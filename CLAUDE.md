# memoli

CLI markdown memo manager. Manages daily reports and memos under `~/.memoli`.

## Tech Stack

- **Runtime**: Bun (not Node.js)
- **Language**: TypeScript
- **Type Checker**: tsgo (`@typescript/native-preview`)
- **Linter**: oxlint
- **Formatter**: oxfmt

## Commands

```bash
bun test            # Run tests
bun run typecheck   # Type check with tsgo
bun run lint        # Lint with oxlint
bun run fmt         # Format with oxfmt
bun run build       # Build (scripts/build.ts)
bun run release     # Release (scripts/release.ts)
```

## Project Structure

```
src/
  commands/       # CLI commands (daily, today, range, memo, init)
  utils/          # Shared utilities (date, fs, template)
  config.ts       # Configuration
index.ts          # Entry point
index.test.ts     # Tests
bin/memoli        # CLI binary
scripts/          # Build and release scripts
```

## Development Guidelines

- Use `bun` for all runtime, testing, and package management tasks
- Use `Bun.file` instead of `node:fs` readFile/writeFile
- Tests use `bun:test` (`import { test, expect } from "bun:test"`)
- No external dependencies — keep `dependencies` empty in package.json
