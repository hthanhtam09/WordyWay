module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: "latest", sourceType: "module", project: ["./tsconfig.json"] },
  plugins: ["@typescript-eslint", "unused-imports"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  settings: { next: { rootDir: ["./"] } },
  env: { es6: true, node: true, browser: true },
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }
    ],
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" }
    ],
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      { prefer: "type-imports" }
    ]
  },
  ignorePatterns: ["node_modules", "dist", ".next", "*.d.ts"],
};
