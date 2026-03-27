import * as v from "valibot";

// ── Schemas ──────────────────────────────────────────────────────────

export const TaskStatusSchema = v.picklist([
  "todo",
  "doing",
  "done",
  "blocked",
]);

export const TaskPrioritySchema = v.picklist(["high", "medium", "low"]);

export const TaskSchema = v.object({
  id: v.string(),
  title: v.string(),
  status: TaskStatusSchema,
  priority: v.optional(TaskPrioritySchema),
  tags: v.optional(v.array(v.string())),
  memo: v.optional(v.string()),
  dailyRef: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
  scheduledDate: v.optional(v.string()),
  blockedBy: v.optional(v.array(v.string())),
  parentId: v.optional(v.string()),
});

export const TaskStoreSchema = v.object({
  version: v.literal(1),
  tasks: v.array(TaskSchema),
});

export const TaskFilterSchema = v.object({
  status: v.optional(v.array(TaskStatusSchema)),
  tag: v.optional(v.string()),
  date: v.optional(v.string()),
  parentId: v.optional(v.string()),
  scope: v.optional(v.picklist(["day"])),
});

export const TaskAddOptionsSchema = v.object({
  priority: v.optional(TaskPrioritySchema),
  tags: v.optional(v.array(v.string())),
  scheduledDate: v.optional(v.string()),
  memo: v.optional(v.string()),
  dailyRef: v.optional(v.string()),
  parentId: v.optional(v.string()),
});

// ── Types (derived from schemas) ─────────────────────────────────────

export type TaskStatus = v.InferOutput<typeof TaskStatusSchema>;
export type TaskPriority = v.InferOutput<typeof TaskPrioritySchema>;
export type Task = v.InferOutput<typeof TaskSchema>;
export type TaskStore = v.InferOutput<typeof TaskStoreSchema>;
export type TaskFilter = v.InferOutput<typeof TaskFilterSchema>;
export type TaskAddOptions = v.InferOutput<typeof TaskAddOptionsSchema>;

export type TaskUpdatableFields = Partial<
  Pick<
    Task,
    | "title"
    | "priority"
    | "tags"
    | "scheduledDate"
    | "memo"
    | "blockedBy"
    | "dailyRef"
    | "parentId"
  >
>;

// ── Backward-compat constants ────────────────────────────────────────

export const TASK_STATUSES = TaskStatusSchema.options;
export const TASK_PRIORITIES = TaskPrioritySchema.options;

// ── Type guards ──────────────────────────────────────────────────────

export const isTaskStatus = (value: string): value is TaskStatus =>
  v.safeParse(TaskStatusSchema, value).success;

export const isTaskPriority = (value: string): value is TaskPriority =>
  v.safeParse(TaskPrioritySchema, value).success;
