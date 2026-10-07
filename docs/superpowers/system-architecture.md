# AsistenQ TikTok System Architecture Documentation

## 1. Application Purpose & Value Proposition

### 1.1 Executive Overview
**AsistenQ TikTok** is an enterprise-grade desktop automation and multi-account operations platform designed specifically for TikTok Shop sellers and e-commerce aggregators. It centralizes operational monitoring, inventory syncing, order tracking, batch maintenance, authentication, and live chat management across dozens or hundreds of TikTok Shop merchant accounts within a unified, high-performance desktop interface.

### 1.2 Core Business Problems Solved
- **Multi-Account Fragmentation**: Managing numerous TikTok Shop stores typically forces operators to switch between multiple browser profiles, incognito windows, or distinct virtual machines, leading to high operational friction, session expiration, and slow response times.
- **Real-Time Order & Notification Tracking**: Sellers need instant visibility into unread buyer chats, pending orders ("Dikemas"), in-transit orders ("Dikirim"), customer complaints, account health penalties, and shop balance fluctuations without manual tab-polling.
- **Mass Administrative Operations**: Bulk tasks such as updating profile photos, managing operational/holiday schedules, mass store slogans, batch product deletions, and automated product catalog uploads require high labor overhead when done manually.
- **Session & 2FA Management**: Frequent TikTok Shop re-authentications demand seamless cookie persistence, automated TOTP/2FA code generation, and isolated browser profile handling.

### 1.3 Key Value Pillars
1. **Centralized Real-Time Dashboard**: Single-pane-of-glass monitoring of order metrics, revenue/potency tracking, balance totals, moderation status, and chat alerts with customizable columns and real-time Socket.IO synchronization.
2. **Built-in Automation Engines**: Background job runners for batch product uploads, mass profile photo customization, bulk shipping provider configurations, holiday auto-responders, and scheduled shop hours.
3. **Integrated Stealth Browser**: Chromium automation powered by `puppeteer-extra-plugin-stealth` with automatic Chrome Web Store CRX extension injection, user-agent spoofing, fingerprint evasion, and isolated session workspaces.
4. **Desktop Ergonomics & Security**: Native Windows & macOS desktop experience with customizable audio alerts, floating notification toasts, low-overhead SQLite local storage, and hardware-bound license validation.

---

## 2. High-Level Architecture Overview

The system employs a hybrid decoupled architecture consisting of an **Electron Native Process Model**, an embedded **Express & Socket.IO HTTP/WebSocket Server** on port `9184`, a local **SQLite Persistence Engine**, and a headless/headful **Puppeteer-Extra Stealth Browser Automation Suite**.

```
+---------------------------------------------------------------------------------------+
|                                    Electron Shell                                     |
|                                                                                       |
|  +-------------------------------------+     IPC / HTTP     +----------------------+  |
|  |           Renderer Process          |<==================>|     Main Process     |  |
|  |      (React 18 / MUI / AntD UI)     |   (port 9184 / WS) |   (src/index.ts)     |  |
|  +-------------------------------------+                    +----------+-----------+  |
|                     |                                                  |              |
+---------------------|--------------------------------------------------|--------------+
                      |                                                  |
                      v                                                  v
     +----------------------------------+             +----------------------------------+
     |     Embedded Express Server      |             |     Puppeteer Stealth Engine     |
     |         (src/class/Server.ts)    |             |       (src/class/Browser.ts)     |
     |  - REST Endpoints (Port 9184)    |             |  - Chrome Profile Isolation      |
     |  - Socket.IO Real-time Events    |             |  - Stealth Anti-Detection        |
     |  - Static Frontend Bundle Server |             |  - CRX Extension Management      |
     +-----------------+----------------+             +------------------+---------------+
                       |                                                 |
                       +------------------------+------------------------+
                                                |
                                                v
                              +----------------------------------+
                              |      Local Persistence Layer     |
                              |  - SQLite (asistenq-tiktok-data) |
                              |  - Memory JSON Data Cache        |
                              |  - Chrome Profile Stores         |
                              +----------------------------------+
```

---

## 3. Process Model & Lifecycle

