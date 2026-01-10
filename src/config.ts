import { homedir } from "node:os";
import { join } from "node:path";

export const VERSION = "0.0.6";
export const MEMOLI_DIR = join(homedir(), ".memoli");
export const REPORTS_DIR = join(MEMOLI_DIR, "reports");
export const TEMP_DIR = join(MEMOLI_DIR, "temp");
export const MEMO_DIR = join(MEMOLI_DIR, "memo");
