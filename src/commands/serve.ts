import { startMcpServer } from "../mcp/server.ts";

export const serve = async (): Promise<void> => {
  await startMcpServer();
};