### 3.1 Electron Main Process (`src/index.ts`)
The Main Process serves as the orchestration backbone and runtime host:
- **Environment Bootstrap**: Initializes ESM polyfills via `fixesm.register()`, loads environment variables via `dotenv.config()`, and configures Electron command-line performance flags.
- **Hardware Acceleration & Security Flags**:
  - Web security relaxation for multi-domain shop API access: `--disable-web-security`, `--no-sandbox`, `--disable-setuid-sandbox`.
  - Resource conservation: `--disable-gpu`, `--disable-gpu-vsync`, `--disable-dev-shm-usage`, `--disable-http-cache`, `--disable-http2`.
- **Window Management**:
  - Instantiates the primary `BrowserWindow` (1100x600 minimum size, framed, custom title with versioning).
  - Enforces continuous window dimension constraints across any spawned child windows via an asynchronous supervisory loop.
  - Removes default OS menus (`window.setMenu(null)`).
- **Network & Request Interception**:
  - Hooks `session.defaultSession.webRequest.onBeforeSendHeaders` for target domains to inject standard desktop browser headers and spoof `User-Agent`.
- **Auto-Updater Integration**:
  - Interfaces with `electron-updater` via an HTTP feed (`http://45.76.183.58/asistenq-tiktok-update/`).
  - Checks for updates, downloads releases in the background, and prompts user confirmation for installation via `dialog.showMessageBoxSync`.

### 3.2 Renderer Process & Frontend Host
- **React Frontend**: Built using React 18, React Router v6, Material-UI (MUI), Ant Design, and Styled Components (packaged in `frontend-app/build` and served directly through Express at `http://localhost:9184/` or local dev port `3000`).
- **Preload Bridge (`src/preload.ts`)**: Exposes environment runtime versions (`chrome`, `node`, `electron`) and standard desktop bindings into the DOM.
- **Hybrid Communication**: Rather than relying exclusively on Electron IPC (`ipcRenderer`/`ipcMain`), the UI interacts with core subsystems via standard HTTP REST requests and Socket.IO bidirectional channels against the embedded Express server.

---

## 4. Internal Server Architecture (`src/class/Server.ts`)

The embedded Node.js HTTP/WebSocket server abstracts backend operations into structured REST APIs and push notifications.

```
                  +-------------------------------------------------+
                  |          Express Server (Port 9184)             |
                  +-------------------------------------------------+
                  |  Middleware: CORS, BodyParser, Multer In-Memory |
                  +-------------------------------------------------+
                                           |
      +-------------------+----------------+--------------------+-------------------+
      |                   |                                     |                   |
      v                   v                                     v                   v
/account/*          /monitoring/*                         /freeFeature/*        /setting/*
- /all              - /getThread                          - /authenticator/*    - /getValue
- /add              - /getDelay                           - /deleteProduct/*    - /setValue
- /login            - /getPMTypeData                      - /productUploader/*  - /notification/*
- /refresh          - /PMTypeSetActive                    - /ubahFotoProfil/*   - /group/*
- /imports/exports  - /markProcessedOrder                 - /shipping-manager/* - /zoomLevel/*
```

### 4.1 Server Specifications
- **Port**: `9184` (Fixed local loopback).
- **Protocol**: HTTP 1.1 with WebSocket upgrade (Socket.IO).
- **CORS Configuration**: Open local origin policy with permissive preflight headers to allow seamless cross-origin requests between React dev servers and production builds.
- **Payload Parsing**:
  - `bodyParser.json()` and `bodyParser.urlencoded({ extended: true })` for API payloads.
  - In-memory `multer({ storage: multer.memoryStorage() })` for Excel/CSV account batch imports (`/account/imports`).
- **Socket.IO Namespaces & Events**:
  - Broadcasts live shop monitoring metrics (`monitoring-data`, `monitoring-stats`).
  - Emits real-time column visibility modifications (`column-data`).
  - Synchronizes 2FA OTP tokens dynamically (`authenticator-data`).
  - Delivers multi-user internal communication in `LiveChat`.

