# Core Monitoring & Account Management Features

This document provides a comprehensive technical reference for the Account Management lifecycle, SQLite data schema, Multi-Account Monitoring Engine, Order & Metric Tracking pipelines, and the Audio/Visual Notification System in AsistenQ TikTok.

---

## 1. Account Lifecycle & Data Model

### 1.1 SQLite Account Schema (`account` Table)
Account persistence is managed by `src/class/Database.ts` and initialized in `src/class/Account.ts` (`initdb()` method). The application stores state in a local SQLite database (`asistenq-tiktok-data.db` located in `%APPDATA%` on Windows or `~/Library/Application Support/` on macOS).

```sql
CREATE TABLE IF NOT EXISTS account (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT,
    password TEXT,
    moderated BOOLEAN,
    added INTEGER,
    cookies TEXT,
    useAuthenticator BOOLEAN,
    secretAutenticator TEXT,
    avatar TEXT,
    lastUpdated INTEGER,
    chatCount INTEGER,
    lastChatEpoch INTEGER,
    orderEpoch INTEGER,
    orderCount INTEGER,
    orderPotency INTEGER,
    balance INTEGER,
    dikemasCount INTEGER,
    dikemasPotency INTEGER,
    dikemasEpoch INTEGER,
    dikirimCount INTEGER,
    dikirimPotency INTEGER,
    complaintCount INTEGER,
    complaintPotency INTEGER,
    productCount INTEGER,
    groupNames TEXT,
    warning BOOLEAN,
    shopid TEXT,
    authenticated BOOLEAN,
    pinned INT(1) DEFAULT 0,
    pinnedAt BIGINT DEFAULT NULL,
    statusMessage STRING DEFAULT NULL,
    pmSort INTEGER DEFAULT 0,
    statusSort INTEGER DEFAULT 0,
    auth_fp STRING DEFAULT NULL,
    auth_oec_seller_id STRING DEFAULT NULL,
    auth_aid STRING DEFAULT NULL,
    auth_msToken STRING DEFAULT NULL,
    auth_XBogus STRING DEFAULT NULL,
    auth_signature STRING DEFAULT NULL
);
```

### 1.2 Data Field Definitions
* **`id`**: Unique timestamp epoch in milliseconds (`generateId()`).
* **`name` / `email` / `password`**: Seller account credentials and display name.
* **`cookies`**: JSON array of session cookies serialized to text with single quotes sanitized via `____` delimiter replacement during database writes.
* **`useAuthenticator` & `secretAutenticator`**: 2FA/TOTP configuration. When enabled, `otplib` generates 6-digit TOTP codes during automated browser login.
* **`groupNames`**: Comma-separated list of group tags assigned to the account (e.g., `group1,group2`).
* **`shopid`**: Seller store ID extracted from Tokopedia Seller API response or account information.
* **`auth_*` (Security & Request Signing Params)**:
  - `auth_fp`: Fingerprint string.
  - `auth_oec_seller_id`: E-commerce seller identifier (stored surrounded by `-` delimiters, e.g., `-7495...-`).
  - `auth_aid`: Application ID (typically `4068`).
  - `auth_msToken`: Session security token.
  - `auth_XBogus`: Anti-crawler token.
  - `auth_signature`: Query request signature.
* **`pinned` & `pinnedAt`**: Pinning state (up to `maxPin = 10` accounts) with priority sorting.
* **`moderated` & `statusMessage`**: Store moderation flag (`shop_status === 3` maps to permanent ban / moderated).

### 1.3 Group Data Model (`_group` Table)
Managed in `src/class/Group.ts`:
```sql
CREATE TABLE IF NOT EXISTS _group (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255),
    is_active INT(1)
);
```
- Multi-group filtering supports selective monitoring.
- Group toggles can be switched globally (`group_active_for_all` setting) or per individual group.
- Group assignments cascade updates across all linked accounts via `massUpdate` and `updateSingle`.

