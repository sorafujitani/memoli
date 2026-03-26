import { homedir } from "node:os";
import { join } from "node:path";

export const VERSION = "1.1.0";
export const MEMOLI_DIR =
  process.env["MEMOLI_DIR"] ?? join(homedir(), ".memoli");
export const REPORTS_DIR = join(MEMOLI_DIR, "reports");
export const TEMP_DIR = join(MEMOLI_DIR, "temp");
export const MEMO_DIR = join(MEMOLI_DIR, "memo");
