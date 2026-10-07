# Security, Device Licensing, and Full API / WebSocket Reference

## 1. Security & Licensing Architecture

### 1.1 Device Fingerprinting & Machine ID Generation
The application implements hardware-bound identification to enforce licensing integrity and prevent unauthorized multitenancy or credential cloning (`src/class/Device.ts`).

#### Dual Strategy Architecture:
1. **Primary Method (`node-machine-id`)**:
   - Executes `machineIdSync(true)` to extract the system UUID / machine identifier from the OS registry/DMI.
   - Formats the prefix: `ASISTENQ_${machineIdSync(true).toUpperCase()}`.
2. **Fallback / Fallback Override System**:
   - If the generated Machine ID belongs to a known blocked/blacklisted list (`usedMachineid2`), or if dynamic generation is required, the system invokes `generateMachineId()`.
   - **Hardware Data Sources**:
     - Hostname: `os.hostname()`
     - Platform & Arch: `os.platform()`, `os.arch()`
     - OS Release: `os.release()`
     - Primary Disk Drive Serial Number: Extracted via Windows WMI command `wmic diskdrive get SerialNumber` (first non-empty data row).
     - Physical Total Memory: `os.totalmem()`
     - CPU Model Manifest: Concatenation of all core model names `os.cpus().map(cpu => cpu.model).join('')`.
     - MAC Address: Primary network interface `eth0` MAC or fallback `unknown`.
   - **Hashing**: SHA-256 digest over the concatenated hardware signature string, uppercased and prefixed with `ASISTENQ_`.

```
System Info Elements (os.hostname, os.arch, HDD Serial [wmic], CPU Models, eth0 MAC, Total RAM)
                             │
                             ▼
                   Crypto SHA-256 Digest
                             │
                             ▼
               Prefix with "ASISTENQ_" -> Device Machine ID
```

### 1.2 Anti-Virtualization & Anti-Analysis (`preventVMProcess`)
To safeguard proprietary automation algorithms and account credentials, the client runs proactive hypervisor detection upon startup:
- Windows Command: `wmic computersystem get manufacturer`
- macOS Command: `system_profiler SPHardwareDataType | awk '/Model Identifier/ {print $3}'`
- **Blocked Hypervisor Signatures**:
  - `VMware, Inc.`
  - `VirtualBox`
  - `QEMU`
  - `Microsoft Corporation` (Virtual / Hyper-V VM host)
  - `Parallels Software International Inc.`
  - `Xen`
- **Enforcement Action**: Immediate non-zero process termination via `process.exit(230345)`.

---

### 1.3 License Verification, Activation & Heartbeat Protocol

#### Remote License Verification Endpoint:
- **URL**: `POST https://appcenter.ziqva.com/device/status?product={productName}&machine_id={machineId}`
- **Headers**: `Content-Type: multipart/form-data`
- **Product Name**: `"AsistenQ Owner"`
- **Response Structure**:
  ```json
  {
    "tobelsoft": {
      "error": false,
      "message": "Success",
      "data": {
        "registered": true,
        "label": "#UserLabel",
        "created": "1700000000",
        "expired": "1735689600",
        "remaining": "45d 12h",
        "user": {
          "name": "Seller Store",
          "email": "owner@seller.com"
        }
      }
    }
  }
  ```

#### Activation Flow (`activateLicense`):
- **URL**: `POST https://appcenter.ziqva.com/device/activation?token={token}&product={productName}&machine_id={machineId}`
- **Process**:
  1. Validates token format and reaches remote activation gateway.
  2. If `data.tobelsoft.error === true`, raises error with remote message.
  3. Upon success, synchronizes monitoring state (`monitoring.sendMainData()`).

#### Periodic Heartbeat & Auto-Kill Loop:
- Runs in `checkRegisteredRepeately()`:
  - If licensed (`registered === true`): Polling interval is `600,000ms` (10 minutes).
  - If verification fails or license is revoked/expired (`registered === false`): Client immediately halts with `app.exit(239)`.
  - If unregistered: Short polling loop of `3000ms` awaiting user license input.

