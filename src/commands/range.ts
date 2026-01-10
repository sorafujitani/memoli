import { spawn } from "node:child_process";
import {
  ensureDir,
  getRangeFilePath,
  getMonthDirPathForDate,
} from "../utils/fs.ts";
import { isValidDateStr, parseDateStr } from "../utils/date.ts";
import { loadTemplate } from "../utils/template.ts";

export interface RangeOptions {
  template?: string;
}

export async function range(
  startDate: string,
  endDate: string,
  options: RangeOptions = {}
): Promise<void> {
  if (!startDate || !endDate) {
    console.error("Usage: memoli range <start-date> <end-date>");
    console.error("Example: memoli range 2026-01-09 2026-01-12");
    process.exit(1);
  }

  if (!isValidDateStr(startDate)) {
    console.error(`Invalid start date format: ${startDate}`);
    console.error("Expected format: YYYY-MM-DD");
    process.exit(1);
  }

  if (!isValidDateStr(endDate)) {
    console.error(`Invalid end date format: ${endDate}`);
    console.error("Expected format: YYYY-MM-DD");
    process.exit(1);
  }

  const start = parseDateStr(startDate)!;
  const end = parseDateStr(endDate)!;

  if (start > end) {
    console.error("Start date must be before or equal to end date");
    process.exit(1);
  }

  await ensureDir(getMonthDirPathForDate(startDate));

  const filePath = getRangeFilePath(startDate, endDate);
  const file = Bun.file(filePath);

  if (!(await file.exists())) {
    let content: string;
    if (options.template) {
      content = await loadTemplate(options.template);
    } else {
      content = `# ${startDate} - ${endDate}\n\n`;
    }
    await Bun.write(filePath, content);
    console.log(`Created: ${filePath}`);
  } else {
    console.log(`Opening: ${filePath}`);
  }

  const editor = process.env["EDITOR"] || "vi";
  const child = spawn(editor, [filePath], {
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}
