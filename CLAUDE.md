# memoli

CLI markdown memo manager. Manages daily reports and memos under `~/.memoli`.

## Tech Stack

- **Runtime**: Bun (not Node.js)
- **Language**: TypeScript
- **Toolchain**: Vite+ (`vp` CLI) — lint, format, typecheck, test を統合
- **Build**: bun build --compile (ネイティブバイナリ生成)

## Commands

```bash
vp check              # Format + Lint + Type check (1パス)
vp test               # Run tests (vitest)
vp lint               # Lint with oxlint
vp fmt                # Format with oxfmt
bun run build         # Build (scripts/build.ts)
bun run release       # Release (scripts/release.ts)
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

- Use `bun` for all runtime and package management tasks
- Use `Bun.file` instead of `node:fs` readFile/writeFile
- Tests use vitest (`import { test, expect } from "vitest"`)
- No external dependencies — keep `dependencies` empty in package.json
