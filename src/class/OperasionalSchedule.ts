import Database from "./Database";
import Monitoring from "./Monitoring";
import { Socket } from "socket.io";
import moment from "moment-timezone";
import Account from "./Account";
import fetch from "node-fetch";
import Group from "./Group";

export default class OperationalSchedule {
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

  private sendRunning() {
    for (const socket of this.sockets) {
      try {
        socket.emit("running-state", this.running);
      } catch (err) { }
    }
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
      } catch (err) { }
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
      cookie: cookies,
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
  }

  /**
   * Retrieves the payload for setting shop operational hours.
   *
   * @param {number | string} shopid - the ID of the shop
   * @param {any} days - the operational hours for the shop
   * @return {any} the payload for setting shop operational hours
   */
  private getPayload(shopid: number | string, days: any): any {
    return [
      {
        operationName: "SetShopOperationalHours",
        variables: {
          input: {
            shopID: shopid.toString(),
            type: 1,
            params: days.map((day: any, _: number) => {
              return {
                day: _ + 1,
                status: days[_].status,
                startTime: days[_].selectedOpeningHourFormat,
                endTime: days[_].closingTime,
              };
            }),
          },
        },
        query:
          "mutation SetShopOperationalHours($input: ParamSetShopOperationalHours!) {\n  setShopOperationalHours(input: $input) {\n    success\n    message\n    createdId\n    __typename\n  }\n}\n",
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
  public async start(ids: number[], days: any): Promise<void> {
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
      const payload = this.getPayload(account.shopid, days);
      const url = "https://gql.tokopedia.com/graphql/SetShopOperationalHours";
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

      console.log(JSON.stringify(payload))

      const data = await response.json();
      const error = !data[0].data.setShopOperationalHours.success;
      if (error) {
        this.log(`Gagal: ${data[0].data.setShopOperationalHours.message}`);
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
