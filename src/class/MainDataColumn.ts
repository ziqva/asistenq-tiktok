import Database from './Database'
import {Socket}  from 'socket.io'

export default class MainDataColumn {
    private database: Database
    private data: MDColumn[]
    public sockets: Socket[]
    constructor({database}: {
        database: Database
    }) {
        this.sockets = []
        this.database = database
        this.data = this.getDataForInitialize()
        this.initDb(() => {
            this.init(() => {
                this.sendData()
            })
        })
    }

    public async sendData(): Promise<void> {
        for(const socket of this.sockets) {
            try {
                socket.emit('column-data', this.data)
            } catch(err) {}
        }
    }

    private async initDb(callback?: Function): Promise<void> {
        const sql: string = `CREATE TABLE IF NOT EXISTS main_data_column (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255),
            ind INTEGER,
            active INT(1)
        )`
        await this.database.query(sql)
        callback && callback()
    }

    public async setIsActive(index: number, name: string, state: boolean): Promise<void> {
        const i: number = this.data.findIndex(x => x.name === name && x.index === index)
        if(i < 0) { throw new Error('Data tidak terdefinisi') }
        const sql = `
            UPDATE main_data_column
                SET active = ${state ? 1 : 0}
                WHERE 
                    name = "${name}"
                    AND ind = ${index}
        `
        await this.database.query(sql)
        this.data[i].active = state
        this.sendData()
    }

    public isActiveByName(name: string): boolean | null {
        const i: number = this.data.findIndex(x => x.name === name)
        if(i>=0) {
            return this.data[i].active
        } else {
            return null
        }
    }

    private async isActive(index: number, name: string): Promise<boolean> {
        const sql: string = `SELECT * FROM main_data_column
            WHERE ind = ${index}
            AND name = "${name}"`
        const res: any = await this.database.query(sql)
        if(res.length < 1) {
            // set active it 
            const insertSql: string = `INSERT INTO main_data_column (
                name,
                ind,
                active
            ) VALUES(
                "${name}",
                ${index},
                1
            )`
            await this.database.query(insertSql)
            return true
        } else {
            return res[0].active == 1
        }
    }

    private async init(callback?: Function): Promise<void> {
        for(let i = 0; i < this.data.length; i++) {
            this.data[i].active = await this.isActive(this.data[i].index, this.data[i].name)
        }
        if(callback) { callback() }
    }

    private getDataForInitialize(): MDColumn[] {
        return [
            {
                name: "No",
                index: 0,
                active: true,
            },
            {
                name: "Account",
                index: 1,
                active: true,
            },
            {
                name: "Chat",
                index: 2,
                active: true
            },
            {
                name: "Discus",
                index: 3,
                active: true,
            },
            {
                name: "New Order",
                index: 4,
                active: true
            },
            {
                name: "Dikemas",
                index: 5,
                active: true
            },
            {
                name: "Dikirim",
                index: 6,
                active: true,
            },
            {
                name: "Complaint",
                index: 7,
                active: true,
            },
            {
                name: "Saldo",
                index: 8,
                active: true,
            },
            {
                name: "Bank",
                index: 9,
                active: true,
            },
            {
                name: "Skor",
                index: 10,
                active: true,
            },
            {
                name: "Ongkir",
                index: 11,
                active: true,
            },
            {
                name: "Status",
                index: 12,
                active: true
            },
            {
                name: "PM",
                index: 13,
                active: true
            },
            {
                name: "Product",
                index: 14,
                active: true
            }
        ]
    }

   
}