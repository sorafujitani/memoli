import { getTodayDateStr } from "../utils/date.ts";
import {
  ensureDir,
  findRangeFileForDate,
  getMonthDirPath,
  getTodayFilePath,
} from "../utils/fs.ts";
import { loadTemplate } from "../utils/template.ts";

export interface DailyOptions {
  template?: string;
}

const resolveContent = (
  todayStr: string,
  template: string | undefined,
): Promise<string> | string =>
  template === undefined ? `# ${todayStr}\n\n` : loadTemplate(template);

const createDailyFile = async (
  filePath: string,
  todayStr: string,
  template: string | undefined,
): Promise<void> => {
  const content = await resolveContent(todayStr, template);
  await Bun.write(filePath, content);
  console.log(`Created: ${filePath}`);
};

const fileAlreadyExists = async (filePath: string): Promise<boolean> => {
  const exists = await Bun.file(filePath).exists();
  if (exists) {
    console.log(`Already exists: ${filePath}`);
  }
  return exists;
};

export const daily = async (options: DailyOptions = {}): Promise<void> => {
  const todayStr = getTodayDateStr();

  const rangeFile = findRangeFileForDate(todayStr);
  if (rangeFile !== undefined) {
    console.log(`Range file exists: ${rangeFile}`);
    return;
  }

  await ensureDir(getMonthDirPath());

  const filePath = getTodayFilePath();
  if (await fileAlreadyExists(filePath)) {
    return;
  }

  await createDailyFile(filePath, todayStr, options.template);
};
