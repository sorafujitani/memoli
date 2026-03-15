const MONTH_OFFSET = 1;
const RADIX = 10;
const PAD_LENGTH = 2;
const MIN_MONTH = 1;
const MAX_MONTH = 12;
const MIN_DAY = 1;
const MAX_DAY = 31;
const MONTH_DIR_END = 7;

const YEAR_GROUP = 1;
const MONTH_GROUP = 2;
const DAY_GROUP = 3;

const START_GROUP = 1;
const END_GROUP = 2;

const isValidDateValues = (
  year: number,
  month: number,
  day: number,
): boolean => {
  if (
    month < MIN_MONTH ||
    month > MAX_MONTH ||
    day < MIN_DAY ||
    day > MAX_DAY
  ) {
    return false;
  }
  const date = new Date(year, month - MONTH_OFFSET, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - MONTH_OFFSET &&
    date.getDate() === day
  );
};

interface DateParts {
  day: number;
  month: number;
  year: number;
}

const extractDateParts = (match: RegExpMatchArray): DateParts | undefined => {
  const yearStr = match[YEAR_GROUP];
  const monthStr = match[MONTH_GROUP];
  const dayStr = match[DAY_GROUP];

  if (yearStr === undefined || monthStr === undefined || dayStr === undefined) {
    return undefined;
  }

  return {
    day: parseInt(dayStr, RADIX),
    month: parseInt(monthStr, RADIX),
    year: parseInt(yearStr, RADIX),
  };
};

export const parseDateStr = (dateStr: string): Date | undefined => {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match === null) {
    return undefined;
  }

  const parts = extractDateParts(match);
  if (
    parts === undefined ||
    !isValidDateValues(parts.year, parts.month, parts.day)
  ) {
    return undefined;
  }

  return new Date(parts.year, parts.month - MONTH_OFFSET, parts.day);
};

export const getTodayDateStr = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + MONTH_OFFSET).padStart(PAD_LENGTH, "0");
  const day = String(now.getDate()).padStart(PAD_LENGTH, "0");
  return `${year}-${month}-${day}`;
};

export const getMonthDirName = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + MONTH_OFFSET).padStart(PAD_LENGTH, "0");
  return `${year}-${month}`;
};

export const isValidDateStr = (dateStr: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  return parseDateStr(dateStr) !== undefined;
};

export const isDateInRange = (
  target: string,
  start: string,
  end: string,
): boolean => {
  const targetDate = parseDateStr(target);
  const startDate = parseDateStr(start);
  const endDate = parseDateStr(end);

  if (
    targetDate === undefined ||
    startDate === undefined ||
    endDate === undefined
  ) {
    return false;
  }

  return targetDate >= startDate && targetDate <= endDate;
};

export const getRangeFileName = (startDate: string, endDate: string): string =>
  `${startDate}_${endDate}.md`;

export const parseRangeFileName = (
  fileName: string,
): { start: string; end: string } | undefined => {
  const match = fileName.match(/^(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})\.md$/);
  if (match === null) {
    return undefined;
  }
  const startStr = match[START_GROUP];
  const endStr = match[END_GROUP];

  if (startStr === undefined || endStr === undefined) {
    return undefined;
  }

  return { end: endStr, start: startStr };
};

export const getMonthDirNameForDate = (dateStr: string): string =>
  dateStr.slice(0, MONTH_DIR_END);
