import type { TreeNode } from "../../store/task-graph.ts";
import type { Task, TaskPriority, TaskStatus } from "../../store/types.ts";

const STATUS_ICONS: Record<TaskStatus, string> = {
  todo: "[ ]",
  doing: "[~]",
  done: "[x]",
  blocked: "[!]",
};

const PRIORITY_ICONS: Record<TaskPriority, string> = {
  high: "!!!",
  medium: "!!",
  low: "!",
};

const SHORT_ID_LENGTH = 6;

export const formatTask = (task: Task): string => {
  const icon = STATUS_ICONS[task.status];
  const parts = [`${icon} ${task.id.slice(0, SHORT_ID_LENGTH)} ${task.title}`];
  if (task.priority !== undefined) {
    parts.push(`(${PRIORITY_ICONS[task.priority]})`);
  }
  if (task.dueDate !== undefined) {
    parts.push(`due:${task.dueDate}`);
  }
  if (task.tags !== undefined && task.tags.length > 0) {
    parts.push(task.tags.map((tag) => `#${tag}`).join(" "));
  }
  return parts.join(" ");
};

interface DetailFieldMapping {
  label: string;
  value: (task: Task) => string | undefined;
}

const OPTIONAL_DETAIL_FIELDS: DetailFieldMapping[] = [
  { label: "Priority", value: (tk) => tk.priority },
  { label: "Due", value: (tk) => tk.dueDate },
  {
    label: "Tags",
    value: (tk) =>
      tk.tags !== undefined && tk.tags.length > 0
        ? tk.tags.join(", ")
        : undefined,
  },
  { label: "Memo", value: (tk) => tk.memo },
  {
    label: "Blocked",
    value: (tk) =>
      tk.blockedBy !== undefined && tk.blockedBy.length > 0
        ? tk.blockedBy.join(", ")
        : undefined,
  },
  { label: "Parent", value: (tk) => tk.parentId },
];

const LABEL_PAD = 10;

const buildDetailLines = (task: Task): string[] => {
  const lines = [
    `${"ID:".padEnd(LABEL_PAD)}${task.id}`,
    `${"Title:".padEnd(LABEL_PAD)}${task.title}`,
    `${"Status:".padEnd(LABEL_PAD)}${task.status}`,
  ];
  for (const field of OPTIONAL_DETAIL_FIELDS) {
    const val = field.value(task);
    if (val !== undefined) {
      lines.push(`${`${field.label}:`.padEnd(LABEL_PAD)}${val}`);
    }
  }
  return lines;
};

export const formatTaskDetail = (task: Task): string => {
  const lines = buildDetailLines(task);
  lines.push(`${"Created:".padEnd(LABEL_PAD)}${task.createdAt}`);
  lines.push(`${"Updated:".padEnd(LABEL_PAD)}${task.updatedAt}`);
  return lines.join("\n");
};

export const formatTaskJson = (task: Task): string => JSON.stringify(task);

export const formatTasksJson = (tasks: Task[]): string => JSON.stringify(tasks);

const resolveConnector = (depth: number, isLast: boolean): string => {
  if (depth === 0) {
    return "";
  }
  return isLast ? "└── " : "├── ";
};

const resolveChildPrefix = (
  prefix: string,
  depth: number,
  isLast: boolean,
): string => {
  if (depth === 0) {
    return "";
  }
  return `${prefix}${isLast ? "    " : "│   "}`;
};

const formatTreeNode = (
  node: TreeNode,
  prefix: string,
  isLast: boolean,
): string[] => {
  const connector = resolveConnector(node.depth, isLast);
  const lines = [`${prefix}${connector}${formatTask(node.task)}`];
  const childPrefix = resolveChildPrefix(prefix, node.depth, isLast);
  for (const [idx, child] of node.children.entries()) {
    const childIsLast = idx === node.children.length - 1;
    lines.push(...formatTreeNode(child, childPrefix, childIsLast));
  }
  return lines;
};

export const formatTaskTree = (nodes: TreeNode[]): string =>
  nodes.flatMap((node) => formatTreeNode(node, "", true)).join("\n");
