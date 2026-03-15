import { execFile } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { expect, test } from "vitest";

const execFileAsync = promisify(execFile);
const currentDir = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = join(currentDir, "../../../index.ts");

test("daily creates a new file", async () => {
  const { stdout } = await execFileAsync("bun", [CLI_PATH, "daily"]);
  // Already exists, Created, or Range file exists
  expect(stdout).toMatch(/(Created|Already exists|Range file exists):/);
});

test("daily shows 'Already exists' when file exists", async () => {
  await execFileAsync("bun", [CLI_PATH, "daily"]);
  const { stdout } = await execFileAsync("bun", [CLI_PATH, "daily"]);
  expect(stdout).toMatch(/(Already exists|Range file exists):/);
});
