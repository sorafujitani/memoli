import { homedir } from "node:os";
import { join } from "node:path";

import pkg from "../package.json";

export const VERSION: string = pkg.version;
export const MEMOLI_DIR =
  process.env["MEMOLI_DIR"] ?? join(homedir(), ".memoli");
export const REPORTS_DIR = join(MEMOLI_DIR, "reports");
export const TEMP_DIR = join(MEMOLI_DIR, "temp");
export const MEMO_DIR = join(MEMOLI_DIR, "memo");
