import Browser from "./Browser";
import Account from "./Account";
import { Socket } from "socket.io";
import fs from "fs";
import path from "path";
import { AbortController } from "node-abort-controller";
import moment from "moment-timezone";
import "moment/locale/id";
import { BrowserWindow, dialog } from "electron";
import Device from "./Device";
import Setting from "./Setting";
import { Page } from "puppeteer";
import Monitoring from "./Monitoring";
import xlsx from 'xlsx'

export default class ProductUploader {
  private browser: Browser;
  private account: Account;
  private uploading: boolean;
  private abortController: AbortController | null;
  public sockets: Socket[];
  private monitoring: Monitoring
  private logs: string[];
  private device: Device;
  private page: Page | null;
  private setting: Setting;
  constructor({
    account,
    device,
    setting,
    monitoring
  }: {
    account: Account;
    device: Device;
    setting: Setting;
    monitoring: Monitoring
  }) {
    this.page = null;
    this.monitoring = monitoring
    this.device = device;
    this.setting = setting;
    this.uploading = false;
    this.abortController = null;
    this.account = account;
    this.browser = new Browser();
    this.sockets = [];
    this.logs = [];
    this.handleAcceptCookies();
    // this.uploadBulkForJob({
    //   dir: "C:\\Users\\DELL\\Documents\\products"
    // })
  }

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
        } catch (err) { }
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  public async selectFolder(): Promise<string> {
    const currentWindow = BrowserWindow.getAllWindows()[0];
    const res = await dialog.showOpenDialog(currentWindow, {
      properties: ["openDirectory"],
      title: "Pilih folder produk",
      defaultPath: await this.setting.get("product_upload_dir"),
    });
    if (res.canceled) {
      throw new Error("Aksi dibatalkan oleh pengguna");
    }
    await this.setting.set("product_upload_dir", res.filePaths[0]);
    return res.filePaths[0];
  }

  /**
   * Get the current selected folder.
   *
   * @return {Promise<string>} the selected folder path
   */
  public async getCurrentSelectedFolder(): Promise<string> {
    return await this.setting.get("product_upload_dir");
  }

  public async getAccount(id: number): Promise<ProductUploaderAccount> {
    const exists: boolean = await this.account.exists(id);
    if (!exists) {
      throw new Error(`Akun tidak ditemukan, id: ${id}`);
    }
    const account: StructAccount = await this.account.get(id);
    if (!account.authenticated) {
      throw new Error("Silahkan login akun terlebih dahulu");
    }
    return {
      id: account.id,
      name: account.name,
      email: account.email,
      avatar: account.avatar,
    };
  }

  public async stop() {
    if (this.abortController) {
      this.abortController.abort("Process terminated by user");
    }
    this.addLog("Process terminated by the user");
    this.uploading = false;
    this.sendIsUploading();
  }

  private async addLog(msg: string, from: string = "System"): Promise<void> {
    const dtFormat = moment().tz("Asia/Jakarta").format("D MMM HH:mm");
    const formattedMsg: string = `[${dtFormat}] - ${from}: ${msg}`;
    this.logs.push(formattedMsg);
    if (this.logs.length > 300) {
      this.logs = this.logs.splice(this.logs.length - 300);
    }
    console.log(from, '>>', msg)
    this.sendLogs();
  }

  private async sendLogs(): Promise<void> {
    for (const socket of this.sockets) {
      try {
        socket.emit("logs", this.logs);
      } catch (err) { }
    }
  }

  private async sendIsUploading(): Promise<void> {
    for (const socket of this.sockets) {
      try {
        socket.emit("is-uploading", this.uploading);
      } catch (er) { }
    }
  }


  private async getSubjectFromFile(file: string): Promise<string> {
    const workbook = xlsx.readFile(file)
    return workbook.Props.Subject
  }

  public async onNewConnectionAttached(): Promise<void> {
    this.addLog("New client has been connected");
    this.sendIsUploading();
    this.sendLogs();
  }

  private async closeLimitModal(page: Page): Promise<void>{
    while(true) {
      try {
        const el = await page.$('[data-testid="productLimitModalCloseIcon"]')
      if(el) {
        try {
          await el.click()
        } catch(err) {}
        try {
          await el.$eval('HTMLElementSelector', (e: any) => e.click())
        } catch(err) {}
        const downloadTemplateBtn = await page.waitForSelector('xpath//html/body/div[1]/div/div[1]/div[2]/div/section/div[4]/div[2]/section[1]/div[5]/button', { timeout: 0 })
        await new Promise(r => setTimeout(r, 300))
        // @ts-ignore
        await downloadTemplateBtn.click()
      }
      } catch(err) {}
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  public async uploadBulkForJob({
    dir
  }: {
    dir: string
  }): Promise<void> {
    const accounts = await this.account.all()
    // Initialize browser
    this.addLog('Initializing browser', 'SYSTEM')
    const { page, browser } = await this.browser.getBrowser('upload-bulk4job', [
      '--start-maximized'
    ])
    this.closeLimitModal(page)
    const downloadPath = path.join("C:\\", 'download_bulk_upload')
    if (!fs.existsSync(downloadPath)) { fs.mkdirSync(downloadPath) }
    const client = await page.target().createCDPSession();

    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloadPath
    });

    const clearDownloadFiles = () => {
      const files = fs.readdirSync(downloadPath).map(x => path.join(downloadPath, x))
      for (const file of files) {
        fs.unlinkSync(file)
      }
    }

    const waitUntilFileDownloaded = () => {
      return new Promise(r => {
        page.on('response', async (response) => {
          const contentDisposition = response.headers()['content-disposition'];
          if (contentDisposition && contentDisposition.includes('attachment')) {
            const matches = /filename="([^"]+)/.exec(contentDisposition);
            if (matches && matches[0]) {
              page.removeAllListeners('response')
              setTimeout(() => {
                r(matches[0].split('filename="')[1])
              }, 1000)
            }
          }
        });
      })
    }

    for (const account of accounts) {
      clearDownloadFiles()
      this.addLog('Initializing account', account.name)
      if (!account.authenticated) { this.addLog('Account unauthenticated!', account.name); continue; }
      await this.monitoring.refresh(account, () => { }, true)
      const acc = await this.account.get(account.id, true)
      if (acc.productCount > 150) {
        this.addLog("Account is already uploaded on more time!", account.name)
        continue
      }

      if (acc.moderated) {
        this.addLog('Account is moderated, skipped!', acc.name)
        continue
      }

      this.addLog('Uploading file...', account.name)
      const files = fs.readdirSync(dir).filter(x => x.endsWith('.xlsx')).map(x => path.join(dir, x))
      if (files.length < 1) { this.addLog('File empty', 'SYSTEM'); return; }
      this.addLog('Current files length: ' + files.length)
      const file = files[0]

      // @ts-ignore
      await page.setCookie(...acc.cookies)
      this.addLog('Navigating to upload page', acc.name)
      await this.browser.navigatePage(page, 'https://seller.tokopedia.com/bulk/add')

      const pageTitle = await page.evaluate(() => {
        return document.title
      })
      if(pageTitle.includes('Masuk')) {
        this.addLog("Skipped because: is logged out", acc.name)
        continue
      }
      this.addLog(pageTitle, acc.name)

      // --- Starting manipulate the template
      this.addLog('Downloading template...', acc.name)
      const downloadTemplateBtn = await page.waitForSelector('xpath//html/body/div[1]/div/div[1]/div[2]/div/section/div[4]/div[2]/section[1]/div[5]/button', { timeout: 0 })
      await new Promise(r => setTimeout(r, 300))
      // @ts-ignore
      await downloadTemplateBtn.click()
      this.addLog('Download template button clicked', acc.name)
      const templateFilename = await waitUntilFileDownloaded()
      const templateFile = path.join(downloadPath, templateFilename as string)
      this.addLog('Template downloaded!', acc.name)
      this.addLog('Checking subject of: ' + templateFile, acc.name)
      const subject = await this.getSubjectFromFile(templateFile)
      this.addLog('Subject: ' + subject, acc.name)
      // Update to the template file
      const workbook = xlsx.readFile(file)
      workbook.Props.Subject = subject
      xlsx.writeFile(workbook, file)
      // --- End of manipulate the template

      this.addLog('Uploading file', acc.name)
      const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 10000000 })
      await new Promise(r => setTimeout(r, 2000))
      this.addLog('Input presented', acc.name)
      await fileInput.uploadFile(file)
      this.addLog('Waiting for upload button', acc.name)
      const uploadBtn = await page.waitForSelector('xpath//html/body/div[1]/div/div/div[2]/div/section/div[4]/div[2]/section[2]/div[3]/div/div[3]/button[2]', { timeout: 100000, visible: true})
      this.addLog('Click upload button', acc.name)
      this.addLog('Uploading file: ', file)
      // @ts-ignore
      await uploadBtn.click()
      console.log('Process finished!')
      this.addLog('Wait until progressbar is presented', acc.name)
      await page.waitForSelector('#progressbar_bulk > svg', { timeout: 0, visible: true, hidden: false })
      if(fs.existsSync(file)) { fs.unlinkSync(file) }
      this.addLog('File Deleted: ' + file, acc.name)
    }
    return await browser.close()
  }

  public async upload({
    id,
    maxFile,
    dirPath,
    afterUploaded,
  }: ProductUploaderUpload): Promise<void> {
    try {
      if (!this.device.registered) {
        throw new Error("Access denied!");
      }
      this.addLog("Preparing for upload ...");
      this.uploading = true;
      this.sendIsUploading();
      const exists: boolean = await this.account.exists(id);
      this.addLog("Getting the account data ...");
      if (!exists) {
        throw new Error(`Akun dengan id ${id} tidak ditemukan`);
      }

      const account: StructAccount = await this.account.get(id);
      if (!account.authenticated) {
        throw new Error(
          "Akun belum login, silahkan lakukan login terlebih dahulu"
        );
      }

      this.addLog("Scanning directory ...");
      if (!fs.existsSync(dirPath)) {
        throw new Error(`Folder tidak ditemukan: ${dirPath}`);
      }

      this.addLog("Preparing the controlled browser ...");
      const { browser, page } = await this.browser.getBrowser(
        "upload_account",
        ["--incognito"]
      );
      this.page = page;
      this.abortController = new AbortController();
      this.abortController.signal.addEventListener("abort", async () => {
        try {
          await browser.close();
        } catch (err) { }
      });
      browser.on("disconnected", () => {
        this.addLog("Browser is disconnected");
        this.uploading = false;
        this.page = null;
        this.sendIsUploading();
      });
      account.cookies = account.cookies.map((x: any) => {
        x.expires = undefined;
        return x
      })
      for (const cookie of account.cookies) {
        await page.setCookie(<any>cookie);
      }
      await this.browser.navigatePage(
        page,
        "https://seller.tokopedia.com/bulk/add"
      );
      await page.evaluate(() => {
        setInterval(() => {
          const el = document.querySelector(
            '[data-unify="Overlay"][aria-label="unf-overlay"]'
          );
          const el2 = document.querySelector(".css-1ajf22c.e1nc1fa20");
          if (el) {
            el.remove();
          }
          if (el2) {
            el2.remove();
          }
        }, 300);
      });
      let files: string[] = fs
        .readdirSync(dirPath)
        .filter((x) => x.split(".").pop() === "xlsx")
        .map((x) => x.toString());
      if (files.length > maxFile) {
        files = files.splice(files.length - maxFile);
      }
      this.addLog(`Uploading ${files.length} file ...`);
      const els = {
        fileInput: 'input[type="file"]',
        uploadButton:
          "#BulkUploadArea > div > div > div:nth-child(4) > button.css-1cpgquu-unf-btn.eg8apji0",
        message: "#BulkUploadArea > div  > div > div.css-xlm6r2",
        message2: "#BulkUploadArea > div > div > div.css-1sdqwoi",
        pgBar: "#progressbar_bulk > svg",
      };
      for (const file of files) {
        this.addLog(`Uploading ${file} ...`, account.name);
        this.addLog("Waiting for file input presented", account.name);
        while (!page.isClosed()) {
          try {
            const fileInput = await page.waitForSelector(els.fileInput, {
              timeout: 0,
            });
            // @ts-ignore
            await fileInput.uploadFile(path.join(dirPath, file));
            // Click the upload button
            this.addLog(
              "Waiting upload button for already presented",
              account.name
            );
            const uploadButton = await page.waitForSelector(els.uploadButton, {
              timeout: 5000,
            });
            await uploadButton.click();
            break;
          } catch (err) {
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
        this.addLog(`Waiting for progress bar presented`, account.name);
        while (!page.isClosed()) {
          try {
            await page.waitForSelector(els.pgBar, {
              timeout: 0,
              visible: true,
              hidden: false,
            });
            break
          } catch (err) { }
        }
        this.addLog(`Waiting for progress bar hidden`, account.name);
        while (!page.isClosed()) {
          try {
            await page.waitForSelector(els.pgBar, { timeout: 0, hidden: true });
            break
          } catch (err) { }
        }
        this.addLog(`Waiting for message presented`, account.name);
        let message, message2
        while (!page.isClosed()) {
          try {
            message = await page.waitForSelector(els.message, {
              timeout: 0,
              visible: true,
              hidden: false,
            });
            break
          } catch (err) { }
        }
        while (!page.isClosed()) {
          try {
            message2 = await page.waitForSelector(els.message2, {
              timeout: 0,
              visible: true,
              hidden: false,
            });
            break
          } catch (err) { }
        }
        const msg = await (await message.getProperty("innerText")).jsonValue();
        const msg2 = await (
          await message2.getProperty("innerText")
        ).jsonValue();
        this.addLog(`${file}: ${msg}, ${msg2}.`, account.name);
        if (afterUploaded === "delete") {
          this.addLog(`Menghapus file ${file}`, account.name);
          const fp = path.join(dirPath, file); // fullpath
          if (fs.existsSync(fp)) {
            fs.unlinkSync(fp);
            this.addLog(`File ${file} terhapus`, account.name);
          }
        } else {
          this.addLog(
            `Memindahan file ${file} ke folder UPLOADED`,
            account.name
          );
          const targetDir = path.join(dirPath, "UPLOADED");
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir);
          }
          fs.renameSync(path.join(dirPath, file), path.join(targetDir, file));
          this.addLog(`File ${file} telah berhasil dipindahkan`, account.name);
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
      this.addLog("All files has been uploaded");
      await browser.close();
      this.addLog("Process finished.");
    } catch (err) {
      this.addLog(`Error: ${err.message || err}`);
      this.uploading = false;
      this.sendIsUploading();
    }
  }
}
