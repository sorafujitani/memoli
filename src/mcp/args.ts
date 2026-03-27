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

const NonEmptyString = v.pipe(v.string(), v.minLength(1));
const DateString = v.pipe(v.string(), v.check(isValidDateStr));

const TaskAddArgsSchema = v.object({
  priority: v.fallback(v.optional(TaskPrioritySchema), undefined),
  tags: v.fallback(v.optional(v.array(v.string())), undefined),
  dueDate: v.fallback(v.optional(DateString), undefined),
  scheduledDate: v.fallback(v.optional(DateString), undefined),
  memo: v.fallback(v.optional(NonEmptyString), undefined),
  parentId: v.fallback(v.optional(NonEmptyString), undefined),
});

const TaskFilterArgsSchema = v.object({
  status: v.fallback(v.optional(v.array(TaskStatusSchema)), undefined),
  tag: v.fallback(v.optional(NonEmptyString), undefined),
  dueDate: v.fallback(v.optional(NonEmptyString), undefined),
  parentId: v.fallback(v.optional(NonEmptyString), undefined),
  scope: v.fallback(v.optional(v.picklist(["day"])), undefined),
});

const TaskUpdateArgsSchema = v.object({
  title: v.fallback(v.optional(NonEmptyString), undefined),
  priority: v.fallback(v.optional(TaskPrioritySchema), undefined),
  tags: v.fallback(v.optional(v.array(v.string())), undefined),
  dueDate: v.fallback(v.optional(NonEmptyString), undefined),
  scheduledDate: v.fallback(v.optional(NonEmptyString), undefined),
  memo: v.fallback(v.optional(NonEmptyString), undefined),
  parentId: v.fallback(v.optional(NonEmptyString), undefined),
});

export const parseTaskAddOptions = (args: Args): TaskAddOptions =>
  v.parse(TaskAddArgsSchema, args);

export const parseTaskFilter = (args: Args): TaskFilter =>
  v.parse(TaskFilterArgsSchema, args);

export const parseTaskUpdates = (args: Args): Record<string, unknown> => {
  const parsed = v.parse(TaskUpdateArgsSchema, args);
  const entries: [string, unknown][] = Object.entries(parsed);
  return Object.fromEntries(entries.filter(([, val]) => val !== undefined));
};
