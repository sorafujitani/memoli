import * as v from "valibot";

import { VERSION } from "../config.ts";
import { dispatchTool, getToolDefinitions } from "./tools.ts";
import { readStdinLines, writeStdout } from "./transport.ts";
import type { McpInitializeResult } from "./types.ts";

const PROTOCOL_VERSION = "2024-11-05";
const METHOD_NOT_FOUND = -32_601;
const PARSE_ERROR = -32_700;

const JsonRpcRequestSchema = v.object({
  jsonrpc: v.literal("2.0"),
  id: v.union([v.number(), v.string()]),
  method: v.string(),
  params: v.optional(v.unknown()),
});

const McpCallToolParamsSchema = v.object({
  name: v.string(),
  arguments: v.optional(v.record(v.string(), v.unknown())),
});

const handleInitialize = (id: number | string): void => {
  const result: McpInitializeResult = {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: { tools: {} },
    serverInfo: { name: "memoli", version: VERSION },
  };
  writeStdout({ jsonrpc: "2.0", id, result });
};

const handleToolsList = (id: number | string): void => {
  writeStdout({
    jsonrpc: "2.0",
    id,
    result: { tools: getToolDefinitions() },
  });
};

const handleToolsCall = async (
  id: number | string,
  params: unknown,
): Promise<void> => {
  const result = v.safeParse(McpCallToolParamsSchema, params);
  if (!result.success) {
    return;
  }
  const toolResult = await dispatchTool(
    result.output.name,
    result.output.arguments ?? {},
  );
  writeStdout({ jsonrpc: "2.0", id, result: toolResult });
};

const handleMethodNotFound = (id: number | string, method: string): void => {
  writeStdout({
    jsonrpc: "2.0",
    id,
    error: {
      code: METHOD_NOT_FOUND,
      message: `Method not found: ${method}`,
    },
  });
};

const processMessage = async (
  message: v.InferOutput<typeof JsonRpcRequestSchema>,
): Promise<void> => {
  switch (message.method) {
    case "initialize": {
      handleInitialize(message.id);
      break;
    }
    case "notifications/initialized": {
      break;
    }
    case "tools/list": {
      handleToolsList(message.id);
      break;
    }
    case "tools/call": {
      await handleToolsCall(message.id, message.params);
      break;
    }
    default: {
      handleMethodNotFound(message.id, message.method);
    }
  }
};

export const startMcpServer = async (): Promise<void> => {
  for await (const line of readStdinLines()) {
    try {
      const parsed: unknown = JSON.parse(line);
      const result = v.safeParse(JsonRpcRequestSchema, parsed);
      if (result.success) {
        await processMessage(result.output);
      }
    } catch {
      writeStdout({
        jsonrpc: "2.0",
        id: 0,
        error: {
          code: PARSE_ERROR,
          message: "Parse error",
        },
      });
    }
  }
};
