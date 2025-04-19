import Database from "./Database";
import Monitoring from "./Monitoring";
import Setting from "./Setting";

export default class Group {
  private database: Database;
  private monitoring: Monitoring;
  private setting: Setting;
  public groups: StructGroup[];
  private activeForAllSettingName: string;
  public activeForAll: boolean;
  public onDataChange: Function | null;
  constructor({
    database,
    monitoring,
    setting,
  }: {
    database: Database;
    monitoring: Monitoring;
    setting: Setting;
  }) {
    this.database = database;
    this.monitoring = monitoring;
    this.setting = setting;
    this.initDb(() => {
      this.initMainGroups();
    });
    this.groups = [];
    this.activeForAllSettingName = "group_active_for_all";
    this.activeForAll = true;
    this.initActiveForAll();
    this.onDataChange = null;
  }

  /**
   * Updates a single record in the database.
   *
   * @param {string} before - The value to be replaced in the database.
   * @param {string} after - The new value to replace the old value with.
   * @return {Promise<void>} A promise that resolves when the update is complete.
   */
  async updateSingle(before: string, after: string): Promise<void> {
    // Update accounts data
    const sqlAcc: string = `SELECT id, groupNames FROM account`;
    const resAcc: any = await this.database.query(sqlAcc);
    if (after.length < 3) throw new Error("Group terlalu pendek");
    for (const acc of resAcc) {
      const groups = acc.groupNames
        .split(",")
        .map((x: any) => x.trim())
        .filter((x: any) => x.length > 0)
        .map((x: any) => (x === before ? after : x));
      const updateSql: string = `UPDATE account SET groupNames = "${groups.join(
        ","
      )}" WHERE id = ${acc.id}`
        .split("\n")
        .join("");
      await this.database.query(updateSql);
      const iMonitoring = this.monitoring.mainData.findIndex(
        (x) => x.id == acc.id
      );
      if (iMonitoring >= 0) {
        this.monitoring.mainData[iMonitoring].groupNames = groups.join(",");
      }
    }
    // Kirim datanya dan tampilkan
    await this.monitoring.sendMainData();
    // Update groups
    const updateSql: string = `UPDATE _group SET name = "${after}" WHERE name = "${before}"`;
    await this.database.query(updateSql);
    const i = this.groups.findIndex((x) => x.name == before);
    if (i >= 0) this.groups[i].name = after;
  }

  /**
   * Returns all the StructGroup objects in the groups array.
   *
   * @return {StructGroup[]} An array of StructGroup objects.
   */
  public all(): StructGroup[] {
    return this.groups;
  }

  /**
   * Mass update function that updates the group names for a given set of IDs.
   *
   * @param {object} options - The options object containing the IDs and group names.
   * @param {number[]} options.ids - The array of IDs to update.
   * @param {string} options.groupNames - The comma-separated string of group names.
   * @return {Promise<void>} A promise that resolves when the update is complete.
   */
  public async massUpdate({
    ids,
    groupNames,
  }: {
    ids: number[];
    groupNames: string;
  }): Promise<void> {
    const targetGroupNames: string = groupNames
      .split(",")
      .map((x) => x.toLowerCase())
      .map((x) => x.split('"').join(""))
      .map((x) => x.split("'").join(""))
      .map((x) => x.trim())
      .join(",")
      .trim();

    // update group list
    for (const name of targetGroupNames.split(",")) {
      const exists: boolean = await this.exists(name);
      if (!exists) {
        await this.add(name);
        this.groups.push({
          name: name,
          active: true,
          count: 0,
        });
      }
    }

    // update account
    for (const id of ids) {
      const updateSql: string = `
                UPDATE account 
                    SET groupNames = "${targetGroupNames}"
                WHERE id = "${id}"
            `;
      await this.database.query(updateSql);
      const i: number = this.monitoring.mainData.findIndex((x) => x.id === id);
      if (i >= 0) {
        this.monitoring.mainData[i].groupNames = targetGroupNames;
      }
    }

    // call on data change if not nulled
    if (this.onDataChange) {
      this.onDataChange();
    }
  }

