# Fix Packaged App Socket Data Loading & Sidebar Synchronization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the critical issue where the packaged production application (`AsistenQ Tiktok.exe`) successfully opens and bypasses authentication but displays "No data" and "Total Saldo Rp 0" in the UI because accounts and metrics fail to load from the backend.

**Architecture:**
- Backend:
  - Replace broken `electron-is-packaged` package calls with native `electron.app.isPackaged` across `src/index.ts`, `src/class/Server.ts`, and `src/class/Notification.ts`.
  - Fix Socket.IO CORS configuration in `Server.ts` to allow local origins dynamically.
  - In `prepareSocket` (`Server.ts`), proactively emit `this.monitoring.sendMainData()` on socket connection.
  - Implement getter/setter for `monitoring` on `Device.ts` to trigger data synchronization as soon as device registration is confirmed.
- Frontend:
  - Refactor `MainData.js` and `SidebarData.js` to use getters/setters for callbacks (`onMainData`, `onData`, `onRefreshData`) with caching (`lastData`, `lastRefreshData`) so components mounting after socket events receive data immediately.
  - Wrap socket listeners in anonymous closures instead of passing initial dummy functions by reference.
  - Call `MAINDATA.getMainData()` in `Home/index.jsx` and `sidebarData.getData()` in `MainSidebar/index.jsx` upon component mount.

**Tech Stack:** Electron 32, Node.js 26, React 18, Socket.IO 4.7/4.8, SQLite3, Express 4.

---

### Task 1: Fix Native isPackaged and Socket.IO Server Configuration

**Files:**
- Modify: `src/class/Server.ts`
- Modify: `src/class/Notification.ts`
- Modify: `src/index.ts`
- Modify: `src/class/Device.ts`

- [x] **Step 1: Replace `electron-is-packaged` with `electron.app.isPackaged`**
  - Update `src/class/Server.ts` constructor to evaluate `this.isPackaged = app && app.isPackaged ? true : false`.
  - Update `src/class/Notification.ts` sound path resolution to check `(electron.app && electron.app.isPackaged)`.
  - Update `src/index.ts` URL and startup checks to use `app.isPackaged`.

- [x] **Step 2: Update Socket.IO Server CORS and Proactive Data Emission**
  - Update `start()` in `src/class/Server.ts` to set CORS `origin: (origin, callback) => callback(null, true)` and enable `allowEIO3: true`.
  - Update `prepareSocket` in `src/class/Server.ts` to call `this.monitoring.sendMainData()` on connection.

- [x] **Step 3: Update `Device.ts` Monitoring Setter**
  - Implement getter and setter for `Device.ts` monitoring property to trigger `_monitoring.sendMainData()` if `this.registered` is true.

---

### Task 2: Fix Frontend Socket Data Handlers and Lifecycle Synchronization

**Files:**
- Modify: `frontend-app/src/utils/main/MainData.js`
- Modify: `frontend-app/src/utils/main/SidebarData.js`
- Modify: `frontend-app/src/page/Home/index.jsx`
- Modify: `frontend-app/src/element/MainSidebar/index.jsx`

- [x] **Step 1: Implement Dynamic Delegation and State Caching in `MainData.js`**
  - Implement `lastData` caching and getter/setter for `onMainData`.
  - Wrap `socket.on('monitoring-main-data')` in closure invoking `this._onMainData(data)`.
  - Add safe `getMainData()` fallback checking connection state.

- [x] **Step 2: Implement Dynamic Delegation and State Caching in `SidebarData.js`**
  - Implement `lastData` and `lastRefreshData` caching with getters/setters for `onData` and `onRefreshData`.
  - Add `getData()` method.

- [x] **Step 3: Proactively Request Data on Component Mount**
  - Call `MAINDATA.getMainData()` on mount in `Home/index.jsx`.
  - Call `sidebarData.getData()` on mount in `MainSidebar/index.jsx`.

---

### Task 3: Build, Package, and Verify

- [x] **Step 1: Build Frontend App**
  - Run `npm --prefix frontend-app run build`.

- [x] **Step 2: Compile Backend and Assets**
  - Run `npx tsc --emitDecoratorMetadata --downlevelIteration`.
  - Copy frontend build and assets to `dist/`.
  - Run `npx electron-builder --dir`.

- [x] **Step 3: Test and Verify with Socket Client**
  - Launch packaged executable `electron\output\win-unpacked\AsistenQ Tiktok.exe`.
  - Verify receipt of `monitoring-main-data` (6 accounts) and `main-sidebar-data` (`allAccountCount: 6`, `complaintCount: 1`).
