#!/usr/bin/env bun

import { VERSION } from "./src/config.ts";
import { daily } from "./src/commands/daily.ts";
import { today } from "./src/commands/today.ts";
import { init } from "./src/commands/init.ts";
import { memo } from "./src/commands/memo.ts";
import { range } from "./src/commands/range.ts";

const args = process.argv.slice(2);
const command = args[0];
const commandArgs = args.slice(1);

function parseOption(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return undefined;
}

function showHelp(): void {
  console.log(`memoli - CLI markdown memo manager

Usage:
  memoli <command> [options]

Commands:
  init                     Initialize memoli directories
  daily                    Create today's memo file
  today                    Open today's memo in editor
  memo <name>              Create or open a memo
  range <start> <end>      Create or open a date range memo
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
}

function showVersion(): void {
  console.log(`memoli v${VERSION}`);
}

async function main(): Promise<void> {
  if (
    !command ||
    command === "help" ||
    command === "-h" ||
    command === "--help"
  ) {
    showHelp();
  } else if (command === "-v" || command === "--version") {
    showVersion();
  } else if (command === "init") {
    await init();
  } else if (command === "daily") {
    const template = parseOption(commandArgs, "-t");
    await daily({ template });
  } else if (command === "today") {
    await today();
  } else if (command === "memo") {
    const name = commandArgs[0] ?? "";
    await memo(name);
  } else if (command === "range") {
    const startDate = commandArgs[0] ?? "";
    const endDate = commandArgs[1] ?? "";
    const template = parseOption(commandArgs, "-t");
    await range(startDate, endDate, { template });
  } else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }
}

main();
