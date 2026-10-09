import Account from "./Account";
import { Page, Browser } from "puppeteer";
import BrowserEngine from "./Browser";
import Monitoring from "./Monitoring";
import TemplateChat from "./TemplateChat";
import * as fs from "fs";
import * as path from "path";

export default class OpenBrowser {
  private account: Account;
  private lastOpenedId: number;
  private browser: Browser | null;
  private page: Page | null;
  private browserEngine: BrowserEngine;
  private monitoring: Monitoring;
  private updateCookiesInt: ReturnType<typeof setInterval> | null;
  private detectLogoutInterval: ReturnType<typeof setInterval> | null;
  private templateChat: TemplateChat;
  private chats: string[];

  private async add1Product(page: Page) {
    await this.browserEngine.navigatePage(page, 'https://seller.tokopedia.com/add-product')
    const els = {
      selectCityContainer: "#address",
      selectCitySearch: "/html/body/div[9]/div/div/div/div/input",
      selectCityItems: "/html/body/div[9]/div/div/ul/li/button/div/div/p",
      selectPostalCodeContainer: "/html/body/div[8]/div[2]/div[1]/div[3]/div[2]",
      selectPostalCodeItem: "/html/body/div[10]/div/div/ul/li[1]/button/div/div/p",
      another: "/html/body/div[8]/div[2]/div[1]/div[1]",
      saveLocation: "/html/body/div[8]/div[2]/button",
      productNameInput: 'input[data-testid="txtAEPProductName"]',
      recomendedCategory: '[data-testid="rdoAEPCategoryRecommendation"]',
      inputImage: '#imgInputEl',
      inputPrice: '[data-testid="txtAEPPrice"]',
      inputWeight: '[data-testid="txtAEPWeight"]',
      btnSaveProd: '[data-testid="btnAEPSave"]',
      inputStock: '[data-testid="txtAEPProductStock"]'
    }

    const productName = 'Tentang kita'
    const imageSource = 'C:\\Users\\DELL\\Pictures\\logo\\logo a.jpg'

    const scrollToBottom = () => {
      page.evaluate(() => {
          const scrollHeight = document.documentElement.scrollHeight;
          const distance = 100; // Distance to scroll in pixels
          const delay = 20; // Delay between each scroll step in milliseconds
  
          let scrollTop = 0;
  
          const scrollStep = () => {
            scrollTop += distance;
            document.documentElement.scrollTo(0, scrollTop);
            if (scrollTop < scrollHeight) {
              setTimeout(scrollStep, delay);
            } else {
              return
            }
          };
  
          scrollStep();
        });
    };

    // Set the location
    // Set the city
    const selectCityContainer = await page.waitForSelector(els.selectCityContainer, {timeout: 0})
    await selectCityContainer.click()
    const selectCitySearch = await page.waitForSelector(`xpath/${els.selectCitySearch}`, {timeout: 0})
    await selectCitySearch.type('Jakarta')
    const cityItem: any = await page.waitForSelector(`xpath/${els.selectCityItems}`, {timeout: 0})
    await cityItem.click()
    const another: any = await page.waitForSelector(`xpath/${els.another}`, {timeout: 0})
    another.click()

    // Click the postal code
    const selectPostalCodeContainer: any = await page.waitForSelector(`xpath/${els.selectPostalCodeContainer}`, {timeout:0, visible: true})
    await selectPostalCodeContainer.click()
    const selectPostalCodeItem: any = await page.waitForSelector(`xpath/${els.selectPostalCodeItem}`, {timeout: 0, visible: true})
    await selectPostalCodeItem.click()
    another.click()
    const saveLocation: any = await page.waitForSelector(`xpath/${els.saveLocation}`, {timeout: 0})
    await saveLocation.click()

    const productNameInput = await page.waitForSelector(els.productNameInput, {timeout: 0})
    await productNameInput.type(productName)
    
    scrollToBottom()
    const recomendedCategory = await page.waitForSelector(els.recomendedCategory, {timeout: 0})
    await recomendedCategory.click()
    const inputStock = await page.waitForSelector(els.inputStock, {timeout: 0})
    await inputStock.type('1')
    const inputImage: any = await page.waitForSelector(els.inputImage, {timeout: 0})
    await inputImage.uploadFile(imageSource)
    const inputPrice = await page.waitForSelector(els.inputPrice, {timeout: 0})
    await inputPrice.type('10000000')
    const inputWeight = await page.waitForSelector(els.inputWeight, {timeout: 0})
    await inputWeight.type('1000')
    const btnSaveProd = await page.waitForSelector(els.btnSaveProd, {timeout: 0})
    await btnSaveProd.click()
  } 

