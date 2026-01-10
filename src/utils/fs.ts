import { join } from "node:path";
import { readdirSync, existsSync } from "node:fs";
import { MEMOLI_DIR, REPORTS_DIR } from "../config.ts";
import {
  getTodayDateStr,
  getMonthDirName,
  getMonthDirNameForDate,
  getRangeFileName,
  parseRangeFileName,
  isDateInRange,
} from "./date.ts";

export async function ensureMemoliDir(): Promise<void> {
  const dir = Bun.file(MEMOLI_DIR);
  if (!(await dir.exists())) {
    await Bun.$`mkdir -p ${MEMOLI_DIR}`;
  }
}

export async function ensureDir(path: string): Promise<void> {
  const dir = Bun.file(path);
  if (!(await dir.exists())) {
    await Bun.$`mkdir -p ${path}`;
  }
}

export function getMonthDirPath(): string {
  return join(REPORTS_DIR, getMonthDirName());
}

export function getTodayFilePath(): string {
  return join(getMonthDirPath(), `${getTodayDateStr()}.md`);
}

export function getRangeFilePath(startDate: string, endDate: string): string {
  const monthDir = join(REPORTS_DIR, getMonthDirNameForDate(startDate));
  return join(monthDir, getRangeFileName(startDate, endDate));
}

export function getMonthDirPathForDate(dateStr: string): string {
  return join(REPORTS_DIR, getMonthDirNameForDate(dateStr));
}

export async function findRangeFileForDate(
  targetDate: string
): Promise<string | null> {
  if (!existsSync(REPORTS_DIR)) {
    return null;
  }

  const monthDirs = readdirSync(REPORTS_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const monthDir of monthDirs) {
    const monthPath = join(REPORTS_DIR, monthDir);
    const files = readdirSync(monthPath, { withFileTypes: true })
      .filter((dirent) => dirent.isFile())
      .map((dirent) => dirent.name);

    for (const file of files) {
      const parsed = parseRangeFileName(file);
      if (parsed && isDateInRange(targetDate, parsed.start, parsed.end)) {
        return join(monthPath, file);
      }
    }
  }

  return null;
}
