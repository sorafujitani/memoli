import * as v from "valibot";

import {
  TaskPrioritySchema,
  TaskStatusSchema,
  type TaskAddOptions,
  type TaskFilter,
} from "../store/types.ts";
import { isValidDateStr } from "../utils/date.ts";

type Args = Record<string, unknown>;

export const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

export const asStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }
  return value.filter((item): item is string => typeof item === "string");
};

const NonEmptyString = v.pipe(v.string(), v.minLength(1));
const DateString = v.pipe(v.string(), v.check(isValidDateStr));

const TaskAddArgsSchema = v.object({
  priority: v.fallback(v.optional(TaskPrioritySchema), undefined),
  tags: v.fallback(v.optional(v.array(v.string())), undefined),
  scheduledDate: v.fallback(v.optional(DateString), undefined),
  memo: v.fallback(v.optional(NonEmptyString), undefined),
  parentId: v.fallback(v.optional(NonEmptyString), undefined),
});

const TaskFilterArgsSchema = v.object({
  status: v.fallback(v.optional(v.array(TaskStatusSchema)), undefined),
  tag: v.fallback(v.optional(NonEmptyString), undefined),
  date: v.fallback(v.optional(NonEmptyString), undefined),
  parentId: v.fallback(v.optional(NonEmptyString), undefined),
  scope: v.fallback(v.optional(v.picklist(["day"])), undefined),
});

const TaskUpdateArgsSchema = v.object({
  title: v.fallback(v.optional(NonEmptyString), undefined),
  priority: v.fallback(v.optional(TaskPrioritySchema), undefined),
  tags: v.fallback(v.optional(v.array(v.string())), undefined),
  scheduledDate: v.fallback(v.optional(NonEmptyString), undefined),
  memo: v.fallback(v.optional(NonEmptyString), undefined),
  parentId: v.fallback(v.optional(NonEmptyString), undefined),
});

/** Resolve query string — falls back to `id` param if `query` is empty */
export const resolveQuery = (args: Args): string => {
  const query = asString(args["query"]);
  return query === "" ? asString(args["id"]) : query;
};

export const parseTaskAddOptions = (args: Args): TaskAddOptions =>
  v.parse(TaskAddArgsSchema, args);

export const parseTaskFilter = (args: Args): TaskFilter =>
  v.parse(TaskFilterArgsSchema, args);

export const parseTaskUpdates = (args: Args): Record<string, unknown> => {
  const parsed = v.parse(TaskUpdateArgsSchema, args);
  const entries: [string, unknown][] = Object.entries(parsed);
  return Object.fromEntries(entries.filter(([, val]) => val !== undefined));
};
