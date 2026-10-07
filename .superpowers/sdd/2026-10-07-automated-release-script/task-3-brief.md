# Task 3 Brief: Test and Dry-Run Verification

## Objective
Thoroughly test and verify the release workflow:
1. Test running `release.bat --help` and verify all options are documented.
2. Test dry-run execution with `node scripts/release.js --dry-run -y --version=1.2.8`.
3. Test SFTP connection and target directory verification (`/var/www/html/asistenq-tiktok-update`).
4. Unit-test artifact renaming and `latest.yml` patching logic to ensure spaces are replaced with `-`.
5. Document all testing results in `task-3-report.md`.

## Output Target:
- Write report to `.superpowers/sdd/2026-10-07-automated-release-script/task-3-report.md`
