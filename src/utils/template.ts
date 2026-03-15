import { join } from "node:path";

import { TEMP_DIR } from "../config.ts";

export const getTemplatePath = (name: string): string =>
  join(TEMP_DIR, `${name}.md`);

export const loadTemplate = async (name: string): Promise<string> => {
  const path = getTemplatePath(name);
  const file = Bun.file(path);

  if (await file.exists()) {
    return file.text();
  }

  throw new Error(`Template not found: ${path}`);
};
