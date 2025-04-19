import Monitoring from "./Monitoring";
import Account from "./Account";
import fetch from "node-fetch";
import moment from 'moment-timezone'

export default class ShippingManager {
  private monitoring: Monitoring;
  private account: Account;
  private progressPercentage: number
  public logs: string[]

  constructor({
    monitoring,
    account,
  }: {
    monitoring: Monitoring;
    account: Account;
  }) {
    this.monitoring = monitoring;
    this.account = account;
    this.progressPercentage = 0
    this.logs = []
  }

  private getOneAuthenticatedAccount(i: number = 0): StructAccount {
    if (this.monitoring.mainData.length < 1) {
      throw new Error("Akun tidak ditemukan");
    }
    let cScanned = 0
    for (const account of this.monitoring.mainData) {
      if (
        account.authenticated &&
        account.shopid != 0 &&
        account.shopid !== null &&
        account.cookies
      ) {
        if (i === cScanned) {
          return account;
        } else {
          cScanned++
        }
      }
    }
    throw new Error("Akun terlogin tidak ditemukan, silahkan login akun setidaknya satu terlebih dahulu");
  }

  private parseCookiesToRaw(cookies: any[]): string {
    let t = "";
    for (const cookie of cookies) {
      t += `${cookie.name}=${cookie.value};`;
    }
    return t;
  }

  public async getShippers(): Promise<ShippingManagerShipperResult> {
    let i = 0
    while (true) {
      try {
        const account = this.getOneAuthenticatedAccount(i);
        const rawCookies = this.parseCookiesToRaw(account.cookies);
        const headers = {
          cookie: rawCookies,
          "content-type": "application/json",
          referer: "https://seller.tokopedia.com/",
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
        const payload = [
          {
            operationName: "ongkirShippingEditor",
            variables: { shop_id: account.shopid },
            query:
              "query ongkirShippingEditor($shop_id: Int!) {\n  ongkirShippingEditor(input: {shop_id: $shop_id}) {\n    status\n    message\n    data {\n      shippers {\n        ondemand {\n          shipper_id\n          shipper_name\n          is_active\n          is_whitelabel\n          text_promo\n          image\n          feature_info {\n            header\n            body\n            __typename\n          }\n          shipper_product {\n            shipper_product_id\n            shipper_product_name\n            shipper_product_desc\n            is_active\n            __typename\n          }\n          __typename\n        }\n        conventional {\n          shipper_id\n          shipper_name\n          is_active\n          is_whitelabel\n          text_promo\n          image\n          feature_info {\n            header\n            body\n            __typename\n          }\n          shipper_product {\n            shipper_product_id\n            shipper_product_name\n            shipper_product_desc\n            is_active\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      ticker {\n        header\n        body\n        text_link\n        url_link\n        __typename\n      }\n      custom_logistic_url\n      drop_off_maps_url\n      is_custom_logistic_configured\n      __typename\n    }\n    __typename\n  }\n}\n",
          },
        ];

        const response = await fetch(
          "https://gql.tokopedia.com/graphql/ongkirShippingEditor",
          {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            timeout: 15000, // 15 sec
          },
        );
        if (!response.ok) {
          throw new Error(`${response.status} - ${response.statusText}`);
        }

        const data: any = await response.json();
        if (data[0].data.ongkirShippingEditor.status !== 200) {
          throw new Error(data[0].data.ongkirShippingEditor.message);
        }
        const shippers = data[0].data.ongkirShippingEditor.data.shippers;

        return {
          ondemand: shippers.ondemand,
          conventional: shippers.conventional,
        };
      } catch (err) {
        i++
      }
    }
  }

  private async addLog(msg: string, from: string = "System"): Promise<void> {
    const dtFormat = moment().tz("Asia/Jakarta").format("D MMM HH:mm");
    const formattedMsg: string = `[${dtFormat}] - ${from}: ${msg}`;
    this.logs.push(formattedMsg);
    if (this.logs.length > 300) {
      this.logs = this.logs.splice(this.logs.length - 300);
    }
  }

  /**
   * Applies active shippers to the given accounts.
   *
   * @param {number[]} accountIds - An array of account IDs.
   * @param {number[]} activedIds - An array of activated shipper IDs.
   * @return {Promise<void>} A promise that resolves when all shippers are applied.
   */
  public async applyActiveShippers(accountIds: number[], activedIds: number[]): Promise<void> {
    let applied: number = 0
    this.logs = []
    for (const accountId of accountIds) {
      const det = await this.account.get(accountId, true)
      if (det.authenticated && det.shopid != 0 && det.shopid !== null && det.cookies) {
        try {
          const rawCookies = this.parseCookiesToRaw(det.cookies)
          const headers = {
            cookie: rawCookies,
            "content-type": "application/json",
            referer: "https://seller.tokopedia.com/",
            origin: "https://seller.tokopedia.com",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
            "x-source": "tokopedia-lite",
            "x-tkpd-lite-service": "icarus",
            "x-version": "4be9723",
            accept: "application/json",
          };

          const payload = [{ "operationName": "OngkirShippingEditorSave", "variables": { "input": { "shop_id": det.shopid, "activated_sp_id": activedIds.join(',').toString(), "feature_id": "" } }, "query": "mutation OngkirShippingEditorSave($input: OngkirShippingEditorSaveInput!) {\n  ongkirShippingEditorSave(input: $input) {\n    status\n    message\n    data {\n      message\n      is_success\n      __typename\n    }\n    errors {\n      id\n      status\n      title\n      __typename\n    }\n    __typename\n  }\n}\n" }]
          const url = 'https://gql.tokopedia.com/graphql/OngkirShippingEditorSave'
          const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
          })
          const data = (await response.json())[0].data.ongkirShippingEditorSave
          if (data.status === 200) {
            this.addLog(data.message, det.name)
          } else {
            this.addLog('failed!', det.name)
          }
        } catch (err: any) {
          this.addLog(err.message, det.name)
        } finally {
          console.log(this.logs)
        }
      }
      applied++
    }
    this.addLog(`Pengiriman dari ${accountIds.length} akun telah berhasil diubah 🎉🎉`, 'SYSTEM')
  }
}
