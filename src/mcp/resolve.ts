import { formatTaskTree } from "../commands/task/format.ts";
import { buildTree } from "../store/task-graph.ts";
import { getTask } from "../store/task-store.ts";
import type { Task } from "../store/types.ts";
import { asString } from "./args.ts";
import { notFound } from "./result.ts";
import type { McpCallToolResult } from "./types.ts";

type ResolveResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: McpCallToolResult };

export const resolveTaskId = async (
  query: string,
): Promise<ResolveResult<string>> => {
  const task = await getTask(query);
  if (task === undefined) {
    return { ok: false, error: notFound(query) };
  }
  return { ok: true, value: task.id };
};

export const resolveTaskIds = async (
  queries: string[],
): Promise<ResolveResult<string[]>> => {
  const ids: string[] = [];
  for (const query of queries) {
    const result = await resolveTaskId(query);
    if (!result.ok) {
      return result;
    }
    ids.push(result.value);
  }
  return { ok: true, value: ids };
};

export const asStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }
  return value.filter((item): item is string => typeof item === "string");
};

export const formatTreeText = (tasks: Task[]): string => {
  const nodes = buildTree(tasks);
  if (nodes.length === 0) {
    return "No tasks found.";
  }
  return formatTaskTree(nodes);
};

export const resolveParentEdge = async (
  args: Record<string, unknown>,
  updates: Record<string, unknown>,
): Promise<McpCallToolResult | undefined> => {
  const parentQuery = asString(args["parent"]);
  if (parentQuery === "") {
    return undefined;
  }
  if (parentQuery === "none") {
    updates["parentId"] = undefined;
    return undefined;
  }
  const resolved = await resolveTaskId(parentQuery);
  if (!resolved.ok) {
    return resolved.error;
  }
  updates["parentId"] = resolved.value;
  return undefined;
};

export const resolveBlockedByEdge = async (
  args: Record<string, unknown>,
  updates: Record<string, unknown>,
): Promise<McpCallToolResult | undefined> => {
  const blockers = asStringArray(args["blockedBy"]);
  if (blockers === undefined || blockers.length === 0) {
    return undefined;
  }
  const resolved = await resolveTaskIds(blockers);
  if (!resolved.ok) {
    return resolved.error;
  }
  updates["blockedBy"] = resolved.value;
  return undefined;
};

export const resolveAllEdges = async (
  args: Record<string, unknown>,
  updates: Record<string, unknown>,
): Promise<McpCallToolResult | undefined> =>
  (await resolveParentEdge(args, updates)) ??
  (await resolveBlockedByEdge(args, updates));