  /**
   * Removes a given name from the monitoring group.
   *
   * @param {string} name - The name to be removed from the monitoring group.
   * @return {Promise<void>} - A promise that resolves when the name has been removed.
   */
  public async remove(name: string): Promise<void> {
    for (let i = 0; i < this.monitoring.mainData.length; i++) {
      const targetGroupNames: string = this.monitoring.mainData[i].groupNames
        .split(",")
        .map((x) => x.trim())
        .filter((x) => x.length > 0)
        .filter((x) => x !== name)
        .join(",");
      this.monitoring.mainData[i].groupNames = targetGroupNames;
      await this.database.query(`
                UPDATE account 
                    SET groupNames = "${targetGroupNames}"
                WHERE id = "${this.monitoring.mainData[i].id}"
            `);
    }
    const removeSql: string = `
            DELETE FROM _group
            WHERE name = "${name}"
        `;
    await this.database.query(removeSql);
    if (this.onDataChange) {
      this.onDataChange();
    }
    const i: number = await this.groups.findIndex((x) => x.name === name);
    if (i >= 0) {
      this.groups.splice(i, 1);
    }
  }

  /**
   * Initializes the groups from the database.
   *
   * @return {Promise<void>} - A Promise that resolves once the initialization is complete.
   */
  private async initGroupsFromDb(): Promise<void> {
    const res: any = await this.database.query(`SELECT * FROM _group`);
    for (const item of res) {
      const i: number = this.groups.findIndex((x) => x.name === item?.name);
      if (i < 0) {
        this.groups.push({
          name: item?.name,
          active: item?.is_active === 1,
          count: 0,
        });
      }
    }
  }

  /**
   * Recounts the count of each group based on the mainData in the monitoring.
   *
   * @return {void} This function does not return a value.
   */
  public recount(): void {
    let groups: StructGroup[] = this.groups.map((x) => {
      x.count = 0;
      return x;
    });
    for (const md of this.monitoring.mainData) {
      const groupNames: string[] = md.groupNames.split(",");
      for (const groupName of groupNames) {
        const i: number = groups.findIndex((x) => x.name === groupName);
        if (i >= 0) {
          groups[i].count++;
        }
      }
    }
    this.groups = groups;
  }

  /**
   * Sets the active state for all.
   *
   * @param {boolean} state - The state to set.
   * @param {Function} callback - Optional callback function.
   * @return {Promise<void>} A Promise that resolves when the state is set.
   */
  public async setActiveForAll(
    state: boolean,
    callback?: Function
  ): Promise<void> {
    await this.setting.set(this.activeForAllSettingName, state ? 1 : 0);
    this.activeForAll = state;
    if (this.onDataChange) {
      this.onDataChange();
    }
    callback && callback();
  }

  /**
   * Filters the mainData array based on certain conditions.
   *
   * @param {StructAccount[]} mainData - the array of mainData objects to be filtered
   * @return {StructAccount[]} - the filtered array of mainData objects
   */
  public filterMainData(mainData: StructAccount[]): StructAccount[] {
    if (this.activeForAll) {
      return mainData;
    } else {
      // Filter
      let acc: StructAccount[] = [];
      for (const md of mainData) {
        const groupNames: string[] = md.groupNames.split(",");
        for (const group of groupNames) {
          const isActive: boolean =
            this.groups.findIndex(
              (x) => x.name === group && x.active === true
            ) >= 0;
          if (isActive) {
            acc.push(md);
            break;
          }
        }
      }
      return acc;
    }
  }

  /**
   * Initializes the 'activeForAll' property by retrieving its state from the 'setting' object.
   * If the state is 1, the 'activeForAll' property is set to true. Otherwise, it is set to false.
   * Prints the value of the 'activeForAll' property to the console.
   *
   * @return {Promise<void>} Promise that resolves when the function completes successfully.
   */
  public async initActiveForAll(): Promise<void> {
    try {
      const currentState: number = await this.setting.get(
        this.activeForAllSettingName
      );
      this.activeForAll = currentState === 1;
    } catch (err) {
      console.error(err);
    }
    if (this.onDataChange) {
      this.onDataChange();
    }
  }

