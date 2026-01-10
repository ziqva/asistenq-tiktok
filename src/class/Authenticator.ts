import Database from "./Database";
import { Socket } from "socket.io";
import { authenticator } from "otplib";
import Account from "./Account";

export default class Authenticator {
  public database: Database;
  public sockets: Socket[];
  public mainData: StructAuthenticator[];
  private table: string;
  private account: Account;
  
  constructor({ database, account }: { database: Database; account: Account }) {
    this.database = database;
    this.account = account;
    this.sockets = [];
    this.mainData = [];
    this.table = "free_feature_authenticator";
    this.initDb(() => {
      this.initMainData(() => {
        this.runtime();
      });
    });
  }

  public async sync(): Promise<void> {
    const accounts: StructAccount[] = await this.account.all();
    for (const account of accounts) {
      if (account.useAuthenticator) {
        await this.add({
          label: account.name,
          email: account.email,
          secret: account.secretAutenticator,
          throwOnError: false,
        });
      }
    }
    await this.sendData();
  }

  public async update({
    id,
    label,
    email,
    secret,
  }: {
    id: number;
    label: string;
    email: string;
    secret: string;
  }): Promise<void> {
    label = label.trim().split('"').join("").split("'").join("").trim();
    secret = secret
      .trim()
      .split('"')
      .join("")
      .split("'")
      .join("")
      .trim()
      .split(" ")
      .join("");
    if (label.length < 3) {
      throw new Error("Label terlalu pendek");
    }
    const exists: boolean = this.mainData.findIndex((x) => x.id === id) >= 0;
    if (!exists) {
      throw new Error(`Data dengan id "${id}" tidak ditemukan`);
    }
    const sql: string = `UPDATE ${this.table}
        SET label = "${label}",
            secret = "${secret}"
        WHERE id = "${id}"
      `;
    await this.database.query(sql);
    const i: number = this.mainData.findIndex((x) => x.id === id);
    this.mainData[i].label = label;
    this.mainData[i].secret = secret;
    this.mainData[i].otp = this.getOtp(secret);
    this.sendData();
  }

  public async remove(id: number) {
    const i: number = this.mainData.findIndex((x) => x.id === id);
    if (i < 0) {
      throw new Error(`Data authenticator dengan id ${id} tidak ditemukan`);
    }

    const sql: string = `
        DELETE FROM ${this.table} WHERE id = ${id}
    `;
    await this.database.query(sql);
    this.mainData.splice(i, 1);
    this.sendData();
  }

  public async add({
    label,
    email,
    secret,
    throwOnError,
  }: {
    label: string;
    email: string;
    secret: string;
    throwOnError: boolean;
  }): Promise<boolean> {
    // format for badword characters
    email = email.trim().split('"').join("").split("'").join("");
    label = label.trim().split('"').join("").split("'").join("");
    secret = secret
      .trim()
      .split('"')
      .join("")
      .split("'")
      .join("")
      .split(" ")
      .join("");

    if (email.length < 3) {
      if (throwOnError) throw new Error("Email terlalu pendek");
      return false;
    }
    if (label.length < 3) {
      if (throwOnError) throw new Error("Label terlalu pendek");
      return false;
    }

    const exists: boolean =
      this.mainData.findIndex(
        (x) => x.email === email || x.secret === secret
      ) >= 0;
    if (exists) {
      if (throwOnError) {
        throw new Error(
          "Terjadi duplikasi data email atau secret authenticator."
        );
      }
      return false;
    }

    const id: number = await this.generateId();
    const currentEpoch: number = new Date().valueOf();
    const addSql: string = `
            INSERT INTO ${this.table} VALUES(
                ${id},
                "${label}",
                "${secret}",
                "${email}",
                "${currentEpoch}"
            )
        `;
    await this.database.query(addSql);
    this.mainData.push({
      id: id,
      label: label,
      email: email,
      secret: secret,
      otp: this.getOtp(secret),
      added: currentEpoch,
    });
    this.sendData();
    return true;
  }

  private async generateId(): Promise<number> {
    const sql: string = `
            SELECT MAX(id) FROM ${this.table}
        `;
    const res: any = await this.database.query(sql);
    const id = res[0]["MAX(id)"] + 1;
    return id;
  }

  private getOtp(secret: string): string | null {
    try {
      return authenticator.generate(secret);
    } catch (err) {
      return null;
    }
  }

  private async initMainData(callback?: Function) {
    const sql = `SELECT * FROM ${this.table} ORDER BY id DESC`;
    const res: any = await this.database.query(sql);
    for (const item of res) {
      this.mainData.push({
        id: item.id,
        label: item.label,
        secret: item.secret,
        email: item.email,
        added: item.added,
        otp: this.getOtp(item.secret),
      });
    }
    if (callback) {
      callback();
    }
  }

  private async initDb(callback?: Function) {
    const sql: string = `
            CREATE TABLE IF NOT EXISTS ${this.table} (
                id INT PRIMARY KEY,
                label VARCHAR(255),
                secret VARCHAR(255),
                email VARCHAR(255),
                added BIGINT
            )
        `;
    await this.database.query(sql);
    if (callback) {
      callback();
    }
  }

  private async runtime() {
    while (true) {
      await this.sendData();
      const delay: number = 5000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  public async sendData() {
    for(let i = 0; i < this.mainData.length; i++) {
      try {
        this.mainData[i].otp = this.getOtp(this.mainData[i].secret)
      } catch(er) {
        this.mainData[i].otp = null
      }
    }
    for (const socket of this.sockets) {
      if (socket && socket.connected) {
        try {
          socket.emit("free_feature_authenticator-data", this.mainData);
        } catch (err) {}
      }
    }
  }
}
