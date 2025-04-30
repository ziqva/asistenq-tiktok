// @ts-ignore
import fixesm from "fix-esm";
fixesm.register();

import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

// @ts-ignore
import {
  app,
  BrowserWindow,
  webFrame,
  Dialog,
  dialog,
  session,
  WebRequestFilter,
} from "electron";
import { AppUpdater, autoUpdater } from "electron-updater";
import * as path from "path";
import Server from "./class/Server";
import Account from "./class/Account";
import Database from "./class/Database";
import Monitoring from "./class/Monitoring";
import Setting from "./class/Setting";
import Notificaton from "./class/Notification";
import OpenBrowser from "./class/OpenBrowser";
import Device from "./class/Device";
import Group from "./class/Group";
import ZoomLevel from "./class/ZoomLevel";
import Updater from "./class/Updater";
import Authenticator from "./class/Authenticator";
import DeleteProduct from "./class/DeleteProduct";
import ProductUploader from "./class/ProductUploader";
import MainDataColumn from "./class/MainDataColumn";
import LiveChat from "./class/LiveChat";
import OperationalSchedule from "./class/OperasionalSchedule";
import ShippingManager from "./class/ShippingManager";
// @ts-ignore
import * as isPackaged from "electron-is-packaged";
import TemplateChat from "./class/TemplateChat";
import Holiday from "./class/Holiday";
import Slogan from "./class/Slogan";
import Recorder from "./class/Recorder";
import BulkUpdateProfilePhoto from "./class/BulkUpdateProfilePhoto";
import Memory from './class/Memory'
import LogoutChecker from './class/LogoutChecker'
import Browser from "./class/Browser";
import PublicMonitoring from "./class/PublicMonitoring";

const iconPath = path.join(__dirname, "images", "icon.ico");

const processedInvoiceMemory: Memory = new Memory({ type: 'string', prefix: 'processed_invoice', saveInterval: 10000 })
const database: Database = new Database();
const mainDataColumn: MainDataColumn = new MainDataColumn({ database });
const updater: Updater = new Updater();
const recorder: Recorder = new Recorder();
const device: Device = new Device({ recorder });
const setting: Setting = new Setting(database, { device });

const zoomLevel: ZoomLevel = new ZoomLevel({ setting });

const notification: Notificaton = new Notificaton({ setting });
const account: Account = new Account(database, setting, device, notification);
const authenticator: Authenticator = new Authenticator({ database, account });
const monitoring: Monitoring = new Monitoring(
  database,
  account,
  setting,
  notification,
  device,
  mainDataColumn,
  processedInvoiceMemory
);
const shippingManager = new ShippingManager({ account, monitoring });
const templateChat: TemplateChat = new TemplateChat({
  database,
  account,
  notification,
});
const openBrowser: OpenBrowser = new OpenBrowser(
  account,
  monitoring,
  templateChat,
);
const group: Group = new Group({ database, monitoring, setting });
const deleteProduct: DeleteProduct = new DeleteProduct({ monitoring, device });
const productUploader: ProductUploader = new ProductUploader({
  account,
  device,
  setting,
  monitoring,
});
const liveChat = new LiveChat({ setting });
const operationalSchedule = new OperationalSchedule({
  database,
  monitoring,
  account,
  group,
});
const holiday = new Holiday({
  database,
  monitoring,
  account,
  group,
});
const slogan = new Slogan({
  database,
  monitoring,
  account,
  group,
  setting,
});

const publicMonitoring = new PublicMonitoring({ device, monitoring, group })
notification.publicMonitoring = publicMonitoring
const bulkUpdateProfilePhoto = new BulkUpdateProfilePhoto({ account });
const logoutChecker = new LogoutChecker({ account, monitoring, browserEngine: new Browser() });

const server: Server = new Server(
  account,
  database,
  monitoring,
  setting,
  openBrowser,
  device,
  notification,
  group,
  zoomLevel,
  updater,
  authenticator,
  deleteProduct,
  productUploader,
  mainDataColumn,
  liveChat,
  templateChat,
  autoUpdater,
  operationalSchedule,
  holiday,
  slogan,
  bulkUpdateProfilePhoto,
  shippingManager,
  publicMonitoring
);

