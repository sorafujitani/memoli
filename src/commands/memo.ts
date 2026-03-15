import { join } from "node:path";

import { MEMO_DIR } from "../config.ts";
import { openInEditor } from "../utils/editor.ts";
import { ensureDir } from "../utils/fs.ts";

const EXIT_FAILURE = 1;

const ensureMemoFile = async (
  filePath: string,
  name: string,
): Promise<void> => {
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    const content = `# ${name}\n\n`;
    await Bun.write(filePath, content);
    console.log(`Created: ${filePath}`);
  }
};

export const memo = async (name: string): Promise<void> => {
  if (name === "") {
    console.error("Usage: memoli memo <name>");
    process.exit(EXIT_FAILURE);
  }

  await ensureDir(MEMO_DIR);

  const filePath = join(MEMO_DIR, `${name}.md`);
  await ensureMemoFile(filePath, name);

  openInEditor(filePath);
};
