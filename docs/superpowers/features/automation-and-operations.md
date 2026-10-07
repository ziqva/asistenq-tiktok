# Automation & Store Operations Features

This technical reference provides an exhaustive guide to the automation and store operations architecture in AsistenQ TikTok. It documents the batch automation tools (`ProductUploader`, `DeleteProduct`, `BulkUpdateProfilePhoto`, `Authenticator`) and the store operations engines (`ShippingManager`, `OperasionalSchedule`, `Holiday`, `Slogan`, `LiveChat`, `PublicMonitoring`).

---

## 1. Architectural Overview & Shared Foundations

### 1.1 Overview & Operational Objectives
AsistenQ TikTok delivers a dual-layer automation suite:
1. **Batch Automation Tools**: High-throughput automated browser workflows (via Puppeteer and Chrome DevTools Protocol) and direct GraphQL mutation pipelines designed to eliminate repetitive seller tasks such as uploading mass product inventories, bulk pruning outdated catalog listings, rotating store profile avatars, and centralizing 2-Factor Authentication (TOTP).
2. **Store Management & Operations**: High-concurrency store management modules that enable operators to synchronize logistical courier preferences, operational schedules, holiday closures, store slogans/notices, collaborative operator chats, and remote dashboard monitoring across dozens to hundreds of managed seller stores simultaneously.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ELECTRON CLIENT / UI                                  │
│   (React Frontend - Ant Design / Material UI / Socket.IO Client / Axios Controller)   │
└─────────────────────────────────────────▲──────────────────────────────────────────────┘
                                          │ HTTP REST APIs & WebSocket IPC Handshakes
┌─────────────────────────────────────────▼──────────────────────────────────────────────┐
│                               EXPRESS & SOCKET.IO SERVER                               │
│                         (src/class/Server.ts & src/controller/)                        │
├──────────────────────────────────────────┬─────────────────────────────────────────────┤
│         BATCH AUTOMATION ENGINES         │          STORE OPERATIONS ENGINES           │
│  • ProductUploader (Puppeteer + CDP)     │  • ShippingManager (GraphQL Direct)         │
│  • DeleteProduct (GraphQL Direct)        │  • OperasionalSchedule (GraphQL Direct)     │
│  • BulkUpdateProfilePhoto (Puppeteer)    │  • Holiday / Vacation Mode (GraphQL Direct) │
│  • Authenticator (otplib + SQLite)       │  • Slogan / Store Info (GraphQL Direct)     │
│                                          │  • LiveChat (Remote Node.js Relay)          │
│                                          │  • PublicMonitoring (External Cloud Relay)  │
└──────────────────┬───────────────────────┴─────────────────────────────┬───────────────┘
                   │                                                     │
                   ▼                                                     ▼
┌──────────────────────────────────────────┐         ┌───────────────────────────────────┐
│        LOCAL SQLITE & FILE SYSTEM        │         │      TOKOPEDIA SELLER PLATFORM     │
│  • asistenq-tiktok-data.db               │         │  • https://seller.tokopedia.com   │
│  • XLSX Templates / Output Folders       │         │  • https://gql.tokopedia.com      │
│  • Local User Image Collections          │         │  • Session Authentication Cookies │
└──────────────────────────────────────────┘         └───────────────────────────────────┘
```

### 1.2 Inter-Process Communication (IPC) & Real-time Sockets Architecture
The system utilizes a multiplexed Socket.IO architecture on port `2045` (default). When client components connect, the handshake authentication header (`socket.handshake.auth.from`) routes incoming sockets to dedicated module handlers:

| Handshake `from` Value | Backend Class Target | Primary Events Handled |
| :--- | :--- | :--- |
| `free_feature__product_uploader` | `ProductUploader` | `is-uploading`, `logs` |
| `free_feature__delete_product` | `DeleteProduct` | `start_delete_product`, `stop`, `eligible-data`, `is-running`, `logs` |
| `atur-foto-profil` | `BulkUpdateProfilePhoto` | `start`, `running-state`, `logs` |
| `operational_schedule` | `OperasionalSchedule` | `start`, `running-state`, `logs` |
| `holiday` | `Holiday` | `start`, `unset`, `running-state`, `logs` |
| `slogan` | `Slogan` | `start`, `running-state`, `logs` |
| `live_chat` | `LiveChat` | `live-chat-data` |
| Default / Root | `Monitoring`, `Account`, `Authenticator` | `free_feature_authenticator-data`, `get-free-feature-authenticator-data` |

Each class maintains an internal collection of active sockets (`public sockets: Socket[]`) and streams real-time log arrays (capped at 150 to 300 entries with Jakarta timestamp formatting `[D MMM HH:mm] - Source: Message`) directly to the UI.

### 1.3 Authentication & Session Propagation
Automated tasks rely on authenticated session cookies stored in the `account` table. The cookies are formatted dynamically depending on the execution target:
* **Puppeteer Automation**: Transformed to CDP-compatible cookie objects (`name`, `value`, `domain`, `path`, `expires = undefined`) and injected via `page.setCookie(...cookies)`.
* **Direct GraphQL Requests**: Serialized into raw HTTP cookie header strings (`cookie: name1=val1; name2=val2;`) alongside matching origin/referer headers.

### 1.4 Tokopedia GraphQL Endpoint Conventions & Headers
Direct API operations interface with `https://gql.tokopedia.com/graphql/<OperationName>`. Standard headers include:
```json
{
  "content-type": "application/json",
  "accept": "application/json",
  "origin": "https://seller.tokopedia.com",
  "referer": "https://seller.tokopedia.com/",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  "x-source": "tokopedia-lite",
  "x-tkpd-lite-service": "icarus",
  "x-version": "bf3d806",
  "cookie": "<raw_cookie_string>"
}
```

---

## 2. Batch Automation Tools

