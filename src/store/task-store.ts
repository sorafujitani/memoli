import { join } from "node:path";

import * as v from "valibot";

import { MEMOLI_DIR } from "../config.ts";
import { ensureDir } from "../utils/fs.ts";
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

export const updateTaskStatus = (
  query: string,
  status: TaskStatus,
): Promise<Task | undefined> =>
  withStoreMutation((store) => {
    const task = findTask(store, query);
    if (task === undefined) {
      return;
    }
    task.status = status;
    task.updatedAt = new Date().toISOString();
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
    store.tasks = store.tasks.filter((item) => item.id !== task.id);
    return task;
  });

const applyFilters = (tasks: Task[], filter: TaskFilter): Task[] => {
  let filtered = tasks;

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

  if (filter.dueDate !== undefined) {
    filtered = filtered.filter((task) => task.dueDate === filter.dueDate);
  }

  return filtered;
};

export const listTasks = async (filter: TaskFilter = {}): Promise<Task[]> => {
  const store = await loadStore();
  return applyFilters(store.tasks, filter);
};

export const getTask = async (query: string): Promise<Task | undefined> => {
  const store = await loadStore();
  return findTask(store, query);
};
