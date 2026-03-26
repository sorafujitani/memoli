import { expect, test } from "vitest";

import { TEMP_DIR } from "../../config.ts";
import { getTemplatePath, loadTemplate } from "../template.ts";

test("getTemplatePath returns correct path", () => {
  const result = getTemplatePath("work");
  expect(result).toBe(`${TEMP_DIR}/work.md`);
});

test("loadTemplate throws error for non-existent template", async () => {
  await expect(loadTemplate("non-existent-template")).rejects.toThrow(
    "Template not found",
  );
});
