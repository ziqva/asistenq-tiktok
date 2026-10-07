# Purge Remote SFTP Update Directory Before Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the release automation (`scripts/release.js`) to purge all existing files inside the remote application update directory (`/var/www/html/asistenq-tiktok-update`) over SSH prior to uploading the newly built release artifacts, ensuring only the target release files reside on the update server.

**Architecture:**
- Execute remote shell command `rm -rf '<remoteDir>'/*` over SSH (`conn.exec`) strictly scoped within the configured `SSH_CONFIG.remoteDir`.
- In Node.js `ssh2`, ensure stream `close` event fires reliably by invoking `stream.resume()` and `stream.stderr.resume()`.
- Sequence execution: run SSH cleanup first, then initialize the SFTP session for uploading release artifacts to prevent channel multiplexing deadlocks.
- Perform strict safety validations: ensure `remoteDir` is within `/var/www/html/` and never root (`/`), empty, or system directories (`/var`, `/var/www`, `/etc`, `/home`, `/root`, etc.).
- Support `--dry-run` to log what remote files would be purged.

**Tech Stack:** Node.js, `ssh2` Client / SFTP, Windows Batch (`release.bat`), SSH / SFTP API.

## Global Constraints
- Target directory is strictly `SSH_CONFIG.remoteDir` (`/var/www/html/asistenq-tiktok-update`).
- Strict directory safety check: reject if `remoteDir` is `/`, `/var`, `/var/www`, or empty.
- Log cleanup status clearly to the console during execution.
- Support `--dry-run` simulation without deleting remote files.

---

### Task 1: Implement Remote Directory Purging in `scripts/release.js`

**Files:**
- Modify: `scripts/release.js`

**Interfaces:**
- Consumes: `SSH_CONFIG.remoteDir` (`/var/www/html/asistenq-tiktok-update`), SSH2 connection (`conn`)
- Produces: `cleanRemoteDirectory(conn, remoteDir, dryRun)` helper function invoked before upload

- [x] **Step 1: Define `cleanRemoteDirectory` helper function**
  Implement safe remote directory purging using SSH `conn.exec` with stream consumption.
  ```javascript
  async function cleanRemoteDirectory(conn, remoteDir, dryRun = false) {
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
      const cmd = `rm -rf '${normalizedPath}'/*`;
      conn.exec(cmd, (err, stream) => {
        if (err) {
          return reject(new Error(`Failed to execute remote directory cleanup: ${err.message}`));
        }

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
  ```

- [x] **Step 2: Integrate `cleanRemoteDirectory` sequentially before SFTP uploads**
  Invoke `cleanRemoteDirectory(conn, SSH_CONFIG.remoteDir, false)` right after SSH connection is established, and then open the SFTP session for uploading artifacts.

---

### Task 2: Verification and Dry-Run Testing

**Files:**
- Test: `scripts/release.js`

- [x] **Step 1: Test with `node scripts/release.js --dry-run --yes`**
  Verify console logs indicate remote directory purging step and display intended actions.

- [x] **Step 2: Commit changes to Git and push to GitHub**
  Commit and push to `origin master`.