#### Online Heartbeat Ping Loop:
- Once validated, invokes background worker `pingOnline({ machine_id, email, user_name })`.
- **Target URL**: `POST https://srv-ziqlabs-1.my.id/api/online-device`
- **Headers**: `action: "ping"`, `Content-Type: application/json`
- **Payload**:
  ```json
  {
    "machine_id": "ASISTENQ_...",
    "email": "owner@seller.com",
    "user_name": "Seller Store",
    "product_name": "AsistenQ JS"
  }
  ```
- **Interval**: Fixed cadence of `90,000ms` (90 seconds).
- **Recorder Synchronization**: Instantiates `Recorder` telemetry tracking with the licensed user's email.

---

### 1.4 Multi-Device Logout & Session Revocation (`LogoutChecker.ts`)

To prevent headless sessions from continuing silently when invalidated from another terminal, `LogoutChecker` monitors account token health:
- **Inspection Cycle**: Runs periodically across all active accounts (`checkRuntime()` runs `checkCore()` every 3 hours `10,800,000ms`).
- **Headless Validation**:
  1. Spawns isolated headless browser instance (`logout_checker`) positioned offscreen (`--window-position=-2400,-2400`).
  2. Clears cookies and injects current stored cookies for each account.
  3. Navigates to Tokopedia account security/settings page (`view-source:https://tokopedia.com/user/settings`).
  4. Inspects redirect URL: if the resolved location contains `/login`, the session cookies have been invalidated on remote servers.
  5. Updates database state: calls `account.setAuthenticated(account.id, false)` to flag user intervention required.
  6. Forcefully closes browser and terminates underlying process tree.

---

### 1.5 Auto-Updater Lifecycle (`electron-updater` & Custom Patching)

#### Primary Engine: `electron-updater`
1. **Feed Configuration**:
   - Provider: `generic`
   - Feed URL: `http://45.76.183.58/asistenq-tiktok-update/`
   - Settings: `autoInstallOnAppQuit = true`, `allowDowngrade = false`.
2. **Checking & Background Download**:
   - `autoUpdater.checkForUpdates()` triggered on startup.
   - Listens to `update-available` event and starts downloading background differential artifacts.
3. **Notification Dialog & Interactive Quit**:
   - Listens to `update-downloaded` event.
   - Displays native modal via `dialog.showMessageBoxSync`:
     - Message: *"Update tersedia, apakah anda ingin update aplikasi sekarang ?, jika anda memilih 'Nanti Saja' maka proses update akan dilakukan saat aplikasi tertutup / berhenti beroperasi"*
     - Buttons: `["Sekarang", "Nanti Saja"]`
     - Selecting "Sekarang" triggers immediate `autoUpdater.quitAndInstall()`.

#### Auxiliary Binary Patcher (`Updater.ts`):
- Endpoint: `https://dev.srv-ziqlabs-1.my.id/updates?build_number=${config.product.buildNumber}&product=AsistenQ Owner`
- Patcher Source: `https://srv-ziqlabs-1.my.id/share/intern-library/asistenq/patcher.exe`
- Streamed download to `os.tmpdir()/asistenq-patcher.exe` for differential binary binary hot-patching.

---

## 2. Complete REST API Reference (Port 9184)

All REST endpoints are exposed locally over HTTP on port `9184`. Standard body parsing allows `extended: true` and a payload limit of `150mb` with CORS enabled for `http://localhost:9184` (production) and `http://localhost:3000` (development).

---

### 2.1 Account Management (`src/controller/account/`)

