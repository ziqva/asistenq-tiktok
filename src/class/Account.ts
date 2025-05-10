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
import { HTTPRequest, HTTPResponse, Page, Puppeteer, Browser as PuppeteerBrowser } from "puppeteer";
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
import queryString from "query-string";

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
    let downloadUrl: string = "http://ziqva-resource.streampeg.com/asistenq-tiktok-import-template.xlsx";
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
        account.shopid.toString(),
        account.auth.fp.toString(),
        account.auth.oecSellerId.toString(),
        account.auth.aid.toString(),
        account.auth.msToken.toString(),
        account.auth.XBogus.toString(),
        account.auth.signature.toString()
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
  async getShopId(idOrCookies: number | any): Promise<string> {
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
      return data.data.userShopInfo.info.shop_id
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
    auth,
    shopid
  }: {
    name: string;
    email: string;
    password: string;
    authenticator: string;
    useAuthenticator: boolean;
    labels: string;
    authenticated: boolean;
    cookies: any[];
    auth?: AccountAuth,
    shopid?: string
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
    const exists: boolean = await this.exists(emailFormatted);
    if (exists) {
      throw new Error("Akun sudah ditambahkan sebelumnya");
    }

    const _auth: AccountAuth = auth || {
      fp: '',
      oecSellerId: '',
      aid: '',
      XBogus: '',
      msToken: '',
      signature: ''
    }
    const currentEpoch: number = new Date().valueOf();
    const sql = `
            INSERT INTO account VALUES(
                ${targetId},
                "${nameFormatted}",
                "${emailFormatted}",
                "${passwordFormatted}",
                0,
                ${currentEpoch},
                '[]',
                ${useAuthenticator ? 1 : 0},
                "${authenticatorFormatted}",
                 null,
                 0,
                 0,
                 0,
                 0,0,0,
                 0,
                 0,0,0,
                 0,0,
                 0,0,
                 0, 
                "${labelsFormatted}",
                0,
                '${shopid ? shopid : ''}',
                0,  
                0,
                null,
                null,
                0,
                0,
                '${_auth.fp}',
                '-${_auth.oecSellerId}-',
                '${_auth.aid}',
                '${_auth.msToken}',
                '${_auth.XBogus}',
                '${_auth.signature}'
            )
        `;
    await this.db.query(sql);
    try {
      await this.setCookies(targetId, cookies)
      if(cookies.length > 0) {
        await this.setAuthenticated(targetId, true)
      }
    } catch(err) {
      console.error('failed to set cookies: ', err.message)
    }
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
      productCount: 0,
      shopid: shopid,
      warning: false,
      pinned: 0,
      pinnedAt: null,
      statusMessage: null,
      pmSort: 0,
      statusSort: 0,
      auth: _auth
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
        row.getCell(8).value ? row.getCell(8).value : row.getCell(8).text,
        row.getCell(9).value ? row.getCell(9).value : row.getCell(9).text,
        row.getCell(10).value ? row.getCell(10).value : row.getCell(10).text,
        row.getCell(11).value ? row.getCell(11).value : row.getCell(11).text,
        row.getCell(12).value ? row.getCell(12).value : row.getCell(12).text,
        row.getCell(13).value ? row.getCell(13).value : row.getCell(13).text,
        row.getCell(14).value ? row.getCell(14).value : row.getCell(14).text,
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
          authenticator: authenticator.trim(),
          labels: groups,
          cookies: cookies,
          useAuthenticator: authenticator.trim().length > 0,
          authenticated: cookies.length >= 1,
          shopid: values[7] ? values[7].toString() : '',
          auth: {
            fp: values[8] ? values[8].toString() : '',
            oecSellerId: values[9] ? values[9].toString() : '',
            aid: values[10] ? values[10].toString() : '',
            msToken: values[11] ? values[11].toString() : '',
            XBogus: values[12] ? values[12].toString() : '',
            signature: values[13] ? values[13].toString() : ''
          }
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
    const viewErrorsUrl = 'http://localhost:9184/api/import-error-list?e=' + moment().tz("Asia/Jakarta").unix()
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
      },
      { name: "auth_fp", type: 'string', allowNull: true, default: null, },
      { name: "auth_oec_seller_id", type: 'string', allowNull: true, default: null, },
      { name: "auth_aid", type: 'string', allowNull: true, default: null, },
      { name: "auth_msToken", type: "string", allowNull: false, default: null },
      { name: "auth_XBogus", type: 'string', allowNull: false, default: null },
      { name: "auth_signature", type: 'string', allowNull: false, default: null }
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
      "https://seller-id.tokopedia.com/account/login",
      30
    );
    const els = {
      emailField: 'input[name="email"][type="email"]',
      nextBtnFromEmail: 'button[data-testid="email-phone-submit"]',
      passwordField: 'input[name="password"][type="password"]',
      nextBtnFromPassword: "#button-submit:not(:disabled)",
      authenticatorMethodItem: "section[data-unify]",
      otpField: '#TT4B_TSV_Verify_Code_Input',
      verifyOtp: "#TT4B_TSV_Verify_Submit_Btn",
      authenticated: '[data-testid="divHomeHomeWrapper"]',
      loginWithEmail: "#TikTok_Ads_SSO_Login_Email_Panel_Button:not(:disabled)"
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
    const loginWithEmail = await page.waitForSelector(els.loginWithEmail, { timeout: 0, visible: true })
    await loginWithEmail.click()

    const emailField = await page.waitForSelector(els.emailField, {
      timeout: 0,
      visible: true,
    });
    await new Promise((r) => setTimeout(r, 300));
    await emailField.click({ clickCount: 3 });
    console.log("Email email element clicked");
    await emailField.type(account.email);
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
        const otpField = await page.waitForSelector(els.otpField, {
          timeout: 0,
          visible: true,
        });
        await otpField.type(
          this.generateOtpCodeFromSecret(account.secretAutenticator)
        );
        const verifyOtp = await page.waitForSelector(els.verifyOtp, {
          timeout: 0,
          visible: true,
        })
        await verifyOtp.click()
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

    // Wait until authenticated
    while (true) {
      if (controller.signal.aborted) {
        return;
      }
      const url: string = await page.url();
      if ([
        "https://seller-id.tokopedia.com/homepage",
        "https://seller-id.tokopedia.com/download-seller-app"
      ].includes(url.split("?")[0])) {
        // It's already authenticated, then, i need to get the auth params from the cookies
        await page.setRequestInterception(true)
        this.browser.navigatePage(page, 'https://seller-id.tokopedia.com/product/manage', 2)
        const authParams = await this.listenAuthParams(page)
        const cookies = await page.cookies()
        const rawCookies = this.parseCookiesToRaw(cookies)
        const sellerId = await this.getSellerID2(authParams, { cookies: rawCookies })
        await this.setCookies(id, cookies)
        await this.setShopId(sellerId, id)
        await this.setAuthenticated(id, true)
        await this.setAuthParams(id, authParams)
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    // await this.browser.navigatePage(page, "https://tokopedia.com/user");
    // await new Promise((r) => setTimeout(r, 1000));
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

  private async setAuthParams(id: number, params: AccountAuth): Promise<void> {
    await this.db.query(`
        UPDATE account SET 
          auth_fp = '${params.fp}',
          auth_oec_seller_id = '-${params.oecSellerId}-',
          auth_aid = '${params.aid}',
          auth_msToken = '${params.msToken}',
          auth_XBogus = '${params.XBogus}',
          auth_signature = '${params.signature}'
        WHERE id = '${id}'
      `)
  }

  /**
   * Retrieves the seller ID by making a GET request to the specified URL with the provided parameters and cookies.
   *
   * @param params - An object containing authentication details required for the request.
   * @param params.fp - A fingerprint string used for identifying the request.
   * @param params.msToken - A token used for authentication.
   * @param params.XBogus - A security parameter used in the request.
   * @param params.signature - A signature string for request validation.
   * @param context - An object containing additional request context.
   * @param context.cookies - A string representing the cookies to be sent with the request.
   * @returns A promise that resolves to the seller's username as a string.
   * @throws An error if the HTTP request fails or the response status is not OK.
   */
  private async getSellerID2(params: AccountAuth, { cookies }: {
    cookies: string
  }): Promise<string> {
    const url = `https://seller-id.tokopedia.com/api/v1/seller/account/get?locale=en&language=en&oec_seller_id=${params.oecSellerId}&aid=${params.aid}&app_name=i18n_ecom_shop&fp=${params.fp}&device_platform=web&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=en-US&browser_platform=MacIntel&browser_name=Mozilla&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F135.0.0.0%20Safari%2F537.36&browser_online=true&timezone_name=Asia%2FJakarta&msToken=${params.msToken}&X-Bogus=${params.XBogus}&_signature=${params.signature}`
    const response = await fetch(url, {
      method: "GET",
      headers: {
        cookie: cookies
      }
    })
    if(!response.ok) { throw new Error("Failed for get the seller id: http errno code " + response.status) }
    const data: any = await response.json()
    return data.data.account.user_name
  }

  private listenAuthParams(page: Page): Promise<AccountAuth> {
    return new Promise((resolve, reject) => {
      console.log("Waiting until params detected!")
      const listenRequest = async (req: HTTPRequest) => {
        const url = req.url()
        req.continue()
        if(url.includes('seller/message/pull_by_category_v2')) {
          const params: any = queryString.parse(url.split('?')[1])
          page.off('request', listenRequest)
          await page.setRequestInterception(false)
          resolve({
            fp: params.fp,
            oecSellerId: params.oec_seller_id,
            aid: params.aid,
            msToken: params.msToken,
            XBogus: params['X-Bogus'],
            signature: params._signature
          })
        }
      }
      page.on('request', listenRequest)
    })
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

  async setShopId(shopid: string, id: number): Promise<void> {
    const sql = `
            UPDATE account SET shopid = "${shopid}" WHERE id = "${id}"
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
        orderPotency: row?.orderCount,
        orderCount: row?.orderCount,
        balance: row?.balance,
        dikemasCount: row?.dikemasCount,
        dikemasEpoch: row?.dikemasEpoch,
        dikemasPotency: row?.dikemasPotency,
        dikirimCount: row?.dikirimCount,
        dikirimPotency: row?.dikirimPotency,
        complaintCount: row?.complaintCount,
        complaintPotency: row?.complaintPotency,
        productCount: row?.productCount,
        groupNames: row?.groupNames,
        warning: this.parseBoolean(row?.warning),
        shopid: row?.shopid,
        authenticated: this.parseBoolean(row?.authenticated),
        badgeImage: row?.badgeImage,
        pinned: row?.pinned,
        pinnedAt: row?.pinnedAt,
        statusMessage: row?.statusMessage === 'null' ? null : row?.statusMessage,
        pmSort: row?.pmSort,
        statusSort: row?.statusSort,
        auth: {
          fp: row?.auth_fp,
          oecSellerId: `${row?.auth_oec_seller_id?.split('-')?.join('')}`,
          aid: row?.auth_aid,
          msToken: row?.auth_msToken,
          XBogus: row?.auth_XBogus,
          signature: row?.auth_signature,
        }
      } as StructAccount);
    }
    console.log({data})
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
        productCount: res?.productCount,
        groupNames: res?.groupNames,
        warning: this.parseBoolean(res?.warning),
        shopid: res?.shopid,
        authenticated: this.parseBoolean(res?.authenticated),
        pinned: res?.pinned,
        pinnedAt: res?.pinnedAt,
        statusMessage: res?.statusMessage === 'null' ? null : res?.statusMessage,
        pmSort: res?.pmSort,
        statusSort: res?.statusSort,
        auth: {
          fp: res?.auth_fp,
          oecSellerId: res?.auth_oec_seller_id?.split('-')?.join(''),
          aid: res?.auth_aid,
          msToken: res?.auth_msToken,
          XBogus: res?.auth_XBogus,
          signature: res?.auth_signature
        }
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

