/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-var */
import { Socket } from "socket.io";
import Database from "./Database";
import Account from "./Account";
import AccountInformation from "./AccountInformation";
import Setting from "./Setting";
import Notification from "./Notification";
import Group from "./Group";
import Device from "./Device";
import MainDataColumn from "./MainDataColumn";
import moment from "moment-timezone";
import ping from 'ping'
import Memory from "./Memory";
import PublicMonitoring from "./PublicMonitoring";

export default class Monitoring {
  public sockets: Socket[];
  public database: Database;
  public group: Group | null;
  public running: boolean;
  public activeFilter: any;
  public mainData: StructAccount[];
  public accountEngine: Account;
  public thread: number;
  private accountInformation: AccountInformation;
  private setting: Setting;
  private delay: number;
  private notificaton: Notification;
  public mainDataInitialized: boolean;
  public device: Device;
  public openedAccountId: number | null;
  public pmType: PMType;
  private mainDataColumn: MainDataColumn;
  private maxPin: number;
  private putaran: number
  private processedInvoiceMemory: Memory
  public refreshAccountStats: RefreshAccountStats = {
    progress: {
      percentage: 0,
      processed: 0,
      total: 0
    },
    running: false
  }
  public publicMonitoring: PublicMonitoring | null = null

  constructor(
    database: Database,
    account: Account,
    setting: Setting,
    notification: Notification,
    device: Device,
    mainDataColumn: MainDataColumn,
    processedInvoiceMemory: Memory
  ) {
    this.processedInvoiceMemory = processedInvoiceMemory
    this.sockets = [];
    this.openedAccountId = null;
    this.putaran = 0
    this.mainDataColumn = mainDataColumn;
    this.device = device;
    this.delay = 500;
    this.group = null;
    this.database = database;
    this.notificaton = notification;
    this.running = false;
    this.activeFilter = null;
    this.mainData = [];
    this.thread = 1;
    this.pmType = {
      activeForAll: true,
      types: [],
    };
    this.accountInformation = new AccountInformation({
      notification,
      mainDataColumn,
      account,
      processedInvoiceMemory
    });
    this.accountEngine = account;
    this.setting = setting;
    this.mainDataInitialized = false;
    this.initMainData(() => {
      this.mainDataInitialized = true;
    });
    this.initDelay();
    this.initThread();
    this.maxPin = 10
  }

  /**
   * Gets the moderation date of the given account.
   *
   * @param {StructAccount} account - The account object.
   * @return {Promise<Date | null>} A promise that resolves to the moderation date or null if not moderated or authenticated.
   */
  public async getModerationDate(account: StructAccount): Promise<Date | null> {
    return await this.accountInformation.getModerationDate(account)
}

  /**
   * Refreshes multiple accounts at once. If a process is currently running,
   * this function will throw an error. Please wait for a moment until finished.
   *
   * @param {number[]} ids - An array of account IDs to refresh.
   * @return {Promise<void>} A promise that resolves when all accounts have been refreshed.
   */
  public async bulkRefresh(ids: number[]): Promise<void> {
    if(this.refreshAccountStats.running) { throw new Error('Process is currently running, please wait for a moment until finished') }
    this.refreshAccountStats = {
      running: true,
      progress: {
        total: ids.length,
        processed: 0,
        percentage: this.getPercentage(0, ids.length)
      }
    }
    this.sendRefreshAccountData()

    // Refresh one by one
    for(const id of ids) {
      try {
        const account = await this.accountEngine.get(id)
        await this.refresh(account, undefined, true)
        await this.sendMainData()
        this.refreshAccountStats.progress.processed += 1
        this.refreshAccountStats.progress.percentage = this.getPercentage(this.refreshAccountStats.progress.processed, this.refreshAccountStats.progress.total)
        this.sendRefreshAccountData()
      } catch(err) {}
    }

    this.refreshAccountStats.running = false
    this.sendRefreshAccountData()
  } 

  /**
   * Marks an invoice as processed by adding it to the processedInvoiceMemory.
   *
   * If the invoice is already in the processedInvoiceMemory, this function does nothing.
   * @param {string} invoice - The invoice to mark as processed.
   */
  public markProcessedOrder(invoice: string): void {
    if(!this.processedInvoiceMemory.has(invoice)) {
      this.processedInvoiceMemory.add(invoice)
    }
  }

