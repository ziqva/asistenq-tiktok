# Task 1 Brief: Create scripts/release.js Automation Runner

## Objective
Create a Node.js release script at `scripts/release.js` with full CLI interactivity and automated build/package/upload steps:
1. Show current version from `package.json`.
2. Allow inputting a custom version (or Enter for auto-increment).
3. Update version in `package.json` and `frontend-app/package.json` (if exists).
4. Run full production build:
   - `frontend-app` build: `pnpm --dir frontend-app run build`
   - Backend build and asset bundling: `pnpm run build`
   - Electron builder: `npx electron-builder --win`
5. Scan `electron/output/` for output artifacts:
   - Rename `.exe` and `.exe.blockmap` so that all spaces are replaced with `-` (e.g. `AsistenQ-Tiktok-Setup-X.Y.Z.exe`).
   - Read `latest.yml`, replace any space in `url:` and `path:` fields with `-`, and save.
6. Connect via `ssh2` SFTP to `45.76.183.58:22` (user `root`, pass `q?X76dMq?tmbiyo}`).
7. Upload `.exe`, `.exe.blockmap`, and `latest.yml` to `/var/www/html/asistenq-tiktok-update`.
8. Support a `--dry-run` or `--skip-build` CLI flag for testing without performing full 5-minute packaging if requested.

## Output Target:
- Create `scripts/release.js`
- Write report to `.superpowers/sdd/2026-10-07-automated-release-script/task-1-report.md`
