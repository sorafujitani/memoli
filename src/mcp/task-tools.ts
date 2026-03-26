import {
  addTask,
  getTask,
  listTasks,
  listTaskTree,
  removeTask,
  updateTask,
  updateTaskStatus,
} from "../store/task-store.ts";
import { isTaskStatus } from "../store/types.ts";
import {
  asString,
  parseTaskAddOptions,
  parseTaskFilter,
  parseTaskUpdates,
} from "./args.ts";
import { formatTreeText, resolveAllEdges, resolveTaskId } from "./resolve.ts";
import type { McpCallToolResult, McpToolDefinition } from "./types.ts";

type ToolHandler = (
  args: Record<string, unknown>,
) => Promise<McpCallToolResult>;

export interface ToolEntry {
  definition: McpToolDefinition;
  handler: ToolHandler;
}

const jsonResult = (data: unknown): McpCallToolResult => ({
  content: [{ type: "text", text: JSON.stringify(data) }],
});

const textResult = (text: string): McpCallToolResult => ({
  content: [{ type: "text", text }],
});

const errorResult = (message: string): McpCallToolResult => ({
  content: [{ type: "text", text: message }],
  isError: true,
});

const notFound = (query: string): McpCallToolResult =>
  errorResult(`Task not found: ${query}`);

// ── task_add ────────────────────────────────────────────────────────

const taskAddTool: ToolEntry = {
  definition: {
    name: "task_add",
    description:
      "Add a new task or subtask. " +
      'To create a subtask, set parent to the parent task\'s title keyword or ID. Example: parent "GMOPG" adds under the GMOPG task. ' +
      "Multiple tasks can be added in sequence to build a task tree.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Task title" },
        priority: { type: "string", enum: ["high", "medium", "low"] },
        tags: { type: "array", items: { type: "string" } },
        dueDate: { type: "string", description: "Due date (YYYY-MM-DD)" },
        memo: { type: "string", description: "Linked memo name" },
        parent: {
          type: "string",
          description: "Parent task (title keyword or ID)",
        },
      },
      required: ["title"],
    },
  },
  handler: async (args) => {
    const title = asString(args["title"]);
    if (title === "") {
      return errorResult("title is required");
    }
    const options = parseTaskAddOptions(args);
    const parentQuery = asString(args["parent"]);
    if (parentQuery !== "") {
      const resolved = await resolveTaskId(parentQuery);
      if (!resolved.ok) {
        return resolved.error;
      }
      options.parentId = resolved.value;
    }
    return jsonResult(await addTask(title, options));
  },
};

// ── task_list ───────────────────────────────────────────────────────

const taskListTool: ToolEntry = {
  definition: {
    name: "task_list",
    description:
      "List tasks as flat JSON. Use task_tree instead for visual display. " +
      "This tool is for programmatic access or when structured JSON data is needed.",
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
  handler: async (args) => jsonResult(await listTasks(parseTaskFilter(args))),
};

// ── task_get ────────────────────────────────────────────────────────

const taskGetTool: ToolEntry = {
  definition: {
    name: "task_get",
    description:
      "Find a single task by title keyword or ID. " +
      "Returns the task with all fields and its subtask list.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Task title keyword or ID" },
      },
      required: ["query"],
    },
  },
  handler: async (args) => {
    const query = asString(args["query"]);
    const task = await getTask(query);
    if (task === undefined) {
      return notFound(query);
    }
    const allTasks = await listTasks({});
    const children = allTasks
      .filter((t) => t.parentId === task.id)
      .map((t) => ({ id: t.id, title: t.title, status: t.status }));
    return jsonResult({ ...task, children });
  },
};

// ── task_update ─────────────────────────────────────────────────────

const handleStatusUpdate = async (
  query: string,
  statusStr: string,
): Promise<McpCallToolResult | undefined> => {
  if (statusStr === "" || !isTaskStatus(statusStr)) {
    return undefined;
  }
  const task = await updateTaskStatus(query, statusStr);
  return task === undefined ? notFound(query) : jsonResult(task);
};

