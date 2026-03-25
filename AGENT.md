# memoli — Agent Reference

This file is the authoritative reference for AI agents (Claude Code, MCP clients, etc.) that interact with memoli programmatically. The primary integration path is the MCP server.

## Overview

memoli manages daily reports, memos, and tasks as Markdown/JSON files under `~/.memoli/`. All data is local — no network, no database.

## MCP Server

Start with `memoli serve`. Protocol: JSON-RPC over stdio, MCP spec `2024-11-05`.

### Configuration

Add to your MCP client config:

```json
{
  "mcpServers": {
    "memoli": {
      "command": "memoli",
      "args": ["serve"]
    }
  }
}
```

---

## Tool Reference

### `task_add`

Create a new task.

**Parameters:**

| Name       | Type                              | Required | Description                                |
| ---------- | --------------------------------- | -------- | ------------------------------------------ |
| `title`    | string                            | yes      | Task title                                 |
| `priority` | `"high"` \| `"medium"` \| `"low"` | no       | Priority level                             |
| `tags`     | string[]                          | no       | Tags for categorization                    |
| `dueDate`  | string                            | no       | Due date in `YYYY-MM-DD` format            |
| `memo`     | string                            | no       | Name of a linked memo file (without `.md`) |

**Returns:** Task object.

**Example call:**

```json
{
  "name": "task_add",
  "arguments": {
    "title": "Fix login bug",
    "priority": "high",
    "tags": ["bugfix"],
    "dueDate": "2026-04-01"
  }
}
```

**Example response:**

```json
{
  "id": "a1b2c3d4",
  "title": "Fix login bug",
  "status": "todo",
  "priority": "high",
  "tags": ["bugfix"],
  "dueDate": "2026-04-01",
  "createdAt": "2026-03-25T10:00:00.000Z",
  "updatedAt": "2026-03-25T10:00:00.000Z"
}
```

---

### `task_list`

List tasks with optional filters. Returns all tasks if no filters given.

**Parameters:**

| Name      | Type     | Required | Description                                                          |
| --------- | -------- | -------- | -------------------------------------------------------------------- |
| `status`  | string[] | no       | Filter by status. Values: `"todo"`, `"doing"`, `"done"`, `"blocked"` |
| `tag`     | string   | no       | Filter by a single tag                                               |
| `dueDate` | string   | no       | Filter by due date (`YYYY-MM-DD`)                                    |

**Returns:** Array of Task objects.

**Example — get active tasks:**

```json
{ "name": "task_list", "arguments": { "status": ["todo", "doing"] } }
```

**Example — get tasks due today tagged "work":**

```json
{ "name": "task_list", "arguments": { "tag": "work", "dueDate": "2026-03-25" } }
```

---

### `task_get`

Get a single task by ID. Supports **partial prefix match** — you only need enough characters to uniquely identify the task (e.g. `"a1b2"` matches `"a1b2c3d4"`).

**Parameters:**

| Name | Type   | Required | Description                      |
| ---- | ------ | -------- | -------------------------------- |
| `id` | string | yes      | Task ID (full or partial prefix) |

**Returns:** Task object, or error if not found.

---

### `task_update`

Update a task's properties or status. Only provided fields are updated; omitted fields are unchanged.

**Parameters:**

| Name       | Type                                             | Required | Description                      |
| ---------- | ------------------------------------------------ | -------- | -------------------------------- |
| `id`       | string                                           | yes      | Task ID (full or partial prefix) |
| `title`    | string                                           | no       | New title                        |
| `status`   | `"todo"` \| `"doing"` \| `"done"` \| `"blocked"` | no       | New status                       |
| `priority` | `"high"` \| `"medium"` \| `"low"`                | no       | New priority                     |
| `tags`     | string[]                                         | no       | Replace tags                     |
| `dueDate`  | string                                           | no       | New due date (`YYYY-MM-DD`)      |
| `memo`     | string                                           | no       | Link to memo file                |

**Returns:** Updated Task object.

**Behavior note:** When `status` is provided, the status is updated first. Other fields are applied as a property update.

**Example — mark as done:**

```json
{ "name": "task_update", "arguments": { "id": "a1b2", "status": "done" } }
```

**Example — change title and priority:**

```json
{
  "name": "task_update",
  "arguments": { "id": "a1b2", "title": "Updated title", "priority": "low" }
}
```

---

### `task_remove`

Delete a task permanently.

**Parameters:**

