import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";
import ts from "typescript";

type LegacyLimit = Record<string, number>;

type GuardConfig = {
  size: { maxLines: number; legacy: LegacyLimit };
  jsxNesting: { maxDepth: number; legacy: LegacyLimit };
  clones: {
    paths: string[];
    minLines: number;
    minTokens: number;
    legacy: Array<{ files: string[]; maxLines: number; owner: string; added: string }>;
  };
};

type Clone = {
  lines: number;
  firstFile: { name: string };
  secondFile: { name: string };
};

const projectRoot = process.cwd();
const configPath = "config/ui-decomposition-guard.json";
const execFileAsync = promisify(execFile);

async function main() {
  const config = JSON.parse(await readFile(configPath, "utf8")) as GuardConfig;
  const scanRoots = process.argv.slice(2);
  const sourceRoots = scanRoots.length > 0 ? scanRoots : ["src"];
  const files = await findTsxFiles(sourceRoots);
  const metrics = await Promise.all(files.map(measureFile));
  const cloneResult = await checkClones(config, scanRoots);

  const sizeCandidates = metrics
    .filter((metric) => metric.lines > config.size.maxLines)
    .map((metric) => candidate(metric.path, metric.lines, config.size.legacy[metric.path]));
  const nestingCandidates = metrics
    .filter((metric) => metric.jsxNesting > config.jsxNesting.maxDepth)
    .map((metric) => candidate(metric.path, metric.jsxNesting, config.jsxNesting.legacy[metric.path]));
  const violations = [
    ...sizeCandidates.filter((item) => item.status === "blocked").map((item) => ({ metric: "tsxLines", ...item })),
    ...nestingCandidates.filter((item) => item.status === "blocked").map((item) => ({ metric: "jsxNesting", ...item })),
    ...cloneResult.violations.map((item) => ({ metric: "clone", ...item })),
  ];

  console.log(JSON.stringify({
    scanRoots: sourceRoots,
    filesScanned: metrics.length,
    maximums: {
      tsxLines: Math.max(0, ...metrics.map((metric) => metric.lines)),
      jsxNesting: Math.max(0, ...metrics.map((metric) => metric.jsxNesting)),
    },
    size: { limit: config.size.maxLines, candidates: sizeCandidates },
    jsxNesting: { limit: config.jsxNesting.maxDepth, candidates: nestingCandidates },
    clones: cloneResult,
    violations,
  }, null, 2));

  if (violations.length > 0) process.exitCode = 1;
}

function candidate(path: string, actual: number, legacyLimit?: number) {
  return {
    path,
    actual,
    legacyLimit: legacyLimit ?? null,
    status: legacyLimit !== undefined && actual <= legacyLimit ? "allowed" : "blocked",
  };
}

async function findTsxFiles(roots: string[]): Promise<string[]> {
  const files = await Promise.all(roots.map(findTsxFilesIn));
  return files.flat().sort();
}

async function findTsxFilesIn(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return findTsxFilesIn(path);
    return entry.isFile() && path.endsWith(".tsx") ? [path] : [];
  }));
  return files.flat();
}

async function measureFile(path: string) {
  const source = await readFile(path, "utf8");
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  return {
    path: toProjectPath(path),
    lines: source.split("\n").length - (source.endsWith("\n") ? 1 : 0),
    jsxNesting: findMaxJsxNesting(sourceFile),
  };
}

function findMaxJsxNesting(sourceFile: ts.SourceFile) {
  let maximum = 0;
  function visit(node: ts.Node, parentDepth: number) {
    const depth = isJsxNode(node) ? parentDepth + 1 : parentDepth;
    maximum = Math.max(maximum, depth);
    ts.forEachChild(node, (child) => visit(child, depth));
  }
  visit(sourceFile, 0);
  return maximum;
}

function isJsxNode(node: ts.Node) {
  return ts.isJsxElement(node) || ts.isJsxFragment(node) || ts.isJsxSelfClosingElement(node);
}

async function checkClones(config: GuardConfig, scanRoots: string[]) {
  const paths = scanRoots.length > 0 ? scanRoots : config.clones.paths;
  const output = await mkdtemp(join(tmpdir(), "ui-decomposition-"));
  try {
    await execFileAsync("./node_modules/.bin/jscpd", [
      ...paths,
      "--format", "tsx",
      "--min-lines", String(config.clones.minLines),
      "--min-tokens", String(config.clones.minTokens),
      "--reporters", "json",
      "--output", output,
      "--silent",
    ]);

    const reportPath = join(output, "jscpd-report.json");
    const reportText = await readFile(reportPath, "utf8").catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (reportText === null) {
      return emptyCloneResult(config);
    }
    const report = JSON.parse(reportText) as {
      statistics: { total: { clones: number; duplicatedLines: number; percentage: number } };
      duplicates: Clone[];
    };
    const pairs = new Map<string, { files: string[]; lines: number }>();
    for (const clone of report.duplicates) {
      const files = [toProjectPath(clone.firstFile.name), toProjectPath(clone.secondFile.name)].sort();
      const key = files.join("\u0000");
      const pair = pairs.get(key) ?? { files, lines: 0 };
      pair.lines += clone.lines;
      pairs.set(key, pair);
    }
    const candidates = [...pairs.values()].map((pair) => {
      const legacy = config.clones.legacy.find((item) => item.files.slice().sort().join("\u0000") === pair.files.join("\u0000"));
      return {
        ...pair,
        legacyLimit: legacy?.maxLines ?? null,
        status: legacy && pair.lines <= legacy.maxLines ? "allowed" : "blocked",
      };
    });
    return {
      minLines: config.clones.minLines,
      minTokens: config.clones.minTokens,
      pairs: report.statistics.total.clones,
      duplicatedLines: report.statistics.total.duplicatedLines,
      percentage: report.statistics.total.percentage,
      candidates,
      violations: candidates.filter((candidate) => candidate.status === "blocked"),
    };
  } finally {
    await rm(output, { recursive: true, force: true });
  }
}

function emptyCloneResult(config: GuardConfig) {
  return {
    minLines: config.clones.minLines,
    minTokens: config.clones.minTokens,
    pairs: 0,
    duplicatedLines: 0,
    percentage: 0,
    candidates: [],
    violations: [],
  };
}

function toProjectPath(path: string) {
  const absolute = resolve(path);
  const relativePath = relative(projectRoot, absolute);
  return relativePath.startsWith(`..${sep}`) ? path : relativePath;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