### 1.4 Automated Login & Session Extraction Flow
When initiating login (`Account.loginSingle` via Puppeteer):
1. Launches browser instance with `--incognito` and configured window sizing.
2. Clears CDP session cookies (`Network.clearBrowserCookies`).
3. Navigates to `https://seller-id.tokopedia.com/account/login?setup=1&shop_region=ID`.
4. Enters email and password credentials.
5. If `useAuthenticator` is active, listens for `#TT4B_TSV_Verify_Code_Input` and inputs generated TOTP code from `authenticator.generate(secret)`.
6. Intercepts network requests (`page.on('request')`) targeting `proxy/seller/helpdesk/unread_msg/get` to extract `fp`, `oec_seller_id`, `aid`, `msToken`, and `X-Bogus`.
7. Captures cookies via `page.cookies()` and retrieves the seller username / shop ID.
8. Writes credentials, cookies, and signing parameters to the SQLite database and marks account as `authenticated = true`.

---

## 2. Multi-Account Monitoring Architecture

### 2.1 Worker Loop & Thread Pool Orchestration
The monitoring engine is implemented in `src/class/Monitoring.ts`:
```
+-------------------------------------------------------------------------+
| Monitoring.runtimeStart() (Infinite Worker Loop)                        |
+-------------------------------------------------------------------------+
                                    |
            +-----------------------v-----------------------+
            | Is Bot Running? (this.running === true)       |
            +-----------------------------------------------+
                        /                       \
                  [Yes]                           [No]
                    /                               \
+-------------------------------------+   +-------------------------------+
| Filter Main Data by Active Groups   |   | Sleep 2000ms                  |
| (Group.filterMainData)              |   | sendMainData()                |
+-------------------------------------+   +-------------------------------+
                    |
+-------------------------------------+
| Chunk Accounts by `thread` Setting  |
| (distributeArray(accounts, thread)) |
+-------------------------------------+
                    |
+-------------------------------------------------------------------------+
| For each Chunk / Batch:                                                 |
|   - Concurrently execute `refresh(acc)` for all chunk items             |
|   - Await `Promise.all(tasks)`                                          |
|   - Push real-time updates via `sendMainData()` over WebSocket          |
|   - Every 3 iterations, trigger `publicMonitoring.record()`             |
|   - Wait `delay` ms before executing next chunk                         |
+-------------------------------------------------------------------------+
                    |
+-------------------------------------------------------------------------+
| Recount Group Metrics & Wait `delay` ms                                 |
+-------------------------------------------------------------------------+
```

### 2.2 Concurrency & Delay Settings
* **`thread` (Concurrency limit)**:
  - Configurable via `src/controller/monitoring/getThread.ts` & `src/class/Monitoring.ts:setThread`.
  - Default value: `1` (or fetched from database setting `thread`, typically 5 in concurrent configurations).
  - Determines how many accounts are polled simultaneously in a single `Promise.all` batch.
* **`delay` (Polling interval throttle)**:
  - Configurable via `src/controller/monitoring/getDelay.ts` & `src/class/Monitoring.ts:setDelay`.
  - Default value: `500ms` (or fetched from database setting `delay`, typically 1000ms).
  - Prevents rate-limiting between chunk dispatches.

### 2.3 Session Recovery & Expiration Detection
- If API responses return auth error codes (e.g., code `98001002` on conversation endpoint or empty payload on profile endpoint), the engine marks `authenticated = false`.
- If an account has empty `shopid` or invalid cookies, it is automatically demoted to unauthenticated status, alerting the user via the sidebar badge (`logoutCount`).
- Periodic session checks (`filterLogoutByTime`) flag sessions older than 24 hours (86,400 seconds without successful sync) as logged out.

---

## 3. Order & Metrics Tracking Pipeline

Account statistics are fetched via `src/class/AccountInformation.ts` during each account refresh cycle.

