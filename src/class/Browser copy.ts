import * as fs from "fs";
import * as path from "path";
import puppeteer from "puppeteer-extra";
import pluginStealth from "puppeteer-extra-plugin-stealth";
import * as os from "os";
import { Page, Browser as BrowserPuppeteer } from "puppeteer";
import axios from 'axios'
// @ts-ignore
import crx from 'crx-util'
import fsExtra from 'fs-extra'
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker'
import chromeLauncher from 'chrome-launcher'

interface ExtensionDetail {
  dir: string;
  name: string;
  description: string;
  icon: string;
  author: string;
  id: string;
  iconUrl: string
}

export default class Browser {
  private chromeBinPath: string | null;
  private rootPath: string;
  private extensionsRootPath: string
  constructor() {
    this.chromeBinPath = this.getChromeBinPath();
    this.rootPath = path.join(os.tmpdir(), "asistenq-owner-node");
    if(!fs.existsSync(this.rootPath)) { fs.mkdirSync(this.rootPath) }
    this.extensionsRootPath = path.join(this.rootPath, '_extensions_')
    if (!fs.existsSync(this.extensionsRootPath)) { fs.mkdirSync(this.extensionsRootPath) }
  }

  /**
   * Retrieves a list of installed extensions and their details.
   *
   * @return {Promise<ExtensionDetail[]>} A promise that resolves to an array of ExtensionDetail objects,
   * representing the installed extensions.
   */
  public async extensions(): Promise<ExtensionDetail[]> {
    let res: ExtensionDetail[] = []
    if(!fs.existsSync(this.extensionsRootPath)) { fs.mkdirSync(this.extensionsRootPath) }
    const dirs = fs.readdirSync(this.extensionsRootPath).map(x => path.join(this.extensionsRootPath, x))
    for(const dir of dirs) {
      try {
        res.push(this.getExtensionDetails(dir, 'en'))
      } catch(err) {}
    }
    return res
  }
  
  public async removeExtension(id: string): Promise<void> {
    const installed = this.installedExtension(id)
    if(!installed) { throw new Error('Extension is not installed') }
    const extPath = path.join(this.extensionsRootPath, id)
    fsExtra.rmSync(extPath, { force: true, recursive: true })
  }

/**
 * This function is a private method that tests the functionality of the `getExtensionDetails` method.
 *
 * @return {Promise<void>} A Promise that resolves to void.
 */

  private resolveLocalizedString = (placeholder: string, localesDir: string, defaultLocale: string) => {
    const localePath = path.join(localesDir, defaultLocale, 'messages.json');

    if (!fs.existsSync(localePath)) {
      console.warn(`Locale file not found: ${localePath}`);
      return placeholder; // Return the placeholder if the locale file is not found
    }

    const messages = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
    const key = placeholder.replace(/__MSG_(.*)__/, '$1');

    return messages[key] && messages[key].message ? messages[key].message : placeholder;
  };

  private getLastDirectoryName(fullPath: string): string {
    const normalizedPath = path.normalize(fullPath);
    const lastPart = path.basename(normalizedPath);
    if (fs.statSync(fullPath).isDirectory()) {
        return lastPart;
    }
    return path.basename(path.dirname(normalizedPath));
  }

