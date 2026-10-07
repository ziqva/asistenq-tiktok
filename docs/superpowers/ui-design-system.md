# UI Design System, Color Tokens, and Component Architecture

## 1. Executive Summary & Design Philosophy
The **AsistenQ TikTok Desktop Client** UI is engineered as an Electron + React 18 single-page desktop management platform. It delivers real-time multi-account monitoring, high-density order fulfillment controls, live notifications, and batch automation tools.

### Design Paradigm & Framework Stack:
- **Hybrid Component Library Architecture**: Combines **Ant Design 5** (`antd`) for dense data grids, form controls, spinners, popconfirms, and cascading dropdowns with **Material-UI 5** (`@mui/material`, `@mui/icons-material`) for modal dialogues, contextual tooltips, and interactive switches.
- **SCSS Tokenization System**: CSS Custom Properties (`:root` variables) coupled with modular SCSS files scoped per element and page view.
- **Responsive Scaling**: Integrated Electron `webFrame` zoom factor management supporting dynamic scaling from 50% to 300% without breaking dense data layout constraints.
- **Micro-Animations**: Smooth entry transitions powered by **AOS (Animate On Scroll)** and CSS keyframe animations (e.g. badge pulses, rotational icon alerts).

---

## 2. Design Tokens & Complete Color Palette

### 2.1 CSS Custom Properties (`frontend-app/src/colors.scss`)
```scss
:root {
    --light: #F0F5FC;                  /* Main App Background */
    --semi-light: #E7EDF7;             /* Subtle Container & Section Background */
    --gray: #7D9CB9;                   /* Subdued Labels & Muted UI Accents */
    --semi-gray: #C9D9EB;              /* Border Highlights & Card Dividers */
    --green: #2ED573;                  /* General Success & Confirmation */
    --purple: #6952ED;                 /* Secondary Accent */
    --semi-purple: #7D67F9;            /* Purple Hover / Gradient Fill */
    --main-color: rgb(25, 118, 210);   /* Primary Brand Blue (#1976D2) */
    
    /* Marketplace Status Indicators */
    --green-tokped: rgb(24, 159, 96);  /* #189F60 - Success & Potency Highlights */
    --green-tokped-bg: #C9FDE0;        /* Success Badge Background */
    --green-tokped-color: #00AA5B;     /* Success Text & Counter Foreground */
    --orange-tokped-bg: rgba(255, 221, 14, 0.2); /* Warning / Dikemas Badge Background */
    --orange-tokped-color: rgb(149, 128, 3);      /* Warning / Dikemas Text Foreground */
    --red-tokped-bg: rgb(252, 221, 226);          /* Danger / Urgent Badge Background */
    --red-tokped-color: rgb(235, 82, 112);        /* Danger / Urgent Text Foreground */
}
```

### 2.2 Brand & Identity Colors
| Token / Property | Hex / RGB Value | Role / Usage Context |
| :--- | :--- | :--- |
| **TikTok Red/Pink Primary** | `#FE2C55` / `rgb(254, 44, 85)` | Brand primary highlights, active badges, live notification indicator |
| **TikTok Cyan/Teal Secondary** | `#25F4EE` / `rgb(37, 244, 238)` | Secondary neon contrast, glowing status indicators |
| **Primary Theme Blue** | `#1976D2` / `rgb(25, 118, 210)` | Global `colorPrimary` in Ant Design & Material-UI controls |
| **Active Focus Accent** | `#007AD4` | App header title branding, interactive button focus states |
| **Dark Base Backgrounds** | `#121212`, `#1E1E1E`, `#282828` | Overlay layers, terminal logs, code blocks, dark modal sheets |
| **Dark Theme Borders** | `#383838`, `#424242` | Container boundaries in dark mode dialogs & log inspectors |
| **Light Canvas Base** | `#F0F5FC` | Global viewport background (`body, html`) |

### 2.3 Status, Order & Cell Counter Indicators
The data grid provides real-time visual alerts using calculated epoch thresholds:
- **Pesanan Baru (New Order)**:
  - `< 10 jam (r < 36000s)`: Red Alert (`background: #FCDDE2`, `color: #EB5270`)
  - `10 - 20 jam (36000s <= r < 72000s)`: Orange Alert (`background: rgba(255, 221, 14, 0.2)`, `color: #958003`)
  - `> 20 jam`: Green Normal (`background: #C9FDE0`, `color: #00AA5B`)
