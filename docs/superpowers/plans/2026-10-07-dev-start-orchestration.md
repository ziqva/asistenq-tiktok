# Implementation Plan - Orchestrated Start (Frontend Dev Server & Electron Backend)

## Background & Objective
When running `npm start` (or `pnpm start`), the developer expects:
1. The frontend development server (`frontend-app`) to start up automatically in the background.
2. The frontend development server MUST NOT open an external default web browser (set `BROWSER=none`).
3. The backend compilation / build should run, and then Electron starts up loading `http://localhost:3000/authentication` once the frontend server is ready.
4. If the backend process / terminal is stopped or interrupted (e.g. `Ctrl+C` or window closed), the child frontend server process (and its whole tree) MUST be terminated cleanly.

## Proposed Architecture
We will create a robust Node.js runner: `scripts/dev-start.js`
1. Ensure Electron binary is installed (`ensure-electron.js`).
2. Set `process.env.BROWSER = 'none'` and spawn `pnpm --dir frontend-app start` (or `npx react-scripts start` inside `frontend-app`).
3. Wait for `http://localhost:3000` to be responsive (polling HTTP GET with timeout).
4. Run backend build (`pnpm run build`).
5. Launch Electron using the local executable pointing to `./dist/index.js`.
6. Attach lifecycle handlers (`SIGINT`, `SIGTERM`, `exit`, uncaught exception) to cleanly kill the frontend subprocess and all its spawned children on Windows (using `taskkill /pid <PID> /T /F` on Windows or `process.kill`).

## Verification Plan
1. Test launching `scripts/dev-start.js`.
2. Verify no external web browser opens.
3. Verify Electron window opens showing the React SPA from port 3000.
4. Verify closing the terminal / Ctrl+C kills both Electron and React development server processes without orphan node processes remaining on port 3000.
