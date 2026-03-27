import {
  addTask,
  getTask,
  listTasks,
  listTaskTree,
  removeTask,
  updateTask,
  updateTaskStatus,
} from "../../store/task-store.ts";
import {
  isTaskStatus,
  type TaskStatus,
  type TaskUpdatableFields,
} from "../../store/types.ts";
import { hasFlag, parseOption } from "../../utils/args.ts";
import { getTodayDateStr } from "../../utils/date.ts";
import {
  formatTask,
  formatTaskJson,
  formatTaskTree,
  formatTasksJson,
} from "./format.ts";
import { outputTask, outputTaskDetail } from "./output.ts";
import {
  extractTitle,
  parseDueDate,
  parseParentId,
  parsePriority,
  parseTags,
} from "./parse.ts";

const EXIT_FAILURE = 1;

const showTaskHelp = (): void => {
  console.log(`memoli task - Task management

Usage:
  memoli task [options]              List active tasks (todo/doing)
  memoli task add <title> [options]  Add a new task
  memoli task done <id>              Mark task as done
  memoli task doing <id>             Mark task as doing
  memoli task block <id>             Mark task as blocked
  memoli task todo <id>              Mark task as todo
  memoli task rm <id>                Remove a task
  memoli task show <id>              Show task details
  memoli task edit <id> [options]    Edit task properties

List Options:
  --all                Show all tasks (including done)
  --status <status>    Filter by status (todo,doing,done,blocked)
  --tag <tag>          Filter by tag
  --date <date>        Filter by scheduled date (YYYY-MM-DD or "today")
  --tree               Display tasks as a tree

Add/Edit Options:
  --priority <p>       Set priority (high, medium, low)
  --tag <tags>         Set tags (comma-separated)
  --date <date>        Set scheduled date (YYYY-MM-DD)
  --memo <name>        Link to memo file
  --daily              Link to today's daily
  --parent <id>        Set parent task (use "none" to remove)

Global Options:
  --json               Output in JSON format
  -h, --help           Show this help
`);
};

const requireId = (args: string[], usage: string): string => {
  const [id] = args;
  if (id === undefined || id === "") {
    console.error(usage);
    process.exit(EXIT_FAILURE);
  }
  return id;
};

const handleAdd = async (args: string[], json: boolean): Promise<void> => {
  const title = extractTitle(args);
  if (title === "") {
    console.error("Usage: memoli task add <title>");
    process.exit(EXIT_FAILURE);
  }

  const tagStr = parseOption(args, "--tag");
  const parentResult = parseParentId(parseOption(args, "--parent"));
  const parentId =
    parentResult === undefined || parentResult.clear
      ? undefined
      : parentResult.value;
  const task = await addTask(title, {
    priority: parsePriority(parseOption(args, "--priority")),
    tags: tagStr === undefined ? undefined : parseTags(tagStr),
    scheduledDate: parseDueDate(parseOption(args, "--date")),
    memo: parseOption(args, "--memo"),
    dailyRef: hasFlag(args, "--daily") ? getTodayDateStr() : undefined,
    parentId,
  });

  outputTask(task, "Added", json);
};

const handleStatusChange = async (
  args: string[],
  status: TaskStatus,
  json: boolean,
): Promise<void> => {
  const id = requireId(args, `Usage: memoli task ${status} <id>`);
  const task = await updateTaskStatus(id, status);
  if (task === undefined) {
    console.error(`Task not found: ${id}`);
    process.exit(EXIT_FAILURE);
  }
  outputTask(task, "Updated", json);
};

const handleRemove = async (args: string[], json: boolean): Promise<void> => {
  const id = requireId(args, "Usage: memoli task rm <id>");
  const task = await removeTask(id);
  if (task === undefined) {
    console.error(`Task not found: ${id}`);
    process.exit(EXIT_FAILURE);
  }
  if (json) {
    console.log(formatTaskJson(task));
  } else {
    console.log(`Removed: ${task.title}`);
  }
};

const handleShow = async (args: string[], json: boolean): Promise<void> => {
  const id = requireId(args, "Usage: memoli task show <id>");
  const task = await getTask(id);
  if (task === undefined) {
    console.error(`Task not found: ${id}`);
    process.exit(EXIT_FAILURE);
  }
  outputTaskDetail(task, json);
};

const handleEdit = async (args: string[], json: boolean): Promise<void> => {
  const id = requireId(args, "Usage: memoli task edit <id> [options]");
  const updates = buildEditUpdates(args);
  const task = await updateTask(id, updates);
  if (task === undefined) {
    console.error(`Task not found: ${id}`);
    process.exit(EXIT_FAILURE);
  }
  outputTask(task, "Updated", json);
};

