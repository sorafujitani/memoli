import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = join(currentDir, "../../../index.ts");

const EXIT_FAILURE = 1;

test("memo without name shows usage error", async () => {
  const { exitCode, stderr: stderrOutput } = await new Promise<{
    exitCode: number;
    stderr: string;
  }>((resolve) => {
    const proc = spawn("bun", [CLI_PATH, "memo"]);
    let output = "";
    proc.stderr.on("data", (chunk) => (output += chunk));
    proc.on("close", (code) => {
      resolve({ exitCode: code ?? EXIT_FAILURE, stderr: output });
    });
  });

  expect(exitCode).toBe(EXIT_FAILURE);
  expect(stderrOutput).toContain("Usage: memoli memo <name>");
});
