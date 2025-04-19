import Monitoring from "./Monitoring";
import { Socket } from "socket.io";
import moment from "moment-timezone";
import "moment/locale/id";
import fetch from "node-fetch";
import axios from "axios";
import Device from "./Device";

export default class DeleteProduct {
  public sockets: Socket[];
  private running: boolean;
  private logs: string[];
  private monitoring: Monitoring;
  private device: Device;
  private labelLog: string;
  private ua: string;
  constructor({
    monitoring,
    device,
  }: {
    monitoring: Monitoring;
    device: Device;
  }) {
    this.monitoring = monitoring;
    this.device = device;
    this.logs = [];
    this.ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36";
    this.labelLog = "System";
    this.sockets = [];
    this.running = false;
  }

  private async getAvailableProductCount({
    shopid,
    cookies,
    name,
  }: {
    shopid: number | string;
    cookies: string;
    name: string;
  }): Promise<void> {
    const url: string = `https://gql.tokopedia.com/graphql/ProductAddRule`;
    const payload = [
      {
        operationName: "ProductAddRule",
        variables: {},
        query:
          "query ProductAddRule {\n  ProductAddRule {\n    header {\n      reason\n      messages\n      errorCode\n      __typename\n    }\n    data {\n      eligible {\n        value\n        totalProduct\n        limit\n        actionItems\n        txThreshold\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n",
      },
    ];
    const body = JSON.stringify(payload);
    const headers = {
      cookie: cookies,
      accept: "*/*",
      "content-type": "application/json",
      "user-agent": this.ua,
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      referer: "https://seller.tokopedia.com/bulk/add",
      "x-source": "tokopedia-lite",
      "x-tkpd-lite-service": "icarus",
      "x-version": "1c50679",
      origin: "https://seller.tokopedia.com",
    };

    while (true) {
      if (!this.running) {
        for (const socket of this.sockets) {
          try {
            socket.emit("eligible-data", undefined);
          } catch (err) {}
        }
        return;
      }
      const response = await fetch(url, {
        headers: headers,
        body: body,
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        const eligible = data[0].data.ProductAddRule.data.eligible;
        for (const socket of this.sockets) {
          try {
            socket.emit("eligible-data", eligible);
          } catch (err) {}
        }
      } else {
        console.error(response.statusText);
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  public async stop(): Promise<void> {
    this.addLog("Terminating process", "User");
    this.running = false;
    this.sendIsRunning();
  }

  private getProductListPayload(
    shopid: string | number,
    {
      sortId,
      sortValue,
    }: {
      sortId: string;
      sortValue: string;
    }
  ): any {
    return [
      {
        operationName: "ProductList",
        variables: {
          shopID: shopid.toString(),
          filter: [
            { id: "pageSize", value: ["20"] },
            { id: "keyword", value: [""] },
            { id: "status", value: [] },
            { id: "page", value: ["1"] },
          ],
          sort: { id: sortId, value: sortValue },
          extraInfo: ["view", "topads", "rbac", "price-suggestion"],
          warehouseID: "",
          pageSource: "manage_product",
        },
        query:
          "query ProductList($shopID: String!, $filter: [GoodsFilterInput], $sort: GoodsSortInput, $extraInfo: [String], $warehouseID: String, $pageSource: String!) {\n  ProductList(shopID: $shopID, filter: $filter, sort: $sort, extraInfo: $extraInfo, warehouseID: $warehouseID, pageSource: $pageSource) {\n    header {\n      processTime\n      messages\n      reason\n      errorCode\n      __typename\n    }\n    data {\n      id\n      name\n      price {\n        min\n        max\n        __typename\n      }\n      stock\n      status\n      minOrder\n      maxOrder\n      weight\n      weightUnit\n      condition\n      isMustInsurance\n      isKreasiLokal\n      isCOD\n      isCampaign\n      isVariant\n      url\n      sku\n      cashback\n      featured\n      hasStockReserved\n      hasInbound\n      warehouseCount\n      isEmptyStock\n      score {\n        total\n        __typename\n      }\n      pictures {\n        urlThumbnail\n        __typename\n      }\n      shop {\n        id\n        __typename\n      }\n      wholesale {\n        minQty\n        __typename\n      }\n      stats {\n        countView\n        countReview\n        countTalk\n        __typename\n      }\n      txStats {\n        sold\n        __typename\n      }\n      topads {\n        status\n        management\n        __typename\n      }\n      priceSuggestion {\n        suggestedPrice\n        suggestedPriceTreshold\n        suggestedPriceMin\n        suggestedPriceMax\n        label\n        productRecommendation {\n          title\n          productID\n          price\n          imageURL\n          sold\n          rating\n          __typename\n        }\n        __typename\n      }\n      campaignType {\n        id\n        name\n        iconURL\n        __typename\n      }\n      suspendLevel\n      hasStockAlert\n      stockAlertCount\n      stockAlertActive\n      haveNotifyMeOOS\n      notifyMeOOSCount\n      notifyMeOOSWording\n      manageProductData {\n        isStockGuaranteed\n        scoreV3\n        isDTInbound\n        isInGracePeriod\n        isArchived\n        __typename\n      }\n      createTime\n      __typename\n    }\n    __typename\n  }\n}\n",
      },
    ];
  }

  /**
   * Starts the process of deleting products based on the given account ID, ID, and value.
   *
   * @param {number} accountId - The ID of the account.
   * @param {{ id: string; value: string }} params - The ID and value of the product.
   * @return {Promise<void>} - A promise that resolves when the process is complete.
   */
  public async start(
    accountId: number,
    { id, value, notSold }: { id: string; value: string, notSold: boolean }
  ) {
    try {
      if (!this.device.registered) {
        throw new Error("Access denied");
      }
      this.addLog("Starting process", "User");
      if (this.running) {
        this.addLog("Another process is already running!", "System");
        return;
      }
      this.running = true;
      this.sendIsRunning();
      const i: number = this.monitoring.mainData.findIndex(
        (x) => x.id == accountId
      );
      if (i < 0) {
        this.addLog(`Account with id: ${accountId} doesn't exists!`, "System");
        this.running = false;
        this.sendIsRunning();
        return;
      }
      const cookies: any = this.monitoring.mainData[i].cookies;
      let rawCookies: string = cookies
        .map((x: any) => `${x.name}=${x.value}`)
        .join("; ");
      const shopid = this.monitoring.mainData[i].shopid;
      const accountName = this.monitoring.mainData[i].name;
      this.getAvailableProductCount({
        shopid: shopid,
        cookies: rawCookies,
        name: accountName,
      });
      while (true) {
        if (!this.running) {
          break;
        }
        const response = await fetch(
          "https://gql.tokopedia.com/graphql/ProductList",
          {
            method: "POST",
            headers: {
              cookie: rawCookies,
              "content-type": "application/json",
              referer: "https://seller.tokopedia.com/manage-product",
              origin: "https://seller.tokopedia.com",
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "same-site",
              "user-agent": this.ua,
              "x-source": "tokopedia-lite",
              "x-tkpd-lite-service": "icarus",
              "x-version": "bf3d806",
              accept: "*/*",
            },
            body: JSON.stringify(
              this.getProductListPayload(shopid, {
                sortId: id,
                sortValue: value,
              })
            ),
          }
        );
        if (response.ok) {
          const jsonData = await response.json();
          const products = jsonData[0].data.ProductList.data;
          this.addLog(`Removing ${products.length} product(s)...`, accountName);
          await this.removeProducts({
            products,
            name: accountName,
            cookies: rawCookies,
            shopid: shopid,
            notSold
          });

          if (products.length < 1 ||
            (notSold && products.filter((x: any) => x.txStats.sold !== 0).length > 0)
          ) {
            this.addLog("No product found", accountName);
            this.running = false;
            this.sendIsRunning();
            return;
          }
        } else {
          this.addLog(
            `Failed to fetch product list: ${response.statusText}`,
            "System"
          );
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    } catch (err) {
      this.addLog(err.message || err, "System");
    }
  }

  private generateRemoveProductPayload(
    products: any,
    shopid: number | string
  ): any {
    return [
      {
        operationName: "BulkProductEditV3",
        variables: {
          input: [
            ...products.map((product: any) => {
              return {
                productID: product.id,
                shop: {
                  id: shopid.toString(),
                },
                status: "DELETED",
              };
            }),
          ],
        },
        query:
          "mutation BulkProductEditV3($input: [ProductInputV3]!) {\n  BulkProductEditV3(input: $input) {\n    productID\n    result {\n      header {\n        messages\n        reason\n        errorCode\n        __typename\n      }\n      isSuccess\n      __typename\n    }\n    __typename\n  }\n}\n",
      },
    ];
  }

  private async removeProducts({
    products,
    shopid,
    cookies,
    name,
    notSold
  }: {
    products: any;
    shopid: number | string;
    cookies: string;
    name: string;
    notSold: boolean
  }): Promise<void> {
    try {
      if(notSold) {
        products = products.filter((x: any) => x.txStats.sold === 0)
      }
      const payload = this.generateRemoveProductPayload(products, shopid);
      const hitUrl = `https://gql.tokopedia.com/graphql/BulkProductEditV3`;
      const body = JSON.stringify(payload);
      const headers = {
        accept: "*/*",
        "content-type": "application/json",
        referer: "https://seller.tokopedia.com/manage-product",
        "sec-ch-ua":
          '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "user-agent": this.ua,
        "x-source": "tokopedia-lite",
        "x-tkpd-lite-services": "icarus",
        "x-version": "1c50679",
        cookie: cookies,
        origin: "https://seller.tokopedia.com",
        "accept-encoding": "gzip, deflate, br",
        "content-length": body.length.toString(),
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "set-fetch-site": "same-site",
      };
      const response = await axios.post(hitUrl, payload, {
        headers: headers,
      });
      if (response.status === 200) {
        for (const product of products) {
          this.addLog(`Product telah berhasil dihapus: ${product.name}`, name);
        }
      } else {
        this.addLog(
          `Failed for removing the product: ${response.statusText} (${response.status})`,
          name
        );
      }
    } catch (err) {
      this.addLog(
        `Failed for removing product(s): ${err.message || err}`,
        name
      );
    }
  }

  private addLog(logMsg: string, label: string): void {
    const dtFormatted = moment().tz("Asia/Jakarta").format("D MMM HH:mm");
    this.logs.push(`[${dtFormatted}] - ${label}: ${logMsg}`);
    if (this.logs.length > 250) {
      this.logs = this.logs.splice(this.logs.length - 250);
    }
    this.sendLogs();
  }

  public async onNewClientConnected(): Promise<void> {
    this.addLog("New client is already connected!", "System");
    this.sendIsRunning();
    this.sendLogs();
  }

  private async sendLogs(): Promise<void> {
    for (const socket of this.sockets) {
      try {
        socket.emit("logs", this.logs);
      } catch (err) {
        console.error(`Failed for sent the logs: ${err.message || err}`);
      }
    }
  }

  public async getAccount(id: number): Promise<DeleteProductAccount> {
    const index: number = this.monitoring.mainData.findIndex((x) => x.id == id);
    if (index < 0) {
      throw new Error("Akun tidak ditemukan dengan id: " + id.toString());
    }
    const data: StructAccount = this.monitoring.mainData[index];
    return {
      email: data.email,
      name: data.name,
      id: data.id,
      avatar: data.avatar,
    };
  }

  private async sendIsRunning(): Promise<void> {
    for (const socket of this.sockets.filter((x) => x.connected)) {
      try {
        socket.emit("is-running", this.running);
      } catch (err) {}
    }
  }

  public async getAvailableAccounts({
    search,
  }: {
    search: string;
  }): Promise<DeleteProductAccount[]> {
    let data: DeleteProductAccount[] = [];
    search = search.toLowerCase();
    for (const account of this.monitoring.mainData) {
      if (
        account.authenticated &&
        (account.name.toLowerCase().includes(search) ||
          account.email.toLowerCase().includes(search))
      ) {
        data.push({
          avatar: account.avatar,
          email: account.email,
          name: account.name,
          id: account.id,
        });
      }
      if (data.length >= 30) {
        break;
      }
    }
    return data;
  }
}
