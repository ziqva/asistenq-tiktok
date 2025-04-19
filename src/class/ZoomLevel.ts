import Setting from './Setting'
import { BrowserWindow } from 'electron'

export default class ZoomLevel {
    private setting: Setting
    public browserWindow: null | BrowserWindow
    constructor({setting}: {setting: Setting}) {
        this.setting = setting
        this.browserWindow = null
        this.init()
    }

    /**
     * Initializes the function.
     *
     * @return {Promise<void>} Promise that resolves when the function has finished initializing.
     */
    private async init(): Promise<void> {
        await this.waitForBrowserWindowReady()
        let level: number = 100
        try {
            level = await this.setting.get('zoom_level')
        } catch(err) {}
        this.browserWindow.webContents.once('did-finish-load', () => {
            this.browserWindow.webContents.setZoomFactor(level / 100)
        })
    }

    /**
     * Waits for the browser window to be ready.
     *
     * @return {Promise<void>} Promise that resolves when the browser window is ready.
     */
    async waitForBrowserWindowReady() {
        while(true) {
            if(this.browserWindow !== null) {
                return
            } else {
                await new Promise((resolve) => setTimeout(resolve, 300))
            }
        }
    }

    /**
     * Sets the size of the browser window's zoom factor.
     *
     * @param {number} size - The size of the zoom factor (in percentage).
     * @return {Promise<void>} A Promise that resolves when the zoom factor has been set.
     */
    public async set(size: number): Promise<void> {
        await this.waitForBrowserWindowReady()
        await this.browserWindow.webContents.setZoomFactor(size/100)
        await this.setting.set('zoom_level', size)
    }

    /**
     * Retrieves the zoom level setting.
     *
     * @return {Promise<number>} The zoom level.
     */
    public async get(): Promise<number> {
        return await this.setting.get('zoom_level')
    }
}