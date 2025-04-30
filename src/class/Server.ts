import express from "express";
// @ts-ignore
import isPackaged from "electron-is-packaged";
import controller from "../controller";
import http from "http";
import { Server as SocketServer } from "socket.io";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";

import Account from "./Account";
import Database from "./Database";
import Monitoring from "./Monitoring";
import Setting from "./Setting";
import OpenBrowser from "./OpenBrowser";
import App from "./App";
import Device from "./Device";
import Notification from "./Notification";
import Group from "./Group";
import ZoomLevel from "./ZoomLevel";
import Updater from "./Updater";
import Authenticator from "./Authenticator";
import DeleteProduct from "./DeleteProduct";
import ProductUploader from "./ProductUploader";
import MainDataColumn from "./MainDataColumn";
import LiveChat from "./LiveChat";
import TemplateChat from "./TemplateChat";
import { AppUpdater } from "electron-updater";
import OperationalSchedule from "./OperasionalSchedule";
import Holiday from "./Holiday";
import Slogan from "./Slogan";
import BulkUpdateProfilePhoto from "./BulkUpdateProfilePhoto";
import ShippingManager from "./ShippingManager";
import Browser from "./Browser";
import PublicMonitoring from "./PublicMonitoring";

export default class Server {
  private updater: Updater;
  private liveChat: LiveChat;
  public port: number;
  private app: express.Application;
  public isPackaged: boolean;
  private account: Account;
  private authenticator: Authenticator;
  private deleteProduct: DeleteProduct;
  private notification: Notification;
  private database: Database;
  public sockets: SocketServer[];
  private monitoring: Monitoring;
  private setting: Setting;
  private openBrowser: OpenBrowser;
  private application: App;
  private device: Device;
  private group: Group;
  private zoomLevel: ZoomLevel;
  private productUploader: ProductUploader;
  private mainDataColumn: MainDataColumn;
  private templateChat: TemplateChat;
  private autoUpdater: AppUpdater;
  private operationalSchedule: OperationalSchedule;
  private holiday: Holiday;
  private slogan: Slogan;
  private bulkUpdateProfilePhoto: BulkUpdateProfilePhoto;
  private shippingManager: ShippingManager;
  private browser: Browser
  private publicMonitoring: PublicMonitoring

  constructor(
    account: Account,
    database: Database,
    monitoring: Monitoring,
    setting: Setting,
    openBrowser: OpenBrowser,
    device: Device,
    notification: Notification,
    group: Group,
    zoomLevel: ZoomLevel,
    updater: Updater,
    authenticator: Authenticator,
    deleteProduct: DeleteProduct,
    productUploader: ProductUploader,
    mainDataColumn: MainDataColumn,
    liveChat: LiveChat,
    templateChat: TemplateChat,
    autoUpdater: AppUpdater,
    operationalSchedule: OperationalSchedule,
    holiday: Holiday,
    slogan: Slogan,
    bulkUpdateProfilePhoto: BulkUpdateProfilePhoto,
    shippingManager: ShippingManager,
    publicMonitoring: PublicMonitoring
  ) {
    this.publicMonitoring = publicMonitoring
    this.port = 9184;
    this.holiday = holiday;
    this.liveChat = liveChat;
    this.productUploader = productUploader;
    this.mainDataColumn = mainDataColumn;
    this.deleteProduct = deleteProduct;
    this.updater = updater;
    this.group = group;
    this.authenticator = authenticator;
    this.device = device;
    this.openBrowser = openBrowser;
    this.notification = notification;
    this.app = express();
    this.application = new App();
    this.setting = setting;
    this.zoomLevel = zoomLevel;
    this.isPackaged = isPackaged.isPackaged;
    this.account = account;
    this.database = database;
    this.sockets = [];
    this.monitoring = monitoring;
    this.templateChat = templateChat;
    this.autoUpdater = autoUpdater;
    this.operationalSchedule = operationalSchedule;
    this.slogan = slogan;
    this.bulkUpdateProfilePhoto = bulkUpdateProfilePhoto;
    this.shippingManager = shippingManager;
    this.browser = new Browser()
  }

  /**
   * Creates a multer storage engine that stores files in memory.
   *
   * @return {Object} - The multer storage engine.
   */
  memoryStorage() {
    return multer({ storage: multer.memoryStorage() });
  }

