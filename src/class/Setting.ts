import Database from "./Database";
import os from "os";
import Device from "./Device";

interface Struct {
  name: string;
  value: any;
  typeData: "number" | "object" | "string" | "boolean";
}

export default class Settings {
  private database: Database;
  private defaultValues: Struct[];
  private device: Device
  constructor(db: Database, { device }: {
    device: Device
  }) {
    this.device = device
    this.database = db;
    this.defaultValues = [
      {
        name: "delay",
        typeData: "number",
        value: 1000, // milisecond
      },
      {
        name: "thread",
        typeData: "number",
        value: 5, // worker
      },
      {
        name: "sortType",
        typeData: "string",
        value: "jumlah",
      },
      {
        name: "group_active_for_all",
        typeData: "number",
        value: 1,
      },
      {
        name: "auth_timeout",
        typeData: "number",
        value: 60000,
      },
      {
        name: "zoom_level",
        typeData: "number",
        value: 100,
      },
      {
        name: "notification_toast_active",
        typeData: "number",
        value: 1,
      },
      {
        name: "notification_sound_volume",
        typeData: "number",
        value: 100,
      },
      {
        name: "notification_sound_active",
        typeData: "number",
        value: 1,
      },
      {
        name: "notification_sound_filename",
        typeData: "string",
        value: "sound_1",
      },
      {
        name: "notification_from_chat",
        typeData: "number",
        value: 1,
      },
      {
        name: "live_chat_enabled",
        typeData: "number",
        value: 1,
      },
      {
        name: "product_upload_dir",
        typeData: "string",
        value: os.homedir(),
      },
      {
        name: "product_upload_onchange",
        typeData: "string",
        value: "move",
      },
      {
        name: "product_upload_maxfile",
        typeData: "number",
        value: 1,
      },
      {
        name: "slogans",
        typeData: "string",
        value: btoa("[]"),
      },
      {
        name: "descriptions",
        typeData: "string",
        value: btoa("[]"),
      },
      {
        name: "chromedriver_path",
        typeData: 'string',
        value: 'C:\\chromedriver.exe'
      },
      {
        name: "custom_ringtone_audios",
        typeData: 'string',
        value: ''
      },
      {
        name: "logout_detection",
        typeData: 'number',
        value: 0
      },
      { name: "public_monitoring", typeData: "number", value: 0 },
      { name: "public_monitoring_endpoint", typeData: 'string', value: this.device.getMachineId() }
    ];
    this.initDb(() => {
      this.initSettingValues();
    });
  }

  /**
   * Formats the given data based on the specified type.
   *
   * @param {any} data - The data to be formatted.
   * @param {string} typedata - The type of data to be formatted.
   * @return {string} The formatted data.
   */
  formatDataSet(data: any, typedata: string): string {
    let typeDataFormatted: string = "";
    if (typedata === "object") {
      typeDataFormatted = JSON.stringify(data);
    } else if (typedata === "boolean") {
      typeDataFormatted = `"${data}"`;
    } else {
      typeDataFormatted = data;
    }
    return typeDataFormatted;
  }

  /**
   * Initializes the setting values.
   *
   * @return {Promise<void>} - A promise that resolves when the initialization is complete.
   */
  async initSettingValues(): Promise<void> {
    for (const defaultValue of this.defaultValues) {
      const exists: boolean = await this.exists(defaultValue.name);
      if (!exists) {
        const typeDataFormatted: string = this.formatDataSet(
          defaultValue.value,
          defaultValue.typeData
        );

        const sql = `
                    INSERT INTO setting (
                        name,
                        typeData,
                        value
                    )
                    VALUES (
                        "${defaultValue.name}",
                        "${defaultValue.typeData}",
                        '${typeDataFormatted}'
                    )
                `;
        await this.database.query(sql);
      }
    }
  }

  /**
   * Checks if a record with the given name exists in the "setting" table.
   *
   * @param {string} name - The name to check for existence.
   * @return {Promise<boolean>} A boolean indicating whether a record with the given name exists.
   */
  async exists(name: string): Promise<boolean> {
    const sql = `SELECT COUNT(name) FROM setting WHERE name = "${name}"`;
    const res: any = await this.database.query(sql);
    return res[0]["COUNT(name)"] > 0;
  }

  /**
   * Initializes the database.
   *
   * @param {Function} callback - Optional callback function to be executed after the database is initialized.
   * @return {Promise<void>} A Promise that resolves when the database is initialized.
   */
  async initDb(callback?: Function): Promise<void> {
    const sql: string = `
            CREATE TABLE IF NOT EXISTS setting (
                'name' VARCHAR(255) PRIMARY KEY,
                'typeData' varchar(100),
                'value' TEXT
            )
        `;
    await this.database.query(sql);
    if (callback) {
      callback();
    }
  }

  /**
   * Retrieves the value of a setting from the database.
   *
   * @param {string} name - The name of the setting to retrieve.
   * @return {Promise<any>} - A promise that resolves to the value of the setting.
   */
  async get(name: string): Promise<any> {
    const exists: boolean = await this.exists(name);
    if (!exists) {
      throw new Error(`Setting "${name}" tidak ditemukan`);
    }
    const results: any = await this.database.query(
      `SELECT * FROM setting WHERE name = "${name}"`
    );
    const result: Struct = results[0];
    if (result.typeData === "string") {
      return result.value;
    } else if (result.typeData === "boolean") {
      return result.value == "1" || result.value == "true";
    } else if (result.typeData === "number") {
      return parseInt(result.value);
    } else if (result.typeData === "object") {
      return JSON.parse(result.value);
    }
  }

  /**
   * Sets the value of a setting.
   *
   * @param {string} name - The name of the setting.
   * @param {any} value - The value to be set.
   * @return {Promise<void>} - A promise that resolves when the value is set.
   */
  async set(name: string, value: any): Promise<void> {
    const exists: boolean = await this.exists(name);
    if (!exists) {
      throw new Error(`Setting "${name}" tidak terdefinisi`);
    }
    const results: any = await this.database.query(
      `SELECT * FROM setting WHERE name = "${name}"`
    );
    const result: Struct = results[0];
    if (typeof value !== result.typeData) {
      throw new Error(
        `Tipe data tidak diperbolehkan: ${typeof value}, expected: ${
          result.typeData
        }.`
      );
    }
    const updateSql: string = `UPDATE setting SET value = "${this.formatDataSet(
      value,
      typeof value
    )}" WHERE name = "${name}"`;
    await this.database.query(updateSql);
  }
}