  /**
   * Sends the refresh account stats data to all sockets in the refreshSockets array.
   *
   * This function is used to send the refresh account stats data to all connected sockets when the refresh account stats data is updated.
   *
   * @return {void} Nothing is returned.
   */
  public sendRefreshAccountData(): void {
    for(const socket of this.sockets) {
      try {
        socket.emit('refresh-account-data', this.refreshAccountStats)
      } catch(err) {}
    }
  }

  /**
   * Calculates the percentage of a given number out of a total.
   *
   * @param {number} processed - The number to calculate the percentage for.
   * @param {number} total - The total number.
   * @return {number} The percentage value, rounded to 2 decimal places.
   */
  private getPercentage(processed: number, total: number): number {
    if(total === 0) {
      return 0
    }
    const percentage = (processed / total) * 100
    return parseFloat(percentage.toFixed(2))
  }

  /**
   * Set the active state of a PMType.
   *
   * @param {string} name - The name of the PMType.
   * @param {boolean} state - The state to set.
   * @return {void} This function does not return a value.
   */
  public PMTypeSetActive(name: string, state: boolean): void {
    const i: number = this.pmType.types.findIndex((x) => x.name === name);
    if (i >= 0) {
      this.pmType.types[i].active = state;
    }
    this.sendMainData();
  }

  /**
   * Sets the active state for all PM types.
   *
   * @param {boolean} state - The new active state.
   * @return {void} This function does not return a value.
   */
  public PMTypeSetActiveForAll(state: boolean): void {
    this.pmType.activeForAll = state;
    this.sendMainData();
  }

  /**
   * Sets the active filter to the specified value and sends the main data.
   *
   * @param {string} filter - The value to set as the active filter.
   * @return {void} This function does not return anything.
   */
  setActiveFilter(filter: string): void {
    this.activeFilter = filter;
    this.sendMainData();
  }

  /**
   * Sets the thread for the object.
   *
   * @param {number} thread - The thread to be set.
   * @return {Promise<void>} - A promise that resolves when the thread is set.
   */
  async setThread(thread: number): Promise<void> {
    this.thread = thread;
    await this.setting.set("thread", thread);
    this.sendMainData();
  }

  /**
   * Retrieves the delay from the setting.
   *
   * @return {Promise<number>} The delay value.
   */
  async getDelay(): Promise<number> {
    return await this.setting.get("delay");
  }

  /**
   * Initializes the filter for the PM type.
   *
   * @private
   * @returns {void}
   */
  private initFilterPmType(): void {
    return 
    // let pmType = this.pmType.types.map((x) => {
    //   x.count = 0;
    //   return x;
    // });
    // for (let md of this.mainData) {
    //   // check name is already exists on pmType
    //   if (md.pmName === "") {
    //     md.pmName = "Other";
    //   }
    //   if (pmType.findIndex((x) => x.name === md.pmName) < 0) {
    //     // if not exists push it for initialize
    //     pmType.push({ name: md.pmName, count: 0, active: true });
    //   }
    //   const i: number = pmType.findIndex((x) => x.name === md.pmName);
    //   pmType[i].count++;
    // }
    // this.pmType.types = pmType;
  }

  /**
   * Get the thread number.
   *
   * @return {Promise<number>} The thread number.
   */
  async getThread(): Promise<number> {
    const thread: number = await this.setting.get("thread");
    return thread;
  }

  /**
   * Sets the delay for the function.
   *
   * @param {number} delay - The delay in milliseconds.
   * @return {Promise<void>} - A promise that resolves when the delay is set.
   */
  async setDelay(delay: number): Promise<void> {
    this.delay = delay; // ms
    await this.setting.set("delay", delay);
    this.sendMainData();
  }

  /**
   * Initializes the delay for the function.
   *
   * @return {Promise<void>} A promise that resolves once the delay is set.
   */
  async initDelay(): Promise<void> {
    const delay: number = await this.setting.get("delay");
    console.log("delay: ", delay);
    this.delay = delay;
  }

