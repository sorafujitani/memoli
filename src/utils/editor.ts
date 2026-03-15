import { spawn } from "node:child_process";

const EXIT_SUCCESS = 0;

export const openInEditor = (filePath: string): void => {
  const editor = process.env["EDITOR"] ?? "vi";
  const child = spawn(editor, [filePath], {
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    process.exit(code ?? EXIT_SUCCESS);
  });
};
