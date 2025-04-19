import Database from "./Database";
import { Socket } from "socket.io";
import Browser from "./Browser";
import Monitoring from "./Monitoring";
import Group from "./Group";
// @ts-ignore
import * as otpauth from "otpauth";
import fetch, { Response } from "node-fetch";
import Notification from "./Notification";
import { Worksheet, Workbook } from "exceljs";
import * as exceljs from "exceljs";
import { app, dialog } from "electron";
import path from "path";
import fs from "fs";
import { Page, Puppeteer, Browser as PuppeteerBrowser } from "puppeteer";
import Setting from "./Setting";
import Device from "./Device";
import { authenticator } from "otplib";
import { AbortController } from "node-abort-controller";
import Authenticator from "./Authenticator";
import { shell } from 'electron'
import Queue from 'queue'
import chalk from "chalk";
import shuffleArray from 'shuffle-array'
import { downloadFile } from 'ipull'
// @ts-ignore
import { unzip } from 'als-zip-tools'
import xlsx from 'xlsx'
import Progress from 'cli-progress'
import Memory from "./Memory";
import moment from "moment";

export default class Account {
  private db: Database;
  private poProcessedMemory: Memory
  public group: Group | null;
  public sockets: Socket[];
  public monitoring: Monitoring | null;
  private browser: Browser;
  private notification: Notification;
  private loginUseragent: string;
  private setting: Setting;
  public device: Device;
  public authenticator: Authenticator | null;
  public accountImportErrors: AccountImportErrorList[]

  constructor(
    db: Database,
    setting: Setting,
    device: Device,
    notification: Notification
  ) {
    this.notification = notification;
    this.db = db;
    this.setting = setting;
    this.device = device;
    this.authenticator = null;
    this.initdb();
    this.monitoring = null;
    this.sockets = [];
    this.browser = new Browser();
    this.loginUseragent =
      "Mozilla/5.0 (Linux; Android 5.0; Mobile Chrome/41.0.2272.96)";
    this.group = null;
    this.accountImportErrors = []
    this.poProcessedMemory = new Memory({ type: 'number', prefix: 'po_processed', saveInterval: 2000 })
  }

  public async forceLogoutAllDevice(ids: number[]): Promise<void> {
    try {
      const hitUrl =
        "https://accounts.tokopedia.com/api/session-force-logout-all?type=web";
      for (const id of ids) {
        const account = await this.get(id);
        if (account.authenticated) {
          const cookiesRaw: string = this.parseCookiesToRaw(account.cookies);
          const headers = {
            cookie: cookiesRaw,
            accept: "*/*",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "en-US,en;q=0.9",
            origin: "https://www.tokopedia.com",
            referer: "https://www.tokopedia.com/user/settings/security",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-ch-ua":
              '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
          };
          console.log("requesting...");
        }
      }
      this.notification.show({
        title: "Logout semua perangkat",
        message: `${ids.length} Akun telah berhasil dikeluarkan dari semua perangkat kecuali perangkat saat ini / sesi saat ini`,
      });
    } catch (err) {
      this.notification.show({
        title: `Login semua perangkat`,
        message: `Gagal mengeluarkan semua perangkat: ${err.message || err}`,
      });
    }
  }

  /**
   * Generates a spreadsheet containing account data based on the specified parameters.
   *
   * @param {Object} options - The options for generating the spreadsheet.
   * @param {string} options.type - The type of accounts to include in the spreadsheet. Valid values are "moderated", "authenticated", "unauthenticated", "all", or "selected".
   * @param {any[]} options.selectedAccounts - An array of selected account IDs to include in the spreadsheet. Only applicable when `options.type` is set to "selected".
   * @return {Promise<null>} A Promise that resolves to `null` when the spreadsheet is generated and saved successfully.
   */
  async _exports({
    type,
    selectedAccounts,
  }: {
    type?:
    | "moderated"
    | "authenticated"
    | "unauthenticated"
    | "all"
    | "selected"
    | "all_with_moderation_date"
    selectedAccounts?: any[];
  }): Promise<null> {
    let downloadUrl: string =
      "https://ziqva.com/ziqva-labs-lite-account-template.xlsx";

    if(type === 'all_with_moderation_date') { // only with the moderation date
      downloadUrl = "https://ziqva.com/ziqva-labs-lite-account-template_withmoderationdate.xlsx"
    }
    const downloadResponse: Response = await fetch(downloadUrl);
    const bufferTemplate = Buffer.from(await downloadResponse.arrayBuffer());
    const workbook = new exceljs.Workbook();
    await workbook.xlsx.load(bufferTemplate);
    const worksheet = workbook.getWorksheet(1);
    const accounts: StructAccount[] = await this.all();
    let filteredAccounts: StructAccount[] = [];
    if (type === "all" || type === 'all_with_moderation_date') {
      filteredAccounts = accounts;
    } else if (type === "moderated") {
      filteredAccounts = accounts.filter((x) => x.moderated);
    } else if (type === "authenticated") {
      filteredAccounts = accounts.filter((x) => x.authenticated);
    } else if (type === "unauthenticated") {
      filteredAccounts = accounts.filter((x) => !x.authenticated);
    } else if (type === "selected") {
      filteredAccounts = accounts.filter((x) =>
        selectedAccounts.includes(x.id)
      );
    }
    if (!this.device.registered) {
      filteredAccounts = [];
    }
    for (const account of filteredAccounts) {
      let moderationDateStr = ''
      if(type === 'all_with_moderation_date') {
        const moderationDate = await this.monitoring.getModerationDate(account)
        moderationDateStr = moderationDate ? moment(moderationDate).format('DD-MM-YYYY HH:mm') : '-'
      }
      await worksheet.addRow([
        "",
        account.name,
        account.email,
        account.password,
        account.secretAutenticator,
        account.groupNames,
        JSON.stringify(account.cookies),
        moderationDateStr,
        account.productCount
      ]);
    }
    let res = dialog.showSaveDialogSync({
      defaultPath: path.resolve(
        app.getPath("downloads"),
        `Accounts AsistenQ Owner - ${filteredAccounts.length} data.xlsx`
      ),
    });
    if (typeof res !== "string") {
      throw new Error("Aksi dibatalkan oleh pengguna");
    }
    if (!res.endsWith('.xlsx')) { res += '.xlsx' }
    const resBuffer = await workbook.xlsx.writeBuffer();
    // @ts-ignore
    fs.writeFileSync(res, resBuffer);
    this.notification.show({
      title: "Berhasil",
      message: `${filteredAccounts.length} Akun telah berhasil tersimpan di "${res}"`,
      buttonOnClick: () => { },
    });
    return null;
  }

