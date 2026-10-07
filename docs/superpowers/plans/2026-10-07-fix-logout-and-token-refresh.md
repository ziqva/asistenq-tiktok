# Fix False-Positive Logout and Session Expiration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate false-positive store logouts (5–15 minute drops), fix `setupChat` / `AccountInformation` unauthenticated triggers, remove stale `msToken`/`X-Bogus` dependencies from query URLs, enable reliable session validation via `seller/common/get`, and fix `OpenBrowser.ts` lockout checks.

**Root Causes Identified:**
1. Stale ephemeral security query params (`msToken`, `X-Bogus`) captured once during login expire after 5-15 minutes, causing TikTok/ByteDance security gateway to reject requests with `code: 98001002` or HTTP 401/403.
2. `setupChat` in `AccountInformation.ts` treats token signature errors as fatal account logout, setting `account.authenticated = false` in SQLite and memory.
3. `OpenBrowser.ts` blocks opening stores whose `authenticated` flag was falsely marked `false`.
4. Legacy Tokopedia consumer URLs (`https://www.tokopedia.com/login`) were checked instead of TikTok Shop Seller Center (`https://seller-id.tokopedia.com/account/login`).

## Tech Stack & Files
- Modify: `src/class/AccountInformation.ts`
- Modify: `src/class/Account.ts`
- Modify: `src/class/OpenBrowser.ts`
- Modify: `src/class/LogoutChecker.ts`

---

### Task 1: Decouple Session Authentication from Ephemeral Chat Signatures and Clean Up Endpoints

**Files:**
- Modify: `src/class/AccountInformation.ts`

- [ ] **Step 1: Make `setupProfileDetail` / `seller/common/get` the authoritative source of authentication state**
  - Verify session validity by checking `seller/common/get` response (`data.data.seller.shop_status` and `code === 0`).
  - Only mark `account.authenticated = false` when `seller/common/get` explicitly returns 401/403 or unauthenticated session response.

- [ ] **Step 2: Fix `setupChat` error handling**
  - Do not mark the entire account as unauthenticated if `get_wait_user_count` fails or returns signature error (`98001002`).
  - Remove stale `msToken`/`X-Bogus`/`_signature` query params or handle graceful fallback.
  - Return `chatCount` without failing the entire monitoring cycle.

- [ ] **Step 3: Clean up query parameters in `setupBalance` and `setupComplaint`**
  - Remove stale `msToken=${account.auth.msToken}&X-Bogus=...` query parameters from API calls that operate purely on cookie authentication.

---

### Task 2: Update `Account.ts` Login & Auth Token Storage

**Files:**
- Modify: `src/class/Account.ts`

- [ ] **Step 1: Ensure cookies from all relevant domains (`.tokopedia.com`, `.tiktok.com`, `seller-id.tokopedia.com`) are captured and preserved**
- [ ] **Step 2: Add dynamic cookie / session health check method `checkSession(id: number)`**

---

### Task 3: Fix `OpenBrowser.ts` Lockout & Login Detection

**Files:**
- Modify: `src/class/OpenBrowser.ts`

- [ ] **Step 1: Allow opening browser even if background state experienced a transient network glitch**
- [ ] **Step 2: Update login URL detection to match `seller-id.tokopedia.com/account/login`**
- [ ] **Step 3: Ensure cookies are set with proper domain context before navigation**

---

### Task 4: Verification and Re-build

**Files:**
- Run: `pnpm run build`
- Test: Full TypeScript compilation and runtime verification

- [ ] **Step 1: Compile TypeScript (`pnpm run build`)**
- [ ] **Step 2: Verify server starts and endpoints respond properly**