---

### 2.1 Mass Product Uploader (`ProductUploader.ts`)

#### 2.1.1 Purpose & Execution Modes
The `ProductUploader` engine automates bulk product publishing to Tokopedia Seller via official bulk upload XLSX spreadsheet templates. It operates in two modes:
1. **Single Account Upload (`upload`)**: User-configured upload targeting a single account, specifying max file limits and post-upload actions (`move` or `delete`).
2. **Autonomous Multi-Account Job (`uploadBulkForJob`)**: Automated sequence that scans all authenticated accounts, refreshes statistics, verifies product quota (`productCount <= 150`), downloads store-specific bulk templates via CDP, extracts Tokopedia's server-generated metadata (Workbook Subject property), rewrites local payload files with matching metadata, and submits the upload.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         PRODUCT UPLOADER AUTOMATION PIPELINE                           │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ Device & License Validation │
                            │     (device.registered)     │
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ Account & Directory Checks  │
                            │ (authenticated, path exists)│
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │  Launch Headless Chrome     │
                            │ (--incognito, CDP Session)  │
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ Inject Cookies & Navigate:  │
                            │   seller.tokopedia.com/     │
                            │        bulk/add             │
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ Remove UI Overlays & Modals │
                            │ (unf-overlay / limit modal) │
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ Loop *.xlsx Files in Folder │
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ Upload File via Input Field │
                            │   (input[type="file"])      │
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ Trigger Upload Button Click │
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ Wait for #progressbar_bulk  │
                            │   (Present -> Hidden)       │
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ Capture Server Message Text │
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ Post-Upload File Action     │
                            │ (Move to /UPLOADED/ | Del)  │
                            └─────────────────────────────┘
```

#### 2.1.2 Directory Expectations & File Structure
* **Source Folder**: Any local directory containing standard Tokopedia batch catalog files formatted as `.xlsx`.
* **Output Destination (`move` mode)**: Files are moved into a nested directory named `UPLOADED` within the source directory (auto-created if not present via `fs.mkdirSync(targetDir)`).
* **Output Destination (`delete` mode)**: Files are permanently unlinked via `fs.unlinkSync(fp)`.

#### 2.1.3 CDP Download Management & Bulk Template Subject Manipulation
Tokopedia enforces a template verification check on uploaded spreadsheets: each downloaded batch template contains a dynamic internal `Subject` metadata property tied to the store session. In `uploadBulkForJob`:
1. Creates a local download folder at `C:\download_bulk_upload`.
2. Connects to the Chrome DevTools Protocol session:
   ```typescript
   const client = await page.target().createCDPSession();
   await client.send('Page.setDownloadBehavior', {
     behavior: 'allow',
     downloadPath: downloadPath
   });
   ```
3. Intercepts the download response via `page.on('response')` matching `content-disposition: attachment; filename="..."`.
4. Uses `xlsx` (SheetJS) to inspect the downloaded template's metadata:
   ```typescript
   const workbook = xlsx.readFile(templateFile);
   const subject = workbook.Props.Subject;
   ```
5. Reads the user's product file, overwrites `workbook.Props.Subject = subject`, and writes the modified file back before uploading.

#### 2.1.4 Puppeteer Automation Selectors & Handlers
* **Overlay & Modal Cleanup**: Runs an automated 300ms polling loop to remove blocking DOM overlays:
  - `[data-unify="Overlay"][aria-label="unf-overlay"]`
  - `.css-1ajf22c.e1nc1fa20`
* **Cookie Consent**: Continuously monitors `#onetrust-accept-btn-handler:not(:disabled)` in a background worker and clicks upon appearance.
* **File Upload Elements**:
  - `input[type="file"]`: File input element for uploading `.xlsx`.
  - `#BulkUploadArea > div > div > div:nth-child(4) > button.css-1cpgquu-unf-btn.eg8apji0`: Submit upload button.
  - `#progressbar_bulk > svg`: Progress indicator SVG monitored until visibility transitions from visible to hidden.
  - `#BulkUploadArea > div > div > div.css-xlm6r2` & `div.css-1sdqwoi`: Success/error toast message containers.

#### 2.1.5 Cancellation & Abort Handling
Upload operations initialize an `AbortController`. Invoking `uploader.stop()` triggers `this.abortController.abort()`, which closes the controlled browser instance, resets `this.uploading = false`, and broadcasts the termination state via `socket.emit("is-uploading", false)`.

#### 2.1.6 REST API & Socket Specifications
* **`GET /freeFeature/productUploader/selectFolder`**
  - Triggers Electron `dialog.showOpenDialog` (`openDirectory`).
  - Persists selected path into `Setting` (`product_upload_dir`).
  - Returns `{ error: false, msg: null, data: "<selected_path>" }`.
* **`GET /freeFeature/productUploader/getCurrentSelectedFolder`**
  - Reads `product_upload_dir` from `Setting`.
  - Returns `{ error: false, data: "<current_path>" }`.
* **`POST /freeFeature/productUploader/getAccount`**
  - Request Body: `{ id: number }`
  - Returns account `{ id, name, email, avatar }` after verifying `authenticated == true`.
* **`POST /freeFeature/productUploader/upload`**
  - Request Body: `{ id: number, maxFile: number, afterUploaded: "move" | "delete", dirPath: string }`
  - Initiates asynchronous upload pipeline.
* **`POST /freeFeature/productUploader/stop`**
  - Immediately aborts running upload job.
* **Socket Events (`from: "free_feature__product_uploader"`)**:
  - Emits: `is-uploading` (`boolean`), `logs` (`string[]`).

---

### 2.2 Mass Product Deletion (`DeleteProduct.ts`)

#### 2.2.1 Purpose & Architecture
`DeleteProduct` provides high-speed automated catalog deletion for accounts with excess, dead, or non-performing inventory. It executes direct GraphQL mutations against Tokopedia backend APIs without needing a headless browser, achieving high execution throughput.

