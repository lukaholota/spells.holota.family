import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // DB-touching test files TRUNCATE the same spells_test between tests (tests/user-data.ts).
    // With >1 such file, Vitest's default parallel-file execution races those truncations against
    // each other — a test in one file can wipe the user a test in another file just created.
    // Same failure class as Р8 in docs/DECISIONS.md, just local instead of CI-vs-local.
    fileParallelism: false,
  },
});