- **Status Dikemas (Packaging)**: Amber status badge `#f59e0b` / `rgba(255, 221, 14, 0.2)`
- **Status Dikirim (Shipping)**: Blue status badge `#3b82f6`
- **Status Selesai (Completed)**: Green badge `#10b981` / `#00AA5B`
- **Saldo (Balance)**:
  - `> 0`: Green Pill (`background: #C9FDE0`, `color: #00AA5B`)
  - `0`: Orange Pill (`background: rgba(255, 221, 14, 0.2)`, `color: #958003`)
  - `< 0`: Red Warning Pill (`background: #FCDDE2`, `color: #EB5270`)
- **Chat Badge**: Red Alert `#FF0134` / `#EF4444`
- **Warning & Moderation**: `#EAB308` / `#F59E0B`

---

## 3. Typography & Global Styling Architecture

### 3.1 Font Stack
- **Primary Typography**: `'Roboto', sans-serif` loaded via Google Fonts CDN (`weights: 100, 300, 400, 500, 700, 900`).
- **Secondary Typography**: `'Roboto Condensed', sans-serif` for condensed numerical tabular data.

### 3.2 Global Scrollbar Styling (`frontend-app/src/index.scss`)
Custom WebKit scrollbars maintain minimum visual footprint while remaining accessible:
```scss
::-webkit-scrollbar {
    width: 9px;
    height: 9px;
}
::-webkit-scrollbar-track {
    background-color: transparent;
}
::-webkit-scrollbar-thumb {
    background-color: #888;
    border-radius: 4px;
    &:hover {
        background-color: #555;
    }
}
```

### 3.3 Ant Design 5 Theme Configuration (`frontend-app/src/App.js`)
Configured at root using Ant Design's `ConfigProvider`:
```jsx
<ConfigProvider
  theme={{
    token: {
      colorPrimary: "rgb(25, 118, 210)",
      borderRadius: 13,
    },
  }}
>
  {/* Application Routes */}
</ConfigProvider>
```

---

## 4. Layout & Application Shell System

```
+---------------------------------------------------------------------------------------+
|  Container (`element.main-container` 100vw x 100vh)                                   |
| +---------------------+ +-----------------------------------------------------------+ |
| | MainSidebar (250px) | | Right-Side View (`calc(100vw - 250px)`)                   | |
| | - AppHeader         | | +-------------------------------------------------------+ | |
| | - Total Saldo Card  | | | HomeHeader (Sort, Search, Groups, Import/Export, Bot) | | |
| | - Quick Filters     | | +-------------------------------------------------------+ | |
| |   * Semua Akun      | | | MainDataController                                    | | |
| |   * Akun Aktif      | | | - Sticky Header & Custom Columns                      | | |
| |   * Akun Bersaldo   | | | - Account Rows & Real-time Badges                     | | |
| |   * Moderasi        | | | - Bulk Selection Bar                                  | | |
| |   * Logout          | | +-------------------------------------------------------+ | |
| | - Batch Actions     | |                                                           | |
| | - Updater Badge     | |                                                           | |
| +---------------------+ +-----------------------------------------------------------+ |
+---------------------------------------------------------------------------------------+
```

### 4.1 `MainSidebar` (`src/element/MainSidebar/`)
- **`AppHeader.jsx`**: Displays application logo (`width: 40px`), app title (`#007AD4`, `font-size: 20px`), subtitle version, and animated Ketupat holiday overlay.
- **`Saldo.jsx`**: Aggregates total balance across all accounts, formatted via `formatRupiah()`. Highlights active balance with border radius and custom border stroke.
- **`FilterButton.jsx`**:
  - Filter list: `Semua Akun`, `Akun Aktif`, `Akun Bersaldo`, `Moderasi`, `Logout`.
  - Account count badges dynamically calculate matching items.
  - Active selection state applies `--main-color` background with `--light` white text.
  - **Batch Action Controls**: Shows `Login`, `Hapus Massal` (with Antd `Popconfirm`), and `Refresh Massal` with real-time `Progress` bar.
  - **`UpdateNotice.jsx` & `MarkProcessedOrderDialog.jsx`**: Trigger popups for checking engine updates and batch-marking processed orders.

### 4.2 `HomeHeader` (`src/element/HomeHeader/`)
- **`SortType.jsx`**: Sort dropdown supporting ordering by `Jumlah Order`, `Waktu Terbaru`, and `Badge Level`.
- **Search Input**: Ant Design `Input` with an 800ms debounce timer for responsive filtering without lag.
- **`Group.jsx` & `MassUpdateGroup.jsx`**: Dropdown for assigning accounts to labeled categories and mass-updating group tags.
- **`Import.jsx` & `Export.jsx`**: Modal triggers for Excel/CSV account batch loading and data export.
- **`News.jsx`**: Live marquee broadcast feed fetching operational notices from the backend socket.
- **`BotStatus` Toggle**: Material-UI `Switch` linked to the automation scheduler state.