#### 2.2.2 Filtering & Sorting Capabilities
Products are paginated in batches of 20 via the `ProductList` query. The sorting and filtering criteria are configured by the user:

| Sort Name | `sortId` | `sortValue` | Behavior |
| :--- | :--- | :--- | :--- |
| Terakhir Diubah | `UPDATE_TIME` | `DESC` | Prunes recently modified listings |
| Terlaris | `SOLD` | `DESC` | Prunes top-selling items |
| Kurang Diminati | `SOLD` | `ASC` | Prunes items with low/zero historical sales |
| Harga Tertinggi | `PRICE` | `DESC` | Prunes highest priced items |
| Harga Terendah | `PRICE` | `ASC` | Prunes lowest priced items |
| Nama: A - Z | `NAME` | `ASC` | Alphabetical forward order |
| Nama: Z - A | `NAME` | `DESC` | Alphabetical reverse order |
| Stock Terbanyak | `STOCK` | `DESC` | Prunes high-stock surplus |
| Stock Tersedikit | `STOCK` | `ASC` | Prunes low/out-of-stock items |

**Special Filter (`notSold: true`)**: When activated, the engine strictly filters items where `product.txStats.sold === 0`. If a fetched page contains only sold items, the engine automatically terminates the job.

#### 2.2.3 Product Quota & Eligibility Tracking (`ProductAddRule`)
While deletion is in progress, the engine initiates a parallel 5-second polling loop executing `ProductAddRule` query:
```graphql
query ProductAddRule {
  ProductAddRule {
    header { reason messages errorCode }
    data {
      eligible {
        value
        totalProduct
        limit
        actionItems
        txThreshold
      }
    }
  }
}
```
The resulting `eligible` object (containing `totalProduct` and quota `limit`) is emitted live to the UI via `socket.emit("eligible-data", eligible)`.

#### 2.2.4 Batch Deletion Pipeline (`BulkProductEditV3`)
Products retrieved from `ProductList` are transformed into a bulk deletion mutation payload:
```graphql
mutation BulkProductEditV3($input: [ProductInputV3]!) {
  BulkProductEditV3(input: $input) {
    productID
    result {
      header { messages reason errorCode }
      isSuccess
    }
  }
}
```
Payload Structure:
```json
{
  "operationName": "BulkProductEditV3",
  "variables": {
    "input": [
      {
        "productID": "1122334455",
        "shop": { "id": "1234567" },
        "status": "DELETED"
      }
    ]
  }
}
```
When Axios receives HTTP 200, it appends success logs for each deleted product and continues the pagination loop until `products.length < 1` or `this.running === false`.

#### 2.2.5 REST API & Socket Specifications
* **`GET /freeFeature/deleteProduct/getAvailableAccounts?search=<term>`**
  - Searches accounts in `Monitoring.mainData` matching name or email (max 30 results).
  - Returns `[{ id, name, email, avatar }]`.
* **`POST /freeFeature/deleteProduct/getAccount`**
  - Request Body: `{ id: number }`
  - Returns `{ id, name, email, avatar }`.
* **Socket Events (`from: "free_feature__delete_product"`)**:
  - Receives: `start_delete_product` (`{ accountId, id, value, notSold }`), `stop`.
  - Emits: `is-running` (`boolean`), `eligible-data` (`object`), `logs` (`string[]`).

---

### 2.3 Mass Profile Photo Updater (`BulkUpdateProfilePhoto.ts`)

#### 2.3.1 Purpose & Execution Flow
`BulkUpdateProfilePhoto` automates the mass rotation of store profile pictures across multiple seller accounts using a local folder of JPG/PNG images.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     BULK UPDATE PROFILE PHOTO EXECUTION FLOW                           │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ Select Local Images Folder  │
                            │   (*.jpg, *.png detection)  │
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ Generate Random Mapping:    │
                            │ Account ID <-> Target Image │
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ Launch Headless Chrome      │
                            │   (bulkUpdateProfilePhoto)  │
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ For each selected account:  │
                            │  1. Clear Browser Data      │
                            │  2. Inject Account Cookies  │
                            │  3. Navigate:               │
                            │     /settings/info          │
                            │  4. Upload File via Input   │
                            │  5. Wait for Toast Notice   │
                            │     ([data-unify="Toaster"])│
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ Close Browser & Emit Finish │
                            └─────────────────────────────┘
```

#### 2.3.2 Image Mapping & Randomization
1. Scans `folder` using `fs.readdirSync`. Filters for files ending in `jpg` or `png`.
2. Validates that at least 1 image file exists.
3. For each targeted account ID, generates a mapping payload:
   ```typescript
   {
     name: acc.name,
     email: acc.email,
     avatar: {
       current: acc.avatar,
       target: files[Math.floor(Math.random() * files.length)]
     }
   }
   ```

#### 2.3.3 Puppeteer Orchestration
* **Browser Session Isolation**: For every account iteration, `this.browser.clearData(page)` is called to clear cookies, storage, and cache before injecting the next account's cookies.
* **Navigation Target**: `https://seller.tokopedia.com/settings/info`.
* **Upload Element**: `input[type="file"]`. Target image path is injected via `fileInput.uploadFile(targetPath)`.
* **Success Toast Verification**: Waits for selector `[data-unify="Toaster"]` with `{ timeout: 0, visible: true }` and extracts `textContent` for logging.

#### 2.3.4 REST API & Socket Specifications
* **`GET /freeFeature/ubahFotoProfil/selectFolder`**
  - Opens system folder picker dialog. Returns `{ error: false, data: "<folder_path>" }`.