  /**
   * Updates an account with the provided information.
   *
   * @param {Object} params - The parameters for the update.
   * @param {number} params.id - The ID of the account to update.
   * @param {string} params.email - The new email for the account.
   * @param {string} params.password - The new password for the account.
   * @param {boolean} params.useAuthenticator - Whether to use an authenticator for the account.
   * @param {string} params.secretAuthenticator - The new secret for the authenticator.
   * @param {string} params.name - The new name for the account.
   * @param {string} params.groupNames - The new group names for the account.
   * @return {Promise<void>} A promise that resolves when the update is complete.
   */
  async update({
    id,
    email,
    password,
    useAuthenticator,
    secretAuthenticator,
    name,
    groupNames,
  }: {
    id: number;
    email: string;
    password: string;
    useAuthenticator: boolean;
    secretAuthenticator: string;
    name: string;
    groupNames: string;
  }): Promise<void> {
    const exists: boolean = await this.exists(id);
    if (!exists) {
      throw new Error("Akun tidak ditemukan");
    }
    var account: StructAccount = await this.get(id);
    const formattedName: string = name
      .split('"')
      .join("")
      .split("'")
      .join("")
      .trim();
    const formattedEmail: string = email
      .split('"')
      .join("")
      .split("'")
      .join("")
      .trim();
    const formattedSecretAuthenticator: string = secretAuthenticator
      .split('"')
      .join("")
      .split("'")
      .join("")
      .trim()
      .split(" ")
      .join("");
    if (formattedName.length < 3) {
      throw new Error("Nama terlalu pendek");
    }
    if (formattedEmail.length < 7) {
      throw new Error("Alamat email terlalu pendek");
    }
    const existsEmail: boolean = await this.exists(formattedEmail);
    if (existsEmail) {
      const newRes: StructAccount = await this.get(formattedEmail);
      if (newRes.id !== account.id) {
        throw new Error(
          `Email "${formattedEmail}" sudah digunakan oleh akun yang berbeda`
        );
      }
    }
    const formattedGroupNames: string = groupNames
      .split(",")
      .map((x) => x.trim())
      .map((x) => x.toLowerCase())
      .map((x) => x.split('"').join(""))
      .map((x) => x.split("'").join(""))
      .join(",");
    const i: number = this.monitoring.mainData.findIndex((x) => x.id === id);
    if (i >= 0) {
      this.monitoring.mainData[i].name = formattedName;
      this.monitoring.mainData[i].email = formattedEmail;
      this.monitoring.mainData[i].password = password;
      this.monitoring.mainData[i].useAuthenticator = useAuthenticator;
      this.monitoring.mainData[i].secretAutenticator =
        formattedSecretAuthenticator;
      this.monitoring.mainData[i].groupNames = formattedGroupNames;
    }

    const updateSql: string = ` 
            UPDATE account
            SET name = "${formattedName}",
                email = "${formattedEmail}",
                password = "${password}",
                secretAutenticator = "${formattedSecretAuthenticator}",
                useAuthenticator = ${useAuthenticator ? "true" : "false"},
                groupNames = '${formattedGroupNames}'
            WHERE id = "${id}"
        `;
    await this.db.query(updateSql);
    await this.group.addGroupFromRawString(formattedGroupNames);
    await this.monitoring.sendMainData();
    await this.notification.show({
      title: "Berhasil",
      message: `Akun "${formattedName}" telah berhasil diubah`,
    });
  }

  async remove({ ids }: { ids: number[] }): Promise<void> {
    let accountName: string = "";
    for (const id of ids) {
      const exists: boolean = await this.exists(id);
      if (exists) {
        accountName = (await this.get(id)).name;
        //Delete from the database
        await this.db.query(`DELETE FROM account WHERE id = "${id}"`);
        // Delete from the main data
        const i: number = this.monitoring.mainData.findIndex(
          (x) => x.id === id
        );
        if (i >= 0) {
          this.monitoring.mainData.splice(i, 1);
        }
      }
    }
    if (ids.length === 1 && accountName !== "") {
      const id: number = ids[0];
      const account: StructAccount = await this.get(id);
      this.notification.show({
        title: "Berhasil",
        message: `Akun ${accountName} telah berhasil dihapus.`,
      });
    }
    await this.monitoring.sendMainData();
  }

  /**
   * Retrieves the shop ID for a given ID.
   *
   * @param {number} id - The ID to retrieve the shop ID for.
   * @return {Promise<number>} The shop ID.
   */
  async getShopId(idOrCookies: number | any): Promise<number> {
    let cookies: object[] = [];
    if (typeof idOrCookies === "number") {
      const exists: boolean = await this.exists(idOrCookies);
      if (!exists) {
        throw new Error("Akun tidak ditemukan");
      }
      const account: StructAccount = await this.get(idOrCookies);
      cookies = account.cookies;
    } else {
      cookies = idOrCookies;
    }
    const rawCookies: string = this.parseCookiesToRaw(cookies);
    const headers = {
      cookie: rawCookies,
      "content-type": "application/json",
      referer: "https://seller.tokopedia.com/",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
      "x-source": "tokopedia-lite",
      "x-tkpd-lite-service": "icarus",
      "x-version": "bf3d806",
      accept: "application/json",
    };
    const targetUrl: string =
      "https://gql.tokopedia.com/graphql/isAuthenticatedQuery";
    const response: Response = await fetch(targetUrl, {
      headers: headers,
      method: "POST",
      body: JSON.stringify({
        operationName: "isAuthenticatedQuery",
        variables: {},
        query:
          "query isAuthenticatedQuery {\n   userShopInfo {\n    info {\n      shop_id\n    shop_avatar\n   shop_score\n      shop_location\n     }\n    owner {\n      owner_id\n      is_gold_merchant\n      pm_status\n  }\n    }\n\n}\n",
      }),
    });
    if (response.ok) {
      const data = await response.json();
      console.log(data);
      return parseInt(data.data.userShopInfo.info.shop_id);
    } else {
      throw new Error(
        `Failed for get the shopid because tokopedia was returned error code: ${response.statusText}`
      );
    }
  }

