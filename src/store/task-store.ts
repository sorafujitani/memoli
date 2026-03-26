import { join } from "node:path";

import * as v from "valibot";

import { MEMOLI_DIR } from "../config.ts";
import { ensureDir } from "../utils/fs.ts";
import {
  buildTree,
  getDescendants,
  hasCycle,
  type TreeNode,
} from "./task-graph.ts";
import {
  TaskStoreSchema,
  type Task,
  type TaskAddOptions,
  type TaskFilter,
  type TaskStatus,
  type TaskStore,
  type TaskUpdatableFields,
} from "./types.ts";

const STORE_PATH = join(MEMOLI_DIR, "tasks.json");
const ID_BYTE_LENGTH = 4;
const HEX_RADIX = 16;
const HEX_PAD = 2;
const JSON_INDENT = 2;

const generateId = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(ID_BYTE_LENGTH));
  return [...bytes]
    .map((byte) => byte.toString(HEX_RADIX).padStart(HEX_PAD, "0"))
    .join("");
};

const createEmptyStore = (): TaskStore => ({
  version: 1,
  tasks: [],
});

export const loadStore = async (): Promise<TaskStore> => {
  const file = Bun.file(STORE_PATH);
  if (!(await file.exists())) {
    return createEmptyStore();
  }
  const result = v.safeParse(TaskStoreSchema, await file.json());
  return result.success ? result.output : createEmptyStore();
};

const saveStore = async (store: TaskStore): Promise<void> => {
  await ensureDir(MEMOLI_DIR);
  await Bun.write(
    STORE_PATH,
    `${JSON.stringify(store, undefined, JSON_INDENT)}\n`,
  );
};

const withStoreMutation = async <T>(
  mutate: (store: TaskStore) => T,
): Promise<T> => {
  const store = await loadStore();
  const result = mutate(store);
  await saveStore(store);
  return result;
};

const findTaskById = (store: TaskStore, id: string): Task | undefined =>
  store.tasks.find((task) => task.id === id || task.id.startsWith(id));

const findTaskByTitle = (store: TaskStore, title: string): Task | undefined => {
  const lower = title.toLowerCase();
  return store.tasks.find((task) => task.title.toLowerCase().includes(lower));
};

const findTask = (store: TaskStore, query: string): Task | undefined =>
  findTaskById(store, query) ?? findTaskByTitle(store, query);

export const addTask = (
  title: string,
  options: TaskAddOptions = {},
): Promise<Task> =>
  withStoreMutation((store) => {
    if (options.parentId !== undefined) {
      const parent = findTaskById(store, options.parentId);
      if (parent === undefined) {
        throw new Error(`Parent task not found: ${options.parentId}`);
      }
    }
    const now = new Date().toISOString();
    const task: Task = {
      id: generateId(),
      title,
      status: "todo",
      ...options,
      createdAt: now,
      updatedAt: now,
    };
    store.tasks.push(task);
    return task;
  });

const cascadeDescendantsDone = (
  store: TaskStore,
  taskId: string,
  now: string,
): void => {
  for (const descendant of getDescendants(store.tasks, taskId)) {
    if (descendant.status !== "done") {
      descendant.status = "done";
      descendant.updatedAt = now;
    }
  }
};

const revertParentIfDone = (
  store: TaskStore,
  parentId: string,
  now: string,
): void => {
  const parent = findTaskById(store, parentId);
  if (parent?.status === "done") {
    parent.status = "doing";
    parent.updatedAt = now;
  }
};

export const updateTaskStatus = (
  query: string,
  status: TaskStatus,
): Promise<Task | undefined> =>
  withStoreMutation((store) => {
    const task = findTask(store, query);
    if (task === undefined) {
      return;
    }
    const now = new Date().toISOString();
    task.status = status;
    task.updatedAt = now;

    if (status === "done") {
      cascadeDescendantsDone(store, task.id, now);
    } else if (
      (status === "todo" || status === "doing") &&
      task.parentId !== undefined
    ) {
      revertParentIfDone(store, task.parentId, now);
    }
    return task;
  });

export const updateTask = (
  query: string,
  updates: TaskUpdatableFields,
): Promise<Task | undefined> =>
  withStoreMutation((store) => {
    const task = findTask(store, query);
    if (task === undefined) {
      return;
    }
    if (
      updates.parentId !== undefined &&
      hasCycle(store.tasks, task.id, updates.parentId)
    ) {
      throw new Error("Circular parent reference detected");
    }
    Object.assign(task, updates);
    task.updatedAt = new Date().toISOString();
    return task;
  });

export const removeTask = (query: string): Promise<Task | undefined> =>
  withStoreMutation((store) => {
    const task = findTask(store, query);
    if (task === undefined) {
      return;
    }
    // Reparent children to the removed task's parent (or root)
    for (const item of store.tasks) {
      if (item.parentId === task.id) {
        item.parentId = task.parentId;
      }
      // Remove blockedBy references to the deleted task
      if (item.blockedBy !== undefined) {
        item.blockedBy = item.blockedBy.filter((id) => id !== task.id);
        if (item.blockedBy.length === 0) {
          item.blockedBy = undefined;
        }
      }
    }
    store.tasks = store.tasks.filter((item) => item.id !== task.id);
    return task;
  });

const applyDayScope = (tasks: Task[], date: string): Task[] =>
  tasks.filter(
    (task) =>
      task.status === "doing" ||
      task.dueDate === date ||
      (task.dueDate !== undefined &&
        task.dueDate < date &&
        task.status !== "done"),
  );

const applyDateFilter = (
  tasks: Task[],
  filter: TaskFilter,
): Task[] => {
  if (filter.scope === "day" && filter.dueDate !== undefined) {
    return applyDayScope(tasks, filter.dueDate);
  }
  if (filter.dueDate !== undefined) {
    return tasks.filter((task) => task.dueDate === filter.dueDate);
  }
  return tasks;
};

const applyFilters = (tasks: Task[], filter: TaskFilter): Task[] => {
  let filtered = applyDateFilter(tasks, filter);

  if (filter.status !== undefined && filter.status.length > 0) {
    const statusSet = new Set(filter.status);
    filtered = filtered.filter((task) => statusSet.has(task.status));
  }

  if (filter.tag !== undefined) {
    const filterTag = filter.tag;
    filtered = filtered.filter(
      (task) => task.tags?.includes(filterTag) === true,
    );
  }

  if (filter.parentId !== undefined) {
    filtered = filtered.filter((task) => task.parentId === filter.parentId);
  }

  return filtered;
};

export const listTasks = async (filter: TaskFilter = {}): Promise<Task[]> => {
  const store = await loadStore();
  return applyFilters(store.tasks, filter);
};

export const listTaskTree = async (
  filter: TaskFilter = {},
): Promise<TreeNode[]> => {
  const store = await loadStore();
  const filtered = applyFilters(store.tasks, filter);
  return buildTree(filtered);
};

export const getTask = async (query: string): Promise<Task | undefined> => {
  const store = await loadStore();
  return findTask(store, query);
};
