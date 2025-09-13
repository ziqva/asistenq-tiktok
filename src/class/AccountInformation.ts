import fetch, { Response } from "node-fetch";
import moment from "moment-timezone";
import { Moment } from "moment-timezone";
import Database from "./Database";
import * as fs from "fs";
import Notification from "./Notification";
import moment2 from "moment";
import MainDataColumn from "./MainDataColumn";
import Account from "./Account";
import { compile } from 'html-to-text'
import Memory from "./Memory";

export default class AccountInformation {
  private hitApi: string;
  public notification: Notification | null;
  private tz: string;
  private mainDataColumn: MainDataColumn;
  private account: Account;
  private processedInvoiceMemory: Memory

  constructor({
    notification,
    mainDataColumn,
    account,
    processedInvoiceMemory
  }: {
    notification: Notification;
    mainDataColumn: MainDataColumn;
    account: Account;
    processedInvoiceMemory: Memory
  }) {
    this.tz = "Asia/Jakarta";
    this.notification = notification;
    this.account = account;
    this.mainDataColumn = mainDataColumn;
    this.processedInvoiceMemory = processedInvoiceMemory
  }

  private async setupProduct(account: StructAccount, headers: any): Promise<StructAccount> {
    const url = `https://seller-id.tokopedia.com/api/v1/product/tab/count/get?locale=en&language=en&oec_seller_id=${account.auth.oecSellerId}&aid=4068&app_name=i18n_ecom_shop&fp=${account.auth.fp}&device_platform=web&cookie_enabled=true&screen_width=1470&screen_height=956&browser_language=en-US&browser_platform=MacIntel&browser_name=Mozilla&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F135.0.0.0%20Safari%2F537.36&browser_online=true&timezone_name=Asia%2FJakarta&msToken=${account.auth.msToken}&X-Bogus=${account.auth.XBogus}&_signature=${account.auth.signature}`
    const response = await fetch(url, {
      headers,
      method: "GET"
    })
    if(response.ok) {
      const data: any = await response.json()
      if(!data.data) { console.error('setupProduct error: ', data); return account; }
      const productCountRow = data.data.find((x: any) => x.tab_id === 1)
      if(productCountRow) {
        account.productCount = parseInt(productCountRow.count)
      }
    }
    return account
  }

  /**
   * Fetches the shop status from the Tokopedia Seller API and updates the given account's
   * moderation status and status message accordingly.
   *
   * @param account - The account object to update with moderation information.
   * @param headers - The HTTP headers to use for the API request.
   * @returns A promise that resolves to the updated account object with moderation status set.
   */
  private async setupModerated(account: StructAccount, headers: any): Promise<StructAccount> {
    const url = `https://seller-id.tokopedia.com/api/v3/seller/common/get?need_verify_account=true&default_region=ID&version=3`
    const response = await fetch(url, {
      headers,
      method: "GET"
    })
    if(response.ok) {
     const data: any = await response.json()

      if(!data.data) { console.error('setupModerated error: ', data); return account; }
     const shopStatus = data.data.seller.shop_status
     account.moderated = shopStatus === 3
     account.statusMessage = shopStatus === 3 ? "Dinonaktifkan secara permanen" : ""
    } else {
      account.statusMessage = ""
    }
    return account
  }

  /**
   * Get the moderation date for the given account.
   * @param account the account data
   * @returns the moderation date or null if not moderated or authenticated
   */
  public async getModerationDate(account: StructAccount): Promise<Date | null> {
    try {
      if(!account.moderated || !account.authenticated) { return null }
      const rawCookies: string = this.parseCookiesToRaw(account.cookies)

      let headers = {
        cookie: rawCookies,
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
      }

      const chatListPayload = {"query":"query ChatSearch($keyword:String,$status:Int,$page:Int,$size:Int,$isSeller:Int){chatSearch(keyword:$keyword,status:$status,page:$page,size:$size,isSeller:$isSeller){contact{data{contact{id role attributes{domain name shopStatus tag thumbnail}}createBy createTimeStr lastMessage msgId oppositeId oppositeType replyId roomId}}replies{hasNext data{contact{role attributes{name thumbnail}}createTimeStr lastMessage msgId productId}}}}","variables":{"keyword":"tokopedia seller","size":10,"status":1,"page":1,"isSeller":1}}
      const chatlistResponse = await fetch('https://gql.tokopedia.com/graphql/ChatSearch', {
        method: "POST",
        body: JSON.stringify(chatListPayload),
        headers,
      })
      if(!chatlistResponse.ok) { return null }
      const chatlistData = await chatlistResponse.json()
      for(const chatListItem of chatlistData.data.chatSearch.contact.data) {
        const msgid = chatListItem.msgId
        //   retreive the message data by the message id
        // @ts-ignore
        const messagePayload = {"query":"query ChatReplies($messageId:Int!,$keyword:String,$page:Int,$perPage:Int=10,$beforeReplyTime:String,$afterReplyTime:String,$isTextOnly:Boolean){chatReplies( msgId:$messageId keyword:$keyword page:$page perPage:$perPage beforeReplyTime:$beforeReplyTime afterReplyTime:$afterReplyTime isTextOnly:$isTextOnly){block{isPromoBlocked isBlocked blockedUntil}contacts{userId shopId name role interlocutor badge isGold domain thumbnail shopType tag status{timestamp isOnline}}textareaReply list{date chats{time replies{attachmentIDString attachment{id type fallback{message html}attributes}parentReply{attachmentID attachmentType senderID name replyID replyTimeUnixNano fraudStatus source mainText subText imageURL isExpired}blastId source isOpposite isRead msg msgIdString oldMsgId oldMsgTitle replyId replyTime role senderId senderName status fraudStatus allowDelete label}}}hasNext hasNextAfter showTimeMachine minReplyTime maxReplyTime attachmentIDs}}","variables":{"perPage":50,"messageId":msgid,"keyword":"","isTextOnly":true,"page":1,"beforeReplyTime":null,"afterReplyTime":null}}
        const messageResponse = await fetch('https://gql.tokopedia.com/graphql/ChatReplies', {
          method: "POST",
          body: JSON.stringify(messagePayload),
          headers
        })
        if(!messageResponse.ok) { continue }
        const messageData = await messageResponse.json()
        const messages = messageData.data.chatReplies.list
        for(const message of messages) {
          for(const chat of message.chats) {
            for(const reply of chat.replies) {
              if(typeof reply.msg === 'string' && reply.msg.toLowerCase().includes('moderasi')) {
                const epoch = parseInt(String(reply.replyTime / 1000000))
                if(!isNaN(epoch)) { return new Date(epoch) }
              }
            }
          }
        }
      }
      return null
    } catch(err: any) {
      console.error(err.message || err)
      return null
    }
  }
  