  /**
   * Parses an array of cookies into a raw string representation.
   *
   * @param {any[]} cookies - An array containing the cookies to be parsed.
   * @return {string} - The raw string representation of the parsed cookies.
   */
  parseCookiesToRaw(cookies: any[]): string {
    let t = "";
    for (const cookie of cookies) {
      t += `${cookie.name}=${cookie.value};`;
    }
    return t;
  }

  /**
   * Generates a unique ID by returning the current timestamp.
   *
   * @return {Promise<number>} The generated ID.
   */
  async generateId(): Promise<number> {
    const res = new Date().valueOf();
    await new Promise((r) => setTimeout(r, 100));
    return res;
  }

  /**
   * Adds a new account to the system.
   *
   * @param {Object} params - The parameters for the new account.
   * @param {string} params.name - The name of the account.
   * @param {string} params.email - The email of the account.
   * @param {string} params.password - The password of the account.
   * @param {string} params.authenticator - The authenticator of the account.
   * @param {boolean} params.useAuthenticator - Whether to use the authenticator.
   * @param {string} params.labels - The labels of the account.
   * @param {boolean} params.authenticated - Whether the account is authenticated.
   * @param {any} params.cookies - The cookies of the account.
   * @return {Promise<void>} A promise that resolves when the account is added.
   */
  async add({
    name,
    email,
    password,
    authenticator,
    useAuthenticator,
    labels,
    authenticated,
    cookies,
  }: {
    name: string;
    email: string;
    password: string;
    authenticator: string;
    useAuthenticator: boolean;
    labels: string;
    authenticated: boolean;
    cookies: any[];
  }): Promise<void> {
    const targetId: number = await this.generateId();
    const nameFormatted: string = name.trim().split('"').join("");
    const emailFormatted: string = email
      .trim()
      .toLowerCase()
      .split('"')
      .join("");
    const passwordFormatted: string = password.trim().split('"').join("");
    const authenticatorFormatted: string = authenticator
      .trim()
      .split('"')
      .join("")
      .split(" ")
      .join("");
    const labelsFormatted: string = labels
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x.length > 0)
      .map((x) => x.toLowerCase())
      .join(",")
      .split('"')
      .join("")
      .split("'")
      .join("");
    await this.group.addGroupFromRawString(labelsFormatted);
    if (nameFormatted.length < 1) {
      throw new Error("Nama terlalu pendek");
    } else if (emailFormatted.length < 1) {
      throw new Error("Email harus diisi");
    }
    let shopid = 0;
    const exists: boolean = await this.exists(emailFormatted);
    if (exists) {
      throw new Error("Akun sudah ditambahkan sebelumnya");
    }

    if (cookies.length > 0) {
      while (true) {
        try {
          shopid = await this.getShopId(cookies);
          if (shopid == 0) {
            await new Promise((r) => setTimeout(r, 500));
            continue;
          } else {
            break;
          }
        } catch (err) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    }

    const currentEpoch: number = new Date().valueOf();
    const sql = `
            INSERT INTO account VALUES(
                ${targetId},
                "${nameFormatted}",
                "${emailFormatted}",
                "${passwordFormatted}",
                false,
                ${currentEpoch},
                '${JSON.stringify(cookies)}',
                ${useAuthenticator ? "true" : "false"},
                "${authenticatorFormatted}",
                "", 
                0, 
                0, 
                0,
                0, 
                0,
                0,
                0, 
                0,
                0,
                0,
                0,
                0,
                0, 
                0,
                "",
                "",
                "",
                false,
                false,
                0,
                0,
                "${labelsFormatted}", 
                0,
                false,
                ${isNaN(shopid) ? 0 : shopid},
                ${authenticated && !isNaN(shopid) ? "true" : "false"},
                '',
                '',
                '',
                '',
                0,
                0,
                0,
                0,
                0,
                0,
                null,
                null,
                0,
                0,
                0
            )
        `;
    await this.db.query(sql);
    const account: StructAccount = {
      name: nameFormatted,
      email: emailFormatted,
      password: passwordFormatted,
      avatar: "",
      moderated: false,
      added: currentEpoch,
      cookies: cookies,
      authenticated: authenticated,
      useAuthenticator: useAuthenticator,
      secretAutenticator: authenticatorFormatted,
      id: targetId,
      lastUpdated: 0,
      chatCount: 0,
      lastChatEpoch: 0,
      groupNames: labelsFormatted,
      orderEpoch: 0,
      orderCount: 0,
      orderPotency: 0,
      balance: 0,
      dikemasCount: 0,
      dikemasPotency: 0,
      dikemasEpoch: 0,
      dikirimCount: 0,
      dikirimPotency: 0,
      complaintCount: 0,
      complaintPotency: 0,
      freeOngkir: false,
      powerMerchant: false,
      productCount: 0,
      score: 0,
      shopid: shopid,
      warning: false,
      bankName: "",
      bankNumber: "",
      bankAN: "",
      discusCount: 0,
      location: "",
      pmImage: "",
      badgeImage: "",
      pmName: "",
      inactiveProduct: 0,
      activeProduct: 0,
      archivedProduct: 0,
      violationProduct: 0,
      productSpace: 0,
      pinned: 0,
      pinnedAt: null,
      statusMessage: null,
      pmRevoked: 0,
      pmSort: 0,
      statusSort: 0
    };

    this.monitoring.mainData.push(account);
    this.monitoring.sendMainData();
    this.group.recount();
    if (this.authenticator && account.useAuthenticator) {
      this.authenticator.add({
        label: account.name,
        email: account.email,
        secret: account.secretAutenticator,
        throwOnError: false,
      });
    }
  }