* **`POST /freeFeature/ubahFotoProfil/listData`**
  - Request Body: `{ selectedIds: number[], folder: string }`
  - Returns generated avatar preview mappings `{ name, email, avatar: { current, target } }[]`.
* **Socket Events (`from: "atur-foto-profil"`)**:
  - Receives: `start` (`{ selectedIds: number[], folder: string }`).
  - Emits: `running-state` (`boolean`), `logs` (`string[]`).

---

### 2.4 Authenticator Tool (`Authenticator.ts`)

#### 2.4.1 Purpose & 2FA Lifecycle
The `Authenticator` module provides a centralized Two-Factor Authentication (TOTP) management vault built into AsistenQ. It generates real-time 6-digit verification codes required for Tokopedia logins, automated browser sessions, and manual operator access.

#### 2.4.2 SQLite Database Schema (`free_feature_authenticator`)
The data table is initialized by `Authenticator.initDb()`:
```sql
CREATE TABLE IF NOT EXISTS free_feature_authenticator (
    id INT PRIMARY KEY,
    label VARCHAR(255),
    secret VARCHAR(255),
    email VARCHAR(255),
    added BIGINT
);
```

#### 2.4.3 Data Model & Sanitization Rules
* **`id`**: Numeric autoincrement calculated via `SELECT MAX(id) + 1`.
* **`label`**: Account name or custom identifier (sanitized to remove quotes, minimum 3 chars).
* **`email`**: Account login email (sanitized, minimum 3 chars).
* **`secret`**: Base32 RFC 6238 TOTP secret string. Stripped of quotes, whitespace, and non-alphanumeric noise.
* **`added`**: Timestamp epoch in milliseconds.
* **`otp`**: Dynamic property generated in memory via `otplib.authenticator.generate(secret)`. Returns `null` if secret is invalid.

#### 2.4.4 Account Secret Synchronization (`sync`)
The `sync()` method scans all accounts in the `account` SQLite table. For every account where `useAuthenticator === true` and `secretAutenticator` is non-empty, it adds an entry into `free_feature_authenticator` without raising duplication errors.

#### 2.4.5 Background Runtime & Socket Broadcast
Upon initialization, `Authenticator.runtime()` executes an infinite 5-second polling loop (`setTimeout(r, 5000)`). On each cycle:
1. Re-calculates OTPs for all records in `this.mainData`.
2. Emits the updated dataset via `socket.emit("free_feature_authenticator-data", this.mainData)` to all active client sockets.

#### 2.4.6 REST API & Socket Specifications
* **`GET /freeFeature/authenticator/sync`**
  - Triggers synchronization between `account` table secrets and authenticator vault.
* **`POST /freeFeature/authenticator/add`**
  - Request Body: `{ label: string, email: string, authenticator: string }`
  - Validates constraints and inserts new TOTP secret.
* **`POST /freeFeature/authenticator/update`**
  - Request Body: `{ id: number, label: string, email: string, secret: string }`
  - Updates existing record in SQLite and refreshes memory state.
* **`POST /freeFeature/authenticator/remove`**
  - Request Body: `{ ids: number[] }`
  - Deletes records matching the specified IDs from database and memory.
* **Socket Events (Default / Root Socket Connection)**:
  - Receives: `get-free-feature-authenticator-data`.
  - Emits: `free_feature_authenticator-data` (`StructAuthenticator[]`).

---

## 3. Store Operations & Management

---

### 3.1 Shipping Logistics Manager (`ShippingManager.ts`)

#### 3.1.1 Purpose & Logistics Architecture
Tokopedia stores manage logistical shipping providers through on-demand pickup and conventional drop-off courier configurations. `ShippingManager` provides automated courier discovery and simultaneous mass activation/deactivation across any number of managed stores.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SHIPPING MANAGER LOGISTICS ARCHITECTURE                         │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ 1. Courier Discovery        │
                            │    (ongkirShippingEditor)   │
                            │ Extracts available couriers │
                            │   & shipper_product_id list │
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ 2. Operator Selection in UI │
                            │    (Di-pickup vs Drop-off)  │
                            │ Selects active shipper IDs  │
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ 3. Mass Mutation Loop       │
                            │ (OngkirShippingEditorSave)  │
                            │ Iterates all selected shops │
                            │ and applies activated_sp_id │
                            └─────────────────────────────┘
```

#### 3.1.2 Courier Provider Discovery (`ongkirShippingEditor`)
`ShippingManager.getShippers()` queries `https://gql.tokopedia.com/graphql/ongkirShippingEditor` using the cookies and `shopid` of the first available authenticated account:
```graphql
query ongkirShippingEditor($shop_id: Int!) {
  ongkirShippingEditor(input: {shop_id: $shop_id}) {
    status
    message
    data {
      shippers {
        ondemand {
          shipper_id
          shipper_name
          is_active
          is_whitelabel
          text_promo
          image
          feature_info { header body }
          shipper_product {
            shipper_product_id
            shipper_product_name
            shipper_product_desc
            is_active
          }
        }
        conventional {
          shipper_id
          shipper_name
          is_active
          is_whitelabel
          text_promo
          image
          feature_info { header body }
          shipper_product {
            shipper_product_id
            shipper_product_name
            shipper_product_desc
            is_active
          }
        }
      }
    }
  }
}
```

#### 3.1.3 Supported Logistics Providers
The discovery response partitions couriers into two logistical models:
1. **On-Demand (Di-pickup kurir)**: Picked up from seller warehouse/store address.
   - GoSend (Instant, Same Day)
   - GrabExpress (Instant, Same Day)
   - Anteraja (Regular, Next Day)
   - SiCepat (Pick Up)
   - J&T Express (Pick Up)
   - Ninja Xpress (Pick Up)
   - JNE (Pick Up)