  /**
   * Retrieves the current account balance from Tokopedia and updates the account object.
   *
   * This method sends a GET request to Tokopedia's settlement balance API using
   * the provided authentication headers. It parses the returned balance value
   * and assigns it to the account's `balance` property.
   *
   * @param account - The account object containing authentication and balance info.
   * @param headers - HTTP headers used for authentication and device/browser metadata.
   * @returns A Promise resolving to the updated account object with the current balance.
   */
  private async setupBalance(account: StructAccount, headers: any): Promise<StructAccount> {
    const url = `https://seller-id.tokopedia.com/api/v1/pay/settlement/balance/get?locale=en&language=en&oec_seller_id=${account.auth.oecSellerId}&aid=4068&app_name=i18n_ecom_shop&fp=${account.auth.fp}&device_platform=web&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=en-US&browser_platform=MacIntel&browser_name=Mozilla&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F135.0.0.0%20Safari%2F537.36&browser_online=true&timezone_name=Asia%2FJakarta&msToken=${account.auth.msToken}&X-Bogus=${account.auth.XBogus}&_signature=${account.auth.signature}`
    const response = await fetch(url, {
      headers,
      method: "GET"
    })
    const data: any = await response.json()
    if(!data.data || !data.data.amount) { console.error('setupBalance error: ', data); return account; }

    const balance = parseInt(data.data.amount.amount)
    account.balance = balance
    return account
  }

  /**
   * Retrieves the account details from the API.
   *
   * @param {StructAccount} account - The account object.
   * @param {boolean} autoUpdate - Determines if the account should be updated automatically. Default is true.
   * @param {Database} database - The database object.
   * @return {Promise<StructAccount>} The updated account object.
   */
  async get(
    account: StructAccount,
    autoUpdate: boolean = true,
    database?: Database,
  ): Promise<StructAccount> {
    // Prepare the payloads
    try {
      let payloads = [];
      payloads.push(this.getProfileDetailPayload()); // nama toko, avatar toko, score toko, shopid, location
      this.mainDataColumn.isActiveByName("Saldo") === true &&
        payloads.push(this.getSellerBalancePayload()); // balance }
      this.mainDataColumn.isActiveByName("Chat") === true &&
        payloads.push(this.getChatPayload()); // chat count, oldest chat epoch }

      const rawCookies: string = this.parseCookiesToRaw(account.cookies);
      if (account.shopid === "") {
        account.authenticated = false;
        await this.account.setAuthenticated(account.id, false);
      }
      const headers = {
        cookie: rawCookies,
        accept: '*/*',
        'sec-ch-ua': `"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"`,
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': `"macOS"`,
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-tt-oec-region': 'ID',
        'origin': 'https://seller-id.tokopedia.com',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9,id;q=0.8',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
      };
      
      account = await this.setupProfileDetail(account, headers);
      // account = this.setupBalance(account);
      const [acc, _authenticated] = await this.setupChat(account, headers);
      account = acc
      if(!_authenticated) {
        account.authenticated = false
        if (autoUpdate && database) {
          this.updateData(account, database);
        }
        return account
      }
      account = await this.setupShippingOrder(account, headers);
      account = await this.setupBalance(account, headers);
      account = await this.setupComplaint(account, headers);
      // try {
      //   account = await this.setupComplaint2(account, headers);
      // } catch(_: any) {}
      account = await this.setupDikemas(account, headers);
      account = await this.setupNewOrder(account, headers);
      account = await this.setupProduct(account, headers);
      account = await this.setupModerated(account, headers);

      account.lastUpdated = moment().tz(this.tz).unix();
      if (account.orderPotency < 100) { account.orderPotency = 0; account.orderEpoch = 0; account.orderCount = 0; }
      if (autoUpdate && database) {
        this.updateData(account, database);
      }
      return account;
    } catch (err: any) {
      console.error(err);
      return account;
    }
  }

  formatWithtype(v: any): string {
    if (typeof v === "string") {
      return `"${v}"`;
    } else if (typeof v === "object") {
      return `'${JSON.stringify(v)}'`;
    } else {
      return v;
    }
  }

  /**
   * Updates the account data in the database with the provided account information.
   * 
   * This method constructs an SQL `UPDATE` query dynamically based on the properties
   * of the `account` object, excluding specific fields such as `cookies`, `shopid`,
   * `auth`, `undefined`, and `badgeImage`. The query is then executed using the provided
   * `database` instance.
   * 
   * @param account - An object of type `StructAccount` containing the account data to be updated.
   *                  Each property of this object represents a column in the `account` table.
   * @param database - An instance of the `Database` class used to execute the SQL query.
   * 
   * @returns A promise that resolves when the update operation is complete.
   * 
   * @throws Will throw an error if the SQL query execution fails.
   */
  async updateData(account: StructAccount, database: Database): Promise<void> {
    const sql = `
            UPDATE account
            SET
                ${Object.entries(account)
                  .filter((x) => x[0].toLowerCase().trim() !== "cookies" && x[0].toLowerCase().trim() !== "shopid")
                  .filter(x => x[0] !== 'auth')
                  .filter(x => x[0] !== undefined && x[0] !== 'badgeImage')
                  .filter(x => !(typeof x[1] === 'number' && isNaN(x[1])))
                  .map((x) => {
                    return `${x[0]} = ${this.formatWithtype(x[1])}`;
                  })
                  .join(",\n")}
            WHERE id = "${account.id}"
        `;
    await database.query(sql);
  }

  /**
   * Fetches the list of shipped orders from Tokopedia for a given account
   * and updates the account's shipping statistics.
   *
   * This method performs a POST request to Tokopedia's fulfillment API
   * to retrieve orders with the "shipped" status. It calculates the total
   * order value (potency) and compares the current order count with the
   * previous value. If there are new shipped orders, it triggers a
   * notification.
   *
   * @param account - The account object containing authentication and tracking info.
   * @param headers - HTTP headers including authorization tokens and other metadata.
   * @returns A Promise resolving to the updated account object with new shipped count and potency.
   */
  private async setupShippingOrder(account: StructAccount, headers: any): Promise<StructAccount> {
    const url = `https://seller-id.tokopedia.com/api/fulfillment/order/list?locale=id-ID&language=id&oec_seller_id=${account.auth.oecSellerId}&aid=4068&app_name=i18n_ecom_shop&fp=${account.auth.fp}&device_platform=web&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=en-US&browser_platform=MacIntel&browser_name=Mozilla&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F135.0.0.0%20Safari%2F537.36&browser_online=true&timezone_name=Asia%2FJakarta&msToken=${account.auth.msToken}&X-Bogus=${account.auth.XBogus}&_signature=${account.auth.signature}`
    const payload = {"sort_info":"6","search_condition":{"condition_list":{"search_tab":{"value":["102"]}}},"count":50,"pagination_type":0,"offset":0,"extra_data_list":["48_hours_dispatch_tag","split_combine_tag_v1","free_sample_tag_v1","hazmat_order_tag","made_to_order_tag","pre_order_tag","pre_sell_tag","zero_lottery_tag","gift_insurance_tag","internal_purchase_tag","replacement_order_tag_v1","risk_order_tag_v1","combo_sku_tag","refundable_sample_tag","split_package_type_tag","two_day_delivery","DT_order"]}
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...headers,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    const data: any = await response.json()
    if(typeof data.data.total_count !== 'number') { console.error('setupShippingOrder error: ', data); return account; }
    if(data.data.total_count === 0) {
      account.dikirimCount = 0
      account.dikirimPotency = 0
      return account
    }
    const orders: any = data.data.main_orders
    let orderPotency: number = 0
    for(const order of orders) {
      orderPotency += parseInt(order.price_module.grand_total.price_val)  
    }
    if(orders.length > account.dikirimCount) {
      const diff = orders.length - account.dikirimCount
      const title =
        `${account.name}` +
        (this.account.getFirstGroupName(account.id)
          ? ` - ${this.account.getFirstGroupName(account.id)}`
          : "");
      this.notification.show({
        title,
        message: `${diff} Pesanan telah dikirim`,
      });
    }
    account.dikirimCount = orders.length
    account.dikirimPotency = orderPotency
    return account
  }

