import { readdirSync } from "node:fs";
import { join } from "node:path";

import { MEMO_DIR } from "../config.ts";
import {
  addTask,
  getTask,
  listTasks,
  removeTask,
  updateTask,
  updateTaskStatus,
} from "../store/task-store.ts";
import { isTaskStatus } from "../store/types.ts";
import { getTodayDateStr } from "../utils/date.ts";
import { getTodayFilePath } from "../utils/fs.ts";
import {
  asString,
  parseTaskAddOptions,
  parseTaskFilter,
  parseTaskUpdates,
} from "./args.ts";
import type { McpCallToolResult, McpToolDefinition } from "./types.ts";

type ToolHandler = (
  args: Record<string, unknown>,
) => Promise<McpCallToolResult>;

interface ToolEntry {
  definition: McpToolDefinition;
  handler: ToolHandler;
}

const jsonResult = (data: unknown): McpCallToolResult => ({
  content: [{ type: "text", text: JSON.stringify(data) }],
});

const errorResult = (message: string): McpCallToolResult => ({
  content: [{ type: "text", text: message }],
  isError: true,
});

const notFound = (id: string): McpCallToolResult =>
  errorResult(`Task not found: ${id}`);

const taskAddTool: ToolEntry = {
  definition: {
    name: "task_add",
    description: "Add a new task",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Task title" },
        priority: { type: "string", enum: ["high", "medium", "low"] },
        tags: { type: "array", items: { type: "string" } },
        dueDate: { type: "string", description: "Due date (YYYY-MM-DD)" },
        memo: { type: "string", description: "Linked memo name" },
      },
      required: ["title"],
    },
  },
  handler: async (args) => {
    const title = asString(args["title"]);
    if (title === "") {
      return errorResult("title is required");
    }
    const task = await addTask(title, parseTaskAddOptions(args));
    return jsonResult(task);
  },
};

const taskListTool: ToolEntry = {
  definition: {
    name: "task_list",
    description: "List tasks with optional filters",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "array",
          items: { type: "string", enum: ["todo", "doing", "done", "blocked"] },
          description: "Filter by status",
        },
        tag: { type: "string", description: "Filter by tag" },
        dueDate: {
          type: "string",
          description: "Filter by due date (YYYY-MM-DD)",
        },
      },
    },
  },
  handler: async (args) => {
    const tasks = await listTasks(parseTaskFilter(args));
    return jsonResult(tasks);
  },
};

const taskGetTool: ToolEntry = {
  definition: {
    name: "task_get",
    description: "Get a task by ID (supports partial ID)",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Task ID" },
      },
      required: ["id"],
    },
  },
  handler: async (args) => {
    const id = asString(args["id"]);
    const task = await getTask(id);
    return task === undefined ? notFound(id) : jsonResult(task);
  },
};

const handleTaskStatusUpdate = async (
  args: Record<string, unknown>,
): Promise<McpCallToolResult> => {
  const id = asString(args["id"]);
  const statusStr = asString(args["status"]);
  if (statusStr !== "" && isTaskStatus(statusStr)) {
    const task = await updateTaskStatus(id, statusStr);
    return task === undefined ? notFound(id) : jsonResult(task);
  }
  const task = await updateTask(id, parseTaskUpdates(args));
  return task === undefined ? notFound(id) : jsonResult(task);
};

const taskUpdateTool: ToolEntry = {
  definition: {
    name: "task_update",
    description: "Update a task's properties or status",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Task ID" },
        title: { type: "string" },
        status: { type: "string", enum: ["todo", "doing", "done", "blocked"] },
        priority: { type: "string", enum: ["high", "medium", "low"] },
        tags: { type: "array", items: { type: "string" } },
        dueDate: { type: "string" },
        memo: { type: "string" },
      },
      required: ["id"],
    },
  },
  handler: handleTaskStatusUpdate,
};

const taskRemoveTool: ToolEntry = {
  definition: {
    name: "task_remove",
    description: "Remove a task by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Task ID" },
      },
      required: ["id"],
    },
  },
  handler: async (args) => {
    const id = asString(args["id"]);
    const task = await removeTask(id);
    return task === undefined ? notFound(id) : jsonResult(task);
  },
};

const dailyReadTool: ToolEntry = {
  definition: {
    name: "daily_read",
    description: "Read today's or a specific date's daily file",
    inputSchema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date in YYYY-MM-DD format (defaults to today)",
        },
      },
    },
  },
  handler: async (args) => {
    const rawDate = asString(args["date"]);
    const dateStr = rawDate === "" ? getTodayDateStr() : rawDate;
    const filePath = getTodayFilePath();
    const file = Bun.file(
      dateStr === getTodayDateStr()
        ? filePath
        : filePath.replace(getTodayDateStr(), dateStr),
    );
    if (!(await file.exists())) {
      return errorResult(`Daily file not found for: ${dateStr}`);
    }
    const content = await file.text();
    return jsonResult({ path: file.name, content });
  },
};

const memoReadTool: ToolEntry = {
  definition: {
    name: "memo_read",
    description: "Read a memo file by name",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Memo name" },
      },
      required: ["name"],
    },
  },
  handler: async (args) => {
    const name = asString(args["name"]);
    const filePath = join(MEMO_DIR, `${name}.md`);
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      return errorResult(`Memo not found: ${name}`);
    }
    const content = await file.text();
    return jsonResult({ path: filePath, content });
  },
};

const memoListTool: ToolEntry = {
  definition: {
    name: "memo_list",
    description: "List all memo names",
    inputSchema: { type: "object", properties: {} },
  },
  handler: async () => {
    const dir = Bun.file(MEMO_DIR);
    if (!(await dir.exists())) {
      return jsonResult({ memos: [] });
    }
    const files = readdirSync(MEMO_DIR)
      .filter((file) => file.endsWith(".md"))
      .map((file) => file.replace(/\.md$/, ""));
    return jsonResult({ memos: files });
  },
};

const ALL_TOOLS: ToolEntry[] = [
  taskAddTool,
  taskListTool,
  taskGetTool,
  taskUpdateTool,
  taskRemoveTool,
  dailyReadTool,
  memoReadTool,
  memoListTool,
];

const toolMap = new Map<string, ToolHandler>(
  ALL_TOOLS.map((entry) => [entry.definition.name, entry.handler]),
);

export const getToolDefinitions = (): McpToolDefinition[] =>
  ALL_TOOLS.map((entry) => entry.definition);

export const dispatchTool = async (
  name: string,
  args: Record<string, unknown>,
): Promise<McpCallToolResult> => {
  const handler = toolMap.get(name);
  if (handler === undefined) {
    return errorResult(`Unknown tool: ${name}`);
  }
  try {
    return await handler(args);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(`Tool error: ${message}`);
  }
};
