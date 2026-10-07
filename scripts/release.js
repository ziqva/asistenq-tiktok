#!/usr/bin/env node

/**
 * AsistenQ TikTok - Automated Release & Deployment Runner
 *
 * Steps:
 * 1. Prompts or reads target version from CLI argument / interactive prompt.
 * 2. Updates version in package.json and frontend-app/package.json (if exists).
 * 3. Builds React frontend (pnpm --dir frontend-app run build).
 * 4. Builds backend TypeScript and bundles assets (pnpm run build).
 * 5. Runs electron-builder (npx electron-builder --win).
 * 6. Scans electron/output, renames spaces to hyphens in .exe and .exe.blockmap files.
 * 7. Patches latest.yml replacing spaces with hyphens in url and path fields.
 * 8. Connects via SSH2 SFTP to 45.76.183.58 and uploads artifacts with progress bar.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');
const { Client } = require('ssh2');
const cliProgress = require('cli-progress');

// ANSI color helpers
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  bgBlue: '\x1b[44m',
};

function log(msg = '') {
  console.log(msg);
}

function info(msg) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`);
}

function success(msg) {
  console.log(`${colors.green}✔${colors.reset} ${msg}`);
}

function warn(msg) {
  console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
}

function error(msg) {
  console.error(`${colors.red}✖ ${msg}${colors.reset}`);
}

function section(title) {
  console.log(`\n${colors.bold}${colors.blue}══════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  ${title}${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}══════════════════════════════════════════════════════════════════${colors.reset}\n`);
}

// Config constants
const SSH_CONFIG = {
  host: process.env.RELEASE_SSH_HOST || '45.76.183.58',
  port: parseInt(process.env.RELEASE_SSH_PORT || '22', 10),
  username: process.env.RELEASE_SSH_USER || 'root',
  password: process.env.RELEASE_SSH_PASSWORD || 'q?X76dMq?tmbiyo}',
  remoteDir: process.env.RELEASE_REMOTE_DIR || '/var/www/html/asistenq-tiktok-update',
};

const ROOT_DIR = path.resolve(__dirname, '..');
const ROOT_PKG_PATH = path.join(ROOT_DIR, 'package.json');
const FRONTEND_PKG_PATH = path.join(ROOT_DIR, 'frontend-app', 'package.json');
const OUTPUT_DIR = path.join(ROOT_DIR, 'electron', 'output');

// Parse CLI Flags
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    help: false,
    dryRun: false,
    skipBuild: false,
    skipUpload: false,
    version: null,
    yes: false,
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--skip-build') {
      options.skipBuild = true;
    } else if (arg === '--skip-upload') {
      options.skipUpload = true;
    } else if (arg === '-y' || arg === '--yes') {
      options.yes = true;
    } else if (arg.startsWith('--version=')) {
      options.version = arg.split('=')[1].trim();
    } else if (arg.startsWith('-v=')) {
      options.version = arg.split('=')[1].trim();
    }
  }

  return options;
}

function showHelp() {
  console.log(`
${colors.bold}${colors.cyan}AsistenQ TikTok - Release & Deployment Runner${colors.reset}

${colors.bold}USAGE:${colors.reset}
  node scripts/release.js [options]

${colors.bold}OPTIONS:${colors.reset}
  --help, -h             Show this help screen
  --dry-run              Simulate full release process without modifying files, running builds, or uploading
  --skip-build           Skip frontend, backend, and electron-builder packaging (use existing artifacts)
  --skip-upload          Build and package artifacts but skip SFTP upload
  --version=<X.Y.Z>      Specify target release version directly (bypasses prompt)
  --yes, -y              Automatic yes to confirmation prompts

${colors.bold}EXAMPLES:${colors.reset}
  node scripts/release.js
  node scripts/release.js --dry-run
  node scripts/release.js --version=1.2.9
  node scripts/release.js --skip-build
`);
}

function incrementPatch(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/);
  if (!match) {
    return `${version}.1`;
  }
  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  const patch = parseInt(match[3], 10) + 1;
  const suffix = match[4] || '';
  return `${major}.${minor}.${patch}${suffix}`;
}

function validateVersion(version) {
  return /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version);
}

function promptUser(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const cwd = options.cwd || ROOT_DIR;
    info(`Executing: ${colors.bold}${command} ${args.join(' ')}${colors.reset} in ${colors.gray}${cwd}${colors.reset}`);

    // On Windows, pnpm and npx are .cmd files
    const isWin = process.platform === 'win32';
    let execCmd = command;
    if (isWin && !command.endsWith('.cmd') && !command.endsWith('.exe') && !command.endsWith('.bat')) {
      execCmd = `${command}.cmd`;
    }

    const proc = spawn(execCmd, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...options.env },
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command '${command} ${args.join(' ')}' failed with exit code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function cleanRemoteDirectory(conn, remoteDir, dryRun = false) {
  // Strict safety guard against accidental deletion of root or system directories
  const normalizedPath = remoteDir.replace(/\\/g, '/').replace(/\/+$/, '');
  const protectedPaths = ['', '/', '/var', '/var/www', '/var/www/html', '/root', '/home', '/etc', '/usr', '/bin', '/lib'];
  if (protectedPaths.includes(normalizedPath) || !normalizedPath.startsWith('/var/www/html/')) {
    throw new Error(`Safety violation: Refusing to clean protected or non-app directory '${remoteDir}'`);
  }

  if (dryRun) {
    info(`[DRY-RUN] Would clean all existing files inside remote directory: ${colors.bold}${remoteDir}${colors.reset}`);
    return;
  }

  info(`Cleaning existing files inside remote directory: ${colors.bold}${remoteDir}${colors.reset}...`);

  return new Promise((resolve, reject) => {
    // Use SSH exec 'rm -rf <remoteDir>/*' to cleanly and reliably remove files and directories
    const cmd = `rm -rf '${normalizedPath}'/*`;
    conn.exec(cmd, (err, stream) => {
      if (err) {
        return reject(new Error(`Failed to execute remote directory cleanup: ${err.message}`));
      }

      // In Node.js streams, stream must be consumed or resumed so the 'close' event fires promptly
      stream.resume();
      stream.stderr.resume();

      stream.on('close', (code) => {
        if (code === 0 || code === null) {
          success(`Successfully purged all old files from ${colors.bold}${remoteDir}${colors.reset}`);
          resolve();
        } else {
          warn(`Clean command exited with code ${code}. Proceeding...`);
          resolve();
        }
      });

      stream.on('error', (streamErr) => {
        reject(streamErr);
      });
    });
  });
}

async function uploadFileSFTP(sftp, localFilePath, remoteFilePath, dryRun = false) {
  const fileName = path.basename(localFilePath);
  const stats = fs.statSync(localFilePath);
  const totalBytes = stats.size;

  if (dryRun) {
    info(`[DRY-RUN] Would upload ${colors.bold}${fileName}${colors.reset} (${formatBytes(totalBytes)}) -> ${remoteFilePath}`);
    return;
  }

  return new Promise((resolve, reject) => {
    const progressBar = new cliProgress.SingleBar({
      format: `  ${colors.cyan}${fileName.padEnd(42)}${colors.reset} |${colors.green}{bar}${colors.reset}| {percentage}% | {valueFormatted}/{totalFormatted} | {speed}`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    }, cliProgress.Presets.shades_classic);

    let uploadedBytes = 0;
    let startTime = Date.now();

    progressBar.start(totalBytes, 0, {
      valueFormatted: formatBytes(0),
      totalFormatted: formatBytes(totalBytes),
      speed: '0 KB/s',
    });

    const readStream = fs.createReadStream(localFilePath);
    const writeStream = sftp.createWriteStream(remoteFilePath);

    readStream.on('data', (chunk) => {
      uploadedBytes += chunk.length;
      const elapsedSec = (Date.now() - startTime) / 1000;
      const speed = elapsedSec > 0 ? formatBytes(uploadedBytes / elapsedSec) + '/s' : '0 KB/s';

      progressBar.update(uploadedBytes, {
        valueFormatted: formatBytes(uploadedBytes),
        totalFormatted: formatBytes(totalBytes),
        speed: speed,
      });
    });

    writeStream.on('close', () => {
      progressBar.update(totalBytes, {
        valueFormatted: formatBytes(totalBytes),
        totalFormatted: formatBytes(totalBytes),
        speed: 'Done',
      });
      progressBar.stop();
      resolve();
    });

    writeStream.on('error', (err) => {
      progressBar.stop();
      reject(err);
    });

    readStream.on('error', (err) => {
      progressBar.stop();
      reject(err);
    });

    readStream.pipe(writeStream);
  });
}

async function main() {
  const opts = parseArgs();

  if (opts.help) {
    showHelp();
    process.exit(0);
  }

  section('AsistenQ TikTok - Automated Release System');

  // Ensure Electron binary is available
  try {
    const ensureElectron = require('./ensure-electron');
    await ensureElectron();
  } catch (e) {}

  // Verify that node_modules has all required runtime dependencies to prevent packaging missing dependency errors
  try {
    require.resolve('universalify');
    require.resolve('builder-util-runtime');
    require.resolve('lazy-val');
    require.resolve('tiny-typed-emitter');
  } catch (e) {
    warn('Detected missing dependencies in node_modules. Re-installing...');
    await runCommand('pnpm', ['install']);
  }

  if (opts.dryRun) {
    warn('Running in DRY-RUN mode. No actual files will be modified or uploaded.');
  }

  // 1. Read package.json & determine version
  if (!fs.existsSync(ROOT_PKG_PATH)) {
    throw new Error(`Root package.json not found at ${ROOT_PKG_PATH}`);
  }

  const rootPkg = JSON.parse(fs.readFileSync(ROOT_PKG_PATH, 'utf8'));
  const currentVersion = rootPkg.version || '1.0.0';
  const defaultNextVersion = incrementPatch(currentVersion);

  log(`${colors.bold}Current Project Version:${colors.reset} ${colors.yellow}${currentVersion}${colors.reset}`);

  let targetVersion = opts.version;

  if (!targetVersion) {
    if (opts.yes) {
      targetVersion = defaultNextVersion;
    } else {
      const input = await promptUser(
        `Enter release version [default auto-increment: ${colors.green}${defaultNextVersion}${colors.reset}]: `
      );
      targetVersion = input ? input.trim() : defaultNextVersion;
    }
  }

  if (!validateVersion(targetVersion)) {
    throw new Error(`Invalid semantic version: '${targetVersion}'. Example format: 1.2.9`);
  }

  info(`Target release version set to: ${colors.bold}${colors.green}${targetVersion}${colors.reset}`);

  // 2. Update package.json & frontend-app/package.json
  section('Step 1: Updating Version Configurations');
  if (opts.dryRun) {
    info(`[DRY-RUN] Would update ${ROOT_PKG_PATH} version: ${currentVersion} -> ${targetVersion}`);
    if (fs.existsSync(FRONTEND_PKG_PATH)) {
      info(`[DRY-RUN] Would update ${FRONTEND_PKG_PATH} version: ${targetVersion}`);
    }
  } else {
    rootPkg.version = targetVersion;
    fs.writeFileSync(ROOT_PKG_PATH, JSON.stringify(rootPkg, null, 2) + '\n', 'utf8');
    success(`Updated ${colors.bold}package.json${colors.reset} to version ${colors.green}${targetVersion}${colors.reset}`);

    if (fs.existsSync(FRONTEND_PKG_PATH)) {
      const frontendPkg = JSON.parse(fs.readFileSync(FRONTEND_PKG_PATH, 'utf8'));
      frontendPkg.version = targetVersion;
      fs.writeFileSync(FRONTEND_PKG_PATH, JSON.stringify(frontendPkg, null, 2) + '\n', 'utf8');
      success(`Updated ${colors.bold}frontend-app/package.json${colors.reset} to version ${colors.green}${targetVersion}${colors.reset}`);
    } else {
      warn(`frontend-app/package.json not found at ${FRONTEND_PKG_PATH}, skipping.`);
    }
  }

  // 3. Build & Packaging Pipeline
  if (opts.skipBuild) {
    warn('Skipping build and packaging steps as --skip-build was specified.');
  } else if (opts.dryRun) {
    section('Step 2: Clean, Build & Packaging Pipeline (Dry Run)');
    info('[DRY-RUN] Would clean build and output directories: dist, frontend-app/build, electron/output');
    info('[DRY-RUN] Would execute: pnpm --dir frontend-app run build');
    info('[DRY-RUN] Would execute: pnpm run build');
    info('[DRY-RUN] Would execute: npx electron-builder --win -p never');
  } else {
    section('Step 2: Clean, Build & Packaging Pipeline');

    // 3a. Clean prior build outputs completely
    info('Cleaning prior build and packaging artifacts (dist, frontend-app/build, electron/output)...');
    const dirsToClean = [
      path.join(ROOT_DIR, 'dist'),
      path.join(ROOT_DIR, 'frontend-app', 'build'),
      OUTPUT_DIR,
    ];
    for (const dir of dirsToClean) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        info(`Deleted old directory: ${colors.gray}${dir}${colors.reset}`);
      }
    }
    success('Prior build outputs cleaned successfully.');

    // 3b. React frontend build
    info('1/3 Building React Frontend (frontend-app)...');
    await runCommand('pnpm', ['--dir', 'frontend-app', 'run', 'build']);
    success('React Frontend built successfully.');

    // 3c. Backend TypeScript build & asset bundling
    info('2/3 Building Backend TypeScript & Bundling Assets...');
    await runCommand('pnpm', ['run', 'build']);
    success('Backend and assets built successfully.');

    // 3d. Electron packaging
    info('3/3 Packaging Windows Installer with electron-builder...');
    await runCommand('npx', ['electron-builder', '--win', '-p', 'never']);
    success('Electron Windows packaging completed.');
  }

  // 4. Scan & Sanitize Output Artifacts
  section('Step 3: Artifact Sanitization (Space-to-Hyphen)');

  if (!fs.existsSync(OUTPUT_DIR)) {
    if (opts.dryRun) {
      warn(`Output directory ${OUTPUT_DIR} does not exist yet (expected in dry-run without prior build).`);
    } else {
      throw new Error(`Output directory not found at ${OUTPUT_DIR}. Build may have failed to produce output.`);
    }
  }

  let artifacts = [];
  let latestYmlPath = null;

  if (fs.existsSync(OUTPUT_DIR)) {
    const outputFiles = fs.readdirSync(OUTPUT_DIR);

    // Rename spaces to hyphens for .exe and .exe.blockmap
    for (const fileName of outputFiles) {
      const fullPath = path.join(OUTPUT_DIR, fileName);
      const isFile = fs.statSync(fullPath).isFile();
      if (!isFile) continue;

      if (fileName === 'latest.yml') {
        latestYmlPath = fullPath;
        continue;
      }

      if (fileName.endsWith('.exe') || fileName.endsWith('.exe.blockmap') || fileName.endsWith('.blockmap')) {
        let cleanName = fileName;
        if (fileName.includes(' ')) {
          cleanName = fileName.replace(/\s+/g, '-');
          const newPath = path.join(OUTPUT_DIR, cleanName);
          if (opts.dryRun) {
            info(`[DRY-RUN] Would rename: '${fileName}' -> '${cleanName}'`);
          } else {
            fs.renameSync(fullPath, newPath);
            info(`Renamed: ${colors.yellow}${fileName}${colors.reset} -> ${colors.green}${cleanName}${colors.reset}`);
          }
        }
        artifacts.push({
          originalName: fileName,
          fileName: cleanName,
          filePath: path.join(OUTPUT_DIR, cleanName),
        });
      }
    }

    // Patch latest.yml
    if (latestYmlPath && fs.existsSync(latestYmlPath)) {
      info(`Sanitizing ${colors.bold}latest.yml${colors.reset}...`);
      const ymlContent = fs.readFileSync(latestYmlPath, 'utf8');

      // Replace spaces in url: and path: lines
      const sanitizedYml = ymlContent.replace(/^(\s*-\s*url:\s*|\s*url:\s*|\s*path:\s*)(.+)$/gm, (match, prefix, val) => {
        const cleanedVal = val.trim().replace(/\s+/g, '-');
        return `${prefix}${cleanedVal}`;
      });

      if (opts.dryRun) {
        info(`[DRY-RUN] Would sanitize latest.yml:\n${sanitizedYml}`);
      } else {
        fs.writeFileSync(latestYmlPath, sanitizedYml, 'utf8');
        success(`Successfully sanitized ${colors.bold}latest.yml${colors.reset}`);
      }
      artifacts.push({
        fileName: 'latest.yml',
        filePath: latestYmlPath,
      });
    } else {
      if (!opts.dryRun) {
        warn(`latest.yml not found in ${OUTPUT_DIR}`);
      }
    }
  }

  log(`\nArtifacts detected for distribution:`);
  for (const art of artifacts) {
    log(`  ${colors.cyan}•${colors.reset} ${art.fileName}`);
  }

  // 5. Upload to SFTP
  if (opts.skipUpload) {
    warn('Skipping SFTP upload as --skip-upload was specified.');
  } else {
    section('Step 4: SFTP Upload to Update Server');
    info(`Connecting to ${colors.bold}${SSH_CONFIG.username}@${SSH_CONFIG.host}:${SSH_CONFIG.port}${colors.reset}...`);

    if (opts.dryRun) {
      info(`[DRY-RUN] Would connect to SSH2 server and clean remote directory ${SSH_CONFIG.remoteDir}`);
      info(`[DRY-RUN] Would upload newly built artifacts to ${SSH_CONFIG.remoteDir}:`);
      for (const art of artifacts) {
        info(`[DRY-RUN] Would upload ${art.fileName} -> ${SSH_CONFIG.remoteDir}/${art.fileName}`);
      }
    } else {
      if (artifacts.length === 0) {
        throw new Error(`No artifacts found in ${OUTPUT_DIR} to upload.`);
      }

      await new Promise((resolve, reject) => {
        const conn = new Client();

        conn.on('ready', async () => {
          success(`SSH connection established.`);

          try {
            // 4a. Clean all old files from remote target directory first using SSH exec
            await cleanRemoteDirectory(conn, SSH_CONFIG.remoteDir, false);

            // 4b. Initialize SFTP session for uploading artifacts
            conn.sftp(async (err, sftp) => {
              if (err) {
                conn.end();
                return reject(new Error(`SFTP initialization failed: ${err.message}`));
              }

              try {
                info(`Uploading ${artifacts.length} files to ${colors.bold}${SSH_CONFIG.remoteDir}${colors.reset}...\n`);

                for (const art of artifacts) {
                  const remoteDest = `${SSH_CONFIG.remoteDir}/${art.fileName}`;
                  await uploadFileSFTP(sftp, art.filePath, remoteDest, false);
                }

                conn.end();
                resolve();
              } catch (uploadErr) {
                conn.end();
                reject(uploadErr);
              }
            });
          } catch (cleanErr) {
            conn.end();
            reject(cleanErr);
          }
        });

        conn.on('error', (err) => {
          reject(new Error(`SSH Connection failed: ${err.message}`));
        });

        conn.connect({
          host: SSH_CONFIG.host,
          port: SSH_CONFIG.port,
          username: SSH_CONFIG.username,
          password: SSH_CONFIG.password,
          readyTimeout: 30000,
        });
      });

      success('All release artifacts uploaded to server successfully.');
    }
  }

  // Release Summary
  section('Release Summary');
  log(`${colors.green}${colors.bold}✔ RELEASE COMPLETED SUCCESSFULLY!${colors.reset}`);
  log(`  Version:       ${colors.bold}${colors.green}${targetVersion}${colors.reset}`);
  log(`  Feed Endpoint: ${colors.cyan}http://${SSH_CONFIG.host}/asistenq-tiktok-update/${colors.reset}`);
  log(`  Remote Dir:    ${colors.gray}${SSH_CONFIG.remoteDir}${colors.reset}`);
  log('');
}

// Execute runner
main().catch((err) => {
  log('');
  error(`Release failed: ${err.message}`);
  if (err.stack && process.env.DEBUG) {
    console.error(err.stack);
  }
  process.exit(1);
});