#### `GET /account/all`
- **Controller**: `src/controller/account/all.ts`
- **Query Params**: `search` (string, optional)
- **Response**:
  ```json
  {
    "error": false,
    "query": { "search": "" },
    "data": [
      {
        "id": 1,
        "name": "Shop 1",
        "email": "shop1@mail.com",
        "authenticated": true,
        "useAuthenticator": true,
        "labels": ["GroupA"]
      }
    ]
  }
  ```

#### `POST /account/add`
- **Controller**: `src/controller/account/add.ts`
- **Request Body**:
  ```json
  {
    "name": "Store Alpha",
    "email": "alpha@store.com",
    "password": "secretPassword",
    "authenticator": "JBSWY3DPEHPK3PXP",
    "useAuthenticator": true,
    "labels": ["Main"]
  }
  ```
- **Response**:
  ```json
  {
    "error": false,
    "msg": "akun telah berhasil ditambahkan"
  }
  ```

#### `POST /account/get`
- **Controller**: `src/controller/account/get.ts`
- **Request Body**:
  ```json
  {
    "id": 1
  }
  ```
- **Response**:
  ```json
  {
    "error": false,
    "msg": null,
    "data": { "id": 1, "name": "Store Alpha", "email": "alpha@store.com", "..." : "..." }
  }
  ```

#### `POST /account/update`
- **Controller**: `src/controller/account/update.ts`
- **Request Body**:
  ```json
  {
    "id": 1,
    "name": "Store Alpha Updated",
    "email": "alpha@store.com",
    "password": "newPassword",
    "secretAutenticator": "JBSWY3DPEHPK3PXP",
    "useAuthenticator": true,
    "groupNames": "Group1, Group2"
  }
  ```
- **Response**:
  ```json
  {
    "error": false,
    "msg": null
  }
  ```

#### `POST /account/remove`
- **Controller**: `src/controller/account/remove.ts`
- **Request Body**:
  ```json
  {
    "ids": [1, 2]
  }
  ```
- **Response**:
  ```json
  {
    "error": false,
    "msg": null
  }
  ```

#### `POST /account/login`
- **Controller**: `src/controller/account/login.ts`
- **Request Body**:
  ```json
  {
    "ids": [1, 2]
  }
  ```
- **Response**:
  ```json
  {
    "error": false,
    "msg": "Akun telah berhasil login"
  }
  ```

#### `POST /account/refresh`
- **Controller**: `src/controller/account/refresh.ts`
- **Request Body**:
  ```json
  {
    "id": 1
  }
  ```
- **Response**:
  ```json
  {
    "error": false,
    "msg": null
  }
  ```

#### `POST /account/imports`
- **Controller**: `src/controller/account/imports.ts`
- **Content-Type**: `multipart/form-data`
- **Form Field**: `file` (Excel/CSV binary buffer)
- **Response**:
  ```json
  {
    "error": false,
    "msg": null
  }
  ```

#### `POST /account/exports`
- **Controller**: `src/controller/account/exports.ts`
- **Request Body**:
  ```json
  {
    "type": "xlsx",
    "selected": [1, 2]
  }
  ```
- **Response**:
  ```json
  {
    "error": false,
    "msg": null
  }
  ```

#### `POST /account/forceLogoutAllDevice`
- **Controller**: `src/controller/account/forceLogoutAllDevice.ts`
- **Request Body**:
  ```json
  {
    "ids": [1, 2]
  }
  ```
- **Response**:
  ```json
  {
    "error": false,
    "msg": null,
    "data": null
  }
  ```

#### `GET /api/import-error-list`
- **Controller**: `src/controller/account/importErrorList.ts`
- **Content-Type**: `text/plain`
- **Response**: Formatted plaintext list of import validation errors.

---

### 2.2 Device & Licensing (`src/controller/device/`)

#### `GET /device/getMachineId`
- **Controller**: `src/controller/device/getMachineId.ts`
- **Response**:
  ```json
  {
    "error": false,
    "msg": null,
    "data": {
      "machineId": "ASISTENQ_B948C7210FA8..."
    }
  }
  ```

