import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    arrowParens: "always",
    bracketSpacing: true,
    endOfLine: "lf",
    printWidth: 80,
    semi: true,
    singleQuote: false,
    sortImports: {},
    sortPackageJson: true,
    tabWidth: 2,
    trailingComma: "all",
    useTabs: false,
  },
  lint: {
    categories: {
      correctness: "error",
      pedantic: "warn",
      perf: "warn",
      style: "warn",
      suspicious: "warn",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    overrides: [
      {
        files: ["*.cjs"],
        rules: {
          "typescript/no-require-imports": "off",
          "typescript/promise-function-async": "off",
        },
      },
    ],
    plugins: ["typescript", "unicorn", "oxc", "import", "promise"],
    rules: {
      // TypeScript strictness (restriction category — individual opt-in)
      "typescript/consistent-type-exports": "warn",
      "typescript/consistent-type-imports": "warn",
      "typescript/no-empty-object-type": "warn",
      "typescript/no-explicit-any": "error",
      "typescript/no-import-type-side-effects": "warn",
      "typescript/no-invalid-void-type": "warn",
      "typescript/no-namespace": "warn",
      "typescript/no-non-null-assertion": "warn",
      "typescript/no-require-imports": "error",
      "typescript/promise-function-async": "warn",
      "typescript/use-unknown-in-catch-callback-variable": "warn",

      // TypeScript nursery — stable enough to enable
      "typescript/no-unnecessary-condition": "warn",
      "typescript/no-unnecessary-type-conversion": "warn",
      "typescript/prefer-optional-chain": "warn",

      // Import hygiene
      "import/no-cycle": "error",
      "import/no-duplicates": "error",
      "import/no-self-import": "error",

      // Restriction rules — individual opt-in
      "no-alert": "error",
      "no-param-reassign": "warn",
      "no-var": "error",
      "unicorn/prefer-node-protocol": "warn",

      // Existing
      "no-plusplus": "off",
      "oxc/approx-constant": "warn",

      // Configured: allow array indexes and common values
      "no-magic-numbers": [
        "warn",
        { ignore: [0, 1, -1], ignoreArrayIndexes: true },
      ],

      // Off: legitimate use of new Promise for callback API wrapping
      "promise/avoid-new": "off",

      // Off: incompatible as shared baseline
      "capitalized-comments": "off",
      "import/exports-last": "off",
      "import/group-exports": "off",
      "import/no-named-export": "off",
      "import/no-nodejs-modules": "off",
      "import/prefer-default-export": "off",
      "no-inline-comments": "off",
      "no-ternary": "off",
      "sort-imports": "off",
      "sort-keys": "off",
    },
  },
  test: {
    include: ["src/**/*.test.ts", "index.test.ts"],
  },
});
