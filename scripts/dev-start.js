#!/usr/bin/env node

/**
 * Dev Orchestrator for AsistenQ TikTok:
 * 1. Ensures Electron binary is ready.
 * 2. Starts React frontend dev server (with BROWSER=none so it doesn't open default browser).
 * 3. Waits until http://localhost:3000 is ready.
 * 4. Compiles the TypeScript backend.
 * 5. Launches Electron app in development mode.
 * 6. Ensures when backend/terminal is killed (Ctrl+C or exit), the frontend process tree is terminated.
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ensureElectron = require('./ensure-electron');

let frontendProcess = null;
let electronProcess = null;
let isShuttingDown = false;

function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('\n[dev-start] Shutting down development processes...');

  if (electronProcess && !electronProcess.killed) {
    try {
      if (process.platform === 'win32' && electronProcess.pid) {
        execSync(`taskkill /pid ${electronProcess.pid} /T /F`, { stdio: 'ignore' });
      } else {
        electronProcess.kill('SIGTERM');
      }
    } catch (e) {}
  }

  if (frontendProcess && !frontendProcess.killed) {
    try {
      if (process.platform === 'win32' && frontendProcess.pid) {
        execSync(`taskkill /pid ${frontendProcess.pid} /T /F`, { stdio: 'ignore' });
      } else {
        frontendProcess.kill('SIGTERM');
      }
    } catch (e) {}
  }

  console.log('[dev-start] All processes cleanly closed.');
}

// Attach clean exit hooks
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

process.on('exit', cleanup);
process.on('uncaughtException', (err) => {
  console.error('[dev-start] Uncaught Exception:', err);
  cleanup();
  process.exit(1);
});

function checkPortReady(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const req = http.get({ host, port, path: '/' }, (res) => {
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForFrontend(port = 3000, maxRetries = 60) {
  process.stdout.write('[dev-start] Waiting for React frontend server to be ready on port ' + port + '...');
  for (let i = 0; i < maxRetries; i++) {
    const ready = await checkPortReady(port);
    if (ready) {
      console.log('\n[dev-start] React frontend is ready!');
      return true;
    }
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log('\n[dev-start] Frontend server start timed out, proceeding anyway...');
  return false;
}

async function main() {
  console.log('===================================================');
  console.log('    AsistenQ TikTok - Development Environment      ');
  console.log('===================================================\n');

  // Step 1: Ensure Electron binary exists
  await ensureElectron();

  // Step 2: Start frontend in background
  console.log('[dev-start] Starting React frontend dev server (BROWSER=none)...');
  const frontendEnv = {
    ...process.env,
    BROWSER: 'none',
    PORT: '3000',
    DISABLE_ESLINT_PLUGIN: 'true',
  };

  const isWin = process.platform === 'win32';
  const npmCmd = isWin ? 'npm.cmd' : 'npm';

  frontendProcess = spawn(npmCmd, ['start'], {
    cwd: path.resolve(__dirname, '..', 'frontend-app'),
    env: frontendEnv,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: isWin,
  });

  frontendProcess.stdout.on('data', (d) => {
    const str = d.toString();
    if (str.includes('Compiled') || str.includes('Compiling') || str.includes('webpack')) {
      process.stdout.write(`[frontend] ${str}`);
    }
  });

  frontendProcess.stderr.on('data', (d) => {
    process.stderr.write(`[frontend] ${d.toString()}`);
  });

  frontendProcess.on('exit', (code) => {
    if (!isShuttingDown) {
      console.log(`[dev-start] Frontend server exited with code ${code}`);
    }
  });

  // Step 3: Wait for frontend to be available
  await waitForFrontend(3000);

  // Step 4: Build backend TypeScript and static assets
  console.log('[dev-start] Compiling backend and preparing assets...');
  try {
    execSync('npm run build', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    });
  } catch (err) {
    console.error('[dev-start] Backend build encountered issues:', err.message);
  }

  // Step 5: Launch Electron app
  console.log('[dev-start] Launching Electron app...');
  const electronExe = require('electron');
  electronProcess = spawn(electronExe, ['./dist/index.js'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
    },
  });

  electronProcess.on('exit', (code) => {
    console.log(`[dev-start] Electron application closed with code ${code}.`);
    cleanup();
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error('[dev-start] Failed to start:', err);
  cleanup();
  process.exit(1);
});
