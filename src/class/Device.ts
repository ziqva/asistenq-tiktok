import { machineIdSync } from "node-machine-id";
import fetch from "node-fetch";
import Monitoring from "./Monitoring";
import moment from "moment-timezone";
import "moment/locale/id";
import os from "os";
import { app } from "electron";
import Recorder from "./Recorder";
import crypto from 'crypto'
import { execSync } from 'child_process';

export default class Device {
  private machineId: string;
  public registered: boolean;
  private productName: string;
  public monitoring: Monitoring | null;
  private userName: string;
  private userEmail: string;
  private label: string;
  private created: string;
  private expired: string;
  private remaining: string;
  private checkRegisteredInterval: number;
  private pingInterval: number;
  private recorder: Recorder
  private usedMachineid2: string[] = [
    'ASISTENQ_3119470A-192B-425F-A87A-810BF2920ADC',
    'ASISTENQ_EF71BFD7-0A04-41A9-9B7D-0C446E768B85',
    'ASISTENQ_EADCE518-909D-4EBA-B475-EE39798D29CE',
    'ASISTENQ_583D32C8-A730-46E3-9EF4-625DDA2BACA6',
    'ASISTENQ_100AB0A1-0CD6-4617-A333-F02CFF2F5A40',
    'ASISTENQ_8FD26B57-1504-52B6-B60D-83B6CB63DEDF',
    'ASISTENQ_F02E9E09-4D9C-4933-8BF3-9DA2D79F7091',
    'ASISTENQ_59FB6569-43E4-4E83-AC1F-143400E3DB80',
    'ASISTENQ_CO2EC92C-EC03-489D-8C96-A362D4FB5BFA',
    'CO2EC92C-EC03-489D-8C96-A362D4FB5BFA'
  ]

  constructor({recorder}: { recorder: Recorder }) {
    this.monitoring = null;
    this.machineId = null;
    this.registered = false;
    this.productName = "AsistenQ Owner";
    this.initMachineId();
    this.remaining = "unknown";
    this.userName = "unknown";
    this.recorder = recorder
    this.userEmail = "unknown"
    this.label = "#unknown"
    this.created = "unknown"
    this.expired = "unknown"
    this.checkRegisteredInterval = 600000; // 10 Minutes
    // this.checkRegisteredInterval = 1000; // 1 Detik
    this.checkRegisteredRepeately();
    this.pingInterval = 90000;
    this.recorder.machineId = this.getMachineId()
    this.preventVMProcess()
  }

  private preventVMProcess() {
    const blockedManufacturers = [
      'VMware, Inc.',
      'VirtualBox',
      'QEMU',
      'Microsoft Corporation',
      'Parallels Software International Inc.',
      'Xen',
    ];

    const checkManufacturer = () => {
      try {
        let manufacturer = 'unknown';
        if (process.platform === 'win32') {
          manufacturer = execSync('wmic computersystem get manufacturer').toString().split('\n')[1].trim();
        } else if (process.platform === 'darwin') {
            manufacturer = execSync("system_profiler SPHardwareDataType | awk '/Model Identifier/ {print $3}'").toString().trim();
        }
        if (blockedManufacturers.includes(manufacturer)) {
          process.exit(230345);
        }
      } catch (error) {
        console.error('Error checking manufacturer:', error);
      }
    };

    checkManufacturer();
  }

  private getHddSerialNumber(): string {
    try {
      const output = execSync('wmic diskdrive get SerialNumber').toString();
      const lines = output.split('\n');
      const serialNumber = lines[1]?.trim(); // Assuming the serial number is on the second line
      if (!serialNumber) {
        throw new Error('Serial number not found');
      }
      return serialNumber;
    } catch (error) {
      console.error('Error fetching HDD serial number:', error);
      return 'unknown';
    }
  }

  /**
   * Generates a unique machine ID based on system information and HDD serial number.
   *
   * @return {string} The generated machine ID.
   */
  generateMachineId(): string {
    const serialNumber = this.getHddSerialNumber();
    const systemInfo = [
      os.hostname(),
      os.platform(),
      os.arch(),
      os.release(),
      serialNumber,
      os.totalmem(),
      os.cpus().map(cpu => cpu.model).join(''),
      os.networkInterfaces()['eth0']?.[0]?.mac || 'unknown'
    ].join('');
  
    return crypto.createHash('sha256').update(systemInfo).digest('hex');
  }