  /**
   * Initializes the routes for the application.
   *
   * This function sets up the routes for various endpoints of the application.
   *
   * @param {type} paramName - description of parameter
   * @return {type} description of return value
   */
  prepareRoute() {
    this.app.get("/account/all", (req, res) =>
      controller.account.all(req, res, this.account),
    );
    this.app.post("/account/add", (req, res) =>
      controller.account.add(req, res, this.account),
    );
    this.app.post("/account/login", (req, res) =>
      controller.account.login(req, res, this.account),
    );
    this.app.get("/monitoring/getThread", (req, res) =>
      controller.monitoring.getThread(req, res, this.monitoring),
    );
    this.app.get("/monitoring/getDelay", (req, res) =>
      controller.monitoring.getDelay(req, res, this.monitoring),
    );
    this.app.post("/setting/getValue", (req, res) =>
      controller.setting.getValue(req, res, this.setting),
    );
    this.app.post("/setting/setValue", (req, res) =>
      controller.setting.setValue(req, res, this.setting),
    );
    this.app.post("/openBrowser/open", (req, res) =>
      controller.openBrowser.open(req, res, this.openBrowser),
    );
    this.app.post(
      "/account/imports",
      // @ts-ignore
      this.memoryStorage().single("file"),
      (req, res) => controller.account.imports(req, res, this.account),
    );
    this.app.post("/account/refresh", (req, res) =>
      controller.account.refresh(req, res, this.monitoring, this.account),
    );
    this.app.post("/account/exports", (req, res) =>
      controller.account._exports(req, res, this.account),
    );
    this.app.post("/app/restart", (req, res) =>
      controller.app.restart(req, res, this.application),
    );
    this.app.post("/account/remove", (req, res) =>
      controller.account.remove(req, res, this.account),
    );
    this.app.post("/account/update", (req, res) =>
      controller.account.update(req, res, this.account),
    );
    this.app.post("/account/get", (req, res) =>
      controller.account.get(req, res, this.account),
    );
    this.app.get("/device/getMachineId", (req, res) =>
      controller.device.getMachineId(req, res, this.device),
    );
    this.app.post("/notification/show", (req, res) =>
      controller.notification.show(req, res, this.notification, this.setting),
    );
    this.app.get("/group/data", (req, res) =>
      controller.group.data(req, res, this.group),
    );
    this.app.post("/group/setActiveForAll", (req, res) =>
      controller.group.setActiveForAll(req, res, this.group),
    );
    this.app.post("/group/setActive", (req, res) =>
      controller.group.setActive(req, res, this.group),
    );
    this.app.post("/group/remove", (req, res) =>
      controller.group.remove(req, res, this.group),
    );
    this.app.post("/group/add", (req, res) =>
      controller.group.add(req, res, this.group),
    );
    this.app.post("/group/massUpdate", (req, res) =>
      controller.group.massUpdate(req, res, this.group),
    );
    this.app.post("/zoomLevel/set", (req, res) =>
      controller.zoomLevel.set(req, res, this.zoomLevel),
    );
    this.app.get("/zoomLevel/get", (req, res) =>
      controller.zoomLevel.get(req, res, this.zoomLevel),
    );
    this.app.get("/updater/getUpdates", (req, res) =>
      controller.updater.getUpdates(req, res, this.updater),
    );
    this.app.post("/updater/update", (req, res) =>
      controller.updater.update(req, res, this.updater),
    );
    this.app.get("/device/isRegistered", (req, res) =>
      controller.device.isRegistered(req, res, this.device),
    );
    this.app.post("/device/activateLicense", (req, res) =>
      controller.device.activateLicense(req, res, this.device),
    );
    this.app.get("/freeFeature/authenticator/sync", (req, res) =>
      controller.freeFeature.authenticator.sync(req, res, this.authenticator),
    );
    this.app.post("/freeFeature/authenticator/remove", (req, res) =>
      controller.freeFeature.authenticator.remove(req, res, this.authenticator),
    );
    this.app.post("/freeFeature/authenticator/add", (req, res) =>
      controller.freeFeature.authenticator.add(req, res, this.authenticator),
    );
    this.app.post("/freeFeature/authenticator/update", (req, res) =>
      controller.freeFeature.authenticator.update(req, res, this.authenticator),
    );
    this.app.get("/notification/get", (req, res) =>
      controller.notification.get(req, res, this.notification),
    );
    this.app.post("/notification/update", (req, res) =>
      controller.notification.update(req, res, this.notification),
    );
    this.app.get(
      "/freeFeature/deleteProduct/getAvailableAccounts",
      (req, res) =>
        controller.freeFeature.deleteProduct.getAvailableAccounts(
          req,
          res,
          this.deleteProduct,
        ),
    );
    this.app.post("/freeFeature/deleteProduct/getAccount", (req, res) =>
      controller.freeFeature.deleteProduct.getAccount(
        req,
        res,
        this.deleteProduct,
      ),
    );
    this.app.post("/freeFeature/productUploader/upload", (req, res) =>
      controller.freeFeature.productUploader.upload(
        req,
        res,
        this.productUploader,
      ),
    );
    this.app.post("/freeFeature/productUploader/getAccount", (req, res) =>
      controller.freeFeature.productUploader.getAccount(
        req,
        res,
        this.productUploader,
      ),
    );
    this.app.get("/freeFeature/productUploader/selectFolder", (req, res) =>
      controller.freeFeature.productUploader.selectFolder(
        req,
        res,
        this.productUploader,
      ),
    );
    this.app.post("/freeFeature/productUploader/stop", (req, res) =>
      controller.freeFeature.productUploader.stop(
        req,
        res,
        this.productUploader,
      ),
    );
    this.app.get("/device/getData", (req, res) =>
      controller.device.getData(req, res, this.device),
    );
    this.app.get("/monitoring/getPMTypeData", (req, res) =>
      controller.monitoring.getPMTypeData(req, res, this.monitoring),
    );
    this.app.post("/monitoring/PMTypeSetActiveForAll", (req, res) =>
      controller.monitoring.PMTypeSetActiveForAll(req, res, this.monitoring),
    );
    this.app.post("/monitoring/PMTypeSetActive", (req, res) =>
      controller.monitoring.PMTypeSetActive(req, res, this.monitoring),
    );
    this.app.post("/mainDataColumn/setActive", (req, res) =>
      controller.mainDataColumn.setActive(req, res, this.mainDataColumn),
    );
    this.app.post("/app/openExternalLink", (req, res) =>
      controller.app.openExternalLink(req, res, this.application),
    );
    this.app.post("/account/forceLogoutAllDevice", (req, res) =>
      controller.account.forceLogoutAllDevice(req, res, this.account),
    );
    this.app.post("/liveChat/setActive", (req, res) =>
      controller.liveChat.setActive(req, res, this.liveChat),
    );
    this.app.get("/liveChat/isActive", (req, res) =>
      controller.liveChat.isActive(req, res, this.liveChat),
    );
    this.app.get(
      "/freeFeature/productUploader/getCurrentSelectedFolder",
      (req, res) =>
        controller.freeFeature.productUploader.getCurrentSelectedFolder(
          req,
          res,
          this.productUploader,
        ),
    );
    this.app.get("/templateChat/getData/:name", (req, res) =>
      controller.templateChat.getData(req, res, this.templateChat),
    );
    this.app.post("/templateChat/set/:name", (req, res) =>
      controller.templateChat.set(req, res, this.templateChat),
    );
    this.app.post("/templateChat/add/:name", (req, res) =>
      controller.templateChat.add(req, res, this.templateChat),
    );
    this.app.post("/templateChat/remove/:name", (req, res) =>
      controller.templateChat.remove(req, res, this.templateChat),
    );
    this.app.get("/update/check", (req, res) =>
      controller.update.check(req, res, this.autoUpdater),
    );
    this.app.post("/group/updateSingle", (req, res) =>
      controller.group.updateSingle(req, res, this.group),
    );
    this.app.get("/operationalSchedule/accounts/:search", (req, res) =>
      controller.operationalSchedule.accounts(
        req,
        res,
        this.operationalSchedule,
      ),
    );
    this.app.get("/operationalSchedule/accounts", (req, res) =>
      controller.operationalSchedule.accounts(
        req,
        res,
        this.operationalSchedule,
      ),
    );
    this.app.get("/operationalSchedule/accounts/:search/:group", (req, res) =>
      controller.operationalSchedule.accounts(
        req,
        res,
        this.operationalSchedule,
      ),
    );
    this.app.get("/holiday/accounts", (req, res) =>
      controller.holiday.accounts(req, res, this.holiday),
    );
    this.app.get("/holiday/accounts/:search", (req, res) =>
      controller.holiday.accounts(req, res, this.holiday),
    );
    this.app.get("/holiday/accounts/:search/:group", (req, res) =>
      controller.holiday.accounts(req, res, this.holiday),
    );
    this.app.get("/slogan/accounts", (req, res) =>
      controller.slogan.accounts(req, res, this.slogan),
    );
    this.app.get("/slogan/accounts/:search", (req, res) =>
      controller.slogan.accounts(req, res, this.slogan),
    );
    this.app.get("/slogan/accounts/:search/:group", (req, res) =>
      controller.slogan.accounts(req, res, this.slogan),
    );
    this.app.get("/slogan/detail", (req, res) =>
      controller.slogan.detail(req, res, this.slogan),
    );
    this.app.post("/free-feature/slogan/update", (req, res) =>
      controller.slogan.update(req, res, this.slogan),
    );
    this.app.post("/monitoring/pin", (req, res) =>
      controller.monitoring.pin(req, res, this.monitoring),
    );
    this.app.get("/freeFeature/aturFotoProfil/selectFolder", (req, res) =>
      controller.freeFeature.ubahFotoProfil.selectFolder(req, res),
    );
    this.app.post("/freeFeature/aturFotoProfil/listData", (req, res) =>
      controller.freeFeature.ubahFotoProfil.listData(
        req,
        res,
        this.bulkUpdateProfilePhoto,
      ),
    );
    this.app.get("/freeFeature/shippingManager/getShippers", (req, res) =>
      controller.shippingManager.getShippers(req, res, this.shippingManager),
    );
    this.app.post('/freeFeature/shippingManager/applyActivateShippers', (req, res) => controller.shippingManager.applyActivateShippers(req, res, this.shippingManager))
    this.app.get('/freeFeature/shippingManager/logs', (req, res) => controller.shippingManager.logs(req, res, this.shippingManager))
    this.app.get('/api/import-error-list', (req, res) => controller.account.importErrorList(req, res, this.account))
    this.app.get('/notification/addNewRingtone', (req, res) => controller.notification.addNewRingtone(req, res, this.notification))
    this.app.post('/notification/removeCustomRingtone', (req, res) => controller.notification.removeCustomRingtone(req, res, this.notification))
    this.app.get('/browser/extensions', (req, res) => controller.browser.extensions(req, res, this.browser))
    this.app.post('/browser/addExtension', (req, res) => controller.browser.addExtension(req, res, this.browser))
    this.app.get('/browser/ext_icon', (req, res) => controller.browser.extIcon(req, res, this.browser))
    this.app.post('/browser/removeExtension', (req, res) => controller.browser.removeExtension(req, res, this.browser))
    this.app.post('/order/markProcessedOrder', (req, res) => controller.monitoring.markProcessedOrder(req, res, this.monitoring))
    this.app.post('/monitoring/bulkRefresh', (req, res) => controller.monitoring.bulkRefresh(req, res, this.monitoring))
    this.app.get('/public-monitoring/alias', (req, res) => controller.publicMonitoring.alias(req, res, this.publicMonitoring))
    this.app.get('/public-monitoring/active', (req, res) => controller.publicMonitoring.active(req, res, this.publicMonitoring))
    this.app.post('/public-monitoring/activeToggle', (req, res) => controller.publicMonitoring.activeToggle(req, res, this.publicMonitoring))
    this.app.post('/public-monitoring/changeAlias', (req, res) => controller.publicMonitoring.changeAlias(req, res, this.publicMonitoring))
    this.app.get("*", controller.renderFrontend);
  }

