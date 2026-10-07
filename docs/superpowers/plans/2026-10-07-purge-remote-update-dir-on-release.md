# Purge Remote SFTP Update Directory Before Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the release automation (`scripts/release.js`) to purge all existing files inside the remote application update directory (`/var/www/html/asistenq-tiktok-update`) over SFTP/SSH prior to uploading the newly built release artifacts, ensuring only the target release files reside on the update server.

**Architecture:**
- Use SSH2 SFTP `readdir` and `unlink` / `rmdir` (or fallback SSH exec `rm -rf /var/www/html/asistenq-tiktok-update/*`) strictly scoped within the configured `SSH_CONFIG.remoteDir`.
- Perform safety validations: ensure `remoteDir` is exactly the target update path and never root (`/`), empty, or parent paths.
- Support `--dry-run` to log what remote files would be purged.

**Tech Stack:** Node.js, `ssh2` SFTP client, Windows Batch (`release.bat`), SSH / SFTP API.

## Global Constraints
- Target directory is strictly `SSH_CONFIG.remoteDir` (`/var/www/html/asistenq-tiktok-update`).
- Strict directory safety check: reject if `remoteDir` is `/`, `/var`, `/var/www`, or empty.
- Log every deleted remote file clearly to the console during execution.
- Support `--dry-run` simulation without deleting remote files.

---

### Task 1: Implement Remote SFTP Directory Purging in `scripts/release.js`

**Files:**
- Modify: `scripts/release.js`

**Interfaces:**
- Consumes: `SSH_CONFIG.remoteDir` (`/var/www/html/asistenq-tiktok-update`), SSH2 SFTP session
- Produces: `cleanRemoteDirectory(sftp, remoteDir, dryRun)` helper function invoked before upload

- [ ] **Step 1: Define `cleanRemoteDirectory` helper function**
  Implement safe recursive / flat file deletion of all items inside `remoteDir`.
  ```javascript
  async function cleanRemoteDirectory(sftp, remoteDir, dryRun = false) {
    if (!remoteDir || remoteDir === '/' || remoteDir === '/var' || remoteDir === '/var/www' || remoteDir === '/var/www/html') {
      throw new Error(`Safety violation: Refusing to purge protected path: ${remoteDir}`);
    }
    // Read and delete all files in remoteDir
  }
  ```

- [ ] **Step 2: Integrate `cleanRemoteDirectory` into Step 4 before file uploads**
  Invoke `cleanRemoteDirectory` right after SFTP session initialization and before `uploadFileSFTP`.

---

### Task 2: Verification and Dry-Run Testing

**Files:**
- Test: `scripts/release.js`

- [ ] **Step 1: Test with `node scripts/release.js --dry-run --yes`**
  Verify console logs indicate remote directory purging step and display intended deletions.

- [ ] **Step 2: Commit changes to Git and push to GitHub**
  Commit message: `feat: purge remote update directory before uploading new release artifacts`
  Push to `origin master`.
