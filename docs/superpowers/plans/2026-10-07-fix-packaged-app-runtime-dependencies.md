# Fix Packaged App Runtime Dependencies and Verification Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure all production runtime dependencies (including `builder-util-runtime`, `electron-updater` subdependencies, `debug`, and `mime@1.6.0` for `send`/Express static serving) are fully bundled into `app.asar`, verify the packaged application launches cleanly without runtime JavaScript errors, and stage code for repository synchronization.

**Architecture & Root Cause Analysis:**
- In pnpm with symlinked virtual store (`.pnpm`), `electron-builder` resolves direct dependencies from root `package.json` into `app.asar/node_modules/` but misses transitive runtime dependencies required by packages like `electron-updater` (`builder-util-runtime`, `lazy-val`, `js-yaml`, `tiny-typed-emitter`, `ms`, `sax`, `debug`, etc.).
- Modul `debug` had a broken junction pointing to a non-existent directory in `.pnpm`, which prevented `electron-builder` from packaging it into `app.asar`.
- Modul `mime` was hoisted to v2.6.0 by devDependencies, causing `send` (which expects `mime.lookup` from `mime@1.x`) to crash with `TypeError: mime.lookup is not a function` when serving frontend static files.
- Pinning `"mime": "1.6.0"`, fixing the `debug` junction, and adding explicit runtime dependencies in `package.json` resolved all startup and runtime errors.

**Tech Stack:** Electron 32, electron-builder 24.13.3, pnpm 12.3.4, Node.js 26.8.1, TypeScript 5.9.3.

---

### Task 1: Fix Node Modules Hoisting and Production Dependencies

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [x] **Step 1: Ensure `.npmrc` and explicit runtime dependencies in `package.json`**
  Added `builder-util-runtime`, `lazy-val`, `js-yaml`, `tiny-typed-emitter`, `lodash.escaperegexp`, `lodash.isequal`, `debug`, `ms`, `sax`, `bindings`, `if-async`, `stream-slicer`, `through2`, and `mime: 1.6.0` to `dependencies`.
- [x] **Step 2: Fix `node_modules/debug` directory/junction**
  Created junction and directory mapping to eliminate broken symlinks in `node_modules`.
- [x] **Step 3: Verify all runtime dependencies resolve from project root**
  Tested `debug`, `ms`, `sax`, `mime.lookup`, `send`, `sqlite3`, `puppeteer`, etc.

---

### Task 2: Build, Package, and Verify ASAR Contents

**Files:**
- Test: `electron/output/win-unpacked`

- [x] **Step 1: Clean build and package to unpacked directory & installer**
  Ran `npm run package` creating unpacked binaries and NSIS installer.
- [x] **Step 2: Audit `app.asar` contents**
  Inspected `electron/output/win-unpacked/resources/app.asar` using `npx asar list` confirming `builder-util-runtime`, `electron-updater`, `debug`, `mime` (v1.6.0), `fs-extra`, `sqlite3`, and other modules are present.

---

### Task 3: Launch Packaged Application and Verify Runtime Stability

**Files:**
- Test: `electron/output/win-unpacked/AsistenQ Tiktok.exe`

- [x] **Step 1: Launch the unpacked executable**
  Spawned `AsistenQ Tiktok.exe` and monitored stdout/stderr and process lifecycle.
- [x] **Step 2: Verify HTTP server & static file serving**
  Sent HTTP requests to internal Express server `http://localhost:9184/`, fetching root HTML, static JS (`main.*.js`), and static CSS (`main.*.css`). All returned 200 OK with correct MIME types and zero exceptions.
- [x] **Step 3: Gracefully terminate the test application process**

---

### Task 4: Save to Superpowers & Sync to GitHub

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `frontend-app/package.json`
- Modify: `scripts/release.js`
- Push: GitHub `origin/master`

- [x] **Step 1: Update superpowers implementation plan**
- [x] **Step 2: Commit all changes with clear descriptive message**
- [x] **Step 3: Push commits to GitHub `origin/master`**
