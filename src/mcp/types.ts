export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: unknown;
}

export interface JsonRpcNotification {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: JsonRpcError;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpCallToolParams {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface McpTextContent {
  type: "text";
  text: string;
}

export interface McpCallToolResult {
  content: McpTextContent[];
  isError?: boolean;
}

export interface McpInitializeResult {
  protocolVersion: string;
  capabilities: { tools: Record<string, never> };
  serverInfo: { name: string; version: string };
}

export type ToolHandler = (
  args: Record<string, unknown>,
) => Promise<McpCallToolResult>;

export interface ToolEntry {
  definition: McpToolDefinition;
  handler: ToolHandler;
}
