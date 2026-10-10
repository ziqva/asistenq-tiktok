# Fix Immediate Logout After Login and Version 1.2.32 Window Title Synchronization

> **Date:** 2026-10-10  
> **Status:** Completed  
> **Scope:** Authentication Lifecycle (`Account.ts`, `AccountInformation.ts`), Window Title Initialization (`src/index.ts`), Build Pipeline (`package.json`)

---

## 1. Problem Statements & Root Causes

### A. Immediate Account Logout After Login ("Login Beberapa Itu Langsung Logout")
- **Symptom:** Newly logged in accounts immediately reverted to unauthenticated / logged-out state within seconds of being added.
- **Root Causes Identified:**
  1. **Aggressive Unauthentication in `setupProfileDetail`:** When background polling called `https://seller-id.tokopedia.com/api/v3/seller/common/get`, the request used `need_verify_account=true` and lacked `referer: "https://seller-id.tokopedia.com/homepage"`. Tokopedia returned error code `98001002`, which immediately demoted `account.authenticated = false` and wrote `0` to SQLite, halting all subsequent monitoring fetches (`setupChat`, `setupShippingOrder`, `setupBalance`).
  2. **Missing Secondary Verification:** Authentication demotion occurred on a single endpoint failure without cross-verifying secondary seller endpoints (such as `/api/v1/seller/account/get`).
  3. **Cross-Domain Cookie Leakage in `parseCookiesToRaw`:** Both `Account.ts` and `AccountInformation.ts` included `.tiktok.com` cookies when making requests to `seller-id.tokopedia.com`, violating RFC 6265 domain boundaries and triggering gateway auth rejections.
  4. **Interrupted Session Hydration in `loginSingle`:** Immediately after arriving at `homepage`, unawaited navigation to `seller-profile` with request interception caused pending background script hydration to stall.
  5. **UserData Wiping & Premature Process Kill in `login()`:** `Account.login()` passed `clearUserData = true` to `getBrowser()`, wiping the Chromium profile on every login, and invoked `process.kill()` before LevelDB/SQLite state could cleanly flush to disk.

### B. Window Title Version Desynchronization (Showing 1.2.31 Instead of 1.2.32)
- **Symptom:** After bumping version in root `package.json` to `1.2.32`, the top-left title bar in the desktop window still showed `AsistenQ Tiktok - 1.2.31`.
- **Root Causes Identified:**
  1. **Missing `package.json` Sync in Build Scripts:** `build` and `build:mac` did not copy `package.json` to `dist/`, leaving `dist/package.json` with outdated version metadata.
  2. **Accidental Truncation of `package.json`:** Editing `package.json` had truncated the `scripts`, `build`, and `devDependencies` blocks.
  3. **Static Window Title Binding:** `createWindow()` in `src/index.ts` relied solely on `app.getVersion()`, which resolves to the Electron shell version or stale dist metadata when running under certain development spawn modes.

---

## 2. Implementation Architecture & Changes

### A. Resilient Authentication & Fallback Verification (`src/class/AccountInformation.ts`)
- **Dual-Endpoint Verification:** Primary check queries `https://seller-id.tokopedia.com/api/v3/seller/common/get?need_verify_account=false&default_region=ID&version=3`. If that endpoint returns non-zero or unauthenticated status, a fallback check immediately queries `https://seller-id.tokopedia.com/api/v1/seller/account/get?locale=en&language=en&aid=4068&app_name=i18n_ecom_shop`.
- **3-Cycle Consecutive Failure Threshold:** Introduced `unauthFailures: Map<number, number>`. The account is only set to `authenticated = false` and persisted to SQLite after 3 consecutive refresh cycles where both endpoints confirm unauthenticated state. Any successful response resets the failure counter and marks `authenticated = true`.
- **Standard Browser Headers:** Added `referer: "https://seller-id.tokopedia.com/homepage"` and `origin: "https://seller-id.tokopedia.com"` in `getBrowserHeaders()`.
- **Strict RFC 6265 Domain Isolation:** Updated `parseCookiesToRaw` to enforce `host === cDomain || host.endsWith("." + cDomain)`, preventing `.tiktok.com` cookies from leaking into Tokopedia requests.

### B. Clean In-Page Profile Capture & Session Retention (`src/class/Account.ts`)
- **Direct In-Page Extraction:** In `loginSingle`, once the browser reaches `homepage`, seller profile information (`seller_id`, `name`) is fetched directly inside `page.evaluate` using the browser's authenticated session context.
- **Non-Blocking Auth Params Listener:** Removed `setRequestInterception(true)` from `listenAuthParams`, eliminating request stall risks.
- **UserData Retention:** Changed `clearUserData = false` in `Account.login()`, ensuring persistent profile directories across launches.
- **Clean Process Shutdown:** Replaced `process.kill()` with `await browser.close()`, giving Chromium 1000ms to cleanly persist LevelDB and cookie storage.

### C. Dynamic Version Resolution & Build Pipeline (`src/index.ts` & `package.json`)
- **Dynamic Version Resolution:** `src/index.ts` now reads `version` directly from `package.json` (resolving from root in development and `app.asar` in production) before falling back to `app.getVersion()`.
- **Restored & Enhanced `package.json`:** Restored all `scripts`, `build`, and `devDependencies` configurations for version `1.2.32`, and updated `build:mac` to automatically copy `package.json` to `dist/package.json`.

---

## 3. Verification & Validation

| Verification Check | Method | Result |
| :--- | :--- | :--- |
| TypeScript Compilation | `npx tsc --noEmit` | Clean (0 errors) |
| Cookie Domain Isolation | Unit test with Tokopedia & TikTok domains | Passed (Strict RFC 6265 domain boundaries) |
| Consecutive Failure Threshold | Unit test simulating 3 unauth cycles & recovery | Passed (Demotion only after 3 confirmed cycles; recovery resets count) |
| Package Build (macOS) | `npm run build:mac` | Success (Assets & `dist/package.json` synchronized) |
| Version Verification | `node -e "require('./dist/package.json').version"` | 1.2.32 |
