import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { MEMOLI_DIR, REPORTS_DIR } from "../config.ts";
import {
  getMonthDirName,
  getMonthDirNameForDate,
  getRangeFileName,
  getTodayDateStr,
  isDateInRange,
  parseRangeFileName,
} from "./date.ts";

export const ensureMemoliDir = async (): Promise<void> => {
  const dir = Bun.file(MEMOLI_DIR);
  if (await dir.exists()) {
    return;
  }
  await Bun.$`mkdir -p ${MEMOLI_DIR}`;
};

export const ensureDir = async (path: string): Promise<void> => {
  const dir = Bun.file(path);
  if (await dir.exists()) {
    return;
  }
  await Bun.$`mkdir -p ${path}`;
};

export const getMonthDirPath = (): string =>
  join(REPORTS_DIR, getMonthDirName());

export const getTodayFilePath = (): string =>
  join(getMonthDirPath(), `${getTodayDateStr()}.md`);

export const getRangeFilePath = (
  startDate: string,
  endDate: string,
): string => {
  const monthDir = join(REPORTS_DIR, getMonthDirNameForDate(startDate));
  return join(monthDir, getRangeFileName(startDate, endDate));
};

export const getMonthDirPathForDate = (dateStr: string): string =>
  join(REPORTS_DIR, getMonthDirNameForDate(dateStr));

const findMatchingRangeFile = (
  monthPath: string,
  targetDate: string,
): string | undefined => {
  const files = readdirSync(monthPath, { withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .map((dirent) => dirent.name);

  for (const file of files) {
    const parsed = parseRangeFileName(file);
    if (
      parsed !== undefined &&
      isDateInRange(targetDate, parsed.start, parsed.end)
    ) {
      return join(monthPath, file);
    }
  }

  return undefined;
};

export const findRangeFileForDate = (
  targetDate: string,
): string | undefined => {
  if (!existsSync(REPORTS_DIR)) {
    return undefined;
  }

  const monthDirs = readdirSync(REPORTS_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const monthDir of monthDirs) {
    const result = findMatchingRangeFile(
      join(REPORTS_DIR, monthDir),
      targetDate,
    );
    if (result !== undefined) {
      return result;
    }
  }

  return undefined;
};