2. **Conventional (Drop off ke gerai)**: Dropped off by seller at carrier outlet.
   - JNE (Reguler, YES, OKE)
   - TIKI (Reguler, ONS)
   - Pos Indonesia (Pos Kilat Khusus)
   - Wahana Prestasi Logistik
   - SiCepat (Drop Off)
   - J&T (Drop Off)

#### 3.1.4 Batch Courier Synchronization (`OngkirShippingEditorSave`)
`applyActiveShippers(accountIds, activedIds)` iterates through all designated `accountIds`, retrieving each account's session cookies and `shopid`, and executing:
```graphql
mutation OngkirShippingEditorSave($input: OngkirShippingEditorSaveInput!) {
  ongkirShippingEditorSave(input: $input) {
    status
    message
    data {
      message
      is_success
    }
    errors { id status title }
  }
}
```
Payload Structure:
```json
{
  "operationName": "OngkirShippingEditorSave",
  "variables": {
    "input": {
      "shop_id": "12345678",
      "activated_sp_id": "1,2,6,10,14,18,22",
      "feature_id": ""
    }
  }
}
```
Execution results and timestamps are stored in `ShippingManager.logs` and printed to console.

#### 3.1.5 REST API Specifications
* **`GET /freeFeature/shippingManager/getShippers`**
  - Discovers ondemand and conventional shipper structures.
  - Returns `{ error: false, msg: null, data: { ondemand: [...], conventional: [...] } }`.
* **`POST /freeFeature/shippingManager/applyActivateShippers`**
  - Request Body: `{ accountIds: number[], activeIds: number[] }`
  - Synchronizes shipper IDs across all targeted accounts.
* **`GET /freeFeature/shippingManager/logs`**
  - Returns `string[]` execution logs.

---

### 3.2 Store Operational Schedule (`OperasionalSchedule.ts`)

#### 3.2.1 Purpose & Schedule Configuration
`OperationalSchedule` allows operators to configure and mass-deploy weekly store business hours across multiple Tokopedia seller accounts.

#### 3.2.2 Weekly Time Window Model
The schedule configuration accepts 7 day definitions (Day index 1 = Monday to 7 = Sunday):
* **Buka 24 Jam**: `status: 1`, `selectedOpeningHourFormat: "00:00:00"`, `closingTime: "23:59:59"`.
* **Pilih Jam (Custom)**: `status: 1`, `selectedOpeningHourFormat: "HH:mm:00"`, `closingTime: "HH:mm:00"`.
* **Libur Rutin (Toko Tutup)**: `status: 0`, `selectedOpeningHourFormat: "00:00:00"`, `closingTime: "00:00:00"`.

#### 3.2.3 Batch Mutation Pipeline (`SetShopOperationalHours`)
Iterates through all targeted `accountIds`, sending:
```graphql
mutation SetShopOperationalHours($input: ParamSetShopOperationalHours!) {
  setShopOperationalHours(input: $input) {
    success
    message
    createdId
  }
}
```
Payload Structure:
```json
{
  "operationName": "SetShopOperationalHours",
  "variables": {
    "input": {
      "shopID": "12345678",
      "type": 1,
      "params": [
        { "day": 1, "status": 1, "startTime": "08:00:00", "endTime": "21:00:00" },
        { "day": 2, "status": 1, "startTime": "08:00:00", "endTime": "21:00:00" },
        { "day": 3, "status": 1, "startTime": "08:00:00", "endTime": "21:00:00" },
        { "day": 4, "status": 1, "startTime": "08:00:00", "endTime": "21:00:00" },
        { "day": 5, "status": 1, "startTime": "08:00:00", "endTime": "21:00:00" },
        { "day": 6, "status": 1, "startTime": "09:00:00", "endTime": "18:00:00" },
        { "day": 7, "status": 0, "startTime": "00:00:00", "endTime": "00:00:00" }
      ]
    }
  }
}
```

#### 3.2.4 Account Filtering & Group Targeting
The `accounts(search, group)` method searches `Monitoring.mainData` by store name, email, or group tags, filtering by assigned account groups (`group !== "all"`).

#### 3.2.5 REST API & Socket Specifications
* **`GET /operationalSchedule/accounts`**
* **`GET /operationalSchedule/accounts/:search`**
* **`GET /operationalSchedule/accounts/:search/:group`**
  - Returns `{ error: false, msg: null, data: { accounts: [...] } }`.
* **Socket Events (`from: "operational_schedule"`)**:
  - Receives: `start` (`{ selectedIds: number[], days: object[] }`).
  - Emits: `running-state` (`boolean`), `logs` (`string[]`).

---

### 3.3 Store Holiday / Vacation Mode (`Holiday.ts`)

#### 3.3.1 Purpose & Vacation Scheduling
`Holiday` automates temporary store closure (Vacation Mode) during national holidays, inventory stocktaking, or emergency maintenance periods. It supports scheduled date ranges and instant reactivation.

#### 3.3.2 Time Formatting & Epoch Calculations
Dates are accepted in `DD-MM-YYYY` format and normalized to Asia/Jakarta timezone timestamps ending at `23:59:59`:
```typescript
const closeStart = moment(range.from, "DD-MM-YYYY").tz("Asia/Jakarta");
const closeEnd = moment(range.to, "DD-MM-YYYY").tz("Asia/Jakarta");

closeStart.set("h", 23).set("minute", 59).set("second", 59);
closeEnd.set("h", 23).set("minute", 59).set("second", 59);

const startUnix = closeStart.unix().toString();
const endUnix = closeEnd.unix().toString();
```

#### 3.3.3 Set Closure vs Unset / Reactivation
The GraphQL mutation `CloseShopSchedule` handles both setting holiday schedules and clearing them:
```graphql
mutation CloseShopSchedule($input: CloseShop!) {
  closeShopSchedule(input: $input) {
    success
    message
  }
}
```