  /**
   * Sets up a new order for the given account by fetching order details from an external API.
   *
   * @param account - The account object containing authentication details and other account-specific information.
   * @param header - An object containing additional headers to be included in the API request.
   * @returns A promise that resolves to the updated account object.
   *
   * @remarks
   * This method sends a POST request to the Tokopedia API to retrieve a list of orders associated with the account.
   * It processes the response to calculate the total order potency and deadlines, although these values are not
   * currently used in the returned account object.
   *
   * @throws Will throw an error if the API request fails or if the response cannot be parsed as JSON.
   */
  private async setupNewOrder(account: StructAccount, header: any): Promise<StructAccount> {
    const url = `https://seller-id.tokopedia.com/api/fulfillment/order/list?locale=id-ID&language=id&oec_seller_id=${account.auth.oecSellerId}&aid=4068&app_name=i18n_ecom_shop&fp=${account.auth.fp}&device_platform=web&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=en-US&browser_platform=MacIntel&browser_name=Mozilla&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F135.0.0.0%20Safari%2F537.36&browser_online=true&timezone_name=Asia%2FJakarta&msToken=${account.auth.msToken}&X-Bogus=${account.auth.XBogus}&_signature==${account.auth.signature}`
    const payload = {"sort_info":"1","search_condition":{"condition_list":{"order_status":{"value":["1"]},"search_tab":{"value":["101"]}}},"count":20,"pagination_type":0,"offset":0,"search_cursor":"","extra_data_list":["48_hours_dispatch_tag","split_combine_tag_v1","free_sample_tag_v1","hazmat_order_tag","made_to_order_tag","pre_order_tag","pre_sell_tag","zero_lottery_tag","gift_insurance_tag","internal_purchase_tag","replacement_order_tag_v1","risk_order_tag_v1","combo_sku_tag","refundable_sample_tag","split_package_type_tag","two_day_delivery","DT_order"]}
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...header,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    const data = await response.json()
    if(typeof data.data.total_count !== 'number') { console.error('setupNewOrder error: ', data); return account; }
    if(data.data.total_count === 0) {
      account.orderCount = 0
      account.orderPotency = 0
      account.orderEpoch = 0
      return account
    }
    const orders: any = data.data.main_orders
    let orderPotency: number = 0
    let orderDeadline: number[] = []
    for(const order of orders) {
      orderPotency += parseInt(order.price_module.grand_total.price_val)
      orderDeadline.push(parseInt(order.trade_order_module.latest_tts_time))
    }
    const orderCount = orders.length
    if(orderCount > account.orderCount) {
      const diff = orderCount - account.orderCount
      const title =
        `${account.name}` +
        (this.account.getFirstGroupName(account.id)
          ? ` - ${this.account.getFirstGroupName(account.id)}`
          : "");
      this.notification.show({
        title,
        message: `${diff} Pesanan baru`,
      });
    }
    account.orderCount = orderCount
    account.orderPotency = orderPotency
    account.orderEpoch = orderCount === 0 ? 0 : Math.min(...orderDeadline)
    return account
  }


  /**
   * Fetches the list of "being packed" (dikemas) orders from Tokopedia
   * for the given account, calculates the total order value (potency),
   * and determines the nearest shipping deadline.
   *
   * This function sends a POST request with a specific payload to retrieve
   * orders in the "dikemas" state. It updates the account object with:
   * - the number of orders,
   * - the total value of those orders,
   * - and the earliest latest shipping time (epoch).
   * A notification is shown if new orders are detected.
   *
   * @param account - The account containing Tokopedia auth and order tracking info.
   * @param header - The HTTP headers used for the API call (includes tokens).
   * @returns A Promise resolving to the updated account object.
   */
  private async setupDikemas(account: StructAccount, header: any): Promise<StructAccount> {
    const url = `https://seller-id.tokopedia.com/api/fulfillment/order/list?locale=id-ID&language=id&oec_seller_id=${account.auth.oecSellerId}&aid=4068&app_name=i18n_ecom_shop&fp=${account.auth.fp}&device_platform=web&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=en-US&browser_platform=MacIntel&browser_name=Mozilla&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F135.0.0.0%20Safari%2F537.36&browser_online=true&timezone_name=Asia%2FJakarta&msToken=${account.auth.msToken}&X-Bogus=${account.auth.XBogus}&_signature==${account.auth.signature}`
    const payload = {"sort_info":"6","search_condition":{"condition_list":{"search_tab":{"value":["110"]}}},"count":50,"pagination_type":0,"offset":0,"search_cursor":"","extra_data_list":["48_hours_dispatch_tag","split_combine_tag_v1","free_sample_tag_v1","hazmat_order_tag","made_to_order_tag","pre_order_tag","pre_sell_tag","zero_lottery_tag","gift_insurance_tag","internal_purchase_tag","replacement_order_tag_v1","risk_order_tag_v1","combo_sku_tag","refundable_sample_tag","split_package_type_tag","two_day_delivery","DT_order"]}
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...header,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    const data = await response.json()
    if(typeof data.data.total_count !== 'number') { console.error('setupDikemas error: ', data); return account; }
    
    let orders: any = data.data.main_orders || []
    let orderPotency: number = 0
    let orderDeadline: number[] = []
    

    // filter packaged orders
    const url2 = `https://seller-id.tokopedia.com/api/fulfillment/order/list?locale=id-ID&language=id&oec_seller_id=${account.auth.oecSellerId}&aid=4068&app_name=i18n_ecom_shop&fp=${account.auth.fp}&device_platform=web&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=en-US&browser_platform=MacIntel&browser_name=Mozilla&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F135.0.0.0%20Safari%2F537.36&browser_online=true&timezone_name=Asia%2FJakarta&msToken=${account.auth.msToken}&X-Bogus=${account.auth.XBogus}&_signature==${account.auth.signature}`
    const payload2 = {"sort_info":"1","search_condition":{"condition_list":{"order_status":{"value":["2"]},"search_tab":{"value":["101"]}}},"count":20,"pagination_type":0,"offset":0,"search_cursor":"","extra_data_list":["48_hours_dispatch_tag","split_combine_tag_v1","free_sample_tag_v1","hazmat_order_tag","made_to_order_tag","pre_order_tag","pre_sell_tag","zero_lottery_tag","gift_insurance_tag","internal_purchase_tag","replacement_order_tag_v1","risk_order_tag_v1","combo_sku_tag","refundable_sample_tag","split_package_type_tag","two_day_delivery","DT_order"]}
    const response2 = await fetch(url2, {
      method: "POST",
      headers: {
        ...header,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload2)
    })
    if(response.ok) {
      const data = await response2.json()
      if(data.data) {
        const _orders = data.data?.main_orders || []
        orders.push(..._orders)
      }
    } else {
      console.error(response.status, response.statusText);
    }

    for(const order of orders) {
      try {
        const orderDL = parseInt(order.trade_order_module.latest_tts_time)
        if(isNaN(orderDL)) {
          orders = orders.filter((x: any) => x !== order)
          continue;
        }
        orderPotency += parseInt(order.price_module.grand_total.price_val)
        orderDeadline.push(orderDL)
      } catch(err) {
        console.error(err)
      }
    }

    if(orders === 0) {
      account.dikemasCount = 0
      account.dikemasPotency = 0
      account.dikemasEpoch = 0
      return account
    }

    const orderCount = orders.length
    if(orderCount > account.dikemasCount) {
      const diff = orderCount - account.dikemasCount
      const title =
        `${account.name}` +
        (this.account.getFirstGroupName(account.id)
          ? ` - ${this.account.getFirstGroupName(account.id)}`
          : "");
      this.notification.show({
        title,
        message: `${diff} Pesanan sedang dikemas`,
      });
    }
    account.dikemasCount = orderCount
    account.dikemasPotency = orderPotency
    account.dikemasEpoch = orderCount === 0 ? 0 : Math.min(...orderDeadline)
    return account
  }


