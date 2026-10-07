# Setup and Development Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure and verify both Backend (Electron + TypeScript + Express) and Frontend (React CRA) so they can run concurrently and smoothly in development mode.

**Architecture:** The repository maintains two distinct branches (`backend` and `frontend`). In development mode, the React frontend runs on `http://localhost:3000` via `pnpm start` (in a tracked worktree/subfolder), while the Electron backend runs its Express API/Socket server on port 9184 and launches an Electron window loading `http://localhost:3000/authentication`.

**Tech Stack:** Electron 32, TypeScript 5.9, Express 4, React 18, React Router 6, Socket.IO, pnpm 12.

**Spec:** Requirement to ensure both backend and frontend branches are installed, configured with pnpm, capable of building and running in development mode, and that backend properly loads the frontend.

## Global Constraints

- Use `pnpm` as the package manager for both backend and frontend environments.
- Backend Express server listens on port 9184 with CORS enabled for `http://localhost:3000`.
- Frontend runs on `http://localhost:3000` and proxies/connects to `http://localhost:9184`.
- Preserve existing branch structure (`backend` and `frontend`).

---

### Task 1: Setup Isolated Frontend Worktree and Install Dependencies

**Files:**
- Create: `frontend-app/` (via `git worktree add frontend-app frontend`)
- Modify: `frontend-app/package.json`

**Interfaces:**
- Consumes: `frontend` branch from git repository
- Produces: Working React frontend workspace with node_modules ready for development

- [ ] **Step 1: Create git worktree for the frontend branch**

Run command:
```powershell
git worktree add frontend-app frontend
```

- [ ] **Step 2: Adjust `frontend-app/package.json` for pnpm compatibility**

Remove the Yarn packageManager lock if present so pnpm installs cleanly.

- [ ] **Step 3: Install frontend dependencies using pnpm**

Run command:
```powershell
cd frontend-app; pnpm install; cd ..
```

- [ ] **Step 4: Verify frontend build compiles without errors**

Run command:
```powershell
cd frontend-app; pnpm run build; cd ..
```
Expected: Build output generated in `frontend-app/build` successfully.

---

### Task 2: Verify Backend TypeScript Build and Static Asset Bundling

**Files:**
- Modify: `package.json` (root backend)
- Test: `dist/index.js`, `dist/controller/renderFrontend.js`

**Interfaces:**
- Consumes: `src/` TypeScript codebase
- Produces: Compiled `dist/` directory with static assets (images, sounds, controllers)

- [ ] **Step 1: Test TypeScript build script**

Run command:
```powershell
pnpm run build
```

- [ ] **Step 2: Verify compiled outputs exist in `dist/`**

Verify `dist/index.js` and required subdirectories exist.

- [ ] **Step 3: Verify Express server startup in development mode**

Start the backend server in background or test mode to verify port 9184 opens and handles requests.

---

### Task 3: End-to-End Development Integration Verification

**Files:**
- Test: `frontend-app` (dev server on port 3000)
- Test: Backend Electron app loading `http://localhost:3000/authentication`

**Interfaces:**
- Consumes: Frontend running on port 3000, Backend Express on port 9184
- Produces: Verified full dev workflow where Electron main window communicates with React frontend and Express API

- [x] **Step 1: Start React frontend development server on port 3000**

Run in background:
```powershell
cd frontend-app; pnpm start
```

- [x] **Step 2: Verify frontend HTTP response at `http://localhost:3000`**

Perform HTTP GET request to verify React app serves HTML and assets.

- [x] **Step 3: Verify Backend Express API responds on `http://localhost:9184`**

Perform HTTP request to backend health / ping / authentication route.

- [x] **Step 4: Document development launch instructions for both services**