| Name | Type   | Required | Description                      |
| ---- | ------ | -------- | -------------------------------- |
| `id` | string | yes      | Task ID (full or partial prefix) |

**Returns:** The removed Task object (for confirmation), or error if not found.

---

### `daily_read`

Read a daily report file. Defaults to today if `date` is omitted.

**Parameters:**

| Name   | Type   | Required | Description                                     |
| ------ | ------ | -------- | ----------------------------------------------- |
| `date` | string | no       | Date in `YYYY-MM-DD` format. Defaults to today. |

**Returns:**

```json
{
  "path": "/Users/user/.memoli/reports/2026-03/2026-03-25.md",
  "content": "# 2026-03-25\n\n..."
}
```

**Error:** `"Daily file not found for: 2026-03-25"` if no report exists for that date.

---

### `memo_read`

Read a named memo file.

**Parameters:**

| Name   | Type   | Required | Description                       |
| ------ | ------ | -------- | --------------------------------- |
| `name` | string | yes      | Memo name without `.md` extension |

**Returns:**

```json
{
  "path": "/Users/user/.memoli/memo/project-ideas.md",
  "content": "# Project Ideas\n\n..."
}
```

**Error:** `"Memo not found: project-ideas"` if the file doesn't exist.

---

### `memo_list`

List all available memo names.

**Parameters:** None.

**Returns:**

```json
{ "memos": ["project-ideas", "meeting-notes", "reading-list"] }
```

Returns `{ "memos": [] }` if no memos exist.

---

## Task Object Schema

Every task tool returns or accepts this structure:

```typescript
{
  id: string;          // 8-char hex, e.g. "a1b2c3d4"
  title: string;
  status: "todo" | "doing" | "done" | "blocked";
  priority?: "high" | "medium" | "low";
  tags?: string[];
  dueDate?: string;    // "YYYY-MM-DD"
  memo?: string;       // linked memo name (without .md)
  dailyRef?: string;   // linked daily date "YYYY-MM-DD"
  blockedBy?: string[];// IDs of blocking tasks
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
```

### ID Matching

All `id` parameters use **prefix matching**. The shortest unambiguous prefix works. Typically 3–4 characters are sufficient.

## Error Responses

All errors use the MCP standard format:

```json
{
  "content": [{ "type": "text", "text": "Error message here" }],
  "isError": true
}
```

| Error message                      | Cause                               |
| ---------------------------------- | ----------------------------------- |
| `Task not found: <id>`             | No task matches the given ID prefix |
| `title is required`                | `task_add` called without `title`   |
| `Memo not found: <name>`           | No memo file with that name         |
| `Daily file not found for: <date>` | No daily report for that date       |
| `Unknown tool: <name>`             | Unrecognized tool name              |
| `Tool error: <message>`            | Unexpected runtime error            |

## Common Workflows

### Daily review

1. `daily_read` → read today's report
2. `task_list` with `status: ["todo", "doing"]` → get active tasks
3. Summarize progress and next steps

### Task lifecycle

1. `task_add` → create with title, priority, tags
2. `task_update` with `status: "doing"` → start work
3. `task_update` with `status: "done"` → complete
4. Optionally `task_remove` to clean up

### Cross-reference memos and tasks

1. `memo_list` → discover available memos
2. `memo_read` → read relevant memo content
3. `task_add` with `memo: "<name>"` → link task to memo
4. `task_list` → find tasks linked to a specific memo

### Overdue task detection

1. `task_list` with `status: ["todo", "doing"]`
2. Compare each task's `dueDate` against today
3. Flag or update overdue items

## File Layout

```
~/.memoli/
  reports/YYYY-MM/YYYY-MM-DD.md           # Daily report
  reports/YYYY-MM/YYYY-MM-DD_YYYY-MM-DD.md  # Range memo
  temp/<name>.md                           # Templates
  memo/<name>.md                           # Named memos
  tasks.json                               # Task store
```

### tasks.json Format

```json
{
  "version": 1,
  "tasks": [
    {
      "id": "a1b2c3d4",
      "title": "...",
      "status": "todo",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

Validated with valibot schemas (`src/store/types.ts`). Missing or invalid file is treated as empty store.

## CLI (for shell scripting)

All task subcommands support `--json` for machine-readable output:

```bash
TASK=$(memoli task add "New task" --json | jq -r '.id')
memoli task done "$TASK" --json
memoli task --status todo,doing --tag work --json
```
