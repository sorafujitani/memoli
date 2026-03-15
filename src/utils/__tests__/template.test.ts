import { expect, test, vi } from "vitest";

import { TEMP_DIR } from "../../config.ts";
import { getTemplatePath } from "../template.ts";

test("getTemplatePath returns correct path", () => {
  const result = getTemplatePath("work");
  expect(result).toBe(`${TEMP_DIR}/work.md`);
});

test("loadTemplate throws error for non-existent template", async () => {
  // Bun.file is not available in vitest (Node.js), so mock it
  const mockFile = { exists: vi.fn().mockResolvedValue(false), text: vi.fn() };
  (globalThis as Record<string, unknown>).Bun = {
    file: vi.fn().mockReturnValue(mockFile),
  };

  const { loadTemplate } = await import("../template.ts");
  await expect(loadTemplate("non-existent-template")).rejects.toThrow(
    "Template not found",
  );

  delete (globalThis as Record<string, unknown>).Bun;
});
