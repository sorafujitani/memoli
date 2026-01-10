export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMonthDirName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function isValidDateStr(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) {
    return false;
  }
  const date = parseDateStr(dateStr);
  return date !== null;
}

export function parseDateStr(dateStr: string): Date | null {
  const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = dateStr.match(regex);
  if (!match) {
    return null;
  }
  const year = parseInt(match[1]!, 10);
  const month = parseInt(match[2]!, 10);
  const day = parseInt(match[3]!, 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function isDateInRange(
  target: string,
  start: string,
  end: string
): boolean {
  const targetDate = parseDateStr(target);
  const startDate = parseDateStr(start);
  const endDate = parseDateStr(end);

  if (!targetDate || !startDate || !endDate) {
    return false;
  }

  return targetDate >= startDate && targetDate <= endDate;
}

export function getRangeFileName(startDate: string, endDate: string): string {
  return `${startDate}_${endDate}.md`;
}

export function parseRangeFileName(
  fileName: string
): { start: string; end: string } | null {
  const regex = /^(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})\.md$/;
  const match = fileName.match(regex);
  if (!match) {
    return null;
  }
  return { start: match[1]!, end: match[2]! };
}

export function getMonthDirNameForDate(dateStr: string): string {
  return dateStr.slice(0, 7);
}
