# NPM Migration and Long-Term Session Persistence Plan & Implementation

> **Date:** 2026-10-09  
> **Status:** Completed  
> **Scope:** Backend, Frontend Worktree, Build Scripts, Session Persistence Architecture

---

## 1. Problem Statements & Root Causes

### A. Missing `universalify` and PNPM Hoisting Issues on Windows
- **Symptom:** Windows installer failed with `cannot find module universalify` upon launch.
- **Root Cause:** PNPM isolated virtual store (`node_modules/.pnpm`) did not hoist transitive dependencies expected by `electron-builder` and runtime scripts.
- **Resolution:** Fully migrated both backend and frontend (`frontend-app`) to standard `npm` with `legacy-peer-deps=true`.

### B. Immediate Login Redirect to `/setup`
- **Symptom:** After entering OTP/Authenticator, the seller was redirected back to onboarding / registration (`/setup`).
- **Root Cause:** The login URL contained hardcoded `?setup=1`, which instructs TikTok Seller Center to force the shop registration flow even for existing accounts.
- **Resolution:** Cleaned login URL to `https://seller-id.tokopedia.com/account/login?shop_region=ID`.

### C. Frequent Session Logout (1-2 Times per Day)
- **Root Causes Identified:**
  1. **Ephemeral Profile & Incognito:** Browser launched with `--incognito` or profile directory in `os.tmpdir()`, wiping local cache and service worker state on each launch.
  2. **Missing LocalStorage Security SDK Tokens:** TikTok Web Security SDK (`SLARDARwebmssdk`, `security-sdk/s_sdk_*`, `__tea_cache_tokens_*`, `xmsi`, `xmst`) stores encryption seeds and device fingerprints in `localStorage`. When absent, API requests lack valid cryptographic context.
  3. **Stale Cookies in Background Polling:** Background polling via `node-fetch` ignored `Set-Cookie` headers returned by TikTok during API calls, keeping stale tokens in SQLite until expiration.
  4. **Disabled Cookie Sync in Browser:** Periodic cookie sync in `OpenBrowser.ts` was disabled (`return; // Disable this feature`).
  5. **Mismatched OS Fingerprints:** Hardcoded macOS headers and query parameters were sent regardless of whether the app ran on Windows or macOS.
  6. **False-Positive Logout Triggers:** Any non-zero API response or transient network failure in `setupProfileDetail` immediately set `authenticated = false`.

---

## 2. Implementation Architecture

### A. Persistent Chromium Profiles per Account
- **`src/class/Browser.ts`:**
  - Base directory set to persistent `%APPDATA%\AsistenQ` (Windows) and `~/Library/Application Support/AsistenQ` (macOS).
  - Disabled unconditional directory wiping on browser launch; profiles are preserved unless explicitly requested.
- **`src/class/Account.ts`:**
  - Removed `--incognito` flag from `login()`.
  - Account login now uses dedicated persistent profile directory `account_${id}`.

### B. LocalStorage SDK Persistence
- **`src/class/Account.ts`:**
  - Captured full `localStorage` at the end of successful login into `storage_data.json` inside the account profile.
- **`src/class/OpenBrowser.ts`:**
  - Injected `storage_data.json` into `localStorage` via `page.evaluateOnNewDocument` before any seller page executes.

### C. Active Background Cookie Jar
- **`src/class/AccountInformation.ts`:**
  - Implemented `safeFetch(account, url, init)` and `updateCookiesFromResponse(account, url, response)`.
  - Captures `Set-Cookie` response headers across all background endpoints (`setupProfileDetail`, `setupProduct`, `setupBalance`, `setupShippingOrder`, `setupDikemas`, `setupNewOrder`, `setupComplaint`, `setupChat`).
  - Automatically updates in-memory cookies and persists to SQLite via `this.account.setCookies(account.id, account.cookies)`.

### D. CDP Real-Time Cookie Sync
- **`src/class/OpenBrowser.ts`:**
  - Re-enabled 15-second periodic synchronization using Chrome DevTools Protocol (`Network.getAllCookies`) to capture all cross-domain session updates while the browser is open.

### E. Domain Filtering & OS-Aware Headers
- **`src/class/AccountInformation.ts` & `src/class/Account.ts`:**
  - Updated `parseCookiesToRaw` to filter expired cookies and deduplicate names by prioritizing specific domains (`seller-id.tokopedia.com` over wildcard `.tokopedia.com`).
  - Added `getPlatformInfo()` and `getBrowserHeaders()` providing OS-aware `user-agent`, `sec-ch-ua-platform`, `browser_platform`, and `browser_version` query parameters.

### F. False-Positive Logout Protection
- **`src/class/AccountInformation.ts`:**
  - `setupProfileDetail` only triggers `authenticated = false` on explicit 401/403 HTTP codes or unauthorized response (`code: 98001002`, "not login", "unauthorized", "session expired").
  - Transient errors, rate limits, or network timeouts log a warning and preserve existing authentication state.

---

## 3. Verification & Validation

| Verification Target | Command | Result |
| :--- | :--- | :--- |
| Backend TypeScript & Minification | `npm run build:prod:mac` | Success (Exit Code: 0) |
| Frontend React Webpack Build | `npm run build` (in `frontend-app/`) | Success (Exit Code: 0) |
| Windows x64 NSIS Packaging | `npm run package:win` | Success (`AsistenQ Tiktok Setup 1.2.31.exe` generated, Exit Code: 0) |
| Live Seller Session Verification | Browser Skill (`bsk`) | Store session validated on `seller-id.tokopedia.com` |
