import { readdirSync } from "node:fs";
import { join } from "node:path";

import { MEMO_DIR } from "../config.ts";
import { getTodayDateStr } from "../utils/date.ts";
import { getTodayFilePath } from "../utils/fs.ts";
import { asString } from "./args.ts";
import { errorResult, jsonResult } from "./result.ts";
import { TASK_TOOLS, type ToolEntry } from "./task-tools.ts";
import type { McpCallToolResult, McpToolDefinition } from "./types.ts";

type ToolHandler = (
  args: Record<string, unknown>,
) => Promise<McpCallToolResult>;

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
  ...TASK_TOOLS,
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
