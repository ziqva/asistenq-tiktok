# Fix Missing Sidebar, Table Columns, and Import/Export Errors Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the blank/missing sidebar buttons, missing table columns on initial/empty state, multipart upload runtime error (`iterable is not async iterable`), and null-reference errors during account Excel import and export.

**Architecture:**
- Frontend: Replace Node.js `form-data` package imports with browser-native `FormData` in `importAccount.js` and `postMessage.js`, initialize `refreshData` state so `FilterButton` always renders, and initialize table `activeColumnIndex` with default column indices while mounting the custom column socket listener at the controller level.
- Backend: Update `Account.ts` `_exports` and `imports` methods to handle null/undefined cell values, empty worksheets, and user-cancelled file dialogs safely without throwing unhandled exceptions.

**Tech Stack:** React 18, Ant Design 5, Material-UI 5, Axios, ExcelJS, Electron 32, TypeScript 5.9, Express 4.

**Spec:** Resolve all bugs preventing sidebar rendering, table column rendering, account import via Excel, and account export.

## Global Constraints

- Never use Node.js `form-data` package in frontend code meant for the browser/Electron renderer.
- Ensure all table columns ("No", "Account", "Chat", "New Order", "Dikemas", "Dikirim", "Complaint", "Saldo", "Product", "Status", "Action") render even when the account dataset is empty.
- Ensure the sidebar filter buttons ("Semua Akun", "Akun Aktif", "Akun Bersaldo", "Moderasi", "Logout", "Pengaturan", "About", "Cek Update") are always visible regardless of socket state.
- Keep Excel import/export template compatibility intact.

---

### Task 1: Fix Frontend Multipart Upload and LiveChat FormData

**Files:**
- Modify: `frontend-app/src/utils/importAccount.js`
- Modify: `frontend-app/src/utils/liveChat/postMessage.js`

**Interfaces:**
- Consumes: User selected `.xlsx` file / chat attachment
- Produces: Native browser multipart/form-data upload to `/account/imports` and `/chat/post` without `iterable is not async iterable` error

- [x] **Step 1: Update `frontend-app/src/utils/importAccount.js`**
  - Remove `import FormData from 'form-data'` (use browser native `FormData`).
  - Send `FormData` with native boundary handling.

- [x] **Step 2: Update `frontend-app/src/utils/liveChat/postMessage.js`**
  - Remove `import FormData from 'form-data'` (use browser native `FormData`).

---

### Task 2: Fix Sidebar Filter Buttons Lifecycle & Always Render in `MainSidebar`

**Files:**
- Modify: `frontend-app/src/element/MainSidebar/index.jsx`
- Modify: `frontend-app/src/element/MainSidebar/FilterButton.jsx`

**Interfaces:**
- Consumes: Socket events `main-sidebar-data` and `refresh-account-data`
- Produces: Unconditionally rendered sidebar buttons (`Semua Akun`, `Akun Aktif`, `Akun Bersaldo`, `Moderasi`, `Logout`, `Pengaturan`, `About`, `Cek Update`)

- [x] **Step 1: Update `frontend-app/src/element/MainSidebar/index.jsx`**
  - Initialize `refreshData` state with `{ running: false, progress: { percentage: 0, processed: 0, total: 0 } }`.
  - Always render `<FilterButton />` without conditional hiding.

- [x] **Step 2: Update `frontend-app/src/element/MainSidebar/FilterButton.jsx`**
  - Safely access `refreshData?.running` and `refreshData?.progress`.

---

### Task 3: Fix Main Data Table Column Initialization and Custom Column Socket Sync

**Files:**
- Modify: `frontend-app/src/element/MainDataController/index.jsx`
- Modify: `frontend-app/src/element/MainDataController/CustomColumn.jsx`

**Interfaces:**
- Consumes: `data` array of accounts, `column-data` socket events
- Produces: Fully rendered Ant Design table with all active columns visible regardless of account count

- [x] **Step 1: Initialize active columns in `MainDataController/index.jsx`**
  - Set initial `activeColumnIndex` to `[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]`.
  - Connect `MainData` column listener inside `MainDataController` so column preferences load immediately upon component mount.

- [x] **Step 2: Always make column controls available**
  - Ensure column configurations and table headers remain intact when `data.length === 0`.

---

### Task 4: Fix Robustness in `Account.ts` for Import and Export

**Files:**
- Modify: `src/class/Account.ts`
- Modify: `src/controller/account/exports.ts`

**Interfaces:**
- Consumes: Excel buffer from import upload / account objects from SQLite
- Produces: Robust export generation and fault-tolerant account import

- [x] **Step 1: Guard null/undefined values in `Account._exports`**
  - Use `(account.shopid ?? '').toString()`, `(account.auth?.fp ?? '').toString()`, etc.
  - Return `{ cancelled: true }` when user dismisses the save file dialog instead of throwing a generic error alert.

- [x] **Step 2: Guard row iterations and cell reading in `Account.imports`**
  - Guard `worksheet.rowCount` and ensure `rows` is defined.
  - Safely read cell values with string nullish fallback before calling `.toString().trim()`.
  - Wrap per-row parsing in try-catch so invalid rows are logged to `accountImportErrors` rather than aborting the entire batch.

---

### Task 5: Fix Auto-Updater `latest.yml` Generation in `package.json`

**Files:**
- Modify: `package.json`

- [x] **Step 1: Configure generic publish provider in `package.json`**
  - Set `"publish": [{ "provider": "generic", "url": "http://45.76.183.58/asistenq-tiktok-update/" }]`.
  - Enables `electron-builder` to generate `latest.yml` metadata for differential updates.

---

### Task 6: Build, Test, and Verify Fixes

**Files:**
- Run: `cd frontend-app; pnpm run build; cd ..`
- Run: `pnpm run build`
- Run: `npx electron-builder --win -p never`
- Test: Frontend build output in `dist/controller/frontend/`, TypeScript in `dist/`, and installer artifacts in `electron/output/` (`.exe`, `.exe.blockmap`, `latest.yml`)

- [x] **Step 1: Compile React Frontend bundle**
- [x] **Step 2: Compile TypeScript backend and copy assets**
- [x] **Step 3: Verify all components, builds, and updater metadata generate cleanly**
