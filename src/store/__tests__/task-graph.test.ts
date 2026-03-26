import { describe, expect, test } from "vitest";

import {
  buildTree,
  getAncestors,
  getChildren,
  getDescendants,
  getRootTasks,
  hasBlockedByCycle,
  hasCycle,
} from "../task-graph.ts";
import type { Task } from "../types.ts";

const makeTask = (id: string, parentId?: string): Task => ({
  id,
  title: `Task ${id}`,
  status: "todo",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  parentId,
});

// a
// ├── b
// │   └── d
// └── c
// e (root, no children)
const sampleTasks: Task[] = [
  makeTask("a"),
  makeTask("b", "a"),
  makeTask("c", "a"),
  makeTask("d", "b"),
  makeTask("e"),
];

describe("getChildren", () => {
  test("returns direct children", () => {
    const children = getChildren(sampleTasks, "a");
    expect(children.map((t) => t.id)).toEqual(["b", "c"]);
  });

  test("returns empty for leaf", () => {
    expect(getChildren(sampleTasks, "d")).toEqual([]);
  });
});

describe("getDescendants", () => {
  test("returns all descendants recursively", () => {
    const ids = getDescendants(sampleTasks, "a").map((t) => t.id);
    expect(ids).toContain("b");
    expect(ids).toContain("c");
    expect(ids).toContain("d");
    expect(ids).toHaveLength(3);
  });

  test("returns empty for leaf", () => {
    expect(getDescendants(sampleTasks, "e")).toEqual([]);
  });
});

describe("getAncestors", () => {
  test("returns ancestors from leaf to root", () => {
    const ancestors = getAncestors(sampleTasks, "d");
    expect(ancestors.map((t) => t.id)).toEqual(["b", "a"]);
  });

  test("returns empty for root", () => {
    expect(getAncestors(sampleTasks, "a")).toEqual([]);
  });
});

describe("getRootTasks", () => {
  test("returns tasks without parentId", () => {
    const roots = getRootTasks(sampleTasks);
    expect(roots.map((t) => t.id)).toEqual(["a", "e"]);
  });
});

describe("buildTree", () => {
  test("builds root nodes", () => {
    const tree = buildTree(sampleTasks);
    expect(tree).toHaveLength(2);

    const nodeA = tree.at(0);
    expect(nodeA?.task.id).toBe("a");
    expect(nodeA?.depth).toBe(0);
    expect(nodeA?.children).toHaveLength(2);
  });

  test("builds nested children", () => {
    const tree = buildTree(sampleTasks);
    const nodeA = tree.at(0);
    const nodeB = nodeA?.children.at(0);
    expect(nodeB?.task.id).toBe("b");
    expect(nodeB?.depth).toBe(1);
    expect(nodeB?.children).toHaveLength(1);

    const nodeD = nodeB?.children.at(0);
    expect(nodeD?.task.id).toBe("d");
    expect(nodeD?.depth).toBe(2);
    expect(nodeD?.children).toHaveLength(0);
  });

  test("treats orphans as roots", () => {
    const tasks = [makeTask("x", "missing-parent")];
    const tree = buildTree(tasks);
    expect(tree).toHaveLength(1);
    expect(tree.at(0)?.task.id).toBe("x");
  });
});

describe("hasCycle", () => {
  test("detects direct self-reference", () => {
    expect(hasCycle(sampleTasks, "a", "a")).toBe(true);
  });

  test("detects cycle when child becomes parent", () => {
    // Making d the parent of a would create a -> b -> d -> a cycle
    expect(hasCycle(sampleTasks, "a", "d")).toBe(true);
  });

  test("allows valid parent assignment", () => {
    expect(hasCycle(sampleTasks, "e", "a")).toBe(false);
  });
});

describe("hasBlockedByCycle", () => {
  test("detects cycle in blockedBy", () => {
    const tasks: Task[] = [
      { ...makeTask("x"), blockedBy: ["y"] },
      makeTask("y"),
    ];
    // y blockedBy x, but x blockedBy y -> cycle
    expect(hasBlockedByCycle(tasks, "y", ["x"])).toBe(true);
  });

  test("allows valid blockedBy", () => {
    const tasks: Task[] = [makeTask("x"), makeTask("y")];
    expect(hasBlockedByCycle(tasks, "x", ["y"])).toBe(false);
  });
});