  /**
   * Initializes the thread.
   *
   * @return {Promise<void>} A Promise that resolves when the thread is initialized.
   */
  async initThread(): Promise<void> {
    const thread: number = await this.setting.get("thread");
    this.thread = thread;
    this.runtimeStart();
  }
 /**
   * Gets the sort order for the PM status column.
   *
   * This function takes the PM status and returns a number that can be used for sorting.
   * The higher the number, the higher the sort order. The PM statuses are sorted in the following order:
   * 1. PM Pro (revoked)
   * 2. PM (revoked)
   * 3. Regular Merchant (revoked)
   * 4. PM Pro
   * 5. PM
   * 6. Regular Merchant
   * 7. Unknown
   *
   * @param {StructAccount} acc - The account object.
   * @return {number} The sort order for the PM status column.
   */
 private getPMSort(acc: StructAccount): number {
  // const name = acc.pmName.toLowerCase().trim() 
  // if(acc.pmRevoked === 0 && name === 'power merchant pro') return 7
  // if(acc.pmRevoked === 1 && name === 'power merchant pro') return 6
  // if(acc.pmRevoked === 0 && name === 'power merchant') return 5
  // if(acc.pmRevoked === 1 && name === 'power merchant') return 4
  // if(acc.pmRevoked === 0 && name === 'regular merchant') return 3
  // if(acc.pmRevoked === 1 && name === 'regular merchant') return 2
  return 1
}

/**
 * Gets the sort order for the status column.
 *
 * This function takes the account object and returns a number that can be used for sorting.
 * The higher the number, the higher the sort order. The statuses are sorted in the following order:
 * 1. Moderated
 * 2. Not Moderated
 *
 * @param {StructAccount} account - The account object.
 * @return {number} The sort order for the status column.
 */
private getStatusSort(account: StructAccount): number {
  let n: number = 1
  if(account.moderated) {
    console.log({statusMessage: account.statusMessage})
    n = account.statusMessage?.toString()?.length
    if(typeof n !== 'number' || isNaN(n)) {
      n = 2
    }
    n = n - n - n
  }
  return n
}
  

