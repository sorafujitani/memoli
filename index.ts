#!/usr/bin/env bun

import { daily } from "./src/commands/daily.ts";
import { init } from "./src/commands/init.ts";
import { memo } from "./src/commands/memo.ts";
import { range } from "./src/commands/range.ts";
import { serve } from "./src/commands/serve.ts";
import { task } from "./src/commands/task/index.ts";
import { today } from "./src/commands/today.ts";
import { VERSION } from "./src/config.ts";

const EXIT_FAILURE = 1;

const parseOption = (params: string[], flag: string): string | undefined => {
  const index = params.indexOf(flag);
  if (index !== -1 && index + 1 < params.length) {
    return params[index + 1];
  }
  return undefined;
};

const showHelp = (): void => {
  console.log(`memoli - CLI markdown memo manager

Usage:
  memoli <command> [options]

Commands:
  init                     Initialize memoli directories
  daily                    Create today's memo file
  today                    Open today's memo in editor
  memo <name>              Create or open a memo
  range <start> <end>      Create or open a date range memo
  task [subcommand]        Manage tasks (add, done, doing, rm, show, edit)
  serve                    Start MCP server (stdio)
  help                     Show this help message

Daily/Range Options:
  -t <name>     Use template from ~/.memoli/temp/<name>.md

Range Format:
  memoli range YYYY-MM-DD YYYY-MM-DD
  Example: memoli range 2026-01-09 2026-01-12

Global Options:
  -h, --help    Show help
  -v, --version Show version
`);
};

const showVersion = (): void => {
  console.log(`memoli v${VERSION}`);
};

const commands: Record<string, (commandArgs: string[]) => Promise<void>> = {
  daily: async (commandArgs) => {
    const template = parseOption(commandArgs, "-t");
    await daily({ template });
  },
  init: async () => {
    await init();
  },
  memo: async (commandArgs) => {
    const [name = ""] = commandArgs;
    await memo(name);
  },
  range: async (commandArgs) => {
    const [startDate = "", endDate = ""] = commandArgs;
    const template = parseOption(commandArgs, "-t");
    await range(startDate, endDate, { template });
  },
  serve: async () => {
    await serve();
  },
  task: async (commandArgs) => {
    await task(commandArgs);
  },
  today: async () => {
    await today();
  },
};

const helpCommands = new Set(["help", "-h", "--help"]);
const versionCommands = new Set(["-v", "--version"]);

const ARGV_OFFSET = 2;
const args = process.argv.slice(ARGV_OFFSET);
const [command, ...commandArgs] = args;

if (command === undefined || helpCommands.has(command)) {
  showHelp();
} else if (versionCommands.has(command)) {
  showVersion();
} else if (command in commands) {
  const handler = commands[command];
  if (handler !== undefined) {
    await handler(commandArgs);
  }
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(EXIT_FAILURE);
}
