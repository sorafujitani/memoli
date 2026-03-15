import { MEMOLI_DIR, MEMO_DIR, REPORTS_DIR, TEMP_DIR } from "../config.ts";

export const init = async (): Promise<void> => {
  const dirs = [MEMOLI_DIR, REPORTS_DIR, TEMP_DIR, MEMO_DIR];

  await Promise.all(
    dirs.map(async (dir) => {
      const file = Bun.file(dir);
      if (await file.exists()) {
        return;
      }
      await Bun.$`mkdir -p ${dir}`;
    }),
  );

  console.log(`Initialized memoli at ${MEMOLI_DIR}`);
  console.log("Created directories:");
  console.log(`  - ${REPORTS_DIR}`);
  console.log(`  - ${TEMP_DIR}`);
  console.log(`  - ${MEMO_DIR}`);
};
