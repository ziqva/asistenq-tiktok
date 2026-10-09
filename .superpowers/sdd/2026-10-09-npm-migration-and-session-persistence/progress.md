# SDD ledger — plan: docs/superpowers/plans/2026-10-09-npm-migration-and-session-persistence.md

## Pre-flight Plan Scan
| Tasks / Interfaces | What is consumed / produced | Finding / Ruling |
| --- | --- | --- |
| Task 1: NPM Migration & Windows Packaging | Migrated root & frontend-app to npm, updated package-win.js, dev-start.js, release scripts | Consistent & Verified |
| Task 2: Login URL & Profile Persistence | Removed setup=1, persistent profile in APPDATA/Library, removed incognito | Consistent & Verified |
| Task 3: LocalStorage & Cookie Sync | Captured/restored storage_data.json, re-enabled CDP getAllCookies every 15s | Consistent & Verified |
| Task 4: Background Cookie Jar & False-Logout Fix | safeFetch, updateCookiesFromResponse, OS-aware headers, domain filtering, auth check | Consistent & Verified |

Pre-flight scan clean.

Task 1: complete (npm migration completed, scripts updated, electron-builder NSIS installer verified)
Task 2: complete (login URL cleaned, persistent profiles implemented in Browser.ts and Account.ts)
Task 3: complete (localStorage tokens captured and restored, periodic CDP sync active in OpenBrowser.ts)
Task 4: complete (safeFetch cookie jar active across all endpoints, OS-aware headers, false logout prevented)