### 4.3 `MainDataController` (`src/element/MainDataController/`)
- **Data Table Architecture**: Built on Ant Design `Table` with sticky left columns (`No`, `Account`).
- **`CustomColumn.jsx`**: Modal enabling/disabling visibility for individual columns (`Chat`, `NewOrder`, `Dikemas`, `Dikirim`, `Saldo`, `Bank`, `Ongkir`, `Skor`, `Status`, `Product`, `Action`).
- **`SelectionCheckState.jsx`**: Multi-select row manager with sticky floating counter and batch triggers.
- **Account Row Details**: Displays avatar with active pulse ring (`box-shadow: 0px 2px 10px rgba(25, 118, 210, 1)`), shop name, label tags, and seller center launch button.

---

## 5. Modal & Dialog Ecosystem

| Dialog Component | Source Path | Trigger Context | Primary UI Capabilities |
| :--- | :--- | :--- | :--- |
| **AddAccountDialog** | `src/element/AddAccountDialog/` | Sidebar / Header "Tambah Akun" | Form with validation for Username, Password, 2FA Authenticator Secret, Group Labels, and Proxy assignment. |
| **UpdateAccountDialog** | `src/element/UpdateAccountDialog/` | MainData row edit action | Edit account credentials, TOTP key, notes, and group membership. |
| **SettingDialog** | `src/element/SettingDialog/` | Sidebar Settings Icon | Modular configuration tabs: Delay, Worker Threads, Auth Timeout, Zoom Level, Notification Ringtones, Live Chat toggle, Chrome Extension manager, and Public Monitoring. Includes safe application restart with confirmation. |
| **UpdaterDialog** | `src/element/UpdaterDialog/` | Top Header Cloud Icon / Badge | Release changelog viewer categorization (New Features, Bug Fixes, Changes) and one-click app updater. |
| **AboutDialog** | `src/element/AboutDialog/` | Sidebar About Icon | Displays user license, machine hardware ID, OS parameters, and software build timestamp. |
| **MarkProcessedOrderDialog** | `src/element/MainSidebar/MarkProcessedOrderDialog.jsx` | Sidebar Order Management | Batch dialog to mark orders as acknowledged/processed across multiple accounts. |

---

## 6. Real-Time Collaboration & Live Chat System (`src/element/LiveChat/`)
- Floating live support widget mounted globally on `App.js`.
- **`ButtonToggle.jsx`**: Draggable FAB toggle with unread notification badges.
- **`Chat.jsx`**: Real-time socket message thread with support for:
  - File/image attachments (`Attachment.jsx`).
  - Online user counter (`OnlineUsers.jsx`).
  - Real-time typing indicators (`TypingUsers.jsx`).
  - Username initialization dialog (`InitUsername.jsx`).

---

## 7. Zoom & Window Scaling Architecture

### 7.1 Frontend Slider Controller (`src/element/SettingDialog/ZoomLevel.jsx`)
- Ant Design `Slider` configured between `50%` and `300%` with tick marks at `80%`, `120%`, and `180%`.
- Calls `utils/zoomLevel/set.js` on `onAfterChange` to persist configuration to the backend SQLite store.

### 7.2 Core Electron Synchronization (`src/class/ZoomLevel.ts`)
- The Electron main process hooks into the renderer window's `webContents`:
  ```typescript
  public async set(size: number): Promise<void> {
      await this.waitForBrowserWindowReady();
      await this.browserWindow.webContents.setZoomFactor(size / 100);
      await this.setting.set('zoom_level', size);
  }
  ```
- Automatically initializes and applies stored zoom factor on `did-finish-load` before UI rendering.

---

## 8. Free Features Module UI Architecture
Dedicated standalone utility views registered under `/free-feature/*`:
1. **`FreeFeatureAuthenticator`**: Standalone Google Authenticator / 2FA code generator and manager.
2. **`FreeFeatureDeleteProduct`**: Batch product removal assistant with filter criteria.
3. **`FreeFeatureUploadProduct`**: Mass product catalog uploader with directory selection and task progress trackers.
4. **`FreeFeatureTemplateChat`**: Auto-reply and quick-response template builder.
5. **`FreeFeatureJadwalOperasional`**: Store operating hours and automatic schedule switcher.
6. **`FreeFeatureSetHoliday`**: Shop holiday mode & auto-responder date range scheduler.
7. **`FreeFeatureSetSlogan`**: Mass slogan and bio updater.
8. **`FreeFeatureAturFotoProfile`**: Batch shop avatar updater.
9. **`FreeFeatureAturPengiriman`**: Shipping courier logistics toggle and preset manager.
