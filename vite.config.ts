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
        },
      },
      {
        files: ["*.test.ts"],
        rules: {
          "max-lines-per-function": "off",
          "typescript/no-unsafe-type-assertion": "off",
        },
      },
      {
        files: ["vite.config.ts"],
        rules: {
          "no-magic-numbers": "off",
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
      // Off: conflicts with require-await when returning Promise without await
      "typescript/promise-function-async": "off",
      "typescript/use-unknown-in-catch-callback-variable": "warn",

      // TypeScript nursery — stable enough to enable
      "typescript/no-unnecessary-condition": "warn",
      "typescript/no-unnecessary-type-conversion": "warn",
      "typescript/prefer-optional-chain": "warn",

      // Import hygiene
      "import/no-namespace": "off",
      "import/no-cycle": "error",
      "import/no-duplicates": "error",
      "import/no-self-import": "error",

      // Off: conflicts with import/no-duplicates — inline type specifiers
      // allow merging type + value imports into a single statement
      "import/consistent-type-specifier-style": "off",

      // Restriction rules — individual opt-in
      "no-alert": "error",
      "no-param-reassign": "warn",
      "no-var": "error",
      "unicorn/prefer-node-protocol": "warn",

      // Existing
      "no-plusplus": "off",
      "unicorn/no-useless-undefined": "off",
      "oxc/approx-constant": "warn",

      // Configured: allow array indexes and common values
      "no-magic-numbers": [
        "warn",
        { ignore: [0, 1, -1], ignoreArrayIndexes: true },
      ],

      // Configured: allow single-char generics (T, K) and short callback params (t)
      "id-length": ["warn", { exceptions: ["T", "K", "t", "v"] }],

      // Configured: 10 is too strict for stream parsers and multi-field builders
      "max-statements": ["warn", 12],

      // Off: legitimate use of new Promise for callback API wrapping
      "promise/avoid-new": "off",

      // Off: await-in-loop is legitimate for stream readers
      "no-await-in-loop": "off",

      // Off: generator functions cannot be expressed as arrow expressions
      "func-style": "off",

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
