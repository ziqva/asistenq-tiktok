import {app, shell} from 'electron'

export default class App {
    constructor() {
    }

    /**
     * Restarts the application.
     *
     * @return {void} No return value.
     */
    restart(): void {
        app.relaunch()
        app.exit()
    }

    public openExternalLink(url: string): void {
        shell.openExternal(url)
    }
}
