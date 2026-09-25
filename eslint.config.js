import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: ["**/dist/**", "**/node_modules/**"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/member-ordering": [
        "error",
        {
          default: [
            "public-static-field",
            "public-instance-field",
            "protected-static-field",
            "protected-instance-field",
            "private-static-field",
            "#private-static-field",
            "private-instance-field",
            "#private-instance-field",
            "constructor",
            "public-static-method",
            ["public-instance-get", "public-instance-set"],
            "public-instance-method",
            "protected-instance-method",
            "private-static-method",
            "private-instance-method",
            "#private-instance-method",
          ],
        },
      ],
    },
  },
]);
