const NEWLINE = "\n";

interface LineBuffer {
  data: string;
}

const extractLines = (buf: LineBuffer): string[] => {
  const lines: string[] = [];
  let newlineIndex = buf.data.indexOf(NEWLINE);
  while (newlineIndex !== -1) {
    const line = buf.data.slice(0, newlineIndex).trim();
    buf.data = buf.data.slice(newlineIndex + 1);
    if (line.length > 0) {
      lines.push(line);
    }
    newlineIndex = buf.data.indexOf(NEWLINE);
  }
  return lines;
};

export async function* readStdinLines(): AsyncGenerator<string> {
  const reader = Bun.stdin.stream().getReader();
  const decoder = new TextDecoder();
  const buf: LineBuffer = { data: "" };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buf.data += decoder.decode(value, { stream: true });
    yield* extractLines(buf);
  }

  const remaining = buf.data.trim();
  if (remaining.length > 0) {
    yield remaining;
  }
}

export const writeStdout = (message: unknown): void => {
  process.stdout.write(`${JSON.stringify(message)}${NEWLINE}`);
};