  /**
   * Imports data from a buffer into the system.
   *
   * @param {Buffer} buffer - The buffer containing the data to be imported.
   * @return {Promise<void>} A promise that resolves when the import is complete.
   */
  async imports(buffer: Buffer): Promise<void> {
    this.accountImportErrors = []
    const workbook: Workbook = new exceljs.Workbook();
    await workbook.xlsx.load(buffer);
    let values;
    const worksheet: Worksheet = await workbook.getWorksheet(1);
    const rows = await worksheet.getRows(1, worksheet.rowCount);
    let stats: any = {
      success: 0,
      failed: 0,
    };
    for (let i = 0; i < rows.length; i++) {
      if (i < 2) {
        continue;
      }
      const row = rows[i];
      values = [
        row.getCell(1).value ? row.getCell(1).value : row.getCell(1).text,
        row.getCell(2).value ? row.getCell(2).value : row.getCell(2).text,
        row.getCell(3).value ? row.getCell(3).value : row.getCell(3).text,
        row.getCell(4).value ? row.getCell(4).value : row.getCell(4).text,
        row.getCell(5).value ? row.getCell(5).value : row.getCell(5).text,
        row.getCell(6).value ? row.getCell(6).value : row.getCell(6).text,
        row.getCell(7).value ? row.getCell(7).value : row.getCell(7).text,
      ];
      const error: string = values[0].toString().trim();
      const name: string = values[1]
        .toString()
        .trim()
        .split('"')
        .join("")
        .split("'")
        .join("");
      const email: string = values[2]
        .toString()
        .trim()
        .split('"')
        .join("")
        .split("'")
        .join("");
      const password: string = values[3]
        .toString()
        .trim()
        .split('"')
        .join("")
        .split("'")
        .join("");
      const authenticator: string = values[4]
        .toString()
        .trim()
        .split('"')
        .join("")
        .split("'")
        .join("");
      const groups: string = values[5]
        .toString()
        .trim()
        .split('"')
        .join("")
        .split("'")
        .join("");
      let cookies: any[] = [];
      try {
        cookies = JSON.parse(values[6].toString());
      } catch (err) {
        console.error("failed for parse cookies: ", err.message);
        console.error(values[6]);
      }

      try {
        await this.add({
          name: name,
          email: email,
          password: password,
          authenticator: authenticator,
          labels: groups,
          cookies: cookies,
          useAuthenticator: authenticator.length > 0,
          authenticated: cookies.length >= 1,
        });
        stats.success++;
      } catch (err) {
        this.notification.show({
          title: `Tidak dapat menambahkan`,
          message: `Akun "${name}" gagal ditambahkan karena: ${err.message || err
            }`,
          buttonOnClick: undefined,
        });
        this.accountImportErrors.push({
          name,
          email,
          reason: err.message || err
        })
        stats.failed++;
      }
    }

    this.notification.show({
      title: "Import selesai",
      message: `Berhasil ${stats.success} akun ditambahkan, ${stats.failed} akun gagal ditambahkan`,
      buttonOnClick: undefined,
    });
    const viewErrorsUrl = 'http://localhost:9183/api/import-error-list?e=' + moment().tz("Asia/Jakarta").unix()
    shell.openExternal(viewErrorsUrl)
  }

  /**
   * Initializes the database by creating the 'account' table if it does not already exist.
   *
   * @return {Promise<void>} - A promise that resolves when the database has been initialized.
   */
  async initdb(): Promise<void> {
    const sql = `
            CREATE TABLE IF NOT EXISTS account(
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
                pinned INT(1),
                pinnedAt INTEGER
            )
        `;
    await this.db.query(sql);

    // Create a more column
    const data: AccountInitDBAddColumn[] = [
      {
        name: "pinned",
        type: "INT(1)",
        allowNull: false,
        default: 0
      },
      {
        name: "pinnedAt",
        type: "BIGINT",
        allowNull: true,
        default: null
      },
      {
        name: "statusMessage",
        type: "STRING",
        allowNull: true,
        default: null
      },
      {
        name: "pmSort",
        type: "INTEGER",
        allowNull: false,
        default: 0
      },
      {
        name: "statusSort",
        type: "INTEGER",
        allowNull: false,
        default: 0
      }
    ];

    for (const row of data) {
      try {
        const addColumnsql: string = `
          ALTER TABLE account
          ADD ${row.name} ${row.type} DEFAULT ${row.default};
        `;
        await this.db.query(addColumnsql);
      } catch (err) { }
    }
  }