#### `GET /device/isRegistered`
- **Controller**: `src/controller/device/isRegistered.ts`
- **Response**:
  ```json
  {
    "error": false,
    "registered": true
  }
  ```

#### `POST /device/activateLicense`
- **Controller**: `src/controller/device/activateLicense.ts`
- **Request Body**:
  ```json
  {
    "license": "LICENSE_KEY_STRING"
  }
  ```
- **Response**:
  ```json
  {
    "error": false,
    "msg": null
  }
  ```

#### `GET /device/getData`
- **Controller**: `src/controller/device/getData.ts`
- **Response**:
  ```json
  {
    "error": false,
    "msg": null,
    "data": {
      "user": { "name": "Store Admin", "email": "admin@store.com" },
      "device": {
        "created": "10 Jan 2026; 10:00",
        "expired": "10 Jan 2027; 10:00",
        "remaining": "365d",
        "label": "#Production",
        "machineId": "ASISTENQ_..."
      },
      "contacts": [
        { "name": "Whatsapp", "link": "https://api.whatsapp.com/send/?phone=6285876681770..." },
        { "name": "Email", "link": "mail:cs@ziqva.com" }
      ],
      "os": {
        "computer_name": "WIN-NODE-01",
        "architecture": "x64",
        "platform": "win32",
        "type": "Windows_NT",
        "uptime": "5d 14h 20m 10s"
      },
      "hardware": {
        "cpu": { "model": "Intel Core i7", "core": 8, "speed": "3.20 GHz" },
        "memory": { "total": "16.00 GB", "free": "8.50 GB", "used": "7.50 GB" }
      }
    }
  }
  ```

---

### 2.3 Monitoring & Operations (`src/controller/monitoring/`)

#### `GET /monitoring/getThread`
- **Controller**: `src/controller/monitoring/getThread.ts`
- **Response**:
  ```json
  {
    "error": false,
    "msg": null,
    "data": { "thread": 5 }
  }
  ```

#### `GET /monitoring/getDelay`
- **Controller**: `src/controller/monitoring/getDelay.ts`
- **Response**:
  ```json
  {
    "error": false,
    "msg": null,
    "data": { "delay": 2000 }
  }
  ```

#### `GET /monitoring/getPMTypeData`
- **Controller**: `src/controller/monitoring/getPMType.ts`
- **Response**: Array of registered Private Message Type structures and their active status.

#### `POST /monitoring/PMTypeSetActive`
- **Controller**: `src/controller/monitoring/PMTypeSetActive.ts`
- **Request Body**:
  ```json
  {
    "name": "chat_response",
    "state": true
  }
  ```

#### `POST /monitoring/PMTypeSetActiveForAll`
- **Controller**: `src/controller/monitoring/PMTypeSetActiveForAll.ts`
- **Request Body**:
  ```json
  {
    "state": true
  }
  ```

#### `POST /monitoring/pin`
- **Controller**: `src/controller/monitoring/pin.ts`
- **Request Body**:
  ```json
  {
    "id": 1
  }
  ```

#### `POST /monitoring/bulkRefresh`
- **Controller**: `src/controller/monitoring/bulkRefresh.ts`
- **Request Body**:
  ```json
  {
    "ids": [1, 2, 3]
  }
  ```

#### `POST /order/markProcessedOrder`
- **Controller**: `src/controller/monitoring/markProcessedOrder.ts`
- **Request Body**:
  ```json
  {
    "invoice": "INV/20260101/MPL/12345678"
  }
  ```

---

### 2.4 Groups & Organization (`src/controller/group/`)