  /**
   * Initializes a socket connection and sets up event listeners for various socket events.
   *
   * @param {SocketServer} io - The SocketServer instance for the socket connection.
   */
  prepareSocket(io: SocketServer) {
    io.on("connection", (socket) => {
      const from: any = socket.handshake.auth.from;
      if (from === "free_feature__delete_product") {
        this.deleteProduct.sockets.push(socket);
        socket.on("start_delete_product", ({ accountId, id, value, notSold }) =>
          this.deleteProduct.start(accountId, {
            id,
            value,
            notSold,
          }),
        );
        socket.on("stop", () => this.deleteProduct.stop());
        socket.on("disconnect", () => {
          this.deleteProduct.sockets = this.deleteProduct.sockets.filter(
            (x) => x !== socket,
          );
        });
        this.deleteProduct.onNewClientConnected();
      } else if (from === "free_feature__product_uploader") {
        this.productUploader.sockets.push(socket);
        socket.on("disconnect", () => {
          this.productUploader.sockets = this.productUploader.sockets.filter(
            (x) => x !== socket,
          );
        });
        this.productUploader.onNewConnectionAttached();
      } else if (from === "main_data_column") {
        this.mainDataColumn.sockets.push(socket);
        socket.on("disconnect", () => {
          this.mainDataColumn.sockets.filter((x) => x !== socket);
        });
        this.mainDataColumn.sendData();
      } else if (from === "live_chat") {
        this.liveChat.sockets.push(socket);
        socket.on("disconnect", () => {
          this.liveChat.removeSocket(socket);
        });
        this.liveChat.sendSocketData();
      } else if (from === "operational_schedule") {
        this.operationalSchedule.sockets.push(socket);
        socket.on("disconnect", () => {
          this.operationalSchedule.sockets =
            this.operationalSchedule.sockets.filter((x) => x !== socket); // Remove socket from operational schedule
        });
        socket.on("start", ({ selectedIds, days }) => {
          this.operationalSchedule.start(selectedIds, days);
        });
      } else if (from === "holiday") {
        this.holiday.sockets.push(socket);
        socket.on("disconnect", () => {
          this.holiday.sockets = this.holiday.sockets.filter(
            (x) => x !== socket,
          );
        });
        socket.on("start", ({ selectedIds, range }) => {
          this.holiday.start(selectedIds, {
            from: range.from,
            to: range.to,
          });
        });
        socket.on("unset", ({ selectedIds }) => {
          this.holiday.unset({ selectedIds });
        });
        this.holiday.onNewConnectionAttached();
      } else if (from === "slogan") {
        this.slogan.sockets.push(socket);
        socket.on("disconnect", () => {
          this.slogan.sockets = this.slogan.sockets.filter((x) => x !== socket);
        });
        socket.on("start", ({ selectedIds, slogans, descriptions }) => {
          console.log({ selectedIds, slogans, descriptions });
          this.slogan.start(selectedIds);
        });
        this.slogan.sendRunning();
      } else if (from === "atur-foto-profil") {
        this.bulkUpdateProfilePhoto.sockets.push(socket);
        this.bulkUpdateProfilePhoto.onNewConnectionAttached();

        socket.on("disconnect", () => {
          this.bulkUpdateProfilePhoto.sockets =
            this.bulkUpdateProfilePhoto.sockets.filter((x) => x !== socket);
        });
        socket.on("start", ({ selectedIds, folder }) => {
          this.bulkUpdateProfilePhoto.apply({
            accountIds: selectedIds,
            folder,
          });
        });
      } else {
        this.account.sockets.push(socket);
        this.monitoring.sockets.push(socket);
        this.authenticator.sockets.push(socket);
        this.monitoring.sendBotStatus();
        this.monitoring.sendActiveFilter();
        socket.on("disconnect", () => {
          this.monitoring.sockets = this.monitoring.sockets.filter(
            (x) => x !== socket,
          );
          this.account.sockets = this.monitoring.sockets.filter(
            (x) => x !== socket,
          );
          this.authenticator.sockets = this.monitoring.sockets.filter(
            (x) => x !== socket,
          );
        });
        socket.on("bot-active-toggle", () =>
          this.monitoring.running
            ? this.monitoring.stop()
            : this.monitoring.start(),
        );
        socket.on("set-monitoring-active-filter", (item) => {
          this.monitoring.activeFilter = item;
          this.monitoring.sendActiveFilter();
          this.monitoring.sendMainData();
        });
        socket.on("get-monitoring-main-data", () =>
          this.monitoring.sendMainData(),
        );
        socket.on("get-free-feature-authenticator-data", () =>
          this.authenticator.sendData(),
        );
      }
    });
  }

  /**
   * Starts the server and prepares the necessary middleware and routes.
   *
   * @return {void}
   */
  start() {
    this.app.use(cors());
    this.app.use(bodyParser({ extended: true, limit: "150mb" }));
    this.prepareRoute();
    const server = http.createServer(this.app);
    const io = new SocketServer(server, {
      cors: {
        origin: this.isPackaged
          ? `http://localhost:${this.port}`
          : "http://localhost:3000",
        methods: ["POST", "GET"],
        credentials: true,
      },
    });
    this.prepareSocket(io);
    server.listen(this.port, () => {
      console.log(`Application is listening on port: ${this.port}`);
    });
  }
}