* **Setting Vacation Mode (`action: 0`)**:
  ```json
  {
    "input": {
      "action": 0,
      "closeNote": "",
      "closeStart": "1719766799",
      "closeEnd": "1720198799"
    }
  }
  ```
* **Unsetting / Re-opening Store (`action: 2`)**:
  ```json
  {
    "input": {
      "action": 2,
      "closeNote": "",
      "closeStart": "",
      "closeEnd": ""
    }
  }
  ```

#### 3.3.4 REST API & Socket Specifications
* **`GET /holiday/accounts`**, `GET /holiday/accounts/:search`, `GET /holiday/accounts/:search/:group`
  - Returns filtered operational accounts.
* **Socket Events (`from: "holiday"`)**:
  - Receives: `start` (`{ selectedIds: number[], range: { from, to } }`), `unset` (`{ selectedIds: number[] }`).
  - Emits: `running-state` (`boolean`), `logs` (`string[]`).

---

### 3.4 Store Slogan & Announcement Engine (`Slogan.ts`)

#### 3.4.1 Purpose & Tagline Rotation
`Slogan` allows multi-store operators to update store taglines and description announcements en masse, applying randomized variations to make managed stores appear distinct and organic.

#### 3.4.2 Storage Schema in `Setting`
Tagline and description lists are stored as Base64-encoded JSON strings in the SQLite `setting` table:
* Key `slogans`: `btoa(JSON.stringify(["Slogan 1", "Slogan 2", ...]))`
* Key `descriptions`: `btoa(JSON.stringify(["Store notice 1", "Store notice 2", ...]))`

#### 3.4.3 Mutation Execution (`UpdateShopInfo`)
During execution (`slogan.start(ids)`), the engine iterates through targeted accounts, selects random entries from the configured slogans and descriptions pools:
```typescript
const description = descriptions.length < 1 ? "" : descriptions[Math.floor(Math.random() * descriptions.length)];
const slogan = slogans.length < 1 ? "" : slogans[Math.floor(Math.random() * slogans.length)];
```
And executes:
```graphql
mutation UpdateShopInfo($input: UpdateShopInfoParam!) {
  updateShopInfo(input: $input) {
    success
    message
  }
}
```
Payload Structure:
```json
{
  "operationName": "UpdateShopInfo",
  "variables": {
    "input": {
      "tagline": "Pusat Grosir & Eceran Termurah",
      "description": "Pengiriman setiap hari kerja. Pesanan sebelum 15:00 dikirim hari yang sama."
    }
  }
}
```

#### 3.4.4 REST API & Socket Specifications
* **`GET /slogan/detail`**
  - Returns parsed `{ slogans: string[], descriptions: string[] }`.
* **`POST /free-feature/slogan/update?name=slogans|descriptions`**
  - Request Body: `{ values: string[] }`
  - Persists new string lists to `Setting`.
* **`GET /slogan/accounts`**, `GET /slogan/accounts/:search`, `GET /slogan/accounts/:search/:group`
  - Account list queries.
* **Socket Events (`from: "slogan"`)**:
  - Receives: `start` (`{ selectedIds: number[] }`).
  - Emits: `running-state` (`boolean`), `logs` (`string[]`).

---

### 3.5 Internal Collaboration & Live Chat System (`LiveChat.ts`)

#### 3.5.1 Architecture & Topology
The Live Chat collaboration system enables real-time inter-operator messaging across team members using AsistenQ. It combines local Electron activation state controls with a dedicated external Node.js/Socket.IO communication server (`https://srv-ziqlabs-1.my.id/live-chat`).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        LIVE CHAT COLLABORATION ARCHITECTURE                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ Local Electron State        │
                            │ (LiveChat.ts & Express API) │
                            │ setting: live_chat_enabled  │
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ Remote Chat Socket Client   │
                            │   (utils/liveChat/Socket.js)│
                            │ Connects to srv-ziqlabs-1   │
                            │ with machineId & userId auth│
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ REST / Socket Relays        │
                            │ • getUser / updateName      │
                            │ • getLastChat / loadOldChat │
                            │ • postMessage (FormData)    │
                            │ • online-users roster       │
                            │ • typing-users indicators   │
                            └─────────────────────────────┘
```

#### 3.5.2 Remote Connection & Authentication Handshake
Clients connect to the remote chat server with authentication credentials:
```javascript
this.socket = io("https://srv-ziqlabs-1.my.id/live-chat", {
  transports: ['websocket', 'polling', 'flashsocket'],
  withCredentials: true,
  auth: {
    machineId: machineId,
    userId: userId
  },
  secure: false
});
```

#### 3.5.3 Remote Socket Events Reference
* **Connection Lifecycle**: `connect`, `disconnect`.
* **`user-update`**: Emitted when user profile details (avatar, name) are modified.
* **`new-chat`**: Emitted when a new message arrives in the room. Triggers OS notifications via `notification.show({ from: "live_chat-new-message" })`.
* **`online-users`**: Emitted with the list of currently active operator identities.
* **`typing-users`**: Emitted with user IDs currently typing.
* **`set-typing-state`** (Client -> Server): Broadcasts typing indicator state (`true`/`false`).
* **`set-currently-opening-chat`** (Client -> Server): Updates whether the chat popup is active on screen.

#### 3.5.4 Message History & Attachment Upload Protocol
* **`getUser(machineID)`**: `GET https://srv-ziqlabs-1.my.id/user/get?machineId=<id>`.
* **`getLastChat()`**: `GET https://srv-ziqlabs-1.my.id/chat/getLastChat`.
* **`loadOldChat({ beforeChatId })`**: `POST https://srv-ziqlabs-1.my.id/chat/loadOldChat`.
* **`postMessage({ text, attachment, senderId })`**: `POST https://srv-ziqlabs-1.my.id/chat/post` using `multipart/form-data` with optional image/file attachments.