  /**
   * Retrieves the details of an extension from the specified extracted directory.
   *
   * @param {string} extractedDir - The path to the extracted directory of the extension.
   * @param {string} [defaultLocale='en'] - The default locale to use if the extension does not specify a locale. Defaults to 'en'.
   * @return {ExtensionDetail} An object containing the name, author, description, icon, directory, ID, and icon URL of the extension.
   * @throws {Error} If the manifest.json file is not found in the extracted directory.
   */
  public getExtensionDetails(extractedDir: string, defaultLocale = 'en'): ExtensionDetail {
    const manifestPath = path.join(extractedDir, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      throw new Error('manifest.json not found in the extracted directory.');
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const localesDir = path.join(extractedDir, '_locales');

    const extensionDetails: ExtensionDetail = {
      name: manifest.name.includes('__MSG_')
        ? this.resolveLocalizedString(manifest.name, localesDir, defaultLocale)
        : manifest.name || 'No name available',
      author: manifest.author || 'No author available',
      description: manifest.description.includes('__MSG_')
        ? this.resolveLocalizedString(manifest.description, localesDir, defaultLocale)
        : manifest.description || 'No description available',
      icon: manifest.icons ? this.getLargestIconPath(manifest.icons, extractedDir) : 'No icon available',
      dir: extractedDir,
      id: this.getLastDirectoryName(extractedDir),
      iconUrl: `http://localhost:9183/browser/ext_icon?id=${this.getLastDirectoryName(extractedDir)}`
    };

    return extensionDetails;
  }

  private getLargestIconPath = (icons: any, extractedDir: string) => {
    const iconSizes = Object.keys(icons).map(Number).sort((a, b) => b - a);
    const largestIcon = icons[iconSizes[0]];
    return path.join(extractedDir, largestIcon);
  };

  /**
   * Checks if an extension with the given ID is installed.
   *
   * @param {string} id - The ID of the extension to check.
   * @return {boolean} True if the extension is installed, false otherwise.
   */
  private installedExtension(id: string): boolean {
    const targetManifestFile = path.join(this.extensionsRootPath, id, 'manifest.json')
    return fs.existsSync(targetManifestFile)
  }

  /**
   * Adds an extension to the browser.
   *
   * @param {string} url - The URL of the extension to add.
   * @return {Promise<void>} A promise that resolves when the extension is added successfully.
   * @throws {Error} If the extension is already installed.
   */
  public async addExtension(url: string): Promise<void> {
    const id = this.getExtensionIdFromUrl(url)
    if (this.installedExtension(id)) { throw new Error('Terjadi duplikasi extensi') }
    const crxUrl = `https://clients2.google.com/service/update2/crx?response=redirect&os=linux&arch=x64&os_arch=x86_64&nacl_arch=x86-64&prod=chromium&prodchannel=unknown&prodversion=91.0.4442.4&lang=en-US&acceptformat=crx2,crx3&x=id%3D${id}%26installsource%3Dondemand%26uc`;
    const response = await axios({
      url: crxUrl,
      method: "GET",
      responseType: 'arraybuffer'
    })
    const crxPath = path.join(os.tmpdir(), `_tmp.${Date.now()}.crx`)
    fs.writeFileSync(crxPath, response.data)
    // Extract the crx
    const extDir = path.join(this.extensionsRootPath, id)
    if (!fs.existsSync(extDir)) { fs.mkdirSync(extDir) }
    await crx.parser.extract(crxPath, extDir)
    fs.unlinkSync(crxPath)
  }

  /**
   * Extracts the extension ID from the given Chrome Web Store URL.
   *
   * @param {string} url - The URL of the Chrome Web Store extension.
   * @return {string} The extracted extension ID.
   * @throws {Error} If the URL is invalid or does not contain an extension ID.
   */
  private getExtensionIdFromUrl(url: string): string {
    // Regular expression to match the extension ID in the URL
    const regex = /\/([a-z]{32})/;
    const match = url.match(regex);

    if (match && match[1]) {
      return match[1];
    } else {
      throw new Error('Invalid Chrome Web Store URL.');
    }
  };


  /**
   * Navigates the given page to the specified URL with a maximum number of retries.
   *
   * @param {Page} page - The page to navigate.
   * @param {string} url - The URL to navigate to.
   * @param {number} maxRetry - The maximum number of retries (default: 30).
   * @return {Promise<void>} A promise that resolves when the navigation is complete.
   */
  async navigatePage(
    page: Page,
    url: string,
    maxRetry: number = 30
  ): Promise<void> {
    let retry: number = 0;
    while (retry < maxRetry) {
      try {
        await page.goto(url);
        break;
      } catch (err) {
        retry++;
      }
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  public async clearData(page: Page): Promise<void> {
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');
  }

  /**
   * Asynchronously gets the browser and page instances.
   *
   * @param {string} userDataDir - (optional) The path to the directory where user data will be stored. Default is "default".
   * @param {string[]} args - (optional) Additional command-line arguments to pass to the browser process.
   * @return {Promise<{page: Page, browser: BrowserPuppeteer }>} A promise that resolves to an object containing the page and browser instances.
   */
  async getBrowser(
    userDataDir: string = "default",
    args: string[] = []
  ): Promise<{ page: Page; browser: BrowserPuppeteer }> {
    if (this.chromeBinPath === null) {
      throw new Error("Chrome binnary tidak ditemukan");
    }
    puppeteer.use(AdblockerPlugin({
      blockTrackers: true
    }))
    puppeteer.use(
      pluginStealth({
        enabledEvasions: new Set([
          "chrome.app",
          "chrome.csi",
          "chrome.loadTimes",
          "chrome.runtime",
          // Remove following line to fix issue
          // "iframe.contentWindow",
          "media.codecs",
          "navigator.hardwareConcurrency",
          "navigator.languages",
          "navigator.permissions",
          "navigator.plugins",
          "navigator.webdriver",
          "sourceurl",
          "user-agent-override",
          "webgl.vendor",
          "window.outerdimensions",
        ]),
      })
    );

    try {
      fs.rmSync(this.generateUserdataDir(userDataDir), {
        force: true,
        recursive: true,
      });
    } catch (er) { }

    const extensionsDir = (await this.extensions()).map(x => x.dir)
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [...args,
        '--no-sandbox',
        `--load-extension=${extensionsDir.join(',')}`,
        `--disable-extensions-except=${extensionsDir.join(',')}`
      ],
      executablePath: this.chromeBinPath,
      userDataDir: this.generateUserdataDir(userDataDir),
    });

    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36';
    const pages = await browser.pages();
    const page = pages[0];
    await page.setUserAgent(ua)

    page.on('dialog', dialog => {
      dialog.accept()
    })

    return {
      page,
      browser,
    };
  }

  /**
   * Generates a user data directory with the specified name.
   *
   * @param {string} name - The name of the directory.
   * @returns {string} The path of the generated directory.
   */
  generateUserdataDir(name: string): string {
    if (!fs.existsSync(this.rootPath)) {
      fs.mkdirSync(this.rootPath);
    }
    const targetDir: string = path.join(this.rootPath, name);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir);
    }
    return targetDir;
  }

  /**
   * Retrieves the path to the Chrome binary on the system.
   *
   * @return {string | null} The path to the Chrome binary if found, otherwise null.
   */
  private getChromeBinPath(): string | null {
    const prefixs: string[] = [
      "C:\\Program Files (x86)\\Google",
      "C:\\Program Files\\Google",
      path.join(process.env.APPDATA, "..\\Local\\Google"),
    ];
    const suffix: string = "Chrome\\Application\\chrome.exe";
    for (const prefix of prefixs) {
      const fullPath = path.join(prefix, suffix);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    return null;
  }
}