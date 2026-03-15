#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const https = require("node:https");

const REPO = "sorafujitani/memoli";
const BIN_DIR = path.join(__dirname, "..", "bin");
const BIN_PATH = path.join(BIN_DIR, "memoli-binary");

const MAX_REDIRECTS = 5;
const HTTP_REDIRECT_MIN = 300;
const HTTP_REDIRECT_MAX = 400;
const HTTP_OK = 200;
const FILE_MODE = 0o755;

/** @type {Record<string, string>} */
const PLATFORM_MAP = {
  "darwin-arm64": "darwin-arm64",
  "darwin-x64": "darwin-x64",
  "linux-arm64": "linux-arm64",
  "linux-x64": "linux-x64",
};

/** @returns {string | undefined} */
const getPlatformKey = () => {
  const key = `${os.platform()}-${os.arch()}`;
  return PLATFORM_MAP[key];
};

const getPackageVersion = () => {
  const pkg = require("../package.json");
  return pkg.version;
};

const downloadFile = (targetUrl, dest) =>
  new Promise((resolve, reject) => {
    const follow = (currentUrl, redirects = 0) => {
      if (redirects > MAX_REDIRECTS) {
        reject(new Error("Too many redirects"));
        return;
      }

      https
        .get(
          String(currentUrl),
          { headers: { "User-Agent": "memoli-installer" } },
          (res) => {
            if (
              res.statusCode >= HTTP_REDIRECT_MIN &&
              res.statusCode < HTTP_REDIRECT_MAX &&
              res.headers.location !== undefined &&
              res.headers.location !== ""
            ) {
              follow(res.headers.location, redirects + 1);
              return;
            }

            if (res.statusCode !== HTTP_OK) {
              reject(
                new Error(`Failed to download: ${String(res.statusCode)}`),
              );
              return;
            }

            const file = fs.createWriteStream(String(dest));
            res.pipe(file);
            file.on("finish", () => {
              file.close();
              resolve();
            });
            file.on("error", reject);
          },
        )
        .on("error", reject);
    };

    follow(targetUrl);
  });

const ensureBinDir = () => {
  if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
  }
};

const buildDownloadUrl = (platformKey) => {
  const version = getPackageVersion();
  const binaryName = `memoli-${platformKey}`;
  return `https://github.com/${REPO}/releases/download/v${version}/${binaryName}`;
};

const installBinary = async (platformKey) => {
  const url = buildDownloadUrl(platformKey);

  console.log(`Downloading memoli binary for ${platformKey}...`);

  ensureBinDir();

  try {
    await downloadFile(url, BIN_PATH);
    fs.chmodSync(BIN_PATH, FILE_MODE);
    console.log("memoli binary installed successfully!");
  } catch (error) {
    console.error(`Failed to download binary: ${error.message}`);
    console.log(`You can manually download from:\n  ${url}`);
  }
};

/** @type {string | undefined} */
const platformKey = getPlatformKey();

if (platformKey === undefined) {
  console.log(`Unsupported platform: ${os.platform()}-${os.arch()}`);
  console.log("memoli binary not installed. You can build from source.");
} else {
  // eslint-disable-next-line unicorn/prefer-top-level-await -- CJS does not support top-level await
  void installBinary(platformKey);
}
