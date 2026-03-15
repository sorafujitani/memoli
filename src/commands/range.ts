import { isValidDateStr, parseDateStr } from "../utils/date.ts";
import { openInEditor } from "../utils/editor.ts";
import {
  ensureDir,
  getMonthDirPathForDate,
  getRangeFilePath,
} from "../utils/fs.ts";
import { loadTemplate } from "../utils/template.ts";

export interface RangeOptions {
  template?: string;
}

const EXIT_FAILURE = 1;

const validateDateFormat = (date: string, label: string): void => {
  if (!isValidDateStr(date)) {
    console.error(`Invalid ${label} date format: ${date}`);
    console.error("Expected format: YYYY-MM-DD");
    process.exit(EXIT_FAILURE);
  }
};

const validateDateOrder = (startDate: string, endDate: string): void => {
  const start = parseDateStr(startDate);
  const end = parseDateStr(endDate);

  if (start === undefined || end === undefined) {
    return;
  }

  if (start > end) {
    console.error("Start date must be before or equal to end date");
    process.exit(EXIT_FAILURE);
  }
};

const validateRangeArgs = (startDate: string, endDate: string): void => {
  if (startDate === "" || endDate === "") {
    console.error("Usage: memoli range <start-date> <end-date>");
    console.error("Example: memoli range 2026-01-09 2026-01-12");
    process.exit(EXIT_FAILURE);
  }

  validateDateFormat(startDate, "start");
  validateDateFormat(endDate, "end");
  validateDateOrder(startDate, endDate);
};

const resolveContent = (
  startDate: string,
  endDate: string,
  template: string | undefined,
): Promise<string> | string =>
  template === undefined
    ? `# ${startDate} - ${endDate}\n\n`
    : loadTemplate(template);

interface RangeFileContext {
  endDate: string;
  filePath: string;
  startDate: string;
  template: string | undefined;
}

const ensureRangeFile = async (ctx: RangeFileContext): Promise<void> => {
  const file = Bun.file(ctx.filePath);

  if (await file.exists()) {
    console.log(`Opening: ${ctx.filePath}`);
  } else {
    const content = await resolveContent(
      ctx.startDate,
      ctx.endDate,
      ctx.template,
    );
    await Bun.write(ctx.filePath, content);
    console.log(`Created: ${ctx.filePath}`);
  }
};

export const range = async (
  startDate: string,
  endDate: string,
  options: RangeOptions = {},
): Promise<void> => {
  validateRangeArgs(startDate, endDate);

  await ensureDir(getMonthDirPathForDate(startDate));

  const filePath = getRangeFilePath(startDate, endDate);
  await ensureRangeFile({
    endDate,
    filePath,
    startDate,
    template: options.template,
  });

  openInEditor(filePath);
};
