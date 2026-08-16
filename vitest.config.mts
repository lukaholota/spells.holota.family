import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: [
      "src/**/*.test.ts",
      "tests/rules/**/*.test.ts",
      "tests/logic/**/*.test.ts",
      "tests/golden/levelup/**/*.test.ts",
      "tests/content/rules2024-import.test.ts",
    ],
    setupFiles: ["tests/setup.ts"],
    fileParallelism: true,
  },
});


