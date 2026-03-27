import type { McpCallToolResult } from "./types.ts";

export const jsonResult = (data: unknown): McpCallToolResult => ({
  content: [{ type: "text", text: JSON.stringify(data) }],
});

export const textResult = (text: string): McpCallToolResult => ({
  content: [{ type: "text", text }],
});

export const errorResult = (message: string): McpCallToolResult => ({
  content: [{ type: "text", text: message }],
  isError: true,
});

export const notFound = (query: string): McpCallToolResult =>
  errorResult(`Task not found: ${query}`);
