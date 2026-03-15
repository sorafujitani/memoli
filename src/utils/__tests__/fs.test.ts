import { expect, test } from "vitest";

import { REPORTS_DIR } from "../../config.ts";
import { getMonthDirName, getTodayDateStr } from "../date.ts";
import { getMonthDirPath, getTodayFilePath } from "../fs.ts";

test("getTodayFilePath returns correct path with month directory", () => {
  const result = getTodayFilePath();
  const expected = `${REPORTS_DIR}/${getMonthDirName()}/${getTodayDateStr()}.md`;
  expect(result).toBe(expected);
});

test("getTodayFilePath ends with .md", () => {
  const result = getTodayFilePath();
  expect(result.endsWith(".md")).toBe(true);
});

test("getMonthDirPath returns reports/YYYY-MM", () => {
  const result = getMonthDirPath();
  expect(result).toContain("reports");
  expect(result).toMatch(/\d{4}-\d{2}$/);
});
