import { dirname } from "path";
import { fileURLToPath } from "url";

import tseslint from "typescript-eslint";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Scoped `no-console` for `components/` and App Router (GH #242). */
export default tseslint.config(
  {
    ignores: [".next/**", "node_modules/**", "coverage/**"],
  },
  {
    files: ["components/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
    ignores: ["app/api/**/test.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },
);