  /**
   * Fetches complaint (cancellation) orders from Tokopedia for a given account
   * and updates the account's complaint statistics.
   *
   * This method sends a POST request to Tokopedia's order list API with a filter
   * targeting complaint-related orders. It calculates the total monetary value of
   * these complaints (potency) and updates the account accordingly. If new complaints
   * are detected compared to the previous count, a notification is triggered.
   *
   * @param account - The account object containing authentication and complaint tracking data.
   * @param header - HTTP headers used for the API request, including necessary tokens.
   * @returns A Promise resolving to the updated account object with complaint count and potency.
   */
  /**
   * Fetches complaint (cancellation and return) orders from Tokopedia for a given account
   * and updates the account's complaint statistics.
   *
   * This method sends POST requests to Tokopedia's order list and reverse order APIs
   * to retrieve complaint-related and return-related orders. It calculates the total
   * monetary value of these complaints (potency) and updates the account accordingly.
   * If new complaints are detected compared to the previous count, a notification is triggered.
   *
   * @param account - The account object containing authentication and complaint tracking data.
   * @param header - HTTP headers used for the API request, including necessary tokens.
   * @returns A Promise resolving to the updated account object with complaint count and potency.
   */
  private async setupComplaint(account: StructAccount, header: any): Promise<StructAccount> {
    // Complaint (cancellation) orders
    const url1 = `https://seller-id.tokopedia.com/api/fulfillment/order/list?locale=id-ID&language=id&oec_seller_id=${account.auth.oecSellerId}&aid=4068&app_name=i18n_ecom_shop&fp=${account.auth.fp}&device_platform=web&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=en-US&browser_platform=MacIntel&browser_name=Mozilla&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F135.0.0.0%20Safari%2F537.36&browser_online=true&timezone_name=Asia%2FJakarta&msToken=${account.auth.msToken}&X-Bogus=${account.auth.XBogus}&_signature==${account.auth.signature}`;
    const payload1 = {"sort_info":"1","search_condition":{"condition_list":{"urgency":{"value":["10"]},"search_tab":{"value":["101"]}}},"count":20,"pagination_type":0,"offset":0,"search_cursor":"","extra_data_list":["48_hours_dispatch_tag","split_combine_tag_v1","free_sample_tag_v1","hazmat_order_tag","made_to_order_tag","pre_order_tag","pre_sell_tag","zero_lottery_tag","gift_insurance_tag","internal_purchase_tag","replacement_order_tag_v1","risk_order_tag_v1","combo_sku_tag","refundable_sample_tag","split_package_type_tag","two_day_delivery","DT_order"]};
    const response1 = await fetch(url1, {
      method: "POST",
      headers: {
        ...header,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload1)
    });
    const data1 = await response1.json();

    let complaintCount = 0;
    let complaintPotency = 0;

    if (typeof data1.data?.total_count === 'number' && data1.data.total_count > 0) {
      const orders: any = data1.data.main_orders;
      complaintCount += orders.length;
      for (const order of orders) {
        complaintPotency += parseInt(order.price_module.grand_total.price_val);
      }
    }

    try {
      // Complaint (return) orders
      const url2 = `https://seller-id.tokopedia.com/api/v1/reverse/component/orders/list?locale=id-ID&language=id&oec_seller_id=${account.auth.oecSellerId}&aid=${account.auth.aid}&app_name=i18n_ecom_shop&fp=${account.auth.fp}&device_platform=web&cookie_enabled=true&screen_width=1470&screen_height=956&browser_language=en-US&browser_platform=MacIntel&browser_name=Mozilla&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F137.0.0.0%20Safari%2F537.36&browser_online=true&timezone_name=Asia%2FJakarta&msToken=${account.auth.msToken}&X-Bogus=${account.auth.XBogus}`;
      const payload2 = {"pagination_type":0,"count":20,"offset":0,"search_condition":{"tab":{"str_value_list":["800"]},"order_sort_comp":{"str_value_list":["OrderSort_UPADTE_TIME_DESC"]},"sub_tab_pending":{"str_value_list":["sub_tab_pending_all"]}},"component_version":"hit_opt_aware_revamp"};
      const response2 = await fetch(url2, {
        method: "POST",
        headers: {
          ...header,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload2)
      });
      const data2 = await response2.json();

      if (typeof data2.data?.total_count === 'number' && data2.data.total_count > 0) {
        complaintCount += data2.data.total_count;
        const potencies: number[] = (data2.data.cards || []).map((x: any) => parseInt(x.biz_data.return_price.replace(/\D/g, '')));
        for (const p of potencies) {
          complaintPotency += p;
        }
      }
    } catch(err: any) { console.error('Setup complaint2 error: ', err) }

    // Notification if new complaints
    if (complaintCount > account.complaintCount) {
      const diff = complaintCount - account.complaintCount;
      const title =
        `${account.name}` +
        (this.account.getFirstGroupName(account.id)
          ? ` - ${this.account.getFirstGroupName(account.id)}`
          : "");
      this.notification.show({
        title,
        message: `${diff} Pembatalan diajukan (komplain)`,
      });
    }

    account.complaintCount = complaintCount;
    account.complaintPotency = complaintPotency;
    return account;
  }

  private filterNewOrderFromPackings(orders: any): any[] {
    let newOrderInvoices: string[] = []
    const currentDay = moment2().tz('Asia/Jakarta').locale('id').set('minute', 1).set('hour', 0)
    const nowEpoch = currentDay.unix()
    for(const order of orders) {
      const orderCreatedMoment = moment2(order.order_date.replace("May", "Mei")
                                .replace("Aug", "Agt")
                                .replace("Oct", 'Okt')
                                .replace("Dec", 'Des'))
                                .tz('Asia/Jakarta')
                                .set('minute', 59)
                                .set('hour', 23)
                                .unix()
      const diff = nowEpoch - orderCreatedMoment
      // const expectedDiff = currentDay.format('dddd') === 'Senin' ? 172800 : 86400 // 2 days for sunday and 1 day for another day
      const expectedDiff = 259200 // 3 days 

      if(diff <= expectedDiff && !this.processedInvoiceMemory.has(order.order_resi)) {
        if(order.is_shipping_printed) {
          // Mark as complete automatically
          this.processedInvoiceMemory.add(order.order_resi)
          continue
        }
        newOrderInvoices.push(order.order_resi)
      }
    }
    return orders.filter((x: any) => newOrderInvoices.includes(x.order_resi))
  }

