# Automated Release Script Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create an automated release system (`release.bat` and `scripts/release.js`) that displays the current version, prompts for a target release version, builds both React frontend and Electron TypeScript backend cleanly, packages the Windows NSIS installer via electron-builder, removes/replaces spaces with hyphens (`-`) in artifact filenames and `latest.yml`, and uploads installer, blockmap, and `latest.yml` to `/var/www/html/asistenq-tiktok-update` on `45.76.183.58`.

**Architecture:**
- `release.bat`: Windows batch entry point that calls Node.js release runner with color-coded console output.
- `scripts/release.js`: Interactive Node.js script handling version prompt, atomic version updates, frontend & backend build steps, `electron-builder` invocation, artifact space-to-hyphen renaming & `latest.yml` patching, and SFTP upload with progress bars.

**Tech Stack:** Node.js, `ssh2` SFTP client, `electron-builder`, React CRA, TypeScript, Windows Batch.

---

### Task 1: Create `scripts/release.js` Automation Runner

**Files:**
- Create: `scripts/release.js`

**Interfaces:**
- Consumes: `package.json`, `frontend-app/package.json`, `45.76.183.58` SSH credentials
- Produces: Complete automated build, package, rename, and SFTP upload process

- [ ] **Step 1: Implement Interactive Version Prompter and Version Updater**
  - Read current version from `package.json`.
  - Prompt user with `Current version: X.Y.Z. Enter new release version [default: auto-increment patch]:`.
  - Update version in both root `package.json` and `frontend-app/package.json`.

- [ ] **Step 2: Implement Complete Build & Package Pipeline**
  - Build React frontend: `pnpm --dir frontend-app run build`.
  - Build Backend TypeScript and bundle assets: `pnpm run build`.
  - Run `electron-builder --win` targeting `electron/output`.

- [ ] **Step 3: Implement Space-to-Hyphen Sanitization on Artifacts & `latest.yml`**
  - Scan `electron/output/` for installer `.exe`, `.exe.blockmap`, and `latest.yml`.
  - Rename filenames to replace spaces with `-` (e.g. `AsistenQ-Tiktok-Setup-X.Y.Z.exe`).
  - Read `latest.yml`, replace any space occurrences in `url:` and `path:` fields with `-`, and save.

- [ ] **Step 4: Implement SFTP Upload with Progress Telemetry**
  - Connect to `45.76.183.58:22` as `root` with provided credentials.
  - Upload `latest.yml`, `.exe`, and `.exe.blockmap` to `/var/www/html/asistenq-tiktok-update`.
  - Display live file upload progress and transfer speeds.

---

### Task 2: Create Windows Batch Launcher `release.bat`

**Files:**
- Create: `release.bat`

**Interfaces:**
- Consumes: User invocation from Windows terminal or double-click
- Produces: Interactive CLI runner executing `scripts/release.js`

- [ ] **Step 1: Author `release.bat` script**
  - Check Node.js and pnpm availability.
  - Execute `node scripts/release.js`.
  - Pause on exit with clear completion/failure exit code.

---

### Task 3: Test and Dry-Run Verification

**Files:**
- Test: `scripts/release.js`, `release.bat`

- [ ] **Step 1: Verify version prompter and package.json synchronization**
- [ ] **Step 2: Test artifact renaming and `latest.yml` parser**
- [ ] **Step 3: Test SFTP connectivity and directory listing verification**