- `GET /group/data` (`src/controller/group/data.ts`): Returns all defined groups and enabled flags.
- `POST /group/add` (`src/controller/group/add.ts`): Body: `{ "name": "NorthRegion" }`.
- `POST /group/remove` (`src/controller/group/remove.ts`): Body: `{ "name": "NorthRegion" }`.
- `POST /group/setActive` (`src/controller/group/setActive.ts`): Body: `{ "name": "NorthRegion", "state": true }`.
- `POST /group/setActiveForAll` (`src/controller/group/setActiveForAll.ts`): Body: `{ "state": true }`.
- `POST /group/updateSingle` (`src/controller/group/updateSingle.ts`): Body: `{ "oldName": "Old", "newName": "New" }`.
- `POST /group/massUpdate` (`src/controller/group/massUpdate.ts`): Body: `{ "groups": [...] }`.

---

### 2.5 Free Features

#### Authenticator 2FA (`src/controller/freeFeature/authenticator/`):
- `GET /freeFeature/authenticator/sync`: Synchronizes 2FA token list.
- `POST /freeFeature/authenticator/add`: Body: `{ "authenticator": "KEY", "label": "Label", "email": "e@mail.com" }`.
- `POST /freeFeature/authenticator/remove`: Body: `{ "ids": [1, 2] }`.
- `POST /freeFeature/authenticator/update`: Body: `{ "id": 1, "secret": "KEY", "label": "L", "email": "e@m.com" }`.

#### Product Deletion (`src/controller/freeFeature/deleteProduct/`):
- `GET /freeFeature/deleteProduct/getAvailableAccounts`: Query `search` (string).
- `POST /freeFeature/deleteProduct/getAccount`: Body: `{ "id": 1 }`.

#### Product Uploader (`src/controller/freeFeature/productUploader/`):
- `POST /freeFeature/productUploader/upload`: Body: `{ "accountId": 1, "folder": "C:/...", "config": {...} }`.
- `POST /freeFeature/productUploader/getAccount`: Body: `{ "id": 1 }`.
- `GET /freeFeature/productUploader/selectFolder`: Opens native OS directory picker.
- `GET /freeFeature/productUploader/getCurrentSelectedFolder`: Returns active folder selection.
- `POST /freeFeature/productUploader/stop`: Halts ongoing upload jobs.

#### Profile Photo Manager (`src/controller/freeFeature/ubahFotoProfil/`):
- `GET /freeFeature/aturFotoProfil/selectFolder`: Launches folder selection dialog.
- `POST /freeFeature/aturFotoProfil/listData`: Body: `{ "selectedIds": [1, 2], "folder": "C:/..." }`.

---

### 2.6 Automation Schedules, Holiday, LiveChat, & Extensions

#### LiveChat:
- `GET /liveChat/isActive` (`src/controller/liveChat/isActive.ts`): Checks status.
- `POST /liveChat/setActive` (`src/controller/liveChat/setActive.ts`): Body: `{ "state": true }`.

#### Operational Schedule:
- `GET /operationalSchedule/accounts`
- `GET /operationalSchedule/accounts/:search`
- `GET /operationalSchedule/accounts/:search/:group`

#### Holiday / Store Pause Mode:
- `GET /holiday/accounts`
- `GET /holiday/accounts/:search`
- `GET /holiday/accounts/:search/:group`

#### Slogan & Bio Automation:
- `GET /slogan/accounts`
- `GET /slogan/accounts/:search`
- `GET /slogan/accounts/:search/:group`
- `GET /slogan/detail`
- `POST /free-feature/slogan/update`: Query `name`, Body `{ "values": [...] }`.

#### Shipping Manager:
- `GET /freeFeature/shippingManager/getShippers`
- `POST /freeFeature/shippingManager/applyActivateShippers`: Body `{ "accountIds": [...], "couriers": [...] }`.
- `GET /freeFeature/shippingManager/logs`

#### Chrome Extensions & Isolated Browser Automation:
- `GET /browser/extensions`: Returns list of installed extensions.
- `POST /browser/addExtension`: Body: `{ "url": "https://chrome.google.com/webstore/detail/..." }`.
- `GET /browser/ext_icon?id={extId}`: Serves icon binary.
- `POST /browser/removeExtension`: Body: `{ "id": "extId" }`.
- `POST /openBrowser/open`: Body: `{ "id": 1, "targetUrl": "https://seller.tiktok.com" }`.