### 4.2 Route Controller Hierarchy
| Domain | Path Prefix | Controller Purpose |
| :--- | :--- | :--- |
| **Account Management** | `/account` | Store registration, credential updates, cookie extraction, session refresh, and bulk import/export. |
| **Live Monitoring** | `/monitoring` | Thread configuration, delay intervals, Power Merchant / Shop Type filters, and invoice processing flags. |
| **Automation Tools** | `/freeFeature` | Sub-controllers for TOTP Authenticator, Batch Product Deletion, Catalog Uploader, Profile Photo Updater, and Shipping Manager. |
| **Device Licensing** | `/device` | Machine ID fingerprinting, registration status verification, and license activation against remote DRM servers. |
| **Templates & Chats** | `/templateChat`, `/liveChat` | Quick reply macro templates and internal operator live chat channels. |
| **Settings & Layout** | `/setting`, `/zoomLevel`, `/group` | System preferences, UI zoom scaling, custom sound alerts, and multi-store grouping. |

---

## 5. State, Storage & Data Architecture

The application implements a multi-tier storage paradigm combining transactional SQL storage, memory cache files, and browser session state.

```
                                  STORAGE ARCHITECTURE
  +-----------------------------------------------------------------------------------+
  |                                                                                   |
  |  +---------------------------+  +--------------------------+  +----------------+  |
  |  |      SQLite Database      |  |     Memory JSON File     |  | Chrome Profiles|  |
  |  |  (asistenq-tiktok-data.db)|  | (asistenq-tiktok-memory) |  | (Isolated User |  |
  |  |                           |  |                          |  |      Data)     |  |
  |  |  - account                |  |  - processed_invoice     |  |  - Cookies     |  |
  |  |  - _group                 |  |  - ephemeral ID lists    |  |  - LocalStorage|  |
  |  |  - setting                |  |  - fast O(1) membership  |  |  - Extensions  |  |
  |  |  - template_chat          |  |                          |  |                |  |
  |  |  - main_data_column_1     |  |                          |  |                |  |
  |  |  - authenticator          |  |                          |  |                |  |
  |  +---------------------------+  +--------------------------+  +----------------+  |
  |                                                                                   |
  +-----------------------------------------------------------------------------------+
```

### 5.1 SQLite Persistence (`src/class/Database.ts`)
- **File Location**:
  - Windows: `%APPDATA%\asistenq-tiktok-data.db`
  - macOS: `~/Library/Application Support/asistenq-tiktok-data.db`
- **Query Engine**: Wraps `sqlite3.Database` in asynchronous Promise interfaces, automatically routing `SELECT` queries to `db.all()` and schema/mutation queries to `db.run()`.

#### Primary Table Schemas
1. **`account`**:
   - Stores store credentials, session cookies (JSON serialized), moderation flags, OTP secrets, shop metrics (balances, pending pack count `dikemasCount`, shipping count `dikirimCount`, unread chat count `chatCount`, complaint count `complaintCount`), shop ID, pin state, and grouping assignments.
2. **`_group`**:
   - Organizes accounts into logical operational groups with active toggle flags.
3. **`setting`**:
   - Generic key-value table (`name`, `typeData`, `value`) supporting typed deserialization for string, boolean, numeric, and JSON object configurations.
4. **`template_chat`**:
   - Stores canned response arrays indexed by group name for rapid buyer messaging.
5. **`main_data_column_1`**:
   - Manages UI column indexing, visibility state, and display ordering.
6. **`authenticator`**:
   - Manages standalone TOTP 2FA entries (`label`, `secret`, `email`, `added`).

### 5.2 In-Memory Fast Cache (`src/class/Memory.ts`)
- **Storage Strategy**: Disk-backed JSON arrays stored at `%APPDATA%\asistenq-tiktok-memory-data\` (e.g., `processed_invoice_string.json`).
- **Purpose**: High-frequency lookups (such as checking whether an invoice ID was already marked as processed) to prevent redundant database I/O overhead.

---

## 6. Headless Browser & Automation Engine (`src/class/Browser.ts`)

Browser automation in AsistenQ TikTok is engineered for extreme resilience against bot detection, aggressive rate limits, and fingerprinting.

```
       +-------------------------------------------------------------+
       |                  Puppeteer-Extra Launch Pipeline            |
       +-------------------------------------------------------------+
                                      |
         +----------------------------+----------------------------+
         v                                                         v
  [ Stealth Plugin ]                                    [ Extension Injector ]
  - navigator.webdriver = false                         - Fetch CRX from Chrome Webstore
  - Hardware concurrency spoof                          - Unpack into _extensions_ folder
  - WebGL vendor masking                                - Inject --load-extension
  - Codec & font emulation                              - Inject --disable-extensions-except
         |                                                         |
         +----------------------------+----------------------------+
                                      |
                                      v
                      +-------------------------------+
                      |   Target Chrome Execution     |
                      |   (User-Data Profile Dir)     |
                      +-------------------------------+
                                      |
                                      v
                      +-------------------------------+
                      |   CDP Low-Level Session       |
                      |   - Clear Cache / Cookies     |
                      |   - User-Agent Manipulation   |
                      +-------------------------------+
