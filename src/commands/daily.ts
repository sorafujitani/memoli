import {
  ensureDir,
  getMonthDirPath,
  getTodayFilePath,
  findRangeFileForDate,
} from "../utils/fs.ts";
import { getTodayDateStr } from "../utils/date.ts";
import { loadTemplate } from "../utils/template.ts";

export interface DailyOptions {
  template?: string;
}

export async function daily(options: DailyOptions = {}): Promise<void> {
  const todayStr = getTodayDateStr();

  const rangeFile = await findRangeFileForDate(todayStr);
  if (rangeFile) {
    console.log(`Range file exists: ${rangeFile}`);
    return;
  }

  await ensureDir(getMonthDirPath());

  const filePath = getTodayFilePath();
  const file = Bun.file(filePath);

  if (await file.exists()) {
    console.log(`Already exists: ${filePath}`);
    return;
  }

  let content: string;
  if (options.template) {
    content = await loadTemplate(options.template);
  } else {
    content = `# ${todayStr}\n\n`;
  }

  await Bun.write(filePath, content);
  console.log(`Created: ${filePath}`);
}