account.monitoring = monitoring;
monitoring.group = group;
monitoring.publicMonitoring = publicMonitoring
group.onDataChange = () => {
  monitoring.sendMainData();
};
account.group = group;
device.monitoring = monitoring;
account.authenticator = authenticator;
autoUpdater.allowDowngrade = false;

const appArgs: string[] = [
  "no-sandbox",
  "disable-setuid-sandbox",
  "disable-gpu",
  "disable-dev-shm-usage",
  "disable-web-security",
  "disable-gpu-process-crash-limit",
  "disable-gpu-sandbox",
  "disable-gpu-watchdog",
  "disable-gpu-vsync",
  "disable-http-cache",
  "disable-http2",
];

for (const appArg of appArgs) {
  // app.commandLine.appendArgument(appArg)
  app.commandLine.appendSwitch(appArg);
}

// @ts-ignore
server.start();

app.on("browser-window-created", async () => {
  const c = BrowserWindow.getAllWindows().length;
  while (true) {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length !== c) {
      for (const window of windows) {
        window.setMenu(null);
      }
      return;
    }
    await new Promise((r: any) => setTimeout(r, 100));
  }
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      devTools: isPackaged.default.isPackaged ? false : true,
      webSecurity: false,
      imageAnimationPolicy: "animate",
    },
    width: 1100,
    minWidth: 1100,
    minHeight: 600,
    icon: iconPath,
    autoHideMenuBar: true,
  });
  const title: string = `AsistenQ Tiktok - ${app.getVersion()}`;
  mainWindow.setTitle(title);
  zoomLevel.browserWindow = mainWindow;
  mainWindow.on("page-title-updated", (sender) => sender.preventDefault());
  const url = isPackaged.default.isPackaged
    ? "http://localhost:9183/authentication"
    : "http://localhost:3000/authentication";
  const filters: WebRequestFilter = {
    urls: ["https://*.tokopedia.com/*", "https://*.tokopedia.net/*"],
  };
  session.defaultSession.webRequest.onBeforeSendHeaders(
    filters,
    (detail, callback) => {
      detail.requestHeaders["User-Agent"] =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36";
      detail.requestHeaders["accept"] = "*/*";
      callback({ requestHeaders: detail.requestHeaders });
    },
  );
  mainWindow.loadURL(url, {
    extraHeaders:
      "Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  });

  // Updates
  autoUpdater.setFeedURL({
    provider: "generic",
    url: "http://45.76.183.58/asistenq-update/",
  });
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("update-downloaded", () => {
    // autoUpdater.quitAndInstall()
    const res = dialog.showMessageBoxSync(mainWindow, {
      type: "question",
      buttons: ["Sekarang", "Nanti Saja"],
      message:
        'Update tersedia, apakah anda ingin update aplikasi sekarang ?, jika anda memilih "Nanti Saja" maka proses update akan dilakukan saat aplikasi tertutup / berhenti beroperasi',
      title: "Update Tersedia",
      icon: "question",
    });
    if (res === 0) {
      autoUpdater.quitAndInstall();
    }
  });
  autoUpdater.checkForUpdates();
}

app.whenReady().then(() => {
  createWindow();
});

app.on("activate", function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Check every second for make sure window size of framerate another window is expected with min size [1100, 600]
let currentBrowserWindowLength = 1;
!(async () => {
  while (true) {
    if (BrowserWindow.getAllWindows().length !== currentBrowserWindowLength) {
      const windows = BrowserWindow.getAllWindows();
      for (const window of windows) {
        window.setMinimumSize(1100, 600);
        const size = window.getSize();
        if (size[0] < 1100) {
          window.setSize(1100, size[1]);
        }
        if (size[1] < 600) {
          window.setSize(1100, 600);
        }
      }
      currentBrowserWindowLength = BrowserWindow.getAllWindows().length;
    }
    await new Promise((r: any) => setTimeout(r, 4000));
  }
})();

if(!isPackaged.default.isPackaged) {
  // account.FixPOAndPriceMain()
}
// account.detectLogoutandLogin()