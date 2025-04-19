import Database from "./Database";
import Monitoring from "./Monitoring";
import { Socket } from "socket.io";
import moment from "moment-timezone";
import Account from "./Account";
import fetch from "node-fetch";
import Group from "./Group";

interface DateStart {
  from: string;
  to: string;
}

export default class Holiday {
  private database: Database;
  private monitoring: Monitoring;
  public sockets: Socket[];
  private logs: string[];
  private account: Account;
  private running: boolean;
  private group: Group;

  constructor({
    database,
    monitoring,
    account,
    group,
  }: {
    database: Database;
    monitoring: Monitoring;
    account: Account;
    group: Group;
  }) {
    this.database = database;
    this.monitoring = monitoring;
    this.group = group;
    this.sockets = [];
    this.logs = [];
    this.running = false;
    this.account = account;
  }

  /**
   * Perform an async operation to unset selected items.
   *
   * @param {Object} param - The object containing selectedIds array.
   * @param {number[]} param.selectedIds - An array of selected ids.
   * @return {Promise<void>} A promise that resolves when the operation is completed.
   */
  public async unset({
    selectedIds,
  }: {
    selectedIds: number[];
  }): Promise<void> {
    if (this.running) {
      this.log("Another process is running!");
      return;
    }
    this.logs = [];
    this.running = true;
    this.sendRunning();
    let stat = {
      skip: 0,
      success: 0,
      failed: 0,
    };

    for (const id of selectedIds) {
      const account = await this.account.get(id);
      this.log(`Mengscan akun "${account.name}"...`);
      if (!account.authenticated) {
        stat.skip++;
        this.log(`Akun diskip karena belum login: ${account.name}`);
      }

      this.log(`Menghapus setelan untuk: ${account.name}`);
      // Jika sudah login
      const cookies = this.getRawCookies(account.cookies);
      const header = this.getHeader({ cookies });
      const payload = this.getPayload(
        account.shopid,
        { from: "", to: "" },
        "delete"
      );
      const url = "https://gql.tokopedia.com/graphql/CloseShopSchedule";
      const response = await fetch(url, {
        method: "POST",
        headers: header,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        this.log(`Gagal (${account.name}): ${response.status}`);
        stat.failed++;
      } else {
        const data = await response.json();
        const error = !data[0].data.closeShopSchedule.success;
        if (error) {
          this.log(
            `Gagal (${account.name}): ${data[0].data.closeShopSchedule.message}`
          );
          stat.failed++;
        } else {
          this.log(`Berhasil: ${account.name}`);
          stat.success++;
        }
        console.log(data);
      }
    }
    this.log("Sedang menyelesaikan proses...");
    await new Promise((r) => setTimeout(r, 1000));
    this.log(`TOTAL: ${selectedIds.length}`);
    this.log(`BERHASIL: ${stat.success}`);
    this.log(`SKIP: ${stat.skip}`);
    this.log(`GAGAL: ${stat.failed}`);
    this.log(`Selesai ✨✨`);
    this.running = false;
    this.sendRunning();
  }

  /**
   * A description of the entire function.
   *
   */
  private sendRunning() {
    for (const socket of this.sockets) {
      try {
        socket.emit("running-state", this.running);
      } catch (err) {}
    }
  }

  public onNewConnectionAttached() {
    this.sendRunning();
  }

  /**
   * A description of the entire function.
   *
   * @param {string} msg - description of parameter
   * @return {void} description of return value
   */
  public log(msg: string): void {
    const date = moment().tz("Asia/Jakarta").format("ddd HH:mm:ss");
    msg = `${date}: ${msg}`;
    console.log(msg);
    this.logs.push(msg);
    if (this.logs.length > 150) {
      this.logs = this.logs.splice(this.logs.length - 150);
    }
    for (const socket of this.sockets) {
      try {
        socket.emit("logs", this.logs);
      } catch (err) {}
    }
  }

  /**
   * A description of the entire function.
   *
   * @param {any} cookies - description of parameter
   * @return {string} description of return value
   */
  private getRawCookies(cookies: any): string {
    let x = "";
    for (const cookie of cookies) {
      x += `${cookie.name}=${cookie.value};`;
    }
    return x;
  }

  /**
   * A description of the entire function.
   *
   * @param {type} cookies - description of parameter
   * @return {type} any
   */
  private getHeader({ cookies }: { cookies: string }): any {
    return {
      "content-type": "application/json",
      referer: "https://seller.tokopedia.com/settings/operational-hour",
      origin: "https://seller.tokopedia.com",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "x-source": "tokopedia-lite",
      "x-tkpd-lite-service": "icarus",
      "x-version": "bf3d806",
      accept: "application/json",
      cookie: cookies,
    };
  }

  /**
   * Retrieves the payload for setting shop operational hours.
   *
   * @param {number | string} shopid - the ID of the shop
   * @param {any} days - the operational hours for the shop
   * @return {any} the payload for setting shop operational hours
   */
  private getPayload(
    shopid: number | string,
    range: DateStart,
    tipe: "set" | "delete" = "set"
  ): any {
    if (tipe === "set") {
      // Format epoch close start terlebih dahulu
      const closeStart = moment(range.from, "DD-MM-YYYY").tz("Asia/Jakarta");
      const closeEnd = moment(range.to, "DD-MM-YYYY").tz("Asia/Jakarta");

      closeStart.set("h", 23);
      closeStart.set("minute", 59);
      closeStart.set("second", 59);

      closeEnd.set("h", 23);
      closeEnd.set("minute", 59);
      closeEnd.set("second", 59);

      return [
        {
          operationName: "CloseShopSchedule",
          variables: {
            input: {
              action: 0,
              closeNote: "",
              closeStart: closeStart.unix().toString(),
              closeEnd: closeEnd.unix().toString(),
            },
          },
          query:
            "mutation CloseShopSchedule($input: CloseShop!) {\n  closeShopSchedule(input: $input) {\n    success\n    message\n    __typename\n  }\n}\n",
        },
      ];
    }

    // Delete condition
    return [
      {
        operationName: "CloseShopSchedule",
        variables: {
          input: { action: 2, closeNote: "", closeStart: "", closeEnd: "" },
        },
        query:
          "mutation CloseShopSchedule($input: CloseShop!) {\n  closeShopSchedule(input: $input) {\n    success\n    message\n    __typename\n  }\n}\n",
      },
    ];
  }

  /**
   * Asynchronously starts the process for the given IDs and days.
   *
   * @param {number[]} ids - array of IDs
   * @param {any} days - days for the process
   * @return {Promise<void>} a promise that resolves once the process is complete
   */
  public async start(ids: number[], range: DateStart): Promise<void> {
    this.logs = [];
    if (this.running) {
      return this.log(`[!!WARNING!!] Proses ini sedang berjalan`);
    }
    this.running = true;
    this.sendRunning();
    this.log("[!!WARNING!!] Proses ini tidak dapat dihentikan");
    this.log("Memulai proses");
    let stat = {
      berhasil: 0,
      gagal: 0,
      skip: 0,
    };
    for (const id of ids) {
      const account = await this.account.get(id);
      this.log(`Melakukan scan pada akun "${account.name}"`);
      if (!account.authenticated) {
        this.log(`Akun "${account.name}" belum terauthentikasi`);
        stat.skip++;
        continue;
      }

      const cookies = this.getRawCookies(account.cookies);
      const header = this.getHeader({ cookies });
      const payload = this.getPayload(account.shopid, range, "set");
      const url = "https://gql.tokopedia.com/graphql/CloseShopSchedule";
      const response = await fetch(url, {
        headers: header,
        method: "POST",
        body: JSON.stringify(payload),
        timeout: 15000,
      });
      if (!response.ok) {
        this.log(`Gagal: ERROR ${response.status}`);
        stat.gagal++;
        continue;
      }

      const data = await response.json();
      console.log(data);
      const error = !data[0].data.closeShopSchedule.success;
      if (error) {
        this.log(`Gagal: ${data[0].data.closeShopSchedule.message}`);
        stat.gagal++;
      } else {
        stat.berhasil++;
        this.log(
          `Berhasil: Waktu operasional berhasil diterapkan ke "${account.name}"`
        );
      }
    }
    this.log(`BERHASIL: ${stat.berhasil}`);
    this.log(`GAGAL: ${stat.gagal}`);
    this.log(`SKIP: ${stat.skip}`);
    this.log(
      `${stat.berhasil + stat.gagal + stat.skip} akun telah diproses 🎉`
    );
    this.running = false;
    this.sendRunning();
  }

  /**
   * A description of the entire function.
   *
   * @param {string} search - the search string to filter accounts
   * @return {Promise<OpertionalScheduleAccount[]>} the filtered operational schedule accounts
   */
  public async accounts(
    search: string,
    group: string = "all"
  ): Promise<OpertionalScheduleAccount[]> {
    search = search.toLowerCase().trim(); // format search string

    let data = this.monitoring.mainData
      .filter((x) => {
        return (
          x.name.toLowerCase().includes(search) ||
          x.email.toLowerCase().includes(search) ||
          x.groupNames.toLowerCase().includes(search)
        );
      })
      .map((x) => {
        return {
          ...x,
          groupNames: x.groupNames
            .split(",")
            .map((x) => x.trim())
            .filter((x) => x.length > 0),
        };
      });

    // filter group
    if (group !== "all" && typeof group === "string") {
      data = data.filter((x) => x.groupNames.includes(group));
    }

    let operationalData: OpertionalScheduleAccount[] = data.map((x) => {
      return {
        id: x.id,
        name: x.name,
        email: x.email,
        avatar: x.avatar,
        authenticated: x.authenticated,
        groupNames: x.groupNames,
      };
    });

    return operationalData;
  }
}
