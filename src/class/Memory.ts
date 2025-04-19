import fs from 'fs'
import path from 'path'
type Types = "string" | "number"

export default class Memory {
    private type: Types
    private filename: string
    private data: any[]
    private saveInterval: number
    constructor({ type, prefix, saveInterval }: {
        type: Types,
        prefix: string,
        saveInterval: number
    }) {
        this.saveInterval = saveInterval
        this.type = type
        const dir = process.platform === 'darwin' 
            ? path.join(process.env.HOME, 'Library', 'Application Support', 'asistenq-tiktok-memory-data')
            : path.join(process.env.APPDATA, 'asistenq-tiktok-memory-data')
        if(!fs.existsSync(dir)) { fs.mkdirSync(dir) }
        this.filename = path.join(dir, `${prefix}_${type}.json`)
        if(!fs.existsSync(this.filename)) { fs.writeFileSync(this.filename, '[]', 'utf8') }
        try {
            const content = fs.readFileSync(this.filename, 'utf8')
            JSON.parse(content)
        } catch(_) {
            fs.writeFileSync(this.filename, '[]', 'utf8')
        }
        
        // Initialize the contents
        this.data = JSON.parse(fs.readFileSync(this.filename, 'utf8'))
    }

    public add(value: any): void {
        if(typeof value !== this.type) { throw new Error(`Type is not ${this.type}, rejected!`) }
        if(this.data.includes(value)) return
        this.data.push(value)
        fs.writeFileSync(this.filename, JSON.stringify(this.data), 'utf8')
    }

    public remove(value: any): void {
        if(typeof value !== this.type) { throw new Error(`Type is not ${this.type}, rejected!`) }
        if(!this.data.includes(value)) throw new Error('Data is not exists: ' + value)
        this.data = this.data.filter((d: any) => d !== value)
        fs.writeFileSync(this.filename, JSON.stringify(this.data), 'utf8')
    }

    public has(value: any): boolean {
        if(typeof value !== this.type) { throw new Error(`Type is not ${this.type}, rejected!`) }
        return this.data.includes(value)
    }
}