  private async pingOnline({
    machine_id,
    email,
    user_name,
  }: {
    machine_id: string;
    email: string;
    user_name: string;
  }): Promise<void> {
    if (user_name.length < 1 || email.length < 1) return;
    const ping = async () => {
      const url = "https://srv-ziqlabs-1.my.id/api/online-device";
      const headers = {
        action: "ping",
        "Content-Type": "application/json",
      };
      const body = {
        machine_id: machine_id,
        email,
        user_name,
        product_name: "AsistenQ JS",
      };
      const response = await fetch(url, {
        headers,
        body: JSON.stringify(body),
        method: "POST",
      });
      if (!response.ok) {
        console.log("Failed for ping: ", response.status);
      }
    };

    try {
      await ping();
    } catch (err) {}

    while (true) {
      try {
        await ping();
        await new Promise((r) => setTimeout(r, this.pingInterval));
      } catch (err) {}
    }
  }

  private async checkRegisteredRepeately() {
    while (true) {
      console.log("Melakukan pengecekan: ", this.registered);
      if (this.registered) {
        const registered = await this.refreshIsRegistered();
        if (!registered) {
          app.exit(239);
          return;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, this.checkRegisteredInterval)
        );
      } else {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  /**
   * Formats a given epoch timestamp into a string representation.
   *
   * @param {number} epoch - The epoch timestamp to format.
   * @return {string} The formatted string representation of the epoch timestamp.
   */
  private formatDateFromEpoch(epoch: number): string {
    return moment(epoch * 1000)
      .tz("Asia/Jakarta")
      .format("D MMM YYYY; HH:mm");
  }

  /**
   * Prepares the data after it has been registered.
   *
   * @param {any} data - the data to be prepared
   * @return {void}
   */
  private prepareDataAfterRegistered(data: any): void {
    try {
      this.userName = data.tobelsoft.data.user.name;
    } catch (err) {}
    try {
      this.userEmail = data.tobelsoft.data.user.email;
    } catch (err) {}
    try {
      this.label = data.tobelsoft.data.label;
    } catch (err) {}
    try {
      const createdEpoch = parseInt(data.tobelsoft.data.created);
      this.created = this.formatDateFromEpoch(createdEpoch);
    } catch (err) {}
    try {
      const expiredEpoch = parseInt(data.tobelsoft.data.expired);
      this.expired = this.formatDateFromEpoch(expiredEpoch);
    } catch (err) {}
    try {
      this.remaining = data.tobelsoft.data.remaining;
    } catch (err) {}
  }

  /**
   * Formats a duration in seconds to a dynamic time format.
   *
   * @param {number} duration - The duration in seconds.
   * @return {string} The formatted duration in dynamic time format.
   */
  private formatDuration(duration: number): string {
    const seconds = duration % 60;
    const minutes = Math.floor((duration / 60) % 60);
    const hours = Math.floor((duration / (60 * 60)) % 24);
    const days = Math.floor(duration / (60 * 60 * 24));

    let formattedDuration = "";

    if (days > 0) {
      formattedDuration += `${days}d `;
    }
    if (hours > 0) {
      formattedDuration += `${hours}h `;
    }
    if (minutes > 0) {
      formattedDuration += `${minutes}m `;
    }
    if (seconds > 0) {
      formattedDuration += `${seconds}s`;
    }

    return formattedDuration.trim();
  }

  /**
   * Formats a given number of bytes into a human-readable string.
   *
   * @param {number} bytes - The number of bytes to format.
   * @return {string} The formatted string representing the number of bytes in human-readable format.
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) {
      return "0 Bytes";
    }
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Retrieves data about the user, device, operating system, and hardware.
   *
   * @return {object} - An object containing information about the user, device, operating system, and hardware.
   */
  getData() {
    return {
      user: {
        name: this.userName || "unknown",
        email: this.userEmail,
      },
      device: {
        created: this.created,
        expired: this.expired,
        remaining: this.remaining,
        label: this.label,
        machineId: this.getMachineId(),
      },
      contacts: [
        {
          name: "Whatsapp",
          link: "https://api.whatsapp.com/send/?phone=6285876681770&text&type=phone_number&app_absent=0",
        },
        {
          name: "Email",
          link: "mail:cs@ziqva.com",
        },
      ],
      os: {
        computer_name: process.env.COMPUTERNAME,
        architecture: os.machine,
        platform: os.platform(),
        type: os.type(),
        uptime: this.formatDuration(os.uptime()),
      },
      hardware: {
        cpu: {
          model: os.cpus()[0].model,
          core: os.cpus().length,
          speed: `${(os.cpus()[0].speed / 1000).toFixed(2)} GHz`,
        },
        memory: {
          total: this.formatBytes(os.totalmem()),
          free: this.formatBytes(os.freemem()),
          used: this.formatBytes(os.totalmem() - os.freemem()),
        },
      },
    };
  }

  /**
   * Activates a license.
   *
   * @param {string} license - The license to activate.
   * @return {Promise<void>} - A promise that resolves when the license is activated.
   */
  public async activateLicense(license: string): Promise<void> {
    const url: string = `https://appcenter.ziqva.com/device/activation?token=${license.trim()}&product=${
      this.productName
    }&machine_id=${this.initMachineId()}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "multipart/form-data",
      },
    });
    if (!response.ok) {
      throw new Error(
        `Failed for activate token: ${response.statusText}, status code: ${response.status}.`
      );
    }

    const data = await response.json();
    const error: boolean = data.tobelsoft.error;
    const message: string = data.tobelsoft.message;
    if (error) throw new Error(message);
    if (this.monitoring) {
      await this.monitoring.sendMainData();
    }
  }

  /**
   * Refreshes the registration status of the device.
   *
   * @return {Promise<boolean>} A Promise that resolves to a boolean indicating whether the device is registered or not.
   */
  public async refreshIsRegistered(): Promise<boolean> {
    const url: string = `https://appcenter.ziqva.com/device/status?product=${
      this.productName
    }&machine_id=${this.initMachineId()}`;
    const response = await fetch(url, {
      headers: {
        "content-type": "multipart/form-data",
      },
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(
        `Failed for authenticating this device: ${response.statusText}, status code: ${response.status}.`
      );
    }

    const data = await response.json();
    this.prepareDataAfterRegistered(data);
    if (!this.registered && data.tobelsoft.data.registered) {
      this.pingOnline({
        machine_id: this.initMachineId(),
        email: data.tobelsoft.data.user.email,
        user_name: data.tobelsoft.data.user.name,
      });
      this.recorder.email = data.tobelsoft.data.user.email;
      this.recorder.start()
      // this.recorder.syncMonitoring(this.monitoring.mainData)
    }
    
    this.registered = data.tobelsoft.data.registered;
    if (this.registered && this.monitoring) {
      await this.monitoring.sendMainData();
    }
    return this.registered;
  }

  /**
   * Initializes the machine ID.
   *
   * @return {void}
   */
  initMachineId(): string {
    const mid = "ASISTENQ_" + machineIdSync(true).toUpperCase()
    console.log("mid default: ", mid)
    
    if(this.usedMachineid2.includes(mid)) {
      this.machineId = "ASISTENQ_"+this.generateMachineId().toUpperCase()
      console.log("mid has changed cause machine id is blocked: ", this.machineId)
    } else {
      this.machineId = "ASISTENQ_" + machineIdSync(true).toUpperCase();
      console.log("use default: ", this.machineId)
    }
    return this.machineId;
  }

  /**
   * Retrieves the machine ID.
   * 
   *
   * @return {string} The machine ID.
   */
  public getMachineId(): string {
    if(this.usedMachineid2.includes(this.machineId)) {
      const mid = this.generateMachineId().toUpperCase()
      console.log({mid2: mid})
      this.machineId = "ASISTENQ_" + mid
    }
    return this.machineId;
  }
}
