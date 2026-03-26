import type { Task } from "./types.ts";

export interface TreeNode {
  task: Task;
  children: TreeNode[];
  depth: number;
}

export const getChildren = (tasks: Task[], parentId: string): Task[] =>
  tasks.filter((task) => task.parentId === parentId);

export const getDescendants = (tasks: Task[], taskId: string): Task[] => {
  const result: Task[] = [];
  const stack = [taskId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) {
      break;
    }
    for (const task of tasks) {
      if (task.parentId === current) {
        result.push(task);
        stack.push(task.id);
      }
    }
  }
  return result;
};

export const getAncestors = (tasks: Task[], taskId: string): Task[] => {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const result: Task[] = [];
  let current = taskMap.get(taskId);
  while (current?.parentId !== undefined) {
    const parent = taskMap.get(current.parentId);
    if (parent === undefined) {
      break;
    }
    result.push(parent);
    current = parent;
  }
  return result;
};

export const getRootTasks = (tasks: Task[]): Task[] =>
  tasks.filter((task) => task.parentId === undefined);

const buildSubtree = (
  task: Task,
  childrenMap: Map<string, Task[]>,
  depth: number,
): TreeNode => ({
  task,
  depth,
  children: (childrenMap.get(task.id) ?? []).map((child) =>
    buildSubtree(child, childrenMap, depth + 1),
  ),
});

const collectRoots = (
  tasks: Task[],
  childrenMap: Map<string, Task[]>,
): Task[] => {
  const roots: Task[] = [];
  const taskIds = new Set(tasks.map((t) => t.id));
  for (const task of tasks) {
    if (task.parentId === undefined) {
      roots.push(task);
    } else {
      // Group children by parentId
      const siblings = childrenMap.get(task.parentId);
      if (siblings === undefined) {
        childrenMap.set(task.parentId, [task]);
      } else {
        siblings.push(task);
      }
      // Orphans: parentId set but parent not in tasks list
      if (!taskIds.has(task.parentId)) {
        roots.push(task);
      }
    }
  }
  return roots;
};

export const buildTree = (tasks: Task[]): TreeNode[] => {
  const childrenMap = new Map<string, Task[]>();
  const roots = collectRoots(tasks, childrenMap);
  return roots.map((root) => buildSubtree(root, childrenMap, 0));
};

const walksToTarget = (
  taskMap: Map<string, Task>,
  startId: string,
  targetId: string,
): boolean => {
  let current: string | undefined = startId;
  const visited = new Set<string>();
  while (current !== undefined) {
    if (current === targetId) {
      return true;
    }
    if (visited.has(current)) {
      return false;
    }
    visited.add(current);
    current = taskMap.get(current)?.parentId;
  }
  return false;
};

export const hasCycle = (
  tasks: Task[],
  taskId: string,
  newParentId: string,
): boolean => {
  if (taskId === newParentId) {
    return true;
  }
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  return walksToTarget(taskMap, newParentId, taskId);
};

export const hasBlockedByCycle = (
  tasks: Task[],
  taskId: string,
  newBlockedBy: string[],
): boolean => {
  const blockedByMap = new Map<string, string[]>();
  for (const task of tasks) {
    if (task.blockedBy !== undefined && task.blockedBy.length > 0) {
      blockedByMap.set(task.id, task.blockedBy);
    }
  }
  blockedByMap.set(taskId, newBlockedBy);

  const visited = new Set<string>();
  const inStack = new Set<string>();

  const dfs = (id: string): boolean => {
    if (inStack.has(id)) {
      return true;
    }
    if (visited.has(id)) {
      return false;
    }
    visited.add(id);
    inStack.add(id);
    for (const dep of blockedByMap.get(id) ?? []) {
      if (dfs(dep)) {
        return true;
      }
    }
    inStack.delete(id);
    return false;
  };

  return dfs(taskId);
};
