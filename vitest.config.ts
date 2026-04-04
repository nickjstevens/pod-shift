import { fileURLToPath } from "node:url";

import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@root": rootDir
    }
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/unit/setup.ts"],
    include: [
      "tests/unit/**/*.spec.ts",
      "tests/integration/**/*.spec.ts"
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"]
    }
  }
});
