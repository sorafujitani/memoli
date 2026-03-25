import type { Task } from "../../store/types.ts";
import { formatTask, formatTaskDetail, formatTaskJson } from "./format.ts";

export const outputTask = (task: Task, prefix: string, json: boolean): void => {
  if (json) {
    console.log(formatTaskJson(task));
  } else {
    console.log(`${prefix}: ${formatTask(task)}`);
  }
};

export const outputTaskDetail = (task: Task, json: boolean): void => {
  if (json) {
    console.log(formatTaskJson(task));
  } else {
    console.log(formatTaskDetail(task));
  }
};
