#!/usr/bin/env bun

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

console.log("Building memoli binaries for GitHub Releases...\n");

await mkdir(distDir, { recursive: true });

for (const { name, target } of targets) {
  const outfile = `${distDir}/memoli-${name}`;
  console.log(`Building for ${name}...`);

  // eslint-disable-next-line no-await-in-loop -- sequential builds required for cross-compilation
  await $`bun build ${entrypoint} --compile --minify --target ${target} --outfile ${outfile}`;

  console.log(`  -> ${outfile}\n`);
}

console.log("Build complete!");
console.log(`\nBinaries are in ${distDir}/`);
console.log("Upload these to GitHub Releases with tag v<version>");
