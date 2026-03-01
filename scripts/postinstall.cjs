#!/usr/bin/env node

const {
  createWriteStream,
  chmodSync,
  existsSync,
  mkdirSync,
} = require("node:fs");
const { join } = require("node:path");
const { arch, platform } = require("node:os");
const https = require("node:https");
const { execSync } = require("node:child_process");

const REPO = "sorafujitani/memoli";
const BIN_DIR = join(__dirname, "..", "bin");
const BIN_PATH = join(BIN_DIR, "memoli-binary");

function getPlatformKey() {
  const p = platform();
  const a = arch();

  if (p === "darwin" && a === "arm64") return "darwin-arm64";
  if (p === "darwin" && a === "x64") return "darwin-x64";
  if (p === "linux" && a === "x64") return "linux-x64";
  if (p === "linux" && a === "arm64") return "linux-arm64";

  return null;
}

function getPackageVersion() {
  const pkg = require("../package.json");
  return pkg.version;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = (url, redirects = 0) => {
      if (redirects > 5) {
        reject(new Error("Too many redirects"));
        return;
      }

      https
        .get(url, { headers: { "User-Agent": "memoli-installer" } }, (res) => {
          if (
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            follow(res.headers.location, redirects + 1);
            return;
          }

          if (res.statusCode !== 200) {
            reject(new Error(`Failed to download: ${res.statusCode}`));
            return;
          }

          const file = createWriteStream(dest);
          res.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
          file.on("error", reject);
        })
        .on("error", reject);
    };

    follow(url);
  });
}

async function main() {
  const platformKey = getPlatformKey();

  if (!platformKey) {
    console.log(`Unsupported platform: ${platform()}-${arch()}`);
    console.log("memoli binary not installed. You can build from source.");
    process.exit(0);
  }

  const version = getPackageVersion();
  const binaryName = `memoli-${platformKey}`;
  const url = `https://github.com/${REPO}/releases/download/v${version}/${binaryName}`;

  console.log(`Downloading memoli binary for ${platformKey}...`);

  if (!existsSync(BIN_DIR)) {
    mkdirSync(BIN_DIR, { recursive: true });
  }

  try {
    await downloadFile(url, BIN_PATH);
    chmodSync(BIN_PATH, 0o755);
    console.log("memoli binary installed successfully!");
  } catch (err) {
    console.error(`Failed to download binary: ${err.message}`);
    console.log("You can manually download from:");
    console.log(`  ${url}`);
    process.exit(0);
  }
}

main();
