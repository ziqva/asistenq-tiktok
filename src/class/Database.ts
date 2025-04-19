import { createConnection } from 'net';
import * as path from 'path'
import sqlite3 from 'sqlite3'

export default class Database {
    private dbPath: string;
    private db: sqlite3.Database
    private readPatterns: RegExp[] = [
        /^\s*SELECT\s+/i,
    ]
    
    constructor() {
        if (process.platform === 'darwin') {
            this.dbPath = path.join(process.env.HOME, 'Library', 'Application Support', 'asistenq-owner-node-data.db');
        } else {
            this.dbPath = path.join(process.env.APPDATA, 'asistenq-owner-node-data.db');
        }
        this.db = new sqlite3.Database(this.dbPath)
    }   

    /**
     * Executes a SQL query and returns the result as an array of objects.
     *
     * @param {string} sql - The SQL query to be executed.
     * @return {object} A promise that resolves with the result of the query as an array of objects.
     */
    query(sql: string): object {
        return new Promise((resolve, reject) => {
            try {   
                const uppedSql = sql.trim().toUpperCase()
                for(const readPattern of this.readPatterns) {
                    if(readPattern.test(uppedSql)) {
                        this.db.all(sql, (err, rows) => {
                            if(err) {
                                reject(err)
                                return
                            }
                            resolve(rows)
                        })
                        return
                    }
                }

                this.db.run(sql, err => {
                    if(err) {
                        return reject(err)    
                    }
                    resolve([])
                })
            } catch(err) {reject(err)}
        })
    }

}