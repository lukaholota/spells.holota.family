import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: [
      "src/**/*.test.ts",
      "tests/rules/**/*.test.ts",
      "tests/content/**/*.test.ts",
      "tests/golden/levelup/**/*.test.ts",
      "tests/database.test.ts",
    ],
    setupFiles: ["tests/setup.ts"],
    // Only tests/database.test.ts touches spells_test DB, all other tests are pure in-memory.
    fileParallelism: true,
  },
});


