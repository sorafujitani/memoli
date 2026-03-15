#!/usr/bin/env bun

import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";

import { $ } from "bun";

const targets = [
  { name: "darwin-x64", target: "bun-darwin-x64" },
  { name: "darwin-arm64", target: "bun-darwin-arm64" },
  { name: "linux-x64", target: "bun-linux-x64" },
  { name: "linux-arm64", target: "bun-linux-arm64" },
] as const;

const entrypoint = "./index.ts";
const distDir = "./dist";

console.log("Building memoli binaries for release...\n");

await mkdir(distDir, { recursive: true });

const checksums: Record<string, string> = {};

for (const { name, target } of targets) {
  const outfile = `${distDir}/memoli-${name}`;
  console.log(`Building for ${name}...`);

  // eslint-disable-next-line no-await-in-loop -- sequential builds required for cross-compilation
  await $`bun build ${entrypoint} --compile --minify --target ${target} --outfile ${outfile}`;

  // eslint-disable-next-line no-await-in-loop -- depends on sequential build above
  const buffer = await Bun.file(outfile).arrayBuffer();
  const hash = createHash("sha256").update(Buffer.from(buffer)).digest("hex");
  checksums[name] = hash;

  console.log(`  -> ${outfile}`);
  console.log(`  -> SHA256: ${hash}\n`);
}

console.log("Build complete!\n");
console.log("=== SHA256 Checksums for Homebrew Formula ===\n");
for (const [name, hash] of Object.entries(checksums)) {
  console.log(`${name}: ${hash}`);
}