  setupAllOrders(account: StructAccount, data: any[]): StructAccount {
    // Fix error blink order data
    const orderListData: any[] = data.filter(
      (x) => !x.errors && x.data.orderList,
    );
    if (orderListData.length < 1) {
      return account;
    }
    // End of fix error blink order data
    const orderList: any[] = data
      .filter((x) => !x.errors && x.data.orderList)
      .map((x) => x.data.orderList.list);
    let OrderList = [];
    for (const orders of orderList) {
      OrderList.push(...orders);
    }

    const status = {
      newOrders: [220],
      packings: [400, 520],
      shippings: [450, 500, 501, 530, 540, 550, 600],
      complaints: [601],
    };

    let newOrders = OrderList.filter(
      (x) => status.newOrders.findIndex((y) => y === x.order_status_id) >= 0,
    );
    let packings = OrderList.filter(
      (x) => status.packings.findIndex((y) => y === x.order_status_id) >= 0,
    );
    const shippings = OrderList.filter(
      (x) => status.shippings.findIndex((y) => y === x.order_status_id) >= 0,
    );
    const complaints = OrderList.filter(
      (x) => status.complaints.findIndex((y) => y === x.order_status_id) >= 0,
    );


    let newOrdersNew = this.filterNewOrderFromPackings(packings)
    packings = packings.filter(x => !newOrdersNew.includes(x))
    for(const order of newOrdersNew) {
      if(!newOrders.includes(order)) {
        newOrders.push(order)
      }
    }

    if (newOrders.length > account.orderCount) {
      const count: number = newOrders.length - account.orderCount;
      const title =
        `${account.name}` +
        (this.account.getFirstGroupName(account.id)
          ? ` - ${this.account.getFirstGroupName(account.id)}`
          : "");
      this.notification.show({
        title,
        message: `${count} Pesanan baru`,
      });
    }

    if (packings.length > account.dikemasCount) {
      const differenceCount: number = packings.length - account.dikemasCount;
      const msg: string = `${differenceCount} pesanan sedang dikemas`;
      const title =
        `${account.name}` +
        (this.account.getFirstGroupName(account.id)
          ? ` - ${this.account.getFirstGroupName(account.id)}`
          : "");
      this.notification.show({ title, message: msg });
    }

    if (shippings.length > account.dikirimCount) {
      const differenceCount: number = shippings.length - account.dikirimCount;
      const msg: string = `${differenceCount} pesanan sedang dikirim`;
      const title =
        `${account.name}` +
        (this.account.getFirstGroupName(account.id)
          ? ` - ${this.account.getFirstGroupName(account.id)}`
          : "");
      this.notification.show({ title, message: msg });
    }

    if (complaints.length > account.complaintCount) {
      const differenceCount: number =
        complaints.length - account.complaintCount;
      const msg: string = `${differenceCount} pesanan dikomplain`;
      const title =
        `${account.name}` +
        (this.account.getFirstGroupName(account.id)
          ? ` - ${this.account.getFirstGroupName(account.id)}`
          : "");
      this.notification.show({ title, message: msg });
    }

    // Filter filter the orders length

    account.orderCount = newOrders.length;
    account.dikemasCount = packings.length;
    account.dikirimCount = shippings.length;
    account.complaintCount = complaints.length;

    // get the deadline epoch
    account.orderEpoch = this.getDeadlineEpoch(newOrders, "oldest");
    account.dikemasEpoch = this.getDeadlineEpoch(packings, 'oldest');

    // get the potency of order
    account.orderPotency = this.getPotency(newOrders);
    account.dikemasPotency = this.getPotency(packings);
    account.dikirimPotency = this.getPotency(shippings);
    account.complaintPotency = this.getPotency(complaints);
    return account;
  }

  /**
   * Calculates the potency number based on the given orders.
   *
   * @param {any[]} orders - An array of orders.
   * @return {number} The calculated potency number.
   */
  getPotency(orders: any[]): number {
    try {
      let potencyNumber: number = 0;
      let subTotals: string[] = [];
      for (const order of orders) {
        order.order_product.map((x: any) => subTotals.push(x.subTotal));
      }
      for (const subTotal of subTotals) {
        let n = subTotal
          .split(",")[0]
          // .split(' ')[0]
          .replace(/\D/g, "");
        if (subTotal.includes("jt")) {
          const i = parseInt(n + "000000");
          potencyNumber += i;
        } else {
          const i = parseInt(n);
          potencyNumber += i;
        }
      }
      return potencyNumber;
    } catch (err) {
      console.error("failed for get the potency of order: ", err);
      console.error(orders);
      return 0;
    }
  }

  /**
   * Calculates the deadline epoch based on the given orders and type.
   *
   * @param {any[]} orders - An array of orders.
   * @param {"latest" | "oldest"} type - The type of deadline to calculate.
   * @return {number} The calculated deadline epoch.
   */
  getDeadlineEpoch(orders: any[], type: "latest" | "oldest"): number {
    if (orders.length < 1) {
      return 0;
    }
    const deadlineTexts: string[] = orders.map((x) => x.deadline_text);
    let deadlineEpochs: number[] = [];
    for (let deadlineText of deadlineTexts) {
      try {
        deadlineText = deadlineText
          .replace("May", "Mei")
          .replace("Aug", "Agt")
          .replace("Oct", 'Okt')
          .replace("Dec", "Des");
        let deadlineMoment: Moment = moment(deadlineText, "D MMM; HH:mm"); // Fix date not same with moment datetype
        if(moment().tz("Asia/Jakarta").unix() >= deadlineMoment.unix() + 2.628e+6) {
          deadlineMoment = deadlineMoment.set('year', deadlineMoment.get('year') + 1)
        }
        console.log(`Discus date str: ${deadlineMoment.format('DD-MM-YYYY HH:mm')}`)

        const epoch: number = deadlineMoment.unix();
        // console.log(
        //   `${deadlineText} => ${epoch} => ${moment(epoch * 1000).format(
        //     "D MMM; HH:mm",
        //   )}`,
        // );
        deadlineEpochs.push(epoch);
      } catch (err) {
        console.error("failed for get the deadline epoch: ", err);
      }
    }
    if (deadlineEpochs.length < 1) {
      return 0;
    }
    const cd = new Date().valueOf() / 1000;
    if (type === "latest") {
      const max = Math.max(...deadlineEpochs);
      return max < cd ? max + 3.156e7 - 21600 - 2400 : max;
    } else if (type === "oldest") {
      const min = Math.min(...deadlineEpochs);
      return min < cd ? min + 3.156e7 - 21600 - 2400 : min;
    }
  }