```

### 6.1 Stealth Evasion Suite
The platform utilizes `puppeteer-extra-plugin-stealth` with an explicitly customized evasion configuration:
- **Masked Properties**: `navigator.webdriver`, `navigator.hardwareConcurrency`, `navigator.languages`, `navigator.permissions`, `navigator.plugins`, `webgl.vendor`, `window.outerdimensions`, `chrome.runtime`, `chrome.app`, `chrome.csi`, and `chrome.loadTimes`.
- **User-Agent Spoofing**: Overrides default headless signatures with modern Chrome desktop headers.
- **Profile Isolation**: Each account automation session or interactive login creates an isolated profile under `%TEMP%\asistenq-owner-node\<account_id>` or `~/Library/Application Support/AsistenQ/<account_id>`.

### 6.2 Dynamic Chrome Extension Injection
- **CRX Fetching & Extraction**: Users can install standard Chrome Web Store extensions into the automation browser. The engine downloads the CRX directly via Google's Webstore endpoint (`clients2.google.com/service/update2/crx`), unpacks it via `crx-util`, and persists it into `_extensions_`.
- **Locale Resolution**: Parses `manifest.json` and `_locales/*/messages.json` to correctly render localized extension names and icons in the UI.
- **Startup Injection**: Appends `--load-extension` and `--disable-extensions-except` flags pointing to unpacked extension directories during browser instantiation.

### 6.3 Low-Level CDP Integration
- Accesses Chrome DevTools Protocol (CDP) sessions directly via `page.target().createCDPSession()` to execute low-level operations such as `Network.clearBrowserCookies` and `Network.clearBrowserCache` without restarting browser processes.

---

## 7. Component Interaction & Data Flow

```
+------------------------------------------------------------------------------------------------+
|                                    DATA FLOW DIAGRAM                                           |
+------------------------------------------------------------------------------------------------+
                                                                                                  
 [ User Action ]                                                                                  
        |                                                                                         
        v                                                                                         
 [ React Dashboard UI ]                                                                           
        |                                                                                         
        |  1. POST /account/refresh or Automation Trigger                                         
        v                                                                                         
 [ Express Server : 9184 ]                                                                        
        |                                                                                         
        |  2. Delegates task                                                                      
        v                                                                                         
 [ Monitoring / Account Worker Pool ]                                                             
        |                                                                                         
        +-----------------------------------+-----------------------------------+                 
        |                                   |                                   |                 
        v                                   v                                   v                 
 [ Direct API Engine ]             [ Puppeteer Engine ]              [ SQLite Database ]          
 (Axios HTTP Requests)             (Stealth Automation)              (Data & State Store)         
  - Uses saved session cookies      - Interactive store login         - Commits updated stats     
  - Polls shop stats & orders       - 2FA TOTP injection              - Updates cookie timestamps 
  - Emits real-time progress        - Fallback page scraping          - Reads active settings     
        |                                   |                                   |                 
        +-----------------------------------+-----------------------------------+                 
                                            |                                                     
                                            | 3. Broadcasts updated metrics                       
                                            v                                                     
                                   [ Socket.IO Server ]                                           
                                            |                                                     
                                            | 4. Emits 'monitoring-data'                          
                                            v                                                     
                                  [ React Dashboard UI ]                                          
                               (Instant visual counter update)                                    
```

1. **Trigger Phase**: The operator interacts with the React UI (e.g., refreshing metrics, bulk uploading products, or launching an account browser session).
2. **Dispatch Phase**: Express routes the action to the corresponding singleton class controller (`Account`, `Monitoring`, `ProductUploader`, etc.).
3. **Execution Phase**:
   - **Fast Metric Sync**: Uses direct authenticated HTTP requests with stored cookies via `AccountInformation` to fetch live balances, order states, and chats.
   - **Headless Automation**: Uses `Browser` with stealth plugins to handle complex workflows, file uploads, or cookie refreshments.
4. **State Persistence**: Metrics, updated tokens, and task logs are committed to SQLite (`asistenq-tiktok-data.db`).
5. **Real-Time Broadcast**: The server pushes updated state structures to all connected frontend clients via Socket.IO events, immediately refreshing table cells, counter cards, and toast alerts.

---

## 8. Directory & Module Reference

```
asistenq-tiktok/
├── package.json               # Build scripts, Electron dependencies, and builder config
├── src/
│   ├── index.ts               # Electron Main Process entry point & lifecycle manager
│   ├── preload.ts             # Electron Preload script
│   ├── config.ts              # Global environment & runtime constants
│   ├── class/                 # Core backend domain engines
│   │   ├── Account.ts         # Account CRUD, authentication, and session handling
│   │   ├── AccountInformation.ts # Shop data scraper & API synchronizer
│   │   ├── Authenticator.ts   # Standalone TOTP 2FA generator
│   │   ├── Browser.ts         # Puppeteer-Extra stealth browser launcher & CRX manager
│   │   ├── BulkUpdateProfilePhoto.ts # Profile picture mass updater
│   │   ├── Database.ts        # SQLite query executor & wrapper
│   │   ├── DeleteProduct.ts   # Product catalog batch deletion engine
│   │   ├── Device.ts          # Machine ID licensing & authorization client
│   │   ├── Group.ts           # Store grouping & filtering logic
│   │   ├── Holiday.ts         # Store holiday mode automation
│   │   ├── LiveChat.ts        # Operator-to-operator internal chat room
│   │   ├── LogoutChecker.ts   # Background session expiration detector
│   │   ├── MainDataColumn.ts  # Dynamic column visibility manager
│   │   ├── Memory.ts          # Fast disk-backed JSON cache
│   │   ├── Monitoring.ts      # Multi-threaded account polling & metric engine
│   │   ├── Notification.ts    # Custom audio & OS toast notification dispatcher
│   │   ├── OpenBrowser.ts     # Dedicated store browser profile manager
│   │   ├── OperasionalSchedule.ts # Business hours automation engine
│   │   ├── ProductUploader.ts # Automated catalog batch uploader
│   │   ├── PublicMonitoring.ts# Web-based shared monitoring exporter
│   │   ├── Recorder.ts        # Performance & event recorder
│   │   ├── Server.ts          # Express 4 & Socket.IO server on port 9184
│   │   ├── Setting.ts         # Centralized key-value configuration manager
│   │   ├── ShippingManager.ts # Mass shipping courier selector
│   │   ├── Slogan.ts          # Batch store slogan updater
│   │   ├── TemplateChat.ts    # Quick reply template manager
│   │   ├── Updater.ts         # Remote release checker & patcher
│   │   └── ZoomLevel.ts       # Electron window zoom controller
│   ├── controller/            # Express request handlers organized by domain
│   └── sounds/                # Built-in MP3 notification audio ringtones
└── frontend-app/              # React 18 single-page dashboard application
```

---

## 9. Technology Stack Matrix

| Layer | Technology / Library | Version / Detail |
| :--- | :--- | :--- |
| **Desktop Shell** | Electron | ^27.1.3 |
| **Language & Transpiler** | TypeScript, Node.js | TypeScript ^5.3.3, ES2020 Target |
| **HTTP & WS Server** | Express, Socket.IO | Express ^4.18.2, Socket.IO ^4.7.2 |
| **Database** | SQLite3 | sqlite3 ^5.1.6 |
| **Automation & Scraping** | Puppeteer Extra, Puppeteer Stealth | puppeteer ^21.6.0, puppeteer-extra ^3.3.6 |
| **Frontend Framework** | React, React Router | React 18, React Router v6 |
| **UI Component Suites** | Material UI (MUI), Ant Design | @mui/material, antd ^5.12.1 |
| **Packaging & Installer** | electron-builder, NSIS | electron-builder ^24.9.1 (x64, ia32) |
