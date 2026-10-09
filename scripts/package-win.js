#!/usr/bin/env node

/**
 * Cross-platform Windows Packaging Script for AsistenQ TikTok
 *
 * Enables building Windows x64 NSIS installers from macOS or Windows.
 * On macOS, automatically swaps in the official prebuilt Windows x64 N-API
 * binary for sqlite3 (v5.1.7) during electron-builder packaging, and safely
 * restores the local macOS binary afterwards.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync, spawnSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(ROOT_DIR, '.cache', 'prebuilds');
const WIN_SQLITE_URL = 'https://github.com/TryGhost/node-sqlite3/releases/download/v5.1.7/sqlite3-v5.1.7-napi-v6-win32-x64.tar.gz';
const MAC_SQLITE_URL = process.arch === 'arm64'
  ? 'https://github.com/TryGhost/node-sqlite3/releases/download/v5.1.7/sqlite3-v5.1.7-napi-v6-darwin-arm64.tar.gz'
  : 'https://github.com/TryGhost/node-sqlite3/releases/download/v5.1.7/sqlite3-v5.1.7-napi-v6-darwin-x64.tar.gz';

function log(msg) {
  console.log(`[package-win] ${msg}`);
}

function getSqliteBinaryPath() {
  try {
    const pkgPath = require.resolve('sqlite3/package.json', { paths: [ROOT_DIR] });
    return path.join(path.dirname(pkgPath), 'build', 'Release', 'node_sqlite3.node');
  } catch (err) {
    throw new Error('sqlite3 is not installed in node_modules.');
  }
}

function prepareMacSqliteBinary() {
  const macCacheDir = path.join(CACHE_DIR, 'mac-extracted');
  const macBinary = path.join(macCacheDir, 'build', 'Release', 'node_sqlite3.node');
  if (!fs.existsSync(macBinary)) {
    const tarName = path.basename(MAC_SQLITE_URL);
    const tarPath = path.join(CACHE_DIR, tarName);
    if (!fs.existsSync(tarPath)) {
      log(`Downloading prebuilt macOS sqlite3 binary from ${MAC_SQLITE_URL} ...`);
      execSync(`curl -sL "${MAC_SQLITE_URL}" -o "${tarPath}"`, { stdio: 'inherit' });
    }
    fs.mkdirSync(macCacheDir, { recursive: true });
    execSync(`tar -xzf "${tarPath}" -C "${macCacheDir}"`, { stdio: 'inherit' });
  }
  return macBinary;
}

function prepareWindowsSqliteBinary() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  const tarPath = path.join(CACHE_DIR, 'sqlite3-win32-x64.tar.gz');
  const extractedDir = path.join(CACHE_DIR, 'extracted');
  const winBinary = path.join(extractedDir, 'build', 'Release', 'node_sqlite3.node');

  if (!fs.existsSync(winBinary)) {
    if (!fs.existsSync(tarPath)) {
      log(`Downloading prebuilt Windows sqlite3 binary from ${WIN_SQLITE_URL} ...`);
      execSync(`curl -sL "${WIN_SQLITE_URL}" -o "${tarPath}"`, { stdio: 'inherit' });
    }
    log('Extracting Windows sqlite3 binary...');
    fs.mkdirSync(extractedDir, { recursive: true });
    execSync(`tar -xzf "${tarPath}" -C "${extractedDir}"`, { stdio: 'inherit' });
  }

  if (!fs.existsSync(winBinary)) {
    throw new Error(`Windows sqlite3 binary not found at ${winBinary}`);
  }

  return winBinary;
}

async function main() {
  const isWin = process.platform === 'win32';
  const sqliteBinary = getSqliteBinaryPath();
  const backupBinary = `${sqliteBinary}.darwin-bak`;
  let didSwapSqlite = false;

  try {
    // 1. Build frontend if needed
    const frontendDist = path.join(ROOT_DIR, 'frontend-app', 'build', 'index.html');
    if (!fs.existsSync(frontendDist)) {
      log('Building frontend-app ...');
      execSync('npm --prefix frontend-app run build', { cwd: ROOT_DIR, stdio: 'inherit' });
    }

    // 2. Clean output directory
    log('Cleaning output directory...');
    const outputDir = path.join(ROOT_DIR, 'electron', 'output');
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }

    // 3. Build backend
    log('Compiling backend for production...');
    const buildCmd = isWin ? 'npm run build:prod' : 'npm run build:prod:mac';
    execSync(buildCmd, { cwd: ROOT_DIR, stdio: 'inherit' });

    // 4. Ensure package.json in dist
    log('Copying package.json to dist...');
    fs.copyFileSync(path.join(ROOT_DIR, 'package.json'), path.join(ROOT_DIR, 'dist', 'package.json'));

    // 5. Swap sqlite3 binary if on macOS
    if (!isWin) {
      log('Preparing official Windows x64 prebuilt binary for sqlite3...');
      const winBinary = await prepareWindowsSqliteBinary();
      
      log('Backing up local macOS sqlite3 binary...');
      fs.copyFileSync(sqliteBinary, backupBinary);

      log('Injecting Windows x64 sqlite3 binary for packaging...');
      fs.copyFileSync(winBinary, sqliteBinary);
      didSwapSqlite = true;
    }

    // 6. Run electron-builder targeting Windows x64
    log('Running electron-builder for Windows x64 (NSIS)...');
    execSync('npx electron-builder --win nsis:x64 -p never', {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });

    log('Windows x64 packaging completed successfully!');
  } finally {
    // 7. Always restore macOS sqlite3 binary if swapped
    if (didSwapSqlite) {
      log('Restoring local macOS sqlite3 binary...');
      if (fs.existsSync(backupBinary)) {
        fs.copyFileSync(backupBinary, sqliteBinary);
        fs.unlinkSync(backupBinary);
      } else {
        const macBinary = prepareMacSqliteBinary();
        fs.copyFileSync(macBinary, sqliteBinary);
      }
      log('Local macOS sqlite3 binary restored.');
    }
  }
}

main().catch((err) => {
  console.error('[package-win] Packaging failed:', err);
  process.exit(1);
});
