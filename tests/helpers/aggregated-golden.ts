import fs from "node:fs";
import path from "node:path";

const UPDATE_GOLDEN = process.env.UPDATE_GOLDEN === "1";

/** One JSON file holding a whole sweep's results (keyed by content-row name), not one file per row. */
export function compareOrWriteAggregatedGolden(goldenPath: string, aggregated: Record<string, unknown>) {
  const sorted = Object.fromEntries(Object.entries(aggregated).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

  if (UPDATE_GOLDEN || !fs.existsSync(goldenPath)) {
    fs.mkdirSync(path.dirname(goldenPath), { recursive: true });
    fs.writeFileSync(goldenPath, JSON.stringify(sorted, null, 2) + "\n");
    return;
  }

  const golden = JSON.parse(fs.readFileSync(goldenPath, "utf-8"));
  if (JSON.stringify(sorted) !== JSON.stringify(golden)) {
    const sortedKeys = Object.keys(sorted);
    const goldenKeys = Object.keys(golden);
    const added = sortedKeys.filter((k) => !goldenKeys.includes(k));
    const removed = goldenKeys.filter((k) => !sortedKeys.includes(k));
    const changed = sortedKeys.filter(
      (k) => goldenKeys.includes(k) && JSON.stringify(sorted[k]) !== JSON.stringify(golden[k]),
    );
    throw new Error(
      `${goldenPath} розійшовся з поточним станом.\n` +
        `Додано: ${added.join(", ") || "—"}\nПрибрано: ${removed.join(", ") || "—"}\nЗмінено: ${changed.join(", ") || "—"}`,
    );
  }
}