const handleTaskUpdate = async (
  args: Record<string, unknown>,
): Promise<McpCallToolResult> => {
  const query = asString(args["query"]);
  const statusResult = await handleStatusUpdate(
    query,
    asString(args["status"]),
  );
  if (statusResult !== undefined) {
    return statusResult;
  }
  const updates = parseTaskUpdates(args);
  const edgeError = await resolveAllEdges(args, updates);
  if (edgeError !== undefined) {
    return edgeError;
  }
  const task = await updateTask(query, updates);
  return task === undefined ? notFound(query) : jsonResult(task);
};

const taskUpdateTool: ToolEntry = {
  definition: {
    name: "task_update",
    description:
      "Update a task. Query finds the task by title keyword or ID. " +
      "Supports changing status, priority, parent, and blockers. " +
      'Example: query "GMOPG", status "done" completes the task and all subtasks.',
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Task title keyword or ID" },
        title: { type: "string", description: "New title" },
        status: {
          type: "string",
          enum: ["todo", "doing", "done", "blocked"],
          description: "New status (done cascades to subtasks)",
        },
        priority: { type: "string", enum: ["high", "medium", "low"] },
        tags: { type: "array", items: { type: "string" } },
        dueDate: { type: "string", description: "Due date (YYYY-MM-DD)" },
        memo: { type: "string", description: "Link to memo file" },
        parent: {
          type: "string",
          description:
            'Move under a parent task (keyword or ID). "none" = root.',
        },
        blockedBy: {
          type: "array",
          items: { type: "string" },
          description: "Tasks blocking this one (keywords or IDs)",
        },
      },
      required: ["query"],
    },
  },
  handler: handleTaskUpdate,
};

// ── task_remove ─────────────────────────────────────────────────────

const taskRemoveTool: ToolEntry = {
  definition: {
    name: "task_remove",
    description: "Remove a task by title keyword or ID.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Task title keyword or ID" },
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

// ── task_tree ───────────────────────────────────────────────────────

const taskTreeTool: ToolEntry = {
  definition: {
    name: "task_tree",
    description:
      "Primary tool for listing tasks. Shows tasks as a tree with parent-child relationships. " +
      "Use this by default when the user asks for task list, task overview, or task status. " +
      "Supports filtering by status, tag, due date, and scope. " +
      "When the user asks for tasks without specifying a scope (e.g. 'タスク一覧', 'タスク'), " +
      "set scope to 'day' and dueDate to today (YYYY-MM-DD) to show today's daily view " +
      "(due today + overdue + in-progress). " +
      "Only show all tasks when explicitly asked (e.g. '全タスク', 'all tasks') by omitting scope. " +
      "Default: visual tree text. Set format 'json' for structured data. " +
      "IMPORTANT: When format is 'text' (default), display the returned tree text as-is in a code block. Do NOT reformat it into a table or other layout.",
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
          description:
            "Filter by due date (YYYY-MM-DD). Required when scope is 'day'.",
        },
        scope: {
          type: "string",
          enum: ["day"],
          description:
            "Scope filter. 'day': shows tasks due on dueDate + overdue (past due, not done) + in-progress (doing).",
        },
        format: {
          type: "string",
          enum: ["text", "json"],
          description: "Output format (default: text)",
        },
      },
    },
  },
  handler: async (args) => {
    const filter = parseTaskFilter(args);
    if (asString(args["format"]) === "json") {
      return jsonResult(await listTaskTree(filter));
    }
    return textResult(formatTreeText(await listTasks(filter)));
  },
};

// ── exports ─────────────────────────────────────────────────────────

export const TASK_TOOLS: ToolEntry[] = [
  taskAddTool,
  taskListTool,
  taskGetTool,
  taskUpdateTool,
  taskRemoveTool,
  taskTreeTool,
];
