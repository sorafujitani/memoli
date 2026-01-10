import { test, expect, beforeEach, afterEach } from "bun:test";
import { join } from "node:path";
import { tmpdir } from "node:os";

const CLI_PATH = join(import.meta.dir, "index.ts");

test("--help shows help message", async () => {
  const result = await Bun.$`bun ${CLI_PATH} --help`.text();
  expect(result).toContain("memoli - CLI markdown memo manager");
  expect(result).toContain("daily");
  expect(result).toContain("today");
});

test("-h shows help message", async () => {
  const result = await Bun.$`bun ${CLI_PATH} -h`.text();
  expect(result).toContain("memoli - CLI markdown memo manager");
});

test("--version shows version", async () => {
  const result = await Bun.$`bun ${CLI_PATH} --version`.text();
  expect(result).toContain("memoli v0.0.6");
});

test("-v shows version", async () => {
  const result = await Bun.$`bun ${CLI_PATH} -v`.text();
  expect(result).toContain("memoli v0.0.6");
});

test("unknown command exits with error", async () => {
  const proc = Bun.spawn(["bun", CLI_PATH, "unknown"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const exitCode = await proc.exited;
  const stderr = await new Response(proc.stderr).text();

  expect(exitCode).toBe(1);
  expect(stderr).toContain("Unknown command: unknown");
});

test("no command shows help", async () => {
  const result = await Bun.$`bun ${CLI_PATH}`.text();
  expect(result).toContain("memoli - CLI markdown memo manager");
});
