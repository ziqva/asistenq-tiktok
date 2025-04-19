import fetch, {Request} from 'node-fetch'
import config from '../config'
import os from 'os'
import * as path from 'path'
import * as fs from 'fs'

export default class Updater {
    private base: string
    private updatesUrl: string
    private patcherUrl: string
    private updateBinnaryPath: string
    constructor() {
        this.base = "https://dev.srv-ziqlabs-1.my.id"
        this.updatesUrl = `${this.base}/updates?build_number=${config.product.buildNumber}&product=AsistenQ Owner`
        this.patcherUrl = 'https://srv-ziqlabs-1.my.id/share/intern-library/asistenq/patcher.exe'
        this.updateBinnaryPath = 'https://dev.srv-ziqlabs-1.my.id/update/dl/{zip_file}?as=temporary'
    }

    public async update({zipFile}: {zipFile: string}): Promise<void> {

    }

    private temp(filename: string): string {
        return path.join(os.tmpdir(), filename)
    }


    private async downloadPatcher(): Promise<string> {
        const response = await fetch(this.patcherUrl)
        if(!response.ok) {
            throw new Error('failed for download patcher: ' + response.statusText)
        }

        const targetFilePath: string = this.temp('asistenq-patcher.exe')
        if(fs.existsSync(targetFilePath)) {
            fs.existsSync(targetFilePath)
        }

        const writer = fs.createWriteStream(targetFilePath)
        response.body.pipe(writer)
        await new Promise((resolve) => {
            writer.on('finish', () => resolve(null))
        })
        return targetFilePath
    }

    /**
     * Retrieves updates from the server.
     *
     * @return {Promise<Update[]>} - A promise that resolves to an array of updates.
     */
    public async getUpdates(): Promise<Update[]> {
        const response = await fetch(this.updatesUrl)
        if(response.ok) {
            return await response.json()
        } else {
            throw new Error(`Gagal mendapatkan update: ${response.statusText} [${response.status}]`)
        }
    }
}