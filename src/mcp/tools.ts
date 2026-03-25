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
    description:
      "Add a new task. Example: 'READMEを書く' with priority high and tag docs.",
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
    description:
      "List tasks. Use this first to find tasks before updating or removing them. " +
      "Returns all tasks by default. Filter by status, tag, or due date. " +
      "Each task has an id, title, status, and optional fields (priority, tags, dueDate).",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "array",
          items: {
            type: "string",
            enum: ["todo", "doing", "done", "blocked"],
          },
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
    description:
      "Find a task by keyword or ID. " +
      "The query can be a task title (partial match, case-insensitive) or a task ID (prefix match). " +
      'Example: query "README" matches a task titled "READMEを書く".',
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Task title keyword or task ID to search for",
        },
      },
      required: ["query"],
    },
  },
  handler: async (args) => {
    const query = asString(args["query"]);
    const task = await getTask(query);
    return task === undefined ? notFound(query) : jsonResult(task);
  },
};

const handleTaskUpdate = async (
  args: Record<string, unknown>,
): Promise<McpCallToolResult> => {
  const query = asString(args["query"]);
  const statusStr = asString(args["status"]);
  if (statusStr !== "" && isTaskStatus(statusStr)) {
    const task = await updateTaskStatus(query, statusStr);
    return task === undefined ? notFound(query) : jsonResult(task);
  }
  const task = await updateTask(query, parseTaskUpdates(args));
  return task === undefined ? notFound(query) : jsonResult(task);
};

const taskUpdateTool: ToolEntry = {
  definition: {
    name: "task_update",
    description:
      "Update a task found by keyword or ID. " +
      "The query can be a task title (partial match) or task ID. " +
      'Example: query "README", status "done" marks the README task as done.',
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Task title keyword or task ID to find the task to update",
        },
        title: { type: "string", description: "New title" },
        status: {
          type: "string",
          enum: ["todo", "doing", "done", "blocked"],
          description: "New status",
        },
        priority: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "New priority",
        },
        tags: { type: "array", items: { type: "string" } },
        dueDate: { type: "string", description: "New due date (YYYY-MM-DD)" },
        memo: { type: "string", description: "Link to memo file" },
      },
      required: ["query"],
    },
  },
  handler: handleTaskUpdate,
};

const taskRemoveTool: ToolEntry = {
  definition: {
    name: "task_remove",
    description:
      "Remove a task found by keyword or ID. " +
      "The query can be a task title (partial match) or task ID.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Task title keyword or task ID to find the task to remove",
        },
      },
      required: ["query"],
    },
  },
  handler: async (args) => {
    const query = asString(args["query"]);
    const task = await removeTask(query);
    return task === undefined ? notFound(query) : jsonResult(task);
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