  /**
   * Sets up the chat for the given account.
   *
   * @param {StructAccount} account - The account to set up the chat for.
   * @param {any[]} data - The data containing the chat list.
   * @return {StructAccount} - The updated account with the chat information.
   */
  private async setupChat(account: StructAccount, headers: any): Promise<[StructAccount, boolean]> {
    const url = `https://seller-id.tokopedia.com/api/v1/shop_im/shop/conversation/get_wait_user_count?locale=id-ID&language=id&oec_seller_id=${account.auth.oecSellerId}&aid=${account.auth.aid}&app_name=i18n_ecom_shop&fp=${account.auth.fp}&device_platform=web&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=en-US&browser_platform=MacIntel&browser_name=Mozilla&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F135.0.0.0%20Safari%2F537.36&browser_online=true&timezone_name=Asia%2FJakarta&msToken=${account.auth.msToken}&X-Bogus=${account.auth.XBogus}&_signature=${account.auth.signature}`
    const response = await fetch(url, {
      headers
    })
    if(!response.ok) { return [account, false] }
    const data = await response.json()
    if(data && typeof data.code === 'number' && data.code === 98001002) { return [account, false] }
    account.lastChatEpoch = 0
    account.chatCount = data.data?.unresponsive_conversation_count || 0
    return [account, true];
  }

  // setupBalance(account: StructAccount, data: any): StructAccount {
  //   for (const item of data) {
  //     if (!item.errors && item.data.balance) {
  //       account.balance = item.data.balance.seller_all;
  //     }
  //   }
  //   return account;
  // }

  private async setupProfileDetail(account: StructAccount, headers: any): Promise<StructAccount> {
    const url = `https://seller-id.tokopedia.com/api/v3/seller/common/get?need_verify_account=true&default_region=ID&version=3`
    const response = await fetch(url, {
      headers
    })
    if(!response.ok) { return account }
    const data: any = await response.json()
    //  START OF DETECT WHEN THE ACCOUNT IS LOGGED OUT
    if(!data.data) {
      // account.authenticated = false
      return account
    }
    //  END OF DETECT WHEN THE ACCOUNT IS LOGGED OUT
    const profileUrl = data.data.seller.logo.url_list[0]
    account.avatar = profileUrl
    return account;
  }

  parseCookiesToRaw(cookies: any[]): string {
    let t = "";
    for (const cookie of cookies) {
      t += `${cookie.name}=${cookie.value};`;
    }
    return t;
  }

  getProductCountPayload(shopid: number) {
    return {
      operationName: "ProductAddRule",
      variables: {},
      query:
        "query ProductAddRule {\n  ProductAddRule {\n    header {\n      reason\n      messages\n   }\n    data {\n      eligible {\n        value\n        totalProduct\n       limit\n   }\n      }\n    }\n}\n",
    };
  }

  // Payloads
  getFreeOngkirPayload(shopid: number): any {
    return {
      operationName: "checkRestrictionValidation",
      // @ts-ignore
      variables: {
        input: {
          dataRequest: [],
          source: "seller_dashboard",
          squad: "logistic",
          version: 2,
          metaRequest: [
            {
              restriction_name: "seller_bebas_ongkir_shop",
              dataRequest: [{ shop: { shopID: shopid } }],
            },
          ],
        },
      },
      query:
        "query checkRestrictionValidation($input: ValidateRestrictionRequest!) {\n  restrictValidateRestriction(input: $input) {\n    success\n    message\n    metaResponse {\n      restrictionName\n      dataResponse {\n        status\n        actions {\n          actionType\n          title\n          description\n          actionURL\n          __typename\n        }\n        metadata {\n          eligibleAction {\n            actionType\n            title\n            description\n            actionURL\n             }\n          __typename\n        }\n        }\n }\n    __typename\n  }\n}\n",
    };
  }

  getProfileDetailPayload() {
    return {
      operationName: "isAuthenticatedQuery",
      variables: {},
      query:
        "query isAuthenticatedQuery {\n  userShopInfo {\n    info {\n      shop_id\n    shop_avatar\n   shop_score\n      shop_location\n     }\n    owner {\n      owner_id\n      is_gold_merchant\n      pm_status\n  }\n    }\n\n}\n",
    };
  }

  getSellerBalancePayload() {
    return {
      operationName: "GetSellerBalance",
      variables: {},
      query:
        "query GetSellerBalance {\n  balance {\n    seller_all\n    seller_usable\n    buyer_usable\n    }\n}\n",
    };
  }

  getBankPayload() {
    return {
      operationName: "GetBankAccount",
      variables: {},
      query:
        "query GetBankAccount {\n  GetBankAccount {\n    status\n   data {\n      bankAccounts {\n        accID\n        accName\n        accNumber\n        bankID\n        bankName\n        bankImageUrl\n        fsp\n        statusFraud\n        copyWriting\n        __typename\n      }\n      userInfo {\n        message\n        isVerified\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n",
    };
  }

  getChatPayload() {
    return {
      operationName: "ChatListQuery",
      variables: {
        page: 1,
        perPage: 10,
        order: "desc",
        platform: "desktop",
        filter: "all",
        tab: "tab-seller",
      },
      query:
        'query ChatListQuery($tab: String, $filter: String, $page: Int = 1, $perPage: Int = 10, $order: String = "desc", $platform: String = "mobile") {\n  chatList: chatListMessage(tab: $tab, filter: $filter, page: $page, perPage: $perPage, order: $order, platform: $platform) {\n    list {\n      key: messageKey\n      messageId: msgID\n      attributes {\n        contact {\n          name\n          role\n          thumbnail\n          __typename\n        }\n        lastReplyMessage\n        lastReplyTime: lastReplyTimeStr\n        readStatus\n        unreads\n        pinStatus\n        isReplyByTopbot\n        __typename\n      }\n      __typename\n    }\n    hasNext\n    showTimeMachine\n    __typename\n  }\n}\n',
    };
  }


  getPMNamePayload(shopid: number): any {
    return {
      operationName: "GetUserShop",
      variables: {
        shopID: shopid,
      },
      query:
        'query GetUserShop($shopID: Int!) {\n  userShopInfo {\n    info {\n      dateShopCreated: date_shop_created\n      __typename\n    }\n    owner {\n      pm_status\n      __typename\n    }\n    __typename\n  }\n  shopInfoByID(input: {shopIDs: [$shopID], fields: ["favorite", "is_owner", "core", "other-goldos", "assets", "owner", "closed_info", "shopstats-limited", "status"]}) {\n    result {\n      location\n      favoriteData {\n        totalFavorite\n        __typename\n      }\n      shopCore {\n        description\n        domain\n        name\n        shopID\n        __typename\n      }\n      shopAssets {\n        avatar\n        __typename\n      }\n      goldOS {\n        isGold\n        isGoldBadge\n        isOfficial\n        title\n        badge\n        shopTier\n        shopTierWording\n        shopGrade\n        shopGradeWording\n        __typename\n      }\n      ownerInfo {\n        id\n        imageURL\n        name\n        __typename\n      }\n      statsByDate {\n        identifier\n        value\n        startTime\n        __typename\n      }\n      isOwner\n      closedInfo {\n        detail {\n          startDate\n          endDate\n          status\n          __typename\n        }\n        __typename\n      }\n      statusInfo {\n        shopStatus\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  user {\n    id\n    profilePicture\n    full_name\n    __typename\n  }\n}\n',
    };
  }