#### 3.5.5 Local Activation REST API
* **`GET /liveChat/isActive`**: Returns `{ error: false, data: boolean }`.
* **`POST /liveChat/setActive`**: Request Body: `{ state: boolean }`. Updates `live_chat_enabled` setting and emits `live-chat-data` to local UI.

---

### 3.6 Public Monitoring Cloud Relay (`PublicMonitoring.ts`)

#### 3.6.1 Purpose & Dashboard Sharing
`PublicMonitoring` provides a secure, read-only remote dashboard hosted at `https://asmon.ziqva.com`. It allows store owners, warehouse managers, and external partners to track sales, unread chats, packaging queues, complaints, and moderation alerts in real time without granting access to the desktop application or seller account credentials.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PUBLIC MONITORING CLOUD RELAY PIPELINE                          │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ Monitoring.ts Execution     │
                            │ (Runs account scan cycle)   │
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ Cadence Gate (Every 3 loops)│
                            │ if (i >= 3) record()        │
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ Aggregate Store Metrics     │
                            │ (orders, chats, packings,   │
                            │  shippings, complaints)     │
                            └──────────────┬──────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────┐
                            │ HTTP POST to Cloud Backend  │
                            │ asmon.ziqva.com/backend/    │
                            │            record           │
                            └─────────────────────────────┘
```

#### 3.6.2 Cloud Gateway & Machine ID Registration
* **Cloud Gateway URL**: `https://asmon.ziqva.com`.
* **Initialization (`init()`)**: Sends `POST https://asmon.ziqva.com/backend/init` with payload `{ machineId: device.getMachineId() }`.
* **Activity State (`isActive()`)**: Queries `POST https://asmon.ziqva.com/backend/isActive`.
* **Toggle Activity (`activeToggle()`)**: Sends `POST https://asmon.ziqva.com/backend/activeToggle`.
* **Alias Management (`getAlias()` / `changeAlias(alias)`)**: Sets an obfuscated public identifier for the dashboard URL instead of exposing raw hardware IDs.

#### 3.6.3 Aggregated Metrics Payload Schema
When active, `record()` constructs a comprehensive snapshot across all group-filtered accounts:
```typescript
interface PublicRecordPayload {
  numbers: {
    chat: number;
    discus: number;
    order: number;
    processing: number;
    shipping: number;
    complaint: number;
    active: number;
    hasBalanced: number;
    moderated: number;
    logout: number;
    accounts: number;
  };
  orders: {
    name: string;
    email: string;
    avatar: string;
    count: number;
    deadline: number;
    potency: number;
    groups: string[];
  }[];
  discuses: any[];
  processes: {
    name: string;
    email: string;
    avatar: string;
    count: number;
    deadline: number;
    potency: number;
    groups: string[];
  }[];
  shippings: {
    name: string;
    email: string;
    avatar: string;
    count: number;
    potency: number;
    groups: string[];
  }[];
  moderateds: {
    name: string;
    email: string;
    avatar: string;
    groups: string[];
  }[];
  hasSaldo: {
    name: string;
    email: string;
    avatar: string;
    saldo: number;
    groups: string[];
  }[];
  complaints: {
    name: string;
    email: string;
    avatar: string;
    count: number;
    potency: number;
    groups: string[];
  }[];
  logouts: {
    name: string;
    email: string;
    avatar: string;
    groups: string[];
  }[];
  chats: {
    name: string;
    email: string;
    avatar: string;
    count: number;
    epoch: number;
    groups: string[];
  }[];
  machineId: string;
  totalBalance: number;
}
```

#### 3.6.4 Monitoring Integration & Cadence
In `src/class/Monitoring.ts`, `record()` is triggered automatically every 3 monitoring cycles (`if (i >= 3) { i = 0; await this.publicMonitoring.record(); }`).

#### 3.6.5 Notification Relay (`push`)
`PublicMonitoring.push(msg)` sends high-priority administrative notifications to the cloud endpoint `https://asmon.ziqva.com/notification/push` with `{ message: msg, machineId: device.getMachineId() }`.

#### 3.6.6 REST API Specifications
* **`GET /public-monitoring/alias`**: Returns `{ error: false, msg: null, data: { alias: string } }`.
* **`GET /public-monitoring/active`**: Returns `{ error: false, msg: null, data: { active: boolean } }`.
* **`POST /public-monitoring/activeToggle`**: Toggles cloud sharing on/off.
* **`POST /public-monitoring/changeAlias`**: Request Body: `{ alias: string }`. Updates cloud alias.

---

## 4. Complete REST API & WebSocket Reference Matrix

### 4.1 Summary of HTTP REST Endpoints

