import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "dist-runner", "coverage"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["vite.config.ts", "eslint.config.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["runner/vite.config.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["runner/host.js", "runner/worker.js"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.worker, __PARENT_ORIGIN__: "readonly" },
    },
  },
  {
    files: ["scripts/*.mjs"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
);
