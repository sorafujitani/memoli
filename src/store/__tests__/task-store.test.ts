import { execFile } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, test } from "vitest";

import type { Task } from "../types.ts";

const execFileAsync = promisify(execFile);
const currentDir = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = join(currentDir, "..", "..", "..", "index.ts");

const ID_LENGTH = 8;

const run = async (...args: string[]): Promise<string> => {
  const { stdout } = await execFileAsync("bun", [CLI_PATH, ...args]);
  return stdout.trim();
};

const runJson = async <T>(...args: string[]): Promise<T> => {
  const stdout = await run(...args);
  return JSON.parse(stdout) as T;
};

describe("task store via CLI", () => {
  test("task add creates a task and returns json", async () => {
    const task = await runJson<Task>("task", "add", "CLI test task", "--json");
    expect(task.title).toBe("CLI test task");
    expect(task.status).toBe("todo");
    expect(task.id).toHaveLength(ID_LENGTH);
  });

  test("task add with options", async () => {
    const task = await runJson<Task>(
      "task",
      "add",
      "Tagged task",
      "--priority",
      "high",
      "--tag",
      "work,test",
      "--due",
      "2026-12-31",
      "--json",
    );
    expect(task.priority).toBe("high");
    expect(task.tags).toEqual(["work", "test"]);
    expect(task.dueDate).toBe("2026-12-31");
  });

  test("task list returns tasks as json", async () => {
    const task = await runJson<Task>(
      "task",
      "add",
      "List test task",
      "--tag",
      "listtest",
      "--json",
    );

    const tasks = await runJson<Task[]>("task", "--json");
    const found = tasks.find((t) => t.id === task.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe("List test task");
  });

  test("task done updates status", async () => {
    const task = await runJson<Task>("task", "add", "Done test", "--json");
    const updated = await runJson<Task>("task", "done", task.id, "--json");
    expect(updated.status).toBe("done");
  });

  test("task doing updates status", async () => {
    const task = await runJson<Task>("task", "add", "Doing test", "--json");
    const updated = await runJson<Task>("task", "doing", task.id, "--json");
    expect(updated.status).toBe("doing");
  });

  test("task show returns task detail as json", async () => {
    const task = await runJson<Task>("task", "add", "Show test", "--json");
    const shown = await runJson<Task>("task", "show", task.id, "--json");
    expect(shown.id).toBe(task.id);
    expect(shown.title).toBe("Show test");
  });

  test("task edit modifies task", async () => {
    const task = await runJson<Task>("task", "add", "Edit test", "--json");
    const updated = await runJson<Task>(
      "task",
      "edit",
      task.id,
      "--title",
      "Edited",
      "--priority",
      "low",
      "--json",
    );
    expect(updated.title).toBe("Edited");
    expect(updated.priority).toBe("low");
  });

  test("task rm removes task", async () => {
    const task = await runJson<Task>("task", "add", "Remove test", "--json");
    const removed = await runJson<Task>("task", "rm", task.id, "--json");
    expect(removed.id).toBe(task.id);
  });

  test("task with partial id", async () => {
    const task = await runJson<Task>(
      "task",
      "add",
      "Partial id test",
      "--json",
    );
    const SHORT_ID_LEN = 4;
    const shortId = task.id.slice(0, SHORT_ID_LEN);
    const shown = await runJson<Task>("task", "show", shortId, "--json");
    expect(shown.id).toBe(task.id);
  });
});
