import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["libs/*/test/**/*.test.ts"],
  },
});