  /**
   * Logs in a single user.
   *
   * @param {Object} options - The options for logging in.
   * @param {number} options.id - The ID of the user.
   * @param {Page} options.page - The page object for the login page.
   * @return {Promise<void>} A promise that resolves when the login is successful.
   */
  async loginSingle({
    id,
    page,
    controller,
    closedLoginError
  }: {
    id: number;
    page: Page;
    controller: AbortController;
    closedLoginError?: boolean
  }): Promise<void> {
    const exists: boolean = await this.exists(id);
    if (!exists) {
      throw new Error("Akun tidak ditemukan");
    }

    const detectError = async () => {
      while (!page.isClosed()) {
        try {
          const el = await page.$('.unf-input-info__msg span')
          if (el) {
            const text = await el.evaluate(x => x.textContent)
            if (text.includes('tidak dapat')) {
              await page.close()
              await this.setAuthenticated(id, false)
              throw new Error(text)
            }
          }
        } catch (err) { }
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    if(closedLoginError) {
      detectError()
    }

    const account: StructAccount = await this.get(id);
    const client = await page.target().createCDPSession();
    await client.send("Network.clearBrowserCookies");
    await page.setUserAgent(this.loginUseragent);
    await this.browser.navigatePage(
      page,
      "https://mitra.tokopedia.com/login",
      30
    );
    const els = {
      emailField: "input[name='login']",
      nextBtnFromEmail: 'button[data-testid="email-phone-submit"]',
      passwordField: "input#login-widget-password:not(:disabled)",
      nextBtnFromPassword: "#button-submit:not(:disabled)",
      authenticatorMethodItem: "section[data-unify]",
      otpField: 'input[aria-label="otp input"]:not(:disabled)',
      authenticated: '[data-testid="divHomeHomeWrapper"]',
    };
    // controller.signal.addEventListener("abort", () => {
    //   throw new Error(controller.signal.reason);
    // });
    // wait until email input element is presented
    // controller.signal.addEventListener("abort", () => {
    //   throw new Error(controller.signal.reason);
    // });
    // wait until email input element is presented
    console.log("Waiting for email element");
    const emailField = await page.waitForSelector(els.emailField, {
      timeout: 0,
      visible: true,
    });
    await new Promise((r) => setTimeout(r, 800));
    await emailField.click({ clickCount: 3 });
    console.log("Email email element clicked");
    await emailField.type(account.email);
    // const nextBtnFromEmail = await page.waitForSelector(els.nextBtnFromEmail, {
    //   timeout: 0,
    //   visible: true,
    // });
    // await nextBtnFromEmail.click();
    await emailField.press("Enter");
    if (controller.signal.aborted) {
      return;
    }
    if (this.isValidEmail(account.email)) {
      const passwordField = await page.waitForSelector(els.passwordField, {
        timeout: 0,
        visible: true,
      });
      await passwordField.type(account.password);
      await passwordField.press("Enter");
      // const submitLogin = await page.waitForSelector(els.nextBtnFromPassword, {
      //   timeout: 0,
      //   visible: true,
      // });
      // await submitLogin.click();

      if (controller.signal.aborted) {
        return;
      }
      if (account.useAuthenticator) {
        await page.waitForSelector(els.authenticatorMethodItem, {
          timeout: 0,
          visible: true,
          hidden: false,
        });
        const methods = await page.$$(els.authenticatorMethodItem);
        for (const method of methods) {
          const i = methods.indexOf(method) + 1;
          const text = await method.evaluate((x) => x.textContent);
          if (text.toLowerCase().includes("google authenticator")) {
            try {
              await method.evaluate((x: any) => x.click());
            } catch (err) { }
          }
        }
        console.log("Waiting for otp field is being presented");
        const otpField = await page.waitForSelector(els.otpField, {
          timeout: 0,
          visible: true,
        });
        await otpField.type(
          this.generateOtpCodeFromSecret(account.secretAutenticator)
        );
      } else {
        this.notification.show({
          title: account.name,
          message:
            "Otomatisasi login menggunakan authenticator nonaktif, silahkan pilih opsi untuk melakukan login",
          buttonOnClick: undefined,
        });
      }
      if (controller.signal.aborted) {
        return;
      }
    } else {
      if (controller.signal.aborted) {
        return;
      }
      this.notification.show({
        title: account.name,
        message:
          "Proses login terotomatisasi selain menggunakan email tidak didukung, silahkan lanjutkan proses login hingga selesai",
        buttonOnClick: undefined,
      });
    }
    // Wait until
    while (true) {
      if (controller.signal.aborted) {
        return;
      }
      const url: string = await page.url();
      if (url.split("?")[0] === "https://mitra.tokopedia.com/") {
        break;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    // await this.browser.navigatePage(page, "https://tokopedia.com/user");
    // await new Promise((r) => setTimeout(r, 1000));
    if (controller.signal.aborted) {
      return;
    }
    const cookies = await page.cookies();
    if (controller.signal.aborted) {
      return;
    }

    let shopid;
    if (controller.signal.aborted) {
      return;
    }
    while (true) {
      if (controller.signal.aborted) {
        return;
      }
      console.log("getting the shopid");
      shopid = await this.getShopId(cookies);
      console.log("shopid taked: ", shopid);
      if (shopid != 0) {
        await this.setShopId(shopid, account.id);
        break;
      } else {
        console.log("failed for get the shopid");
        await new Promise((r) => setTimeout(r, 900));
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    if (controller.signal.aborted) {
      return;
    }
    await this.setCookies(id, cookies);
    await this.setAuthenticated(id, true);
    await this.setShopId(shopid, id);
    if (controller.signal.aborted) {
      return;
    }
    this.monitoring.sendMainData();
    if (controller.signal.aborted) {
      return;
    }
    this.notification.show({
      title: account.name,
      message: "Login berhasil",
      buttonOnClick: undefined,
    });
  }

  /**
   * Login to the system using the provided user ID.
   *
   * @param {number} id - The ID of the user.
   * @return {Promise<void>} - A promise that resolves when the login is successful.
   * @throws {Error} - If the account is not found.
   */
  async login(ids: number[], chromeUserData?: string): Promise<void> {
    for (const id of ids) {
      const { browser, page } = await this.browser.getBrowser(chromeUserData ? chromeUserData : "login", [
        "--incognito",
        "--window-size=700,600",
        '--window-position=0,0',
        '--disable-backgrounding-occluded-windows',
        '--disable-background-timer-throttling'
      ]);
      try {
        const timeout: number = await this.setting.get("auth_timeout");
        const controller: AbortController = new AbortController();
        let timeoutTimeout;
        await Promise.race([
          this.loginSingle({ page, id, controller }),
          new Promise((r) => {
            timeoutTimeout = setTimeout(() => {
              r("timed_out");
              controller.abort("Timed out");
              this.notification.show({
                title: "Login Gagal",
                message: `${id} - Error timed out`,
              });
            }, timeout);
          }),
        ]);
        if (timeoutTimeout) {
          clearTimeout(timeoutTimeout);
        }
      } catch (err) {
        const msg = err.message || err;
        this.notification.show({
          title: "Login Gagal",
          message: msg,
        });
        if (msg !== "Error timed out") {
          break;
        }
        console.error(msg)
      } finally {
        await new Promise((r) => setTimeout(r, 500));
        try {
          await browser.close();
        } catch (err) { }
        try {
          await process.kill(browser.process().pid)
        } catch(err) {}
      }
    }
    
  }

  async setShopId(shopid: number, id: number): Promise<void> {
    const sql = `
            UPDATE account SET shopid = ${shopid} WHERE id = "${id}"
        `;
    await this.db.query(sql);
    const i: number = this.monitoring.mainData.findIndex((x) => x.id == id);
    if (i >= 0) {
      this.monitoring.mainData[i].shopid = shopid;
    }
  }

  async setAuthenticated(id: number, state: boolean): Promise<void> {
    const sql = `UPDATE account SET authenticated = ${state} WHERE id = "${id}"`;
    await this.db.query(sql);
    const i: number = this.monitoring.mainData.findIndex((x) => x.id == id);
    if (i >= 0) {
      this.monitoring.mainData[i].authenticated = state;
    }
    this.monitoring.sendMainData();
  }

  async setCookies(id: number, cookies: object[]): Promise<void> {
    try {
      const sql = `
            UPDATE account
                SET cookies = '${JSON.stringify(cookies).split("'").join("____")}'
                WHERE id = "${id}"
        `;
      await this.db.query(sql);
      const i: number = this.monitoring.mainData.findIndex((x) => x.id == id);
      if (i >= 0) {
        this.monitoring.mainData[i].cookies = cookies;
      }
      this.monitoring.sendMainData();
      console.log('COOKIES UPDATED')
    } catch (err) {
      console.error('FAILED UPDATE COOKIES: ')
      console.error(err)
    }
  }

  /**
   * Generates an OTP code from the given secret.
   *
   * @param {any} secret - The secret used to generate the OTP code.
   * @return {string} The generated OTP code as a string.
   */
  generateOtpCodeFromSecret(secret: any): string {
    return authenticator.generate(secret);
  }

  /**
   * Validates if the given email is in a valid format.
   *
   * @param {string} email - The email to be validated.
   * @return {boolean} Returns true if the email is valid, otherwise false.
   */
  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Retrieves all account data that matches the given search string.
   *
   * @param {string} search - The search string to filter the accounts by.
   * @return {Promise<StructAccount[]>} - A promise that resolves to an array of StructAccount objects.
   */
  async all(search: string = ""): Promise<StructAccount[]> {
    let data: StructAccount[] = [];
    const sql = `
            SELECT * FROM account 
            WHERE name LIKE "%${search}%"
            OR email LIKE "%${search}%"
            OR password LIKE "%${search}%"
        `;
    const resData: any = await this.db.query(sql);
    for (const row of resData) {
      data.push({
        id: row?.id,
        name: row?.name,
        email: row?.email,
        password: row?.password,
        moderated: this.parseBoolean(row?.moderated),
        added: row?.added,
        cookies: JSON.parse(row?.cookies.split('____').join("'")),
        useAuthenticator: this.parseBoolean(row?.useAuthenticator),
        avatar: row?.avatar,
        lastUpdated: row?.lastUpdated,
        chatCount: row?.chatCount,
        lastChatEpoch: row?.lastChatEpoch,
        secretAutenticator: row?.secretAutenticator,
        orderEpoch: row?.orderEpoch,
        orderPotency: row?.orderPotency,
        orderCount: row?.orderCount,
        balance: row?.balance,
        dikemasCount: row?.dikemasCount,
        dikemasEpoch: row?.dikemasEpoch,
        dikemasPotency: row?.dikemasPotency,
        dikirimCount: row?.dikirimCount,
        dikirimPotency: row?.dikirimPotency,
        complaintCount: row?.complaintCount,
        complaintPotency: row?.complaintPotency,
        bankName: row?.bankName,
        bankNumber: row?.bankNumber,
        bankAN: row?.bankAN,
        freeOngkir: this.parseBoolean(row?.freeOngkir),
        powerMerchant: this.parseBoolean(row?.powerMerchant),
        productCount: row?.productCount,
        score: row?.score,
        groupNames: row?.groupNames,
        discusCount: row?.discusCount,
        warning: this.parseBoolean(row?.warning),
        shopid: row?.shopid,
        authenticated: this.parseBoolean(row?.authenticated),
        location: row?.location,
        badgeImage: row?.badgeImage,
        pmImage: row?.pmImage,
        pmName: row?.pmName,
        violationProduct: row?.violationProduct,
        activeProduct: row?.activeProduct,
        archivedProduct: row?.archivedProduct,
        inactiveProduct: row?.inactiveProduct,
        productSpace: row?.productSpace,
        pinned: row?.pinned,
        pinnedAt: row?.pinnedAt,
        statusMessage: row?.statusMessage === 'null' ? null : row?.statusMessage,
        pmRevoked: row?.pmRevoked,
        pmSort: row?.pmSort,
        statusSort: row?.statusSort
      });
    }
    return data;
  }

  /**
   * Checks if the given ID or email exists in the account table.
   *
   * @param {number | string} idOrEmail - The ID or email to check.
   * @return {Promise<boolean>} A boolean indicating if the ID or email exists.
   */
  async exists(idOrEmail: number | string): Promise<boolean> {
    const sql = `SELECT COUNT(id) 
            FROM account 
            WHERE id = "${idOrEmail}" OR email = "${idOrEmail}"`;
    const res: any = await this.db.query(sql);
    return res[0]["COUNT(id)"] > 0;
  }

  parseBoolean(data: boolean | number): boolean {
    if (typeof data === "boolean") {
      return data;
    }
    return data === 1;
  }

  /**
   * Retrieves the name of the first group associated with the given account ID.
   *
   * @param {number} id - The ID of the account.
   * @return {null | string} The name of the first group, or null if no group is found.
   */
  public getFirstGroupName(id: number): null | string {
    const account = this.monitoring.mainData.find((x) => x.id === id);
    if (!account) return null;
    const groups: string[] = account.groupNames
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
    if (groups.length < 1) return null;
    return groups[0];
  }

  /**
   * Retrieves an account with the specified ID.
   *
   * @param {number} id - The ID of the account to retrieve.
   * @param {boolean} checkExisting - Optional. Specifies whether to check if the account exists before retrieving it. Default is true.
   * @return {Promise<StructAccount | null>} - A promise that resolves to the retrieved account if successful, or null if the account doesn't exist and checkExisting is true.
   */
  async get(
    idOrEmail: number | string,
    checkExisting: boolean = true
  ): Promise<StructAccount | null> {
    if (checkExisting && !(await this.exists(idOrEmail))) {
      return null;
    } else {
      const sql: string = `
                SELECT * FROM account 
                WHERE id = "${idOrEmail}" OR email = "${idOrEmail}"
            `;
      const results: any = await this.db.query(sql);
      const res: any = results[0];
      const acc: StructAccount = {
        location: res?.location,
        id: res?.id,
        name: res?.name,
        email: res?.email,
        password: res?.password,
        moderated: this.parseBoolean(res?.moderated),
        added: res?.added,
        cookies: JSON.parse(res?.cookies.split('____').join("'")),
        useAuthenticator: this.parseBoolean(res?.useAuthenticator),
        avatar: res?.avatar,
        lastUpdated: res?.lastUpdated,
        chatCount: res?.chatCount,
        lastChatEpoch: res?.lastChatEpoch,
        secretAutenticator: res?.secretAutenticator,
        orderEpoch: res?.orderEpoch,
        orderPotency: res?.orderCount,
        orderCount: res?.orderCount,
        balance: res?.balance,
        dikemasCount: res?.dikemasCount,
        dikemasEpoch: res?.dikemasEpoch,
        dikemasPotency: res?.dikemasPotency,
        dikirimCount: res?.dikirimCount,
        dikirimPotency: res?.dikirimPotency,
        complaintCount: res?.complaintCount,
        complaintPotency: res?.complaintPotency,
        bankName: res?.bankName,
        bankNumber: res?.bankNumber,
        bankAN: res?.bankAN,
        freeOngkir: this.parseBoolean(res?.freeOngkir),
        powerMerchant: this.parseBoolean(res?.powerMerchant),
        productCount: res?.productCount,
        score: res?.score,
        groupNames: res?.groupNames,
        discusCount: res?.discusCount,
        warning: this.parseBoolean(res?.warning),
        shopid: res?.shopid,
        authenticated: this.parseBoolean(res?.authenticated),
        pmImage: res?.pmImage,
        badgeImage: res?.badgeImage,
        pmName: res?.pmName,
        violationProduct: res?.violationProduct,
        activeProduct: res?.activeProduct,
        inactiveProduct: res?.inactiveProduct,
        archivedProduct: res?.archivedProduct,
        productSpace: res?.productSpace,
        pinned: res?.pinned,
        pinnedAt: res?.pinnedAt,
        statusMessage: res?.statusMessage === 'null' ? null : res?.statusMessage,
        pmRevoked: res?.pmRevoked,
        pmSort: res?.pmSort,
        statusSort: res?.statusSort
      };
      return acc;
    }
  }


  // THE FEATURE IN THE BOTTOM JUST FOCUSED FOR INTERNAL TEAM

  private generateHeaders(acc: StructAccount): any {
    function parseCookiesToRaw(cookies: any[]): string {
      let t = "";
      for (const cookie of cookies) {
        t += `${cookie.name}=${cookie.value};`;
      }
      return t;
    }

    const headers = {
      cookie: parseCookiesToRaw(acc.cookies),
      "content-type": "application/json",
      referer: "https://seller.tokopedia.com/chat",
      origin: "https://seller.tokopedia.com",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
      "x-source": "tokopedia-lite",
      "x-tkpd-lite-service": "icarus",
      "x-version": "bf3d806",
      accept: "application/json",
    };
    return headers
  }

  private async downloadBasicInformation(page: Page, acc: StructAccount): Promise<string> {
    const dir = path.join(process.cwd(), 'downloads')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir)
    const headers = await this.generateHeaders(acc)
    const requestURL = 'https://api.tokopedia.com/variants/api/v1/bulk/edit/template/generate?request_type=basic&filter_by=all&include_shipper=true'
    const response = await fetch(requestURL, {
      method: "GET",
      headers: headers,
    })
    if (!response.ok) {
      this.polog(acc, 'Failed for download basic information: ' + response.status.toString())
      throw new Error('Error')
    }
    const data: any = await response.json()
    const reqId = data.data.GeneratedReqID
    while (true) {
      // Waiting until process is completed
      const url = 'https://sse.tokopedia.com/api/v1/bulk/edit/template/generate/progress?request_id=' + reqId
      const response = await fetch(url, {
        method: "GET",
        headers
      })
      if (response.ok) {
        const data: any = JSON.parse((await response.text()).split("data: ").pop())
        const status = data.data.process_status
        const filename = data.data.file_name
        if (status === 'COMPLETED') {
          // Download file first from the url
          const downloadUrl = 'https://api.tokopedia.com/variants/api/v1/bulk/edit/template?filename=' + filename
          const downloader = await downloadFile({
            fileName: filename,
            directory: dir,
            url: downloadUrl,
            headers: headers
          })
          await downloader.download()
          const targetPath = path.join(dir, filename)
          return targetPath
        }
      }
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  private polog(account: StructAccount, msg: string): void {
    console.log(chalk.green.bold(`${account.email}<${account.id}>: ${msg}`))
  }

  private async extractTemplate(zipPath: string): Promise<string[]> {
    const files = await unzip(fs.readFileSync(zipPath))
    const dir = path.join(process.cwd(), 'downloads', path.parse(zipPath).name)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir)
    let res: string[] = []
    for (const file of Object.entries(files)) {
      const filePath = path.join(dir, path.basename(file[0]))
      // @ts-ignore
      fs.writeFileSync(filePath, file[1])
      res.push(filePath)
    }
    fs.unlinkSync(zipPath)
    return res
  }

  private async editPOFile(filePath: string, duration: number, shopid: number): Promise<void> {
    const workbook = xlsx.readFile(filePath)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 3 })
    const currentPo = Object.entries(rows[4])[6][1]
    // if (currentPo === duration.toString()) {
    //   this.poProcessedMemory.add(shopid)
    //   throw new Error('Account is already uploaded another moment')
    // }

    for (let i = 0; i < rows.length; i++) {
      const cellAddress = xlsx.utils.encode_cell({ r: i + 3, c: 7 })
      worksheet[cellAddress] = { v: duration.toString() }
    }

    await xlsx.writeFile(workbook, filePath)
    console.log('Process finished')
  }

  private async fixSinglePO(account: StructAccount, { duration }: {
    duration: number
  }): Promise<void> {
    let _: PuppeteerBrowser = null
    try {
      if (this.poProcessedMemory.has(account.shopid)) return
      this.polog(account, 'Start for processing')
      if (!account.authenticated) { throw new Error('Unauthenticated') }
      if (account.moderated) { throw new Error('Moderated') }
      this.polog(account, 'Refreshing monitoring data')
      await this.monitoring.refresh(account)
      const { browser, page } = await this.browser.getBrowser(`FixPOAndPrice_${account.shopid}`, ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'])
      _ = browser
      browser.on('disconnect', () => {
        throw new Error("Browser disconnected!")
      })
      await this.browser.clearData(page)
      // @ts-ignore
      await page.setCookie(...account.cookies)
      // Make sure this account is not logout
      await this.browser.navigatePage(page, 'view-source:https://www.tokopedia.com/user/settings')
      const url = await page.url()
      if (url.includes('login')) {
          await this.login([account.id], `login_${account.id}`)
          account = await this.get(account.id, true)
          // @ts-ignore
          await page.setCookie(...account.cookies)
      }
      // @ts-ignore
      await page.setCookie(...account.cookies)
      this.polog(account, 'Downloading the basic information')
      const templateBasicInformationPath = await this.downloadBasicInformation(page, account)
      this.polog(account, 'Basic template is already downloaded, extracting...')
      const basicInformationFiles = await this.extractTemplate(templateBasicInformationPath)
      this.polog(account, 'Basic information file extracted, editing...')
      for (const file of basicInformationFiles) {
        await this.editPOFile(file, duration, account.shopid)
      }
      this.polog(account, `${basicInformationFiles.length} file has been edited, uploading...`)

      await page.emulate({
        viewport: {
          deviceScaleFactor: 0.6,
          width: 1280,
          height: 800
        },
        userAgent: ''
      })

      page.evaluateOnNewDocument(() => {
        setInterval(() => {
          const docs = [
            ...document.querySelectorAll('*[label*="overlay"]'),
            ...document.querySelectorAll('*[aria-label*="overlay"]'),
            ...document.querySelectorAll('.css-12kppra')
          ]
          for (const doc of docs) {
            doc.remove()
          }
        }, 500)
      })

      // Upload file and wait until finished
      for (const file of basicInformationFiles) {
        this.polog(account, 'Uploading file: ' + file)
        while (!page.isClosed()) {
          try {
            await this.browser.navigatePage(page, 'https://seller.tokopedia.com/bulk/edit?type=SELLABLE');
            const url = await page.url()
            if(url.includes('login')) {
              await browser.close()
              return
            }
            await page.waitForSelector('input[type="file"]', { timeout: 20000 });
            (await page.$('input[type="file"]')).uploadFile(file)
            await page.waitForSelector('xpath///span[contains(text(), "Upload")]', { timeout: 20000, visible: true })
            break
          } catch (err: any) { }
        }
        await new Promise(r => setTimeout(r, 1000))
        const uploadBtn = await page.waitForSelector('xpath///span[contains(text(), "Upload")]', { timeout: 0, visible: true })
        await uploadBtn.click()
        await page.waitForSelector('div[role="alert"]', { timeout: 0, visible: true, hidden: false })
        fs.unlinkSync(file)
      }
      this.poProcessedMemory.add(account.shopid)
    } catch (err: any) {
      console.error(err)
      console.error(chalk.red.bold(`Failed for process account: ${account.email} <${err.message || err}>`))
    } finally {
      if (_) {
        try {
          await _.process().kill()
        } catch (err) { }
        try {
          await _.close()
        } catch (err) { }
      }
      this.polog(account, 'COMPLETED!')
    }
  }

  public async FixPOAndPriceMain(): Promise<void> {
    const all = shuffleArray(await this.all()).filter(x => x.authenticated)
    const queue = new Queue({ results: [], autostart: true, concurrency: 5, timeout: 350000 })
    let finish = 0
    console.log(`${finish}/${all.length}`)

    queue.addEventListener('success', () => {
      finish++
      console.log(`${finish}/${all.length}`)
    })

    for (const account of all) {
      const task = async () => {
        await this.fixSinglePO(account, { duration: 25 })
      }
      queue.push(task)
    }
  }
  
  public async detectLogoutandLogin(): Promise<void> {
    const accounts = await this.all()
    const { page, browser } = await this.browser.getBrowser('detlogoutlogin', [])
    const loginQueue = new Queue({results: [], concurrency: 1, autostart: true})
    for(const account of accounts.filter(x => x.authenticated)) {
      await this.browser.clearData(page)
      // @ts-ignore
      await page.setCookie(...account.cookies)
      await this.browser.navigatePage(page, 'view-source:https://tokopedia.com/user/settings')
      const url = await page.url()
      if(url.includes('login')) {
        const task = async() => {
          await this.login([account.id])
        }
        loginQueue.push(task)
      }
    }
    await browser.close()
  }

  public async ids(): Promise<number[]> {
    const sql: string = 'SELECT id FROM account'
    const res: any = await this.db.query(sql)
    return res.map((x: any) => x.id)
  }
}