| Method | Route Path | Controller Function | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/freeFeature/productUploader/selectFolder` | `productUploader.selectFolder` | Open folder selection dialog for upload files |
| `GET` | `/freeFeature/productUploader/getCurrentSelectedFolder` | `productUploader.getCurrentSelectedFolder` | Read saved product upload folder |
| `POST` | `/freeFeature/productUploader/getAccount` | `productUploader.getAccount` | Validate and retrieve uploader account |
| `POST` | `/freeFeature/productUploader/upload` | `productUploader.upload` | Start product upload process |
| `POST` | `/freeFeature/productUploader/stop` | `productUploader.stop` | Abort running product uploader |
| `GET` | `/freeFeature/deleteProduct/getAvailableAccounts` | `deleteProduct.getAvailableAccounts` | Search accounts available for product deletion |
| `POST` | `/freeFeature/deleteProduct/getAccount` | `deleteProduct.getAccount` | Get delete product account details |
| `GET` | `/freeFeature/ubahFotoProfil/selectFolder` | `ubahFotoProfil.selectFolder` | Open folder selection dialog for profile images |
| `POST` | `/freeFeature/ubahFotoProfil/listData` | `ubahFotoProfil.listData` | Generate account-to-image preview list |
| `GET` | `/freeFeature/authenticator/sync` | `authenticator.sync` | Synchronize TOTP secrets from `account` table |
| `POST` | `/freeFeature/authenticator/add` | `authenticator.add` | Add new 2FA secret |
| `POST` | `/freeFeature/authenticator/update` | `authenticator.update` | Update existing 2FA secret |
| `POST` | `/freeFeature/authenticator/remove` | `authenticator.remove` | Remove 2FA secrets by IDs |
| `GET` | `/freeFeature/shippingManager/getShippers` | `shippingManager.getShippers` | Fetch ondemand and conventional couriers |
| `POST` | `/freeFeature/shippingManager/applyActivateShippers` | `shippingManager.applyActivateShippers` | Apply active couriers to selected accounts |
| `GET` | `/freeFeature/shippingManager/logs` | `shippingManager.logs` | Get shipping manager logs |
| `GET` | `/operationalSchedule/accounts[/:search[/:group]]` | `operationalSchedule.accounts` | Search and filter accounts for schedule setup |
| `GET` | `/holiday/accounts[/:search[/:group]]` | `holiday.accounts` | Search and filter accounts for holiday setup |
| `GET` | `/slogan/accounts[/:search[/:group]]` | `slogan.accounts` | Search and filter accounts for slogan setup |
| `GET` | `/slogan/detail` | `slogan.detail` | Retrieve configured slogans and descriptions |
| `POST` | `/free-feature/slogan/update` | `slogan.update` | Update slogan/description pool in settings |
| `GET` | `/liveChat/isActive` | `liveChat.isActive` | Get local live chat enabled status |
| `POST` | `/liveChat/setActive` | `liveChat.setActive` | Toggle local live chat enabled status |
| `GET` | `/public-monitoring/alias` | `publicMonitoring.alias` | Get public monitoring dashboard alias |
| `GET` | `/public-monitoring/active` | `publicMonitoring.active` | Check public monitoring active status |
| `POST` | `/public-monitoring/activeToggle` | `publicMonitoring.activeToggle` | Toggle public monitoring active status |
| `POST` | `/public-monitoring/changeAlias` | `publicMonitoring.changeAlias` | Change public monitoring alias name |

### 4.2 Summary of WebSocket Events

| Handshake `auth.from` | Event Name | Direction | Payload Structure / Description |
| :--- | :--- | :--- | :--- |
| `free_feature__product_uploader` | `is-uploading` | Server -> Client | `boolean` |
| `free_feature__product_uploader` | `logs` | Server -> Client | `string[]` |
| `free_feature__delete_product` | `start_delete_product` | Client -> Server | `{ accountId: number, id: string, value: string, notSold: boolean }` |
| `free_feature__delete_product` | `stop` | Client -> Server | `void` |
| `free_feature__delete_product` | `eligible-data` | Server -> Client | `{ value, totalProduct, limit, actionItems, txThreshold }` |
| `free_feature__delete_product` | `is-running` | Server -> Client | `boolean` |
| `free_feature__delete_product` | `logs` | Server -> Client | `string[]` |
| `atur-foto-profil` | `start` | Client -> Server | `{ selectedIds: number[], folder: string }` |
| `atur-foto-profil` | `running-state` | Server -> Client | `boolean` |
| `atur-foto-profil` | `logs` | Server -> Client | `string[]` |
| `operational_schedule` | `start` | Client -> Server | `{ selectedIds: number[], days: Array<{ day, status, startTime, endTime }> }` |
| `operational_schedule` | `running-state` | Server -> Client | `boolean` |
| `operational_schedule` | `logs` | Server -> Client | `string[]` |
| `holiday` | `start` | Client -> Server | `{ selectedIds: number[], range: { from: string, to: string } }` |
| `holiday` | `unset` | Client -> Server | `{ selectedIds: number[] }` |
| `holiday` | `running-state` | Server -> Client | `boolean` |
| `holiday` | `logs` | Server -> Client | `string[]` |
| `slogan` | `start` | Client -> Server | `{ selectedIds: number[] }` |
| `slogan` | `running-state` | Server -> Client | `boolean` |
| `slogan` | `logs` | Server -> Client | `string[]` |
| `live_chat` | `live-chat-data` | Server -> Client | `{ isActive: boolean }` |
| Default / Root | `free_feature_authenticator-data` | Server -> Client | `Array<{ id, label, secret, email, added, otp }>` |
| Default / Root | `get-free-feature-authenticator-data` | Client -> Server | `void` |

---

## 5. Error Handling, Reliability & Security Patterns

1. **Hardware & License Verification**: High-risk automation features (`ProductUploader.upload`, `DeleteProduct.start`) enforce strict device registration checks (`if (!this.device.registered) throw new Error("Access denied");`).
2. **Account Authentication Guarding**: Every operation verifies `account.authenticated === true` and ensures non-empty session cookies before initiating HTTP or browser automation pipelines.
3. **Puppeteer Navigation Safeguards**: Browser-based workers utilize incognito isolation, explicit timeout constraints, and automated DOM cleanup intervals to prevent memory leaks and unhandled promise rejections caused by third-party overlays or modal popups.
4. **Log Retention & Memory Bounding**: All runtime log arrays (`this.logs`) enforce fixed buffer sizes (between 150 and 300 entries) using `.splice()` / `.shift()` to prevent memory exhaustion during long-running batch jobs.
5. **GraphQL Error Parsing**: GraphQL mutation handlers parse the response header data structure (`data[0].data.<mutationName>.success === false`) and extract localized error messages to accurately report failures back to the user interface.
6. **Graceful Cancellation**: Long-running automation tasks implement state flags (`this.running = false`) and `AbortController` signals to guarantee prompt termination upon user cancellation.