const setIfDefined = <K extends keyof TaskUpdatableFields>(
  updates: TaskUpdatableFields,
  key: K,
  value: TaskUpdatableFields[K] | undefined,
): void => {
  if (value !== undefined) {
    updates[key] = value;
  }
};

const buildEditUpdates = (args: string[]): TaskUpdatableFields => {
  const updates: TaskUpdatableFields = {};
  const tagStr = parseOption(args, "--tag");
  const dateRaw = parseOption(args, "--date");
  const parentResult = parseParentId(parseOption(args, "--parent"));
  setIfDefined(updates, "title", parseOption(args, "--title"));
  setIfDefined(
    updates,
    "priority",
    parsePriority(parseOption(args, "--priority")),
  );
  setIfDefined(
    updates,
    "tags",
    tagStr === undefined ? undefined : parseTags(tagStr),
  );
  setIfDefined(updates, "scheduledDate", parseDueDate(dateRaw));
  setIfDefined(updates, "memo", parseOption(args, "--memo"));
  if (parentResult !== undefined) {
    updates.parentId = parentResult.clear ? undefined : parentResult.value;
  }
  return updates;
};

const resolveStatusFilter = (
  statusStr: string | undefined,
  showAll: boolean,
): TaskStatus[] | undefined => {
  if (statusStr !== undefined) {
    return statusStr
      .split(",")
      .filter((status): status is TaskStatus => isTaskStatus(status));
  }
  if (!showAll) {
    return ["todo", "doing", "blocked"];
  }
  return undefined;
};

const printTreeOutput = async (
  filter: Parameters<typeof listTaskTree>[0],
  json: boolean,
): Promise<void> => {
  const nodes = await listTaskTree(filter);
  if (json) {
    console.log(JSON.stringify(nodes));
  } else if (nodes.length === 0) {
    console.log("No tasks found.");
  } else {
    console.log(formatTaskTree(nodes));
  }
};

const printListOutput = async (
  filter: Parameters<typeof listTasks>[0],
  json: boolean,
): Promise<void> => {
  const tasks = await listTasks(filter);
  if (json) {
    console.log(formatTasksJson(tasks));
  } else if (tasks.length === 0) {
    console.log("No tasks found.");
  } else {
    for (const item of tasks) {
      console.log(formatTask(item));
    }
  }
};

const handleList = async (args: string[], json: boolean): Promise<void> => {
  const statusFilter = resolveStatusFilter(
    parseOption(args, "--status"),
    hasFlag(args, "--all"),
  );
  const tag = parseOption(args, "--tag");
  const date = parseDueDate(parseOption(args, "--date"));
  const filter = { status: statusFilter, tag, date };

  await (hasFlag(args, "--tree")
    ? printTreeOutput(filter, json)
    : printListOutput(filter, json));
};

const subcommands: Record<
  string,
  (args: string[], json: boolean) => Promise<void>
> = {
  add: handleAdd,
  done: async (args, json) => {
    await handleStatusChange(args, "done", json);
  },
  doing: async (args, json) => {
    await handleStatusChange(args, "doing", json);
  },
  block: async (args, json) => {
    await handleStatusChange(args, "blocked", json);
  },
  todo: async (args, json) => {
    await handleStatusChange(args, "todo", json);
  },
  rm: handleRemove,
  show: handleShow,
  edit: handleEdit,
};

const isHelpRequest = (args: string[]): boolean =>
  hasFlag(args, "-h") || hasFlag(args, "--help");

const resolveHandler = (
  filteredArgs: string[],
): {
  handler: (args: string[], json: boolean) => Promise<void>;
  args: string[];
} => {
  const [subcommand, ...subArgs] = filteredArgs;
  if (subcommand === undefined || subcommand.startsWith("-")) {
    return { handler: handleList, args: filteredArgs };
  }
  const handler = subcommands[subcommand];
  if (handler !== undefined) {
    return { handler, args: subArgs };
  }
  console.error(`Unknown task subcommand: ${subcommand}`);
  showTaskHelp();
  return process.exit(EXIT_FAILURE);
};

export const task = async (args: string[]): Promise<void> => {
  const json = hasFlag(args, "--json");
  const filteredArgs = args.filter((arg) => arg !== "--json");
  if (isHelpRequest(filteredArgs)) {
    showTaskHelp();
    return;
  }
  const resolved = resolveHandler(filteredArgs);
  await resolved.handler(resolved.args, json);
};
