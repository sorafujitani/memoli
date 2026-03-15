import { execFile, spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { expect, test } from "vitest";

const execFileAsync = promisify(execFile);
const currentDir = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = join(currentDir, "index.ts");

test("--help shows help message", async () => {
  const { stdout } = await execFileAsync("bun", [CLI_PATH, "--help"]);
  expect(stdout).toContain("memoli - CLI markdown memo manager");
  expect(stdout).toContain("daily");
  expect(stdout).toContain("today");
});

test("-h shows help message", async () => {
  const { stdout } = await execFileAsync("bun", [CLI_PATH, "-h"]);
  expect(stdout).toContain("memoli - CLI markdown memo manager");
});

test("--version shows version", async () => {
  const { stdout } = await execFileAsync("bun", [CLI_PATH, "--version"]);
  expect(stdout).toContain("memoli v0.0.6");
});

test("-v shows version", async () => {
  const { stdout } = await execFileAsync("bun", [CLI_PATH, "-v"]);
  expect(stdout).toContain("memoli v0.0.6");
});

const EXIT_FAILURE = 1;

test("unknown command exits with error", async () => {
  const { exitCode, stderr: stderrOutput } = await new Promise<{
    exitCode: number;
    stderr: string;
  }>((resolve) => {
    const proc = spawn("bun", [CLI_PATH, "unknown"]);
    let output = "";
    proc.stderr.on("data", (chunk) => (output += chunk));
    proc.on("close", (code) => {
      resolve({ exitCode: code ?? EXIT_FAILURE, stderr: output });
    });
  });

  expect(exitCode).toBe(EXIT_FAILURE);
  expect(stderrOutput).toContain("Unknown command: unknown");
});

test("no command shows help", async () => {
  const { stdout } = await execFileAsync("bun", [CLI_PATH]);
  expect(stdout).toContain("memoli - CLI markdown memo manager");
});