#### Chat Templates:
- `GET /templateChat/getData/:name`
- `POST /templateChat/set/:name`: Body: `{ "chats": ["Auto response 1", "Auto response 2"] }`.
- `POST /templateChat/add/:name`: Body: `{ "chat": "New text" }`.
- `POST /templateChat/remove/:name`: Body: `{ "chat": "Text to remove" }`.

#### Notifications & Sound Ringtones:
- `GET /notification/get`
- `POST /notification/update`: Body `{ "volume": 80, "sound": "sound_1.mp3", ... }`.
- `POST /notification/show`: Body `{ "title": "New Order", "message": "Order #123 arrived" }`.
- `GET /notification/addNewRingtone`: Dialog to import custom audio file.
- `POST /notification/removeCustomRingtone`: Body: `{ "name": "custom.mp3" }`.

#### App Settings, UI & Public Monitoring:
- `POST /setting/getValue`: Body `{ "name": "settingKey" }`.
- `POST /setting/setValue`: Body `{ "name": "settingKey", "value": "val" }`.
- `GET /zoomLevel/get`
- `POST /zoomLevel/set`: Body `{ "size": 1.2 }`.
- `POST /app/restart`: Relaunches Electron application process.
- `POST /app/openExternalLink`: Body `{ "url": "https://..." }`.
- `POST /mainDataColumn/setActive`: Body `{ "columns": [...] }`.
- `GET /public-monitoring/alias`
- `GET /public-monitoring/active`
- `POST /public-monitoring/activeToggle`
- `POST /public-monitoring/changeAlias`: Body `{ "alias": "Warehouse 1" }`.
- `GET /update/check`: Triggers electron-updater check.
- `GET /updater/getUpdates` & `POST /updater/update`
- `GET *`: `renderFrontend` fallback rendering index HTML bundle.

---

## 3. WebSocket Event Matrix (Socket.IO)

The Socket.IO server multiplexes communication across functional subsystems using authentication handshake routing (`socket.handshake.auth.from`).

```
                              ┌───────────────────────────────────────────────┐
                              │            Socket.IO Connection               │
                              │           (socket.handshake.auth.from)        │
                              └───────────────────────┬───────────────────────┘
                                                      │
             ┌───────────────────┬────────────────────┼───────────────────┬───────────────────┐
             │                   │                    │                   │                   │
             ▼                   ▼                    ▼                   ▼                   ▼
     "free_feature__     "operational_       "live_chat"             "slogan"              Default
     delete_product"       schedule"                                                    (Main System)
             │                   │                    │                   │                   │
    • start_delete_product • start (ids, days)  • live-chat-data   • start (ids)        • bot-active-toggle
    • stop                 • running-state      • sendSocketData   • running-state      • set-monitoring-active-filter
    • eligible-data        • logs                                  • logs               • get-monitoring-main-data
    • is-running                                                                        • monitoring-main-data
                                                                                        • bot-status
                                                                                        • refresh-account-data
```

### 3.1 Namespace Handshake Routing Matrix