  getModerasiPayload(shopid: number) {
    return {
      operationName: "ShopInfoByIDQuery",
      variables: {
        shopIDs: [shopid],
        fields: [
          "assets",
          "core",
          "favorite",
          "location",
          "other-goldos",
          "other-shiploc",
          "status",
          "allow_manage",
          "is_owner",
          "closed_info",
          "status",
          "assets",
        ],
      },
      query:
        "query ShopInfoByIDQuery($shopIDs: [Int!]!, $fields: [String!]!) {\n  shopInfoByID(input: {shopIDs: $shopIDs, fields: $fields}) {\n    result {\n      favoriteData {\n        totalFavorite\n        __typename\n      }\n      goldOS {\n        isGold\n        isOfficial\n        badge\n        shopTier\n        shopTierWording\n        shopGrade\n        shopGradeWording\n        __typename\n      }\n      location\n      shopAssets {\n        avatar\n        cover\n        defaultCover {\n          id\n          path\n          __typename\n        }\n        __typename\n      }\n      isAllowManage\n      isOwner\n      shopCore {\n        name\n        shopID\n        domain\n        description\n        tagLine\n        __typename\n      }\n      shopHomeType\n      closedInfo {\n        closedNote\n        until\n        detail {\n          startDate\n          endDate\n          openDate\n          status\n          __typename\n        }\n        __typename\n      }\n      statusInfo {\n        statusMessage\n        shopStatus\n        statusName\n        __typename\n      }\n      os {\n        isOfficial\n        expired\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n",
    };
  }

  getPowerMerchantPayload(shopid: number) {
    return {
      operationName: "ShopPMGradeBenefitInfo",
      variables: {
        shopID: shopid,
        source: "shop-score-ui",
        fields: [
          "current_pm_grade",
          "current_benefit_list",
          "next_pm_grade",
          "next_benefit_list",
          "potential_pm_grade",
          "potential_benefit_list",
          "pm_grade_benefit_list",
          "next_level_benefit_package_list",
        ],
      },
      query:
        'query ShopPMGradeBenefitInfo($shopID: Int!, $source: String!, $fields: [String!]) {\n  goldGetPMGradeBenefitInfo(shop_id: $shopID, source: $source, device: "", fields: $fields) {\n    shop_id\n    next_monthly_refresh_date\n    next_quarterly_calibration_refresh_date\n    current_pm_grade {\n      shop_level\n      shop_score\n      grade_name\n      image_badge_url\n      image_badge_background_desktop_url\n      last_updated_date\n      __typename\n    }\n    current_benefit_list {\n      benefit_category\n      benefit_name\n      benefit_description\n      related_link_url\n      related_link_name\n      seq_num\n      image_url\n      __typename\n    }\n    next_pm_grade {\n      shop_level\n      shop_score_min\n      shop_score_max\n      grade_name\n      image_badge_url\n      image_badge_background_desktop_url\n      __typename\n    }\n    next_benefit_list {\n      benefit_category\n      benefit_name\n      benefit_description\n      related_link_url\n      related_link_name\n      seq_num\n      image_url\n      __typename\n    }\n    potential_pm_grade {\n      shop_level\n      shop_score\n      grade_name\n      image_badge_url\n      image_badge_background_desktop_url\n      last_updated_date\n      __typename\n    }\n    potential_benefit_list {\n      benefit_category\n      benefit_name\n      benefit_description\n      related_link_url\n      related_link_name\n      seq_num\n      image_url\n      __typename\n    }\n    pm_grade_benefit_list {\n      pm_grade_name\n      image_badge_url\n      is_active\n      benefit_list {\n        benefit_category\n        benefit_name\n        benefit_description\n        related_link_url\n        related_link_applink\n        related_link_name\n        seq_num\n        image_url\n        __typename\n      }\n      __typename\n    }\n    next_level_benefit_package_list {\n      pm_grade_name\n      image_badge_url\n      is_active\n      pm_tier\n      benefit_list {\n        benefit_name\n        benefit_description\n        related_link_url\n        related_link_applink\n        related_link_name\n        seq_num\n        image_url\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n',
    };
  }

  getSetOnlinePayload() {
    return {
      operationName: "SetShopActive",
      variables: { device: "desktop" },
      query:
        "mutation SetShopActive($device: String!) {\n  updateShopActive(input: {device: $device}) {\n    success\n    message\n }\n}\n",
    };
  }

  getBadgePayload(shopid: number) {
    return {
      operationName: "GetSellerReputation",
      variables: {
        shopIDArr: [shopid],
      },
      query:
        "query GetSellerReputation($shopIDArr: [Int!]!) {\n  reputation_shops(shop_ids: $shopIDArr) {\n    badge\n    score\n    __typename\n  }\n}\n",
    };
  }

  getDiscusPayload() {
    return {
      operationName: "discussionSellerInboxQuery",
      variables: {
        filter: "",
        page: 1,
        limit: 10,
      },
      query:
        "query discussionSellerInboxQuery($filter: String!, $page: Int!, $limit: Int!) {\n  discussionSellerDesktopInbox(filter: $filter, page: $page, limit: $limit) {\n    problemTotal\n    unrespondedTotal\n    userName\n    shopID\n    shopName\n    inboxType\n    hasNext\n    totalPage\n    __typename\n  }\n}\n",
    };
  }

  private getLocationPayload(shopid: number): any {
    return {
      operationName: "getAllShopLocations",
      variables: {
        shop_id: shopid,
      },
      query:
        "query getAllShopLocations($shop_id: Int!) {\n  ShopLocGetAllLocations(input: {shop_id: $shop_id}) {\n    status\n    message\n    error {\n      id\n      description\n      __typename\n    }\n    data {\n      general_ticker {\n        header\n        body\n        body_link_text\n        body_link_url\n        __typename\n      }\n      warehouses {\n        warehouse_id\n        warehouse_name\n        warehouse_type\n        shop_id {\n          int64\n          valid\n          __typename\n        }\n        partner_id {\n          int64\n          valid\n          __typename\n        }\n        address_detail\n        postal_code\n        latlon\n        district_id\n        district_name\n        city_id\n        city_name\n        province_id\n        province_name\n        country\n        status\n        is_covered_by_couriers\n        ticker {\n          text_inactive\n          text_courier_setting\n          link_courier_setting\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n",
    };
  }

  getProductMetaPayload(shopid: number): any {
    return {
      operationName: "ProductListMeta",
      variables: {
        shopID: shopid.toString(),
        extraInfo: ["rbac", "access", "category", "filter-group", "archival"],
        warehouseID: "",
      },
      query:
        "query ProductListMeta($shopID: String!, $warehouseID: String, $extraInfo: [String]) {\n  ProductListMeta(shopID: $shopID, warehouseID: $warehouseID, extraInfo: $extraInfo) {\n    header {\n      processTime\n      messages\n      reason\n      errorCode\n      __typename\n    }\n    data {\n      tab {\n        id\n        name\n        value\n        __typename\n      }\n      sort {\n        id\n        name\n        value\n        __typename\n      }\n      shopCategories {\n        id\n        name\n        __typename\n      }\n      access {\n        id\n        name\n        value\n        __typename\n      }\n      filterGroup {\n        id\n        name\n        filter {\n          id\n          value\n          name\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n",
    };
  }

