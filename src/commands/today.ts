import { spawn } from "node:child_process";
import { getTodayFilePath, findRangeFileForDate } from "../utils/fs.ts";
import { getTodayDateStr } from "../utils/date.ts";
import { daily } from "./daily.ts";

export async function today(): Promise<void> {
  const todayStr = getTodayDateStr();

  const rangeFile = await findRangeFileForDate(todayStr);
  if (rangeFile) {
    const editor = process.env["EDITOR"] || "vi";
    const child = spawn(editor, [rangeFile], {
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      process.exit(code ?? 0);
    });
    return;
  }

  const filePath = getTodayFilePath();
  const file = Bun.file(filePath);

  if (!(await file.exists())) {
    await daily();
  }

  const editor = process.env["EDITOR"] || "vi";
  const child = spawn(editor, [filePath], {
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}