  /**
   * Refreshes the data and invokes the callback function.
   *
   * @param {StructAccount} data - The data to refresh.
   * @param {Function} callback - The callback function to invoke after the data is refreshed.
   * @return {Promise<void>} Promise that resolves once the data is refreshed.
   */
  async refresh(
    data: StructAccount,
    callback?: Function,
    autoUpdateOnMaindata: boolean = false
  ): Promise<void> {
    try {
      if (!data.authenticated) {
        return;
      }
      data.pmSort = this.getPMSort(data)
      data.statusSort = this.getStatusSort(data)
      const acc: StructAccount = await this.accountInformation.get(
        data,
        true,
        this.database
      );


      if (autoUpdateOnMaindata) {
        const i: number = this.mainData.findIndex((x) => x.id === data.id);
        if (i >= 0) {
          // this.mainData[i] = acc;
          for(const key of Object.keys(this.mainData[i])) { 
            if(key.trim() !== 'cookies' && key.trim() !== 'shopid') {
              // @ts-ignore
              this.mainData[i][key] = acc[key]
            }
          }
          // this.mainData[i].pmSort = this.getPMSort(acc)
          // this.mainData[i].statusSort = this.getStatusSort(acc)
        }
      }
      callback && callback();
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Runs the runtime indefinitely, refreshing accounts and sending main data.
   *
   * @return {Promise<void>} - A promise that resolves when the runtime stops.
   */
  async runtimeStart(): Promise<void> {
    let i = 0
    while (true) {
      this.initFilterPmType();
      if (this.running) {
        const distributedAccounts = this.distributeArray(
          this.group.filterMainData(this.mainData),
          this.thread
        );
        for (const accounts of distributedAccounts) {
          if (!this.running) {
            break;
          }
          let tasks = [];
          for (const acc of accounts) {
            if (!this.running) {
              break;
            }
            tasks.push(this.refresh(acc));
          }
          console.log('Waiting until task finished')
          await Promise.all(tasks);
          console.log('Tasks finished')
          this.sendMainData();
          console.log('Main data has sent')
          this.initFilterPmType();
            console.log('Menunggu putaran')
            try {
              i++
              console.log('Putaran ke: ' + i)
              if(i >= 3) {
                i = 0
                await this.publicMonitoring.record()
              }
            } catch(err) {}
          await new Promise((r) => setTimeout(r, this.delay));
        }
        await new Promise((r) => setTimeout(r, this.delay));
        if (this.group) {
          this.group.recount();
        }
        // console.log(`Putaran: ${this.putaran}`)
        // ping.sys.probe('google.com', async (alive, error) => {
        //   if(alive && !error) {
        //     if(this.putaran === 2) {
        //       await this.filterLogoutByTime()
        //     }
        //     this.putaran++
        //   }
        // })
      } else {
        // Sleep for 2 second if is not running before check running again
        await new Promise((r) => setTimeout(r, 2000));
        this.sendMainData();
      }
      if (this.group) {
        this.group.recount();
      }
    }
  }

  async filterLogoutByTime(): Promise<void> {
    // Make sure network connection is already connected by internet
    const now = moment().tz("Asia/Jakarta").unix()
    for(const acc of this.mainData) {
      const diff = now - acc.lastUpdated
      if(diff >= 86400)  { // if last updated is more than 24 hours
        await this.accountEngine.setAuthenticated(acc.id, false)
      }
    }
  }


  /**
   * Initializes the main data by retrieving all accounts asynchronously,
   * setting the mainData property to the retrieved accounts,
   * and sending the main data.
   *
   * @return {Promise<void>} - A promise that resolves once the main data has been initialized.
   */
  async initMainData(callback: Function) {
    this.mainData = await this.accountEngine.all();
    this.sendMainData(this.mainData);
    callback();
  }

  /**
   * Splits an array into smaller chunks of a specified size.
   *
   * @param {Array} arr - The array to be distributed.
   * @param {number} chunkSize - The size of each chunk.
   * @return {Array} The distributed array.
   */
  distributeArray(arr: any[], chunkSize: number) {
    const distributed = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      const chunk = arr.slice(i, i + chunkSize);
      distributed.push(chunk);
    }
    return distributed;
  }

  /**
   * Sends the main left data sidebar.
   *
   * @param {StructAccount[]} data - An array of StructAccount objects.
   * @return {void} This function does not return any value.
   */
  sendMainLeftDataSidebar(data: StructAccount[]): void {
    var mainSidebar: MainLeftSidebar = {
      chatCount: 0,
      discusCount: 0,
      orderCount: 0,
      dikemasCount: 0,
      dikirimCount: 0,
      complaintCount: 0,
      saldo: 0,
      allAccountCount: 0,
      loggedinCount: 0,
      hasSaldoCount: 0,
      moderatedCount: 0,
      logoutCount: 0,
      // -- new --
      newOrderPotency: 0,
      dikemasPotency: 0,
      dikirimPotency: 0,
      complaintPotency: 0,
      activeSaldo: 0,
      moderatedSaldo: 0,
      mainSaldo: 0, // not moderated & authenticated
      mainCount: 0, // not moderated & authenticated
    };

    for (const item of data) {
      mainSidebar.chatCount += item.chatCount;
      mainSidebar.newOrderPotency += item.orderPotency;
      mainSidebar.dikemasPotency += item.dikemasPotency;
      mainSidebar.dikirimPotency += item.dikirimPotency;
      mainSidebar.complaintPotency += item.complaintPotency;
      mainSidebar.discusCount += 0;
      // mainSidebar.discusCount += item.discusCount;
      mainSidebar.orderCount += item.orderCount;
      mainSidebar.dikemasCount += item.dikemasCount;
      mainSidebar.dikirimCount += item.dikirimCount;
      mainSidebar.complaintCount += item.complaintCount;
      mainSidebar.saldo += item.balance;
      mainSidebar.allAccountCount += 1;
      if (item.authenticated) {
        mainSidebar.loggedinCount += 1;
      }
      if (item.balance > 0) {
        mainSidebar.hasSaldoCount += 1;
      }
      if (item.moderated) {
        mainSidebar.moderatedCount += 1;
        mainSidebar.moderatedSaldo += item.balance;
      } else {
        mainSidebar.activeSaldo += item.balance;
      }
      if (!item.authenticated) {
        mainSidebar.logoutCount += 1;
      }
      if (!item.moderated && item.authenticated) {
        mainSidebar.mainSaldo += item.balance;
        mainSidebar.mainCount++;
      }
    }

    for (const socket of this.sockets) {
      socket.emit("main-sidebar-data", mainSidebar);
    }
    this.sendRefreshAccountData()
  }

  /**
   * Sends the main data to all connected sockets.
   *
   * @param {void} - This function does not take any parameters.
   * @return {void} - This function does not return any value.
   */
  public sendMainData(data?: StructAccount[]): void {
    let dataToSend = data ? data : this.mainData;
    if (this.group !== null) {
      dataToSend = this.group.filterMainData(dataToSend);
    }
    let tmp = dataToSend.map((x, i) => {
      const groupNamesArr: string[] = x.groupNames
        .split(",")
        .filter((x) => x.trim().length > 0);
      const {
        cookies,
        password,
        secretAutenticator,
        added,
        shopid,
        useAuthenticator,
        ...newObj
      } = { ...x };
      return {
        ...newObj,
        groupNamesArr,
        num: i + 1,
      };
    });
    // if (!this.pmType.activeForAll) {
    //   const names: string[] = this.pmType.types
    //     .filter((x) => x.active)`
    //     .map((x) => x.name);
    //   tmp = tmp.filter((tm) => names.includes(tm.pmName));
    // }
    this.sendMainLeftDataSidebar(<StructAccount[]>tmp);
    if (this.activeFilter === "loggedin") {
      tmp = tmp.filter((x) => x.authenticated);
    } else if (this.activeFilter === "has_saldo") {
      tmp = tmp.filter((x) => x.balance > 0);
    } else if (this.activeFilter === "moderasi") {
      tmp = tmp.filter((x) => x.moderated);
    } else if (this.activeFilter === "logout") {
      tmp = tmp.filter((x) => !x.authenticated);
    } else if (this.activeFilter === "chat") {
      tmp = tmp.filter((x) => x.chatCount > 0);
    } else if (this.activeFilter === "discus") {
      // tmp = tmp.filter((x) => x.discusCount > 0);
      tmp = []
    } else if (this.activeFilter === "order") {
      tmp = tmp.filter((x) => x.orderCount > 0);
    } else if (this.activeFilter === "packing") {
      tmp = tmp.filter((x) => x.dikemasCount > 0);
    } else if (this.activeFilter === "shipping") {
      tmp = tmp.filter((x) => x.dikirimCount > 0);
    } else if (this.activeFilter === "complaint") {
      tmp = tmp.filter((x) => x.complaintCount > 0);
    } else if (this.activeFilter === "active") {
      tmp = tmp.filter((x) => !x.moderated && x.authenticated);
    }

    tmp.map((x: any) => (x.key = x.id));
    if (!this.device.registered) {
      tmp = [];
    }
    for (const socket of this.sockets) {
      socket.emit("monitoring-main-data", tmp);
    }
  }

  /**
   * Sends the active filter to all connected sockets.
   *
   * @param {void} - This function does not accept any parameters.
   * @return {void} - This function does not return any value.
   */
  sendActiveFilter() {
    for (const socket of this.sockets) {
      socket.emit("monitoring-active-filter", this.activeFilter);
    }
  }

  /**
   * Sends the status of the bot to all connected sockets.
   *
   * @param {none} - This function does not take any parameters.
   * @return {void} - This function does not return any value.
   */
  sendBotStatus() {
    for (const socket of this.sockets) {
      socket.emit("bot-status", {
        running: this.running,
      });
    }
  }

  /**
   * Starts the function and sets the running status to true.
   *
   * @param {type} paramName - description of parameter
   * @return {type} description of return value
   */
  start() {
    if (!this.device.registered) {
      return;
    }
    this.running = true;
    this.sendBotStatus();
  }

  /**
   * Stops the function execution and updates the bot status.
   *
   * @param {} - No parameters.
   * @return {} - No return value.
   */
  stop() {
    this.running = false;
    this.sendBotStatus();
  }

  /**
   * Pins or unpins an account with the given ID. If the account is already pinned,
   * it throws an error if the maximum number of pinned accounts has been reached.
   *
   * @param {number} id - The ID of the account to pin or unpin.
   * @return {Promise<void>} A promise that resolves when the pin/unpin operation is complete.
   * @throws {Error} If the maximum number of pinned accounts has been reached.
   */
  async pin(id: number): Promise<void> {
    const i = this.mainData.findIndex(x => x.id === id)
    if(i<0) {
      throw new Error('Account was not found!')
    }

    if(this.mainData[i].pinned === 0) {
      // Tambahkan pin, cek jika sudah maksimal maka tolak
      const pinned = this.mainData.filter(x => x.pinned === 1).length
      if(pinned >= this.maxPin) { throw new Error('Jumlah akun yang Anda pin sudah mencapai maksimum, silahkan unpin beberapa akun untuk melanjutkan') }
      const epoch = moment().tz('Asia/Jakarta').unix()
      const sql: string = `
        UPDATE account SET pinned = "1", pinnedAt = "${epoch}"
        WHERE id = ${id}
      `
      await this.database.query(sql)
      this.mainData[i].pinned = 1
      this.mainData[i].pinnedAt = epoch
    } else {
      // Remove pin
      this.mainData[i].pinned = 0
      this.mainData[i].pinnedAt = null
      const sql: string = `
        UPDATE account SET pinned = "0", pinnedAt = null
        WHERE id = ${id}
      `
      await this.database.query(sql)
    }
    await this.sendMainData()
  }
}
