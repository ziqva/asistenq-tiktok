# Fix Missing Transitive Dependency Errors in Electron Package

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the packaged Electron app error (`Cannot find module 'universalify'` / missing dependencies) caused by pnpm's isolated symlinked virtual store when `electron-builder` packages files into `app.asar`, ensuring all direct and transitive runtime dependencies are correctly hoisted and bundled into release builds.

**Root Cause Analysis:**
- `pnpm` by default uses isolated symlinks (`node_modules/.pnpm/...`).
- When `electron-builder` packages `node_modules` into `app.asar`, it follows symlinks or copies only the root `node_modules` folder (containing only ~77 direct packages).
- Dependencies like `fs-extra` (and `electron-updater`) require `universalify`, `jsonfile`, `graceful-fs`, which reside in the isolated `.pnpm` virtual store rather than being accessible inside `app.asar/node_modules/`.
- Although `.npmrc` had `node-linker=hoisted` and `shamefully-hoist=true`, pnpm requires explicit installation or workspace configuration so `node_modules` has a flat/hoisted structure where all transitive dependencies are present in `node_modules/`.

**Tech Stack:** Node.js, Electron 32, electron-builder, pnpm 12, asar, Windows NSIS.

---

### Task 1: Ensure Hoisted Dependency Layout in Repository

**Files:**
- Modify: `.npmrc`
- Modify: `scripts/release.js`

**Interfaces:**
- Consumes: `.npmrc`, `package.json`
- Produces: A consistent flat/hoisted `node_modules` layout where all transitive packages (`universalify`, `graceful-fs`, `jsonfile`, etc.) are directly resolvable inside `node_modules/`.

- [ ] **Step 1: Verify `.npmrc` hoisting settings**
  Ensure `.npmrc` contains:
  ```ini
  node-linker=hoisted
  shamefully-hoist=true
  ```

- [ ] **Step 2: Add pre-build sanity verification check in `scripts/release.js`**
  Add automated pre-packaging check in `scripts/release.js` that verifies critical runtime dependencies (`universalify`, `electron-updater`, `fs-extra`) resolve properly before running `electron-builder`.

---

### Task 2: Package and Verify ASAR Bundle Integrity

**Files:**
- Test: `electron/output/win-unpacked/resources/app.asar`
- Test: Extracted asar module loader tests

**Interfaces:**
- Consumes: `pnpm run build`, `npx electron-builder --win --dir`
- Produces: Verified `app.asar` without missing transitive module exceptions.

- [ ] **Step 1: Build unpacked Windows distribution**
  Run `npx electron-builder --win --dir`

- [ ] **Step 2: Extract and test require inside ASAR**
  Extract `app.asar` and run validation script testing `require('electron-updater')` and `require('fs-extra')`.
  Expected: Clean resolution with 0 module errors.

- [ ] **Step 3: Launch unpacked Electron application executable**
  Test running `electron/output/win-unpacked/AsistenQ Tiktok.exe` to confirm no JavaScript runtime exception modal appears on startup.

---

### Task 3: Dry-Run and Full Release Verification

**Files:**
- Test: `scripts/release.js`

- [ ] **Step 1: Run `node scripts/release.js --dry-run` to test release runner**
- [ ] **Step 2: Document resolution and provide release instructions to the user**
