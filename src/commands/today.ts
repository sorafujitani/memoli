import { getTodayDateStr } from "../utils/date.ts";
import { openInEditor } from "../utils/editor.ts";
import { findRangeFileForDate, getTodayFilePath } from "../utils/fs.ts";
import { daily } from "./daily.ts";

export const today = async (): Promise<void> => {
  const todayStr = getTodayDateStr();

  const rangeFile = findRangeFileForDate(todayStr);
  if (rangeFile !== undefined) {
    openInEditor(rangeFile);
    return;
  }

  const filePath = getTodayFilePath();
  const file = Bun.file(filePath);

  if (!(await file.exists())) {
    await daily();
  }

  openInEditor(filePath);
};
