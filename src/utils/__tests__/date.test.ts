import { test, expect, describe } from "bun:test";
import {
  getTodayDateStr,
  getMonthDirName,
  isValidDateStr,
  parseDateStr,
  isDateInRange,
  getRangeFileName,
  parseRangeFileName,
  getMonthDirNameForDate,
} from "../date.ts";

test("getTodayDateStr returns YYYY-MM-DD format", () => {
  const result = getTodayDateStr();
  expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test("getTodayDateStr returns today's date", () => {
  const result = getTodayDateStr();
  const now = new Date();
  const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  expect(result).toBe(expected);
});

test("getMonthDirName returns YYYY-MM format", () => {
  const result = getMonthDirName();
  expect(result).toMatch(/^\d{4}-\d{2}$/);
});

test("getMonthDirName returns current month", () => {
  const result = getMonthDirName();
  const now = new Date();
  const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  expect(result).toBe(expected);
});

describe("isValidDateStr", () => {
  test("returns true for valid date", () => {
    expect(isValidDateStr("2026-01-09")).toBe(true);
    expect(isValidDateStr("2026-12-31")).toBe(true);
    expect(isValidDateStr("2024-02-29")).toBe(true);
  });

  test("returns false for invalid format", () => {
    expect(isValidDateStr("2026-1-09")).toBe(false);
    expect(isValidDateStr("2026/01/09")).toBe(false);
    expect(isValidDateStr("01-09-2026")).toBe(false);
    expect(isValidDateStr("invalid")).toBe(false);
  });

  test("returns false for invalid date", () => {
    expect(isValidDateStr("2026-13-01")).toBe(false);
    expect(isValidDateStr("2026-00-01")).toBe(false);
    expect(isValidDateStr("2026-01-32")).toBe(false);
    expect(isValidDateStr("2025-02-29")).toBe(false);
  });
});

describe("parseDateStr", () => {
  test("returns Date for valid string", () => {
    const date = parseDateStr("2026-01-09");
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2026);
    expect(date!.getMonth()).toBe(0);
    expect(date!.getDate()).toBe(9);
  });

  test("returns null for invalid string", () => {
    expect(parseDateStr("invalid")).toBeNull();
    expect(parseDateStr("2026-13-01")).toBeNull();
  });
});

describe("isDateInRange", () => {
  test("returns true when date is in range", () => {
    expect(isDateInRange("2026-01-10", "2026-01-09", "2026-01-12")).toBe(true);
    expect(isDateInRange("2026-01-09", "2026-01-09", "2026-01-12")).toBe(true);
    expect(isDateInRange("2026-01-12", "2026-01-09", "2026-01-12")).toBe(true);
  });

  test("returns false when date is out of range", () => {
    expect(isDateInRange("2026-01-08", "2026-01-09", "2026-01-12")).toBe(false);
    expect(isDateInRange("2026-01-13", "2026-01-09", "2026-01-12")).toBe(false);
  });

  test("returns false for invalid dates", () => {
    expect(isDateInRange("invalid", "2026-01-09", "2026-01-12")).toBe(false);
  });
});

describe("getRangeFileName", () => {
  test("returns correct file name", () => {
    expect(getRangeFileName("2026-01-09", "2026-01-12")).toBe(
      "2026-01-09_2026-01-12.md"
    );
  });
});

describe("parseRangeFileName", () => {
  test("parses valid range file name", () => {
    const result = parseRangeFileName("2026-01-09_2026-01-12.md");
    expect(result).toEqual({ start: "2026-01-09", end: "2026-01-12" });
  });

  test("returns null for invalid file name", () => {
    expect(parseRangeFileName("2026-01-09.md")).toBeNull();
    expect(parseRangeFileName("invalid.md")).toBeNull();
    expect(parseRangeFileName("2026-01-09_2026-01-12.txt")).toBeNull();
  });
});

describe("getMonthDirNameForDate", () => {
  test("returns YYYY-MM from date string", () => {
    expect(getMonthDirNameForDate("2026-01-09")).toBe("2026-01");
    expect(getMonthDirNameForDate("2026-12-31")).toBe("2026-12");
  });
});
