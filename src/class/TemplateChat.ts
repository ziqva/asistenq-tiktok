import Database from "./Database";
import Account from "./Account";
import Notification from "./Notification";
import fetch from "node-fetch";

export default class TemplateChat {
  private database: Database;
  private replaceKutip: string;
  private account: Account;
  private currentTemplates: string[];
  private notification: Notification;

  constructor({
    database,
    account,
    notification,
  }: {
    database: Database;
    account: Account;
    notification: Notification;
  }) {
    this.database = database;
    this.initTable();
    this.notification = notification;
    this.replaceKutip = "%%%%$$$$";
    this.currentTemplates = [];
    this.account = account;
  }

  /**
   * Retrieves the raw cookies of an account.
   *
   * @param {StructAccount} account - The account object containing the cookies.
   * @return {string} The concatenated string of cookies in the format "name=value;".
   */
  private getRawCookiesOfAccount(account: StructAccount): string {
    let x = "";
    for (const cookie of account.cookies as any) {
      x += `${cookie.name}=${cookie.value};`;
    }
    return x;
  }

  /**
   * Retrieves the current template chat count.
   *
   * @param {string} cookies - The cookies used for authentication.
   * @return {Promise<number>} The current template chat count.
   */
  private async getCurrentTemplateChatCount(cookies: string): Promise<number> {
    const url = "https://gql.tokopedia.com/graphql/ChatTemplatesQuery";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        cookie: cookies,
        "content-type": "application/json",
        referer: "https://seller.tokopedia.com/chat",
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
      },
      body: JSON.stringify([
        {
          operationName: "ChatTemplatesQuery",
          variables: { isSeller: true },
          query:
            "query ChatTemplatesQuery($isSeller: Boolean!) {\n  chatTemplatesAll(isSeller: $isSeller) {\n    buyerTemplate {\n      isEnable\n      IsEnableSmartReply\n      IsSeller\n      templates\n      __typename\n    }\n    sellerTemplate {\n      isEnable\n      IsEnableSmartReply\n      IsSeller\n      templates\n      __typename\n    }\n    __typename\n  }\n}\n",
        },
      ]),
    });

    if (!response.ok)
      throw new Error(
        `Failed for get the current template chat count: ${response.statusText}`
      );
    const data: any = await response.json();
    const count = data[0].data.chatTemplatesAll.sellerTemplate.templates.length;
    const templates = data[0].data.chatTemplatesAll.sellerTemplate.templates;
    this.currentTemplates = templates;
    return count;
  }

  /**
   * A function that adds a fetch request with provided cookies and chats array.
   *
   * @param {string} cookies - the cookies to be included in the request headers
   * @param {string[]} chats - an array of chat messages to be added
   * @return {Promise<void>} a promise that resolves when the fetch request is completed
   */
  private async addFetch(cookies: string, chats: string[]): Promise<void> {
    const url = "https://gql.tokopedia.com/graphql/chatTemplateAdd";
    const headers = {
      cookie: cookies,
      "content-type": "application/json",
      referer: "https://seller.tokopedia.com/chat/setting/template",
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
    };
    const body = JSON.stringify([
      {
        operationName: "chatTemplateAdd",
        variables: { isSeller: true, value: chats[0] },
        query:
          "mutation chatTemplateAdd($isSeller: Boolean!, $value: String!) {\n  chatAddTemplate(isSeller: $isSeller, value: $value) {\n    success\n    __typename\n  }\n}\n",
      },
    ]);
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });
    if (!response.ok) {
      throw new Error("Unexpected error of adding the chat template");
    }
    console.log(await response.json());
  }

  /**
   * Deletes one template chat using the provided cookies.
   *
   * @param {string} cookies - The cookies used for authentication.
   * @return {Promise<void>} - A promise that resolves when the template chat is deleted successfully.
   */
  private async deleteOne(cookies: string, index: number = 1): Promise<void> {
    const url = "https://gql.tokopedia.com/graphql/chatTemplateDelete";
    const headers = {
      cookie: cookies,
      "content-type": "application/json",
      referer: "https://seller.tokopedia.com/chat/setting/template",
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
    };
    const body = JSON.stringify([
      {
        operationName: "chatTemplateDelete",
        variables: { index, isSeller: true },
        query:
          "mutation chatTemplateDelete($index: Int!, $isSeller: Boolean!) {\n  chatDeleteTemplate(templateIndex: $index, isSeller: $isSeller) {\n    success\n    __typename\n  }\n}\n",
      },
    ]);
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });
    if (!response.ok) {
      throw new Error("Unexpected error of delete one templatechat");
    }
  }

  /**
   * Sets the given chats for the account with the specified ID.
   *
   * @param {number} id - The ID of the account.
   * @param {string[]} chats - The array of chats to be set for the account.
   * @return {Promise<void>} A promise that resolves when the chats are set for the account.
   */
  public async setOfAccount(id: number, chats: string[]): Promise<void> {
    try {
      chats = chats.slice(0, 5);
      chats = chats.map((x) => x.trim());
      if (chats.length < 1) return;
      const account = await this.account.get(id);
      if (chats.length < 5) {
        const message = `Membutuhkan 5 template chat untuk menerapkan template, anda memasukkan ${chats.length}, perubahan tidak diterapkan.`;
        console.log(message);
        return await this.notification.show({
          title: account.name,
          message,
        });
      }
      const cookies = this.getRawCookiesOfAccount(account);
      let currentTemplateCount = await this.getCurrentTemplateChatCount(
        cookies
      );
      for (const chat of chats) {
        if (currentTemplateCount >= 5) {
          currentTemplateCount--;
          await this.deleteOne(cookies);
        }
        await this.addFetch(cookies, [chat]);
        currentTemplateCount++;
      }

      for (let i = 0; i < currentTemplateCount - chats.length; i++) {
        await this.deleteOne(cookies, chats.length + 1);
      }
    } catch (err) {
      console.error(err?.toString());
    }
  }

  /**
   * Retrieves the list of chats associated with the specified account ID.
   *
   * @param {number} id - The ID of the account.
   * @return {Promise<string[]>} A promise that resolves to an array of chat IDs.
   */
  public async getAccountChats(id: number): Promise<string[]> {
    const account = await this.account.get(id);
    let groups = account.groupNames
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
    if (groups.length < 1) {
      groups = ["ungroup"];
    }
    let chats: string[] = [];
    for (const group of groups) {
      const _chats = await this.getData(group);
      for (const chat of _chats.chats) {
        if (!chats.includes(chat)) chats.push(chat);
      }
    }
    return chats;
  }

  /**
   * Remove a chat from the specified template data.
   *
   * @param {string} name - the name of the template
   * @param {string} chat - the chat to be removed
   * @return {Promise<void>} a Promise that resolves once the chat is removed
   */
  public async remove(name: string, chat: string): Promise<void> {
    const exists = await this.exists(name);
    if (!exists) throw new Error(`Not found template with name: ${name}`);
    let data = await this.getData(name);
    data.chats = data.chats.filter((c: string) => c !== chat);
    await this.set(name, data.chats);
  }

  /**
   * Adds a new chat to the existing template with the given name.
   *
   * @param {string} name - The name of the template.
   * @param {string} chat - The chat to be added to the template.
   * @return {Promise<void>} - A promise that resolves when the chat is successfully added.
   * @throws {Error} - If the template with the given name does not exist.
   */
  /**
   * Initializes the table by creating it if it does not exist.
   */
  public async add(name: string, chat: string): Promise<void> {
    const exists = await this.exists(name);
    if (!exists) throw new Error(`Not found template with name: ${name}`);
    let data = await this.getData(name);
    data.chats.push(chat);
    await this.set(name, data.chats);
  }

  /**
   * Initializes the table for template chat.
   *
   * @return {Promise<void>} - A promise that resolves when the table is initialized.
   */
  private async initTable() {
    const sql: string = `CREATE TABLE IF NOT EXISTS template_chat (
      id INT IDENTITY(1,1) PRIMARY KEY,
      group_name VARCHAR(255) NOT NULL,
      chats LONGTEXT NOT NULL
    )`;
    await this.database.query(sql);
  }

  /**
   * Checks if a template chat with the given name exists in the database.
   *
   * @param {string} name - The name of the template chat to check.
   * @return {Promise<boolean>} A Promise that resolves to true if a template chat with the given name exists, false otherwise.
   */
  private async exists(name: string): Promise<boolean> {
    const sql: string = `SELECT COUNT(group_name) FROM template_chat WHERE group_name = "${name}"`;
    const res: any = await this.database.query(sql);
    const val = res[0]["COUNT(group_name)"];
    return val > 0;
  }

  /**
   * Set the specified chats for the given name in the database.
   *
   * @param {string} name - the name of the template chat
   * @param {string[]} chats - an array of chats to be set
   * @return {Promise<void>} a Promise that resolves when the operation is complete
   */
  public async set(name: string, chats: string[]): Promise<void> {
    const exists = await this.exists(name);
    if (!exists) throw new Error(`Template chat "${name}" tidak ditemukan`);
    chats = chats.map((chat) => chat.split("'").join(this.replaceKutip));
    const chatJson: string = JSON.stringify(chats);
    const sql: string = `UPDATE template_chat SET chats = '${chatJson}' WHERE group_name = "${name}"`;
    await this.database.query(sql);
  }

  /**
   * Retrieves data from the database for the given name and returns the template chat data.
   *
   * @param {string} name - The name to retrieve data for
   * @return {Promise<TemplateChatData>} The template chat data retrieved from the database
   */
  public async getData(name: string): Promise<TemplateChatData> {
    const exists = await this.exists(name);
    if (!exists) {
      const initSql: string = `INSERT INTO template_chat (group_name, chats) VALUES("${name}", "[]")`;
      await this.database.query(initSql);
    }

    // Fetch sql
    const sql: string = `SELECT chats, group_name FROM template_chat WHERE group_name = "${name}"`;
    // @ts-ignore
    const res: any = (await this.database.query(sql))[0];
    return {
      groupName: res.group_name,
      chats: JSON.parse(res.chats).map((chat: string) =>
        chat.split(this.replaceKutip).join("'")
      ),
    };
  }
}
