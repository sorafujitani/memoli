import { isTaskPriority, type TaskPriority } from "../../store/types.ts";
import { getTodayDateStr, isValidDateStr } from "../../utils/date.ts";

export const parsePriority = (
  value: string | undefined,
): TaskPriority | undefined => {
  if (value === undefined || !isTaskPriority(value)) {
    return undefined;
  }
  return value;
};

export const parseTags = (tagsStr: string): string[] =>
  tagsStr
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "");

export const parseDueDate = (raw: string | undefined): string | undefined => {
  if (raw === undefined) {
    return undefined;
  }
  if (raw === "today") {
    return getTodayDateStr();
  }
  if (isValidDateStr(raw)) {
    return raw;
  }
  return undefined;
};

const PARENT_NONE = "none";

export const parseParentId = (
  raw: string | undefined,
): { clear: true } | { clear: false; value: string } | undefined => {
  if (raw === undefined) {
    return undefined;
  }
  if (raw === PARENT_NONE) {
    return { clear: true };
  }
  return { clear: false, value: raw };
};

export const extractTitle = (args: string[]): string => {
  const titleParts: string[] = [];
  for (const arg of args) {
    if (arg.startsWith("-")) {
      break;
    }
    titleParts.push(arg);
  }
  return titleParts.join(" ");
};