### 3.1 Tracked Metric Endpoints & Mappings

| Metric / Status | Internal Property | Tokopedia API Endpoint | Extraction Logic & Filters |
| :--- | :--- | :--- | :--- |
| **Pesanan Baru** (New Orders) | `orderCount`<br>`orderPotency`<br>`orderEpoch` | `POST /api/fulfillment/order/list` | `order_status: ["1"]`, `search_tab: ["101"]`. Calculates total potency from `price_module.grand_total.price_val` and nearest deadline from `trade_order_module.latest_tts_time`. |
| **Dikemas** (Packing) | `dikemasCount`<br>`dikemasPotency`<br>`dikemasEpoch` | `POST /api/fulfillment/order/list` | `label_status: ["3"]` & `order_status: ["2"]`. Merges packed orders, sums potency, calculates earliest packing deadline. |
| **Dikirim** (Shipped) | `dikirimCount`<br>`dikirimPotency` | `POST /api/fulfillment/order/list` | `search_tab: ["102"]`. Counts active transit orders and computes total potency. |
| **Komplain / Retur** (Complaints) | `complaintCount`<br>`complaintPotency` | `POST /api/v2/reverse/orders/list`<br>`POST /api/v1/reverse/component/orders/list` | `tab: 13` (Cancellations) + `tab: ["800"]` (Returns). Extracts return prices and sums total complaint values. |
| **Chat Masuk** (Unread Chat) | `chatCount` | `GET /api/v1/shop_im/shop/conversation/get_wait_user_count` | `data.unresponsive_conversation_count`. |
| **Saldo Toko** (Settlement Balance) | `balance` | `GET /api/v1/pay/settlement/balance/get` | `data.amount.amount`. |
| **Total Produk** (Products) | `productCount` | `GET /api/v1/product/tab/count/get` | Tab count where `tab_id === 1`. |
| **Status Toko** (Moderation) | `moderated`<br>`statusMessage` | `GET /api/v3/seller/common/get` | `seller.shop_status === 3` indicates moderation ("Dinonaktifkan secara permanen"). |

### 3.2 Delta Computation & Difference Detection
Between polling cycles, `AccountInformation.ts` compares previous values against incoming API response counts:
* **New Orders Delta**:
  ```ts
  if (orderCount > account.orderCount) {
    const diff = orderCount - account.orderCount;
    this.notification.show({
      title: `${account.name} - ${groupName}`,
      message: `${diff} Pesanan baru`
    });
  }
  ```
* **Packing Orders Delta**:
  ```ts
  if (orderCount > account.dikemasCount) {
    const diff = orderCount - account.dikemasCount;
    this.notification.show({
      title: `${account.name} - ${groupName}`,
      message: `${diff} Pesanan sedang dikemas`
    });
  }
  ```
* **Shipped Orders Delta**:
  ```ts
  if (orders.length > account.dikirimCount) {
    const diff = orders.length - account.dikirimCount;
    this.notification.show({
      title: `${account.name} - ${groupName}`,
      message: `${diff} Pesanan telah dikirim`
    });
  }
  ```
* **Complaint Delta**:
  ```ts
  if (complaintCount > account.complaintCount) {
    const diff = complaintCount - account.complaintCount;
    this.notification.show({
      title: `${account.name} - ${groupName}`,
      message: `${diff} Pembatalan diajukan (komplain)`
    });
  }
  ```
* **Chat Delta**:
  ```ts
  if (newChatCount > account.chatCount) {
    const diff = newChatCount - account.chatCount;
    this.notification.show({
      title: `${account.name} - ${groupName}`,
      message: `${diff} Chat masuk`
    });
  }
  ```

---

## 4. Audio & Visual Notification Engine

Implemented in `src/class/Notification.ts`.