  getAllOrderPayload(shopid: number, page: number = 1) {
    const getEndDate = (): string => {
      const currentMoment: Moment = moment().tz(this.tz);
      return currentMoment.add(30, "days").format("DD/MM/YYYY");
    };
    const getStartDate = (): string => {
      const currentMoment: Moment = moment().tz(this.tz);
      return currentMoment.subtract(90, "days").format("DD/MM/YYYY");
    };

    return {
      operationName: "OrderList",
      variables: {
        input: {
          status_key: "all_order",
          deadline: 0,
          is_show_filter: null as null,
          is_page: null as null,
          sort_by: -1,
          shipping_id: null as null,
          search: "",
          start_date: getStartDate(),
          end_date: getEndDate(),
          filter_status: 999,
          lang: "id",
          is_resi_only: null as null,
          order_type_list: [] as [],
          status_list: [] as [],
          page: page,
          batch_page: 1,
          show_page: 1,
          shop_id: shopid,
          warehouse_id: [] as [],
          shipping_list: [] as [],
          is_shipping_printed: 0,
          first_date: 0,
          last_date: 0,
          first_order_id: 0,
          last_order_id: 0,
          source: "som-desktop",
        },
      },
      query:
        "fragment AddonDetail on SOMAddon {\n  name\n  price\n  price_str\n  subtotal_price\n  subtotal_price_str\n  quantity\n  type\n  image_url\n  metadata {\n    add_on_note {\n      is_custom_note\n      from\n      to\n      notes\n      short_notes\n      __typename\n    }\n    __typename\n  }\n  create_time\n  __typename\n}\n\nfragment AddonSummary on SOMAddonSummary {\n  addons {\n    ...AddonDetail\n    __typename\n  }\n  total\n  total_price\n  total_price_str\n  total_quantity\n  __typename\n}\n\nfragment ProductDetail on OrderProduct {\n  productId: product_id\n  snapshotUrl: snapshot_url\n  productName: product_name\n  orderNote: order_note\n  productPrice: product_price\n  productQty: product_qty\n  subTotal: sub_total\n  totalWeight: total_weight\n  addonSummary: addon_summary {\n    ...AddonSummary\n    __typename\n  }\n  returnable\n  sku\n  picture\n  __typename\n}\n\nfragment BmgmProduct on BMGMSOMList {\n  id\n  bmgm_tier_name\n  tier_discount_amount\n  tier_discount_amount_formatted\n  price_before_benefit\n  price_before_benefit_formatted\n  price_after_benefit\n  price_after_benefit_formatted\n  order_detail {\n    ...ProductDetail\n    __typename\n  }\n  __typename\n}\n\nfragment BundleProduct on BundleDataSOMList {\n  bundleId: bundle_id\n  bundleVariantId: bundle_variant_id\n  bundleName: bundle_name\n  bundlePrice: bundle_price\n  bundleSubtotalPrice: bundle_subtotal_price\n  bundleItems: order_detail {\n    ...ProductDetail\n    __typename\n  }\n  __typename\n}\n\nfragment OrderDetails on SOMDetails {\n  totalProducts: total_products\n  addonLabel: addon_label\n  iconAddon: addon_icon\n  iconBundle: bundle_icon\n  iconBMGM: bmgm_icon\n  productsBundle: bundles {\n    ...BundleProduct\n    __typename\n  }\n  productsSingle: non_bundles {\n    ...ProductDetail\n    __typename\n  }\n  productsBMGM: bmgms {\n    ...BmgmProduct\n    __typename\n  }\n  __typename\n}\n\nfragment AddonOrderLevel on SOMAddonInfo {\n  label\n  icon_url\n  orderLevel: order_level {\n    ...AddonSummary\n    __typename\n  }\n  __typename\n}\n\nquery OrderList($input: OrderListArgs!) {\n  orderList(input: $input) {\n    firstOrderId: first_order_id\n    lastOrderId: last_order_id\n    firstDate: first_date\n    lastDate: last_date\n    total_data_per_batch\n      paging {\n      show_back_button\n      show_next_button\n      pages_show_value_list\n      pages_real_value_list\n      current_batch_page\n      current_page\n      next_changer_value\n      prev_changer_value\n      __typename\n    }\n    list {\n      orderDetails: details {\n        ...OrderDetails\n        __typename\n      }\n      pofData: pof_data {\n        isPof: is_pof\n        pofStatus: pof_status\n        __typename\n      }\n      isMitra: is_mitra\n      ticker {\n        text\n        action_text\n        action_key\n        type\n        cta_action_type\n        cta_action_value\n        cta_text\n        __typename\n      }\n      addonInfo: addon_info {\n        ...AddonOrderLevel\n        __typename\n      }\n      seller_notes_text\n      is_flagged_order\n      fulfill_by\n      kero_code\n      courier_type\n      courier_product_id\n      id: order_id\n      is_additional_cost\n      has_booking_info\n      booking_info_url\n      courier_product_name\n      courier_info\n      cancel_request\n      cancel_request_origin_note\n      cancel_request_note\n      cancel_request_time\n      dropship_name\n      dropship_phone\n      insurance_type\n      status\n      order_status_id\n      order_resi\n      order_resi_url\n      origin_address\n      origin_district\n      origin_geo\n      origin_postal_code\n      is_purchase_protection\n      order_total_price\n      labels: order_label {\n        text: flag_name\n        color: flag_color\n        backgroundColor: flag_background\n        __typename\n      }\n      preorder_process_time_days_left\n      buyer_name\n      order_date\n      buyer_id\n      courier_id\n      cashback\n      courier_name\n      isChecked: is_checked\n      is_topads\n      is_broadcast_chat\n      is_shipping_printed\n      is_replacement_taken\n      trade_in_fee\n      deadline_color\n      deadline_text\n      deadline_time_left\n      deadline_style\n      destination_street\n      destination_district\n      destination_city\n      destination_province\n      destination_postal_code\n      destination_phone\n      destination_receiver_name\n      free_return_order\n      courier_ref\n      is_free_shipping\n      is_penalty_reject\n      penalty_reject_wording\n      is_show_print_label\n      is_tokocabang\n      expired_finish_notif_label {\n        is_expired_finish_label\n        unix_expired_label_time\n        unix_finish_order_time\n        finish_order_time\n        expired_label_time\n        __typename\n      }\n      online_booking {\n        is_hide_input_awb\n        is_remove_input_awb\n        is_show_info\n        info_text\n        __typename\n      }\n      order_product {\n        productId: product_id\n        snapshotUrl: snapshot_url\n        productName: product_name\n        orderNote: order_note\n        productPrice: product_price\n        productQty: product_qty\n        subTotal: sub_total\n        totalWeight: total_weight\n        addonSummary: addon_summary {\n          ...AddonSummary\n          __typename\n        }\n        returnable\n        sku\n        picture\n        __typename\n      }\n      logistic_info {\n        all {\n          id\n          priority\n          description\n          info_text_short\n          info_text_long\n          __typename\n        }\n        __typename\n      }\n      buttonList: button {\n        bulk_url\n        key\n        display_name\n        url\n        title\n        color\n        type\n        popup {\n          template {\n            code\n            params\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      warehouse_name\n      cancelRequestStatus: cancel_request_status\n      isShowSellerNotes: is_show_seller_notes\n      isShowChatButton: is_show_chat_button\n      plus_data {\n        description\n        edu_url\n        logo_url\n        __typename\n      }\n      shipment_logo\n      has_reso_status\n      tx_id\n      group_type\n      tag {\n        isAffiliate: is_affiliate\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n",
    };
  }
}