  /**
   * Updates the active state of a group.
   *
   * @param {string} name - The name of the group.
   * @param {boolean} state - The new active state of the group.
   * @param {Function} callback - An optional callback function to be called after the update.
   * @return {Promise<void>} A promise that resolves when the update is complete.
   */
  public async setActive(
    name: string,
    state: boolean,
    callback?: Function
  ): Promise<void> {
    const sql: string = `
            UPDATE _group SET is_active = "${
              state ? "1" : "0"
            }" WHERE name = "${name}"
        `;
    await this.database.query(sql);
    const i: number = this.groups.findIndex((x) => x.name === name);
    if (i >= 0) {
      this.groups[i].active = state;
    }
    callback && callback();
    if (this.onDataChange) {
      this.onDataChange();
    }
  }

  /**
   * Initializes the main groups.
   *
   * @param {Function} callback - Optional callback function to be called at the end of the initialization.
   * @return {Promise<void>} A promise that resolves when the initialization is complete.
   */
  private async initMainGroups(callback?: Function): Promise<void> {
    while (true) {
      if (this.monitoring.mainDataInitialized) {
        break;
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    let names: string[] = [];
    for (const md of this.monitoring.mainData) {
      const namesOfRaw = md.groupNames
        .trim()
        .split(",")
        .map((x) => x.trim())
        .filter((x) => x.length > 0);
      for (const name of namesOfRaw) {
        if (!names.includes(name)) {
          names.push(name);
        }
      }
    }

    for (const name of names) {
      const exists: boolean = await this.exists(name);
      if (!exists) {
        await this.add(name);
        this.groups.push({
          name: name,
          active: true,
          count: 0,
        });
      } else {
        this.groups.push({
          name: name,
          active: await this.isActive(name),
          count: 0,
        });
      }
    }
    await this.initGroupsFromDb();
    callback && callback();
    if (this.onDataChange) {
      this.onDataChange();
    }
  }

  /**
   * Checks if a group with the given name is active.
   *
   * @param {string} name - The name of the group.
   * @return {Promise<boolean>} A boolean indicating if the group is active.
   */
  public async isActive(name: string): Promise<boolean> {
    const sql: string = `
            SELECT is_active FROM _group WHERE name = "${name}"
        `;
    const res: any = await this.database.query(sql);
    return res[0]["is_active"] === 1;
  }

  /**
   * Initializes the database.
   *
   * @param {Function} callback - Optional callback function to be executed after initialization.
   * @return {Promise<void>} A promise that resolves once the database is initialized.
   */
  private async initDb(callback?: Function): Promise<void> {
    const sql: string = `
            CREATE TABLE IF NOT EXISTS _group (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255),
                is_active INT(1)
            )
        `;
    await this.database.query(sql);
    callback && callback();
  }

  /**
   * Checks if a record with the specified name exists in the _group table.
   *
   * @param {string} name - The name of the record to check.
   * @return {Promise<boolean>} A Promise that resolves to true if the record exists, false otherwise.
   */
  public async exists(name: string): Promise<boolean> {
    const sql: string = `
            SELECT COUNT(id) FROM _group WHERE name = "${name}"
        `;
    const res: any = await this.database.query(sql);
    return res[0]["COUNT(id)"] > 0;
  }

  /**
   * Adds a new group with the specified name to the database.
   *
   * @param {string} name - The name of the group to be added.
   * @return {Promise<void>} - A promise that resolves once the group has been added.
   */
  public async add(name: string): Promise<void> {
    const exists: boolean = await this.exists(name);
    if (!exists) {
      const sql: string = `
                INSERT INTO _group (name, is_active) VALUES(
                    "${name}",
                    1
                )
            `;
      await this.database.query(sql);
    }
    const i: number = this.groups.findIndex((x) => x.name === name);
    if (i < 0) {
      this.groups.push({
        name: name,
        active: true,
        count: 0,
      });
    }
    if (this.onDataChange) {
      this.onDataChange();
    }
  }

  /**
   * Adds a group to the list of groups from a raw string.
   *
   * @param {string} groupRaw - The raw string containing the groups.
   * @return {Promise<void>} - A Promise that resolves when the groups are added.
   */
  public async addGroupFromRawString(groupRaw: string): Promise<void> {
    const groups: string[] = groupRaw
      .trim()
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
    for (const group of groups) {
      await this.add(group);
    }
  }
}
