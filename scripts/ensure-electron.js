#!/usr/bin/env node

/**
 * Helper script to verify and automatically install Electron binary if missing.
 * Runs during postinstall or pre-release to ensure `electron` CLI and runtime never fail.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getElectronPackageDir() {
  try {
    const electronMain = require.resolve('electron');
    return path.dirname(electronMain);
  } catch (err) {
    const defaultPnpmDir = path.resolve(__dirname, '..', 'node_modules', 'electron');
    if (fs.existsSync(defaultPnpmDir)) {
      return fs.realpathSync(defaultPnpmDir);
    }
    return null;
  }
}

async function ensureElectronBinary() {
  const electronDir = getElectronPackageDir();
  if (!electronDir) {
    console.log('[ensure-electron] Electron is not installed in node_modules.');
    return;
  }

  const pathTxtPath = path.join(electronDir, 'path.txt');
  const exeName = process.platform === 'win32' ? 'electron.exe' : 'electron';
  const exePath = path.join(electronDir, 'dist', exeName);

  if (fs.existsSync(pathTxtPath) && fs.existsSync(exePath)) {
    // Already properly configured
    return;
  }

  console.log('[ensure-electron] Electron binary missing or incomplete. Ensuring binary installation...');

  const packageJson = JSON.parse(fs.readFileSync(path.join(electronDir, 'package.json'), 'utf8'));
  const version = packageJson.version;
  const platform = process.platform;
  const arch = process.arch;

  try {
    const { downloadArtifact } = require('@electron/get');
    const zipPath = await downloadArtifact({
      version,
      artifactName: 'electron',
      platform,
      arch,
    });

    const distDir = path.join(electronDir, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    if (platform === 'win32') {
      execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${distDir}' -Force"`, {
        stdio: 'inherit',
      });
    } else {
      execSync(`unzip -o "${zipPath}" -d "${distDir}"`, { stdio: 'inherit' });
    }

    fs.writeFileSync(pathTxtPath, exeName, 'utf8');
    console.log('[ensure-electron] Successfully configured Electron binary.');
  } catch (err) {
    console.error('[ensure-electron] Failed to auto-install Electron binary:', err.message);
  }
}

if (require.main === module) {
  ensureElectronBinary().catch(console.error);
}

module.exports = ensureElectronBinary;