### 4.1 Architecture & State Configuration
* **Database Settings**:
  - `notification_toast_active` (0 or 1): Controls desktop visual popups.
  - `notification_sound_active` (0 or 1): Controls audio playback.
  - `notification_sound_volume` (0 - 100): Playback volume.
  - `notification_sound_filename` (string): Active sound effect key (e.g., `sound_1`).
  - `custom_ringtone_audios` (string delimited by `|||`): Custom uploaded MP3 files.

### 4.2 Built-in Sound Effects
The application ships with 20 built-in sound effects located in `src/sounds/` (or `dist/sounds` in packaged releases):
- `sound_1.mp3` through `sound_20.mp3`

### 4.3 Notification Dispatch Flow
When `Notification.show({ title, message })` is invoked:
1. **Public Monitoring Forwarding**: If `PublicMonitoring` is attached, pushes text event to public logger.
2. **Visual Desktop Toast**:
   - Spawns native `electron.Notification`.
   - Sets icon to `images/icon.png`.
   - Urgency flagged as `critical` with 5000ms auto-close timeout.
3. **Sound Playback**:
   - Resolves target sound path: `path.join(this.soundDir, `${this.soundFilename}.mp3`)`.
   - Converts volume percentage to decimal: `volume = this.soundVolume / 100`.
   - Plays audio asynchronously via `sound-play` package.

### 4.4 Custom Ringtone Management
- **Add Ringtone** (`addNewRingtone()`): Opens native Electron file dialog, filters `.mp3`, sanitizes file name, copies file to sound directory, and appends to `custom_ringtone_audios`.
- **Remove Ringtone** (`removeCustomRingtone(name)`): Removes name from settings, unlinks MP3 file from filesystem, and reverts active ringtone to `sound_1` if deleted ringtone was selected.

---

## 5. Data Import / Export & Error Handling

### 5.1 Batch Excel Import Pipeline (`Account.imports`)
* **Supported File Format**: `.xlsx` spreadsheet following the template structure.
* **Column Mapping**:
  1. Column 1: Error notes / remarks (ignored on import).
  2. Column 2: Account Name.
  3. Column 3: Email (used as primary unique constraint check).
  4. Column 4: Password.
  5. Column 5: Authenticator 2FA secret key.
  6. Column 6: Group Names (comma-separated).
  7. Column 7: Serialized Cookies JSON string.
  8. Column 8: Shop ID.
  9. Columns 9–14: Authentication parameters (`auth_fp`, `auth_oec_seller_id`, `auth_aid`, `auth_msToken`, `auth_XBogus`, `auth_signature`).
* **Validation & Duplicate Prevention**:
  - Name minimum length: >= 1 character.
  - Email format validation: checked via regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
  - Duplicate check: `SELECT COUNT(id) FROM account WHERE email = ?`. Rejects existing emails with an explicit error.
  - Groups parsed and automatically added to `_group` table if new.

### 5.2 Error Inspection Endpoint (`/api/import-error-list`)
- When errors occur during batch import, failed accounts are stored in memory (`account.accountImportErrors`).
- Automatically launches user's default browser pointing to:
  `http://localhost:9184/api/import-error-list?e=<epoch_timestamp>`
- Handled by `src/controller/account/importErrorList.ts`:
  - Returns plaintext formatted list: `<index>. <Name><Email> - <Reason>`
  - If no errors: returns `"Tidak ada kesalahan saat import akun 🎉🎉"`.

### 5.3 Account Export Mechanism (`Account._exports`)
- Downloads standard template or builds workbook via `exceljs`.
- Supports filtered exports based on query types:
  - `all`: All stored accounts.
  - `moderated`: Accounts with `moderated === true`.
  - `authenticated`: Logged-in accounts with valid cookies.
  - `unauthenticated`: Logged-out / expired accounts.
  - `selected`: User-selected accounts by ID list.
  - `all_with_moderation_date`: Fetches moderation chat timestamps before exporting.
- Presents native OS `showSaveDialogSync` to save `.xlsx` in user downloads.