| Handshake `auth.from` | Target Class | Inbound Client Events (`socket.on`) | Outbound Server Events (`socket.emit`) | Description & Purpose |
|---|---|---|---|---|
| *(undefined / default)* | `Monitoring`, `Account`, `Authenticator` | `bot-active-toggle`<br>`set-monitoring-active-filter`<br>`get-monitoring-main-data`<br>`get-free-feature-authenticator-data` | `bot-status`<br>`monitoring-active-filter`<br>`monitoring-main-data`<br>`main-sidebar-data`<br>`refresh-account-data`<br>`free_feature_authenticator-data` | Main dashboard control loop, bot start/stop toggle, live order counters, and background account sync updates. |
| `"free_feature__delete_product"` | `DeleteProduct` | `start_delete_product`<br>`stop` | `eligible-data`<br>`logs`<br>`is-running` | Automated product deletion wizard, stream logs, eligible product candidates, and cancellation triggers. |
| `"free_feature__product_uploader"` | `ProductUploader` | *(Standard Disconnect)* | `logs`<br>`is-uploading` | Real-time logging of bulk upload automation jobs and batch completion progress. |
| `"main_data_column"` | `MainDataColumn` | *(Standard Disconnect)* | `column-data` | Synchronizes dynamic table column visibility and custom data layout preferences. |
| `"live_chat"` | `LiveChat` | *(Standard Disconnect)* | `live-chat-data` | Streams incoming multi-store chat notifications, unread badges, and live messaging threads. |
| `"operational_schedule"` | `OperationalSchedule` | `start` (`{ selectedIds, days }`) | `running-state`<br>`logs` | Manages operational shop opening/closing schedule execution per day across selected accounts. |
| `"holiday"` | `Holiday` | `start` (`{ selectedIds, range }`)<br>`unset` (`{ selectedIds }`) | `running-state`<br>`logs` | Sets holiday mode / store vacation toggle across accounts with date ranges and live execution logs. |
| `"slogan"` | `Slogan` | `start` (`{ selectedIds, slogans, descriptions }`) | `running-state`<br>`logs` | Bulk updates shop slogans and descriptions across multiple TikTok Shop profiles. |
| `"atur-foto-profil"` | `BulkUpdateProfilePhoto` | `start` (`{ selectedIds, folder }`) | `running-state`<br>`logs` | Batch processes and updates store avatar profile images from an image directory. |
| *(Open Browser)* | `OpenBrowser` | *(Triggered via REST)* | `active-account-id` | Broadcasts active account ID currently being automated or navigated in an isolated Chrome window. |

---

### 3.2 WebSocket Event Payload Definitions

#### 1. `bot-status` (Server -> Client)
```typescript
interface BotStatusPayload {
  running: boolean;
  totalAccount: number;
  totalOrder: number;
  totalChat: number;
  totalReview: number;
  totalCancel: number;
  totalReturn: number;
}
```

#### 2. `monitoring-main-data` (Server -> Client)
```typescript
interface MonitoringMainDataPayload {
  accounts: Array<{
    id: number;
    name: string;
    email: string;
    authenticated: boolean;
    active: boolean;
    summary: {
      newOrders: number;
      readyToShip: number;
      inDelivery: number;
      completed: number;
      unpaid: number;
      canceled: number;
      chatUnread: number;
      negativeReviews: number;
    };
    group: string[];
    lastSync: string;
  }>;
}
```

#### 3. `start_delete_product` (Client -> Server)
```typescript
interface StartDeleteProductPayload {
  accountId: number;
  id: string;
  value: string | number;
  notSold: boolean;
}
```

#### 4. `eligible-data` (Server -> Client)
```typescript
interface EligibleDataPayload {
  total: number;
  products: Array<{
    productId: string;
    title: string;
    sku: string;
    stock: number;
    price: number;
    soldCount: number;
  }>;
}
```

#### 5. `start` [Operational Schedule] (Client -> Server)
```typescript
interface OperationalScheduleStartPayload {
  selectedIds: number[];
  days: {
    monday: { active: boolean; open: string; close: string };
    tuesday: { active: boolean; open: string; close: string };
    wednesday: { active: boolean; open: string; close: string };
    thursday: { active: boolean; open: string; close: string };
    friday: { active: boolean; open: string; close: string };
    saturday: { active: boolean; open: string; close: string };
    sunday: { active: boolean; open: string; close: string };
  };
}
```

#### 6. `logs` (Server -> Client)
```typescript
type LogsPayload = Array<{
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  accountId?: number;
  accountName?: string;
  message: string;
}>;
```
