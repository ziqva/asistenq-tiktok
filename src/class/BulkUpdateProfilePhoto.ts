import fs from 'fs'
import path from 'path'
import Browser from './Browser'
import Account from './Account'
import { Socket } from 'socket.io'

export default class BulkUpdateProfilePhoto {
    private browser: Browser
    private account: Account
    public sockets: Socket[]
    private running: boolean;
    private logs: string[]

    constructor({account}: {
        account: Account,
    }) {
        this.account = account
        this.browser = new Browser()
        this.sockets = []
        this.running = false
        this.logs = []
    }

    /**
     * A description of the entire function.
     *
     * @return {void} description of return value
     */
    public sendLogs(): void {
        for(const socket of this.sockets) {
            try {
                socket.emit('logs', this.logs)
            } catch(err){}
        }
    }

    /**
     * A description of the entire function.
     *
     * @param {string} msg - description of parameter
     * @return {void} description of return value
     */
    private log(msg: string): void {
     this.logs.push(msg)
     if(this.logs.length > 300) {
        this.logs.shift()
     }   
     this.sendLogs()
    }

    /**
     * A description of the entire function.
     *
     * @param {boolean} state - description of parameter
     * @return {void} description of return value
     */
    private sendIsRunning(state?: boolean): void {
        if(typeof state === 'boolean') { this.running = state }
        for(const socket of this.sockets) {
            try {
                socket.emit('running-state', this.running)
            } catch(err) {}
        } 
    }

    public async apply({accountIds, folder}: {
        accountIds: number[],
        folder: string
    }): Promise<void> {
        try {
            if(this.running) { return }
            this.logs = []
            this.log('Starting...')
            this.sendIsRunning(true)
            const listData = await this.getListData({accountIds, folder})
            this.log('Starting the Chrome...')
            const {browser, page} = await this.browser.getBrowser('bulkUpdateProfilePhoto', [])
            for(const item of listData) {   
                await this.browser.clearData(page)
                this.log(`Updating photo of ${item.name}...`)
                const account = await this.account.get(item.email)
                // @ts-ignore
                await page.setCookie(...account.cookies)
                await this.browser.navigatePage(page, 'https://seller.tokopedia.com/settings/info', 10)
                this.log('Waiting for file upload field presented')
                const fileInput = await page.waitForSelector('input[type="file"]')
                this.log(`Uploading file: ${item.avatar.target}`)
                await fileInput.uploadFile(item.avatar.target)
                const msgText = await page.waitForSelector('[data-unify="Toaster"]', {timeout: 0, visible: true})
                this.log(`Info: ` + (await msgText.evaluate(x => x.textContent)))
                await new Promise(r => setTimeout(r, 1000))
            }
            await browser.close()
            try {
                browser.disconnect()
            } catch(err) {}
        } catch(err) {
            this.log(`Error: ${err.message || err}`)
            console.error(err.message || err)
        }
        this.sendIsRunning(false)
        this.log('Proses selesai 🎉🎉')
    }   

    /**
     * Retrieves a list of data for a given set of account IDs and folder.
     *
     * @param {Object} options - The options object.
     * @param {number[]} options.accountIds - An array of account IDs.
     * @param {string} options.folder - The folder path.
     * @return {Promise<ListData[]>} A promise that resolves to an array of ListData objects.
     * @throws {Error} If the folder does not exist or is not a directory.
     * @throws {Error} If there are no image files in the folder.
     */
    public async getListData({accountIds, folder}: {
        accountIds: number[],
        folder: string
    }): Promise<ListData[]> {
        let x: ListData[] = []
        if(!fs.existsSync(folder) && !fs.statSync(folder).isDirectory()) { throw new Error('Folder tidak ditemukan: ' + folder) }
        const files = fs.readdirSync(folder).filter(x => x.endsWith('jpg') || x.endsWith('png')).map(x => path.join(folder, x))
            .map(x => x.charAt(0).toUpperCase() + x.slice(1))
        if(files.length < 1) { throw new Error('Tidak ada file gambar di folder: ' + folder) }
        for(const accountId of accountIds) {
            const acc = await this.account.get(accountId)
            x.push({
                name: acc.name,
                email: acc.email,
                avatar: {
                    current: acc.avatar,
                    target: files[Math.floor(Math.random() * files.length)]
                }
            })
        }
        return x
    }

    public async onNewConnectionAttached() {
        this.sendIsRunning()
        this.sendLogs()
    }
}

interface ListData {
    name: string,
    email: string,
    avatar: {
        current: string,
        target: string
    }
}