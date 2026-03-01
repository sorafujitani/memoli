import { join } from "node:path";
import { spawn } from "node:child_process";
import { MEMO_DIR } from "../config.ts";
import { ensureDir } from "../utils/fs.ts";

export async function memo(name: string): Promise<void> {
  if (!name) {
    console.error("Usage: memoli memo <name>");
    process.exit(1);
  }

  ensureDir(MEMO_DIR);

  let filePath = join(MEMO_DIR, `${name}.md`);
  const file = Bun.file(filePath);

  if (!(await file.exists())) {
    const content = `# ${name}\n\n`;
    await Bun.write(filePath, content);
    console.log(`Created: ${filePath}`);
  }

  const editor = process.env["EDITOR"] || "vi";
  const child = spawn(editor, [filePath], {
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}