  /**
   * Creates a new instance of the constructor.
   *
   * @param {Account} account - The account object.
   */
  constructor(
    account: Account,
    monitoring: Monitoring,
    templateChat: TemplateChat
  ) {
    this.chats = [];
    this.account = account;
    this.monitoring = monitoring;
    this.lastOpenedId = null;
    this.page = null;
    this.browser = null;
    this.browserEngine = new BrowserEngine();
    this.handleAcceptCookies();
    this.updateCookiesInt = null;
    this.detectLogoutInterval = null;
    this.templateChat = templateChat;
  }

  /**
   * sendActiveAccount sends the active account ID to all connected sockets.
   *
   * @return {Promise<void>} A Promise that resolves when the active account ID is sent to all sockets.
   */
  public async sendActiveAccount(): Promise<void> {
    for (const socket of this.monitoring.sockets) {
      try {
        socket.emit("active-account-id", this.monitoring.openedAccountId);
      } catch (err) {}
    }
  }

  /**
   * Handle accept cookies function
   *
   * @return {Promise<void>}
   */
  private async handleAcceptCookies(): Promise<void> {
    while (true) {
      if (this.page && !this.page.isClosed()) {
        try {
          const el = await Promise.race([
            this.page.waitForSelector(
              "#onetrust-accept-btn-handler:not(:disabled)",
              { timeout: 0, visible: true, hidden: false }
            ),
          ]);
          await el?.click();
        } catch (err) {}
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  /**
   * Parses the given array of cookies to a raw string format.
   *
   * @param {any[]} cookies - the array of cookies to be parsed
   * @return {string} the raw string format of the parsed cookies
   */
  private parseCookiesToRaw(cookies: any[]): string {
    let cookieString = "";
    for (let cookie of cookies) {
      cookieString += `${cookie.name}=${cookie.value}; `;
    }
    // Remove the trailing semicolon and space
    cookieString = cookieString.slice(0, -2);
    return cookieString;
  }

  /**
   * An asynchronous function that updates cookies for a given page and account ID.
   *
   * @param {Page} page - The page object to update cookies for.
   * @param {number} id - The account ID for which the cookies should be updated.
   * @return {Promise<void>} A promise that resolves when the cookies are successfully updated.
   */
  private async updateCookies(page: Page, id: number): Promise<void> {
    try {
      if (!page || page.isClosed()) {
        return;
      }
      let cookies: any[] = [];
      try {
        const cdp = await page.target().createCDPSession();
        const res = await cdp.send("Network.getAllCookies");
        if (res && Array.isArray(res.cookies) && res.cookies.length > 0) {
          cookies = res.cookies;
        }
      } catch (e) {
        cookies = await page.cookies();
      }
      if (cookies.length > 0) {
        await this.account.setCookies(id, cookies);
      }
    } catch (err) {}
  }

  private async detectLogout(
    id: number,
    targetUrl: string,
    {
      page,
      browser,
    }: {
      page: Page;
      browser: Browser;
    }
  ): Promise<void> {
    try {
      this.detectLogoutInterval = setInterval(async () => {
        const url = page.url();
        const cleanUrl = url.trim().split("?")[0];
        if (
          cleanUrl === "https://www.tokopedia.com/login" ||
          cleanUrl === "https://seller-id.tokopedia.com/account/login" ||
          cleanUrl.includes("/account/login") ||
          cleanUrl.includes("seller-id.tokopedia.com/login")
        ) {
          for (let i = 0; i < 10; i++) {
            try {
              await browser.close();
            } catch (err) {}
          }
          await new Promise((r) => setTimeout(r, 500));
          await this.account.login([this.lastOpenedId]);
          await this.open(id, targetUrl);
        }
      }, 2000);
    } catch (err) {
      console.error(`Failed for set the detect logout: `, err.message || err);
    }
  }

  /**
   * Opens a new URL in the browser for the specified account ID.
   *
   * @param {number} id - The ID of the account.
   * @param {string} targetUrl - The URL to open in the browser.
   * @return {Promise<void>} - A promise that resolves when the URL is successfully opened.
   */
  async open(id: number, targetUrl: string): Promise<void> {
    // if (this.updateCookiesInt) {
    //   clearInterval(this.updateCookiesInt);
    //   this.updateCookiesInt = null;
    // }
    // if (this.detectLogoutInterval) {
    //   clearInterval(this.detectLogoutInterval);
    // }

    this.detectLogoutInterval = null;
    this.monitoring.openedAccountId = null;
    this.sendActiveAccount();
    const exists: boolean = await this.account.exists(id);
    if (!exists) {
      throw new Error("Akun tidak ditemukan");
    }
    const account: StructAccount = await this.account.get(id);
    if (!account.cookies || !Array.isArray(account.cookies) || account.cookies.length === 0) {
      throw new Error("Akun belum memiliki sesi login, silahkan login terlebih dahulu");
    }
    this.chats = await this.templateChat.getAccountChats(id);
    this.templateChat.setOfAccount(id, this.chats);
    try {
      if (this.lastOpenedId !== id && this.browser) {
        await this.browser.close().catch(() => {});
        this.browser = null;
        this.page = null;
      }
      await this.page.goto("about:blank");
    } catch (err) {
      const profileName = `account_${id}`;
      const { browser, page } = await this.browserEngine.getBrowser(
        profileName,
        [],
        false
      );
      this.page = page;
      this.browser = browser;
      this.browser.on("disconnected", async () => {
        this.monitoring.openedAccountId = null;
        if (this.updateCookiesInt) {
          clearInterval(this.updateCookiesInt);
          this.updateCookiesInt = null;
        }
        this.browser = null;
        this.page = null;
        this.sendActiveAccount();
        this.detectLogoutInterval = null;
      });
    }

    // Start periodic cookie sync
    if (this.updateCookiesInt) {
      clearInterval(this.updateCookiesInt);
    }
    this.updateCookiesInt = setInterval(() => {
      if (this.page && !this.page.isClosed()) {
        this.updateCookies(this.page, id);
      }
    }, 15000);

    // Restore localStorage if available
    try {
      const profileDir = this.browserEngine.generateUserdataDir(`account_${id}`);
      const storageFile = path.join(profileDir, 'storage_data.json');
      if (fs.existsSync(storageFile)) {
        const storageData = JSON.parse(fs.readFileSync(storageFile, 'utf-8'));
        await this.page.evaluateOnNewDocument((data) => {
          for (const key of Object.keys(data)) {
            if (!localStorage.getItem(key)) {
              localStorage.setItem(key, data[key]);
            }
          }
        }, storageData);
      }
    } catch (e) {
      console.warn("Failed to inject localStorage:", e);
    }
    const sanitizeCookies = (rawCookies: any[]) => {
      return rawCookies
        .filter((c) => c && typeof c === "object" && c.name && c.value !== undefined)
        .map((c) => {
          const cookie: any = {
            name: String(c.name),
            value: String(c.value),
          };
          if (c.domain) cookie.domain = c.domain;
          if (c.path) cookie.path = c.path;
          if (typeof c.expires === "number" && c.expires > 0) cookie.expires = c.expires;
          if (typeof c.httpOnly === "boolean") cookie.httpOnly = c.httpOnly;
          if (typeof c.secure === "boolean") cookie.secure = c.secure;
          if (c.sameSite && ["Strict", "Lax", "None"].includes(c.sameSite)) {
            cookie.sameSite = c.sameSite;
          }
          return cookie;
        });
    };

    const cookies = sanitizeCookies(account.cookies);
    if (cookies.length > 0) {
      try {
        await this.page.setCookie(...cookies);
      } catch (err) {
        // Fallback: set cookies individually if batch fails
        for (const cookie of cookies) {
          try {
            await this.page.setCookie(cookie);
          } catch (e) {}
        }
      }
    }
    await this.browserEngine.navigatePage(this.page, targetUrl, 1);
    this.monitoring.openedAccountId = id;
    this.lastOpenedId = id;
    this.sendActiveAccount();
  }
}