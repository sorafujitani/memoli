---
name: release:patch-version-brew
description: Bump patch version (e.g. 1.0.1 → 1.0.2), build, release to GitHub, and update Homebrew formula.
---

# Release Patch Version with Homebrew Update

Perform a **patch** version bump and full release pipeline.

## Steps

1. **Read current version** from `src/config.ts` (the `VERSION` constant) and `package.json`.

2. **Compute new version**: Increment the patch segment.
   - Example: `1.0.1` → `1.0.2`

3. **Update version** in both files:
   - `src/config.ts`: `export const VERSION = "<new>";`
   - `package.json`: `"version": "<new>"`

4. **Run checks and tests**:

   ```bash
   bun run check -- --fix
   bun run test
   ```

   If tests fail, fix the issue before continuing.

5. **Commit and tag**:

   ```bash
   git add src/config.ts package.json
   git commit -m "chore: bump version to <new>"
   git tag v<new>
   git push origin main --tags
   ```

6. **Wait for CI** to pass on the tag:

   ```bash
   gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId') --exit-status
   ```

7. **Build release binaries**:

   ```bash
   bun run release
   ```

   This outputs SHA256 checksums for each platform.

8. **Create GitHub Release** with binaries:

   ```bash
   gh release create v<new> \
     dist/memoli-darwin-x64 \
     dist/memoli-darwin-arm64 \
     dist/memoli-linux-x64 \
     dist/memoli-linux-arm64 \
     --title "v<new>" \
     --generate-notes
   ```

9. **Update Homebrew formula** at `~/dev/oss/homebrew-memoli/Formula/memoli.rb`:
   - Update `version "<new>"`
   - Update all 4 `sha256` values from the build output
   - Commit and push:
     ```bash
     cd ~/dev/oss/homebrew-memoli
     git add Formula/memoli.rb
     git commit -m "bump memoli to <new>"
     git push origin main
     ```

10. **Report** the release URL and confirm Homebrew tap is updated.
