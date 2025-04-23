import Account from "./Account";
import Browser from "./Browser";
import Monitoring from "./Monitoring";

export default class LogoutChecker {

    private monitoring: Monitoring
    private account: Account
    private browserEngine: Browser

    constructor({ account, monitoring, browserEngine }: {
        account: Account,
        monitoring: Monitoring,
        browserEngine: Browser
    }) {
        this.browserEngine = browserEngine
        this.account = account
        this.monitoring = monitoring

        // this.checkRuntime()
    }   

    /**
     * Runs the runtime indefinitely, checking all accounts to see if they have been logged out every 3 hours.
     * If an account is found to be logged out, it will be set as unauthenticated.
     *
     * @return {Promise<void>} A promise that resolves when the runtime stops.
     */
    public async checkRuntime(): Promise<void> {
        while(true) {
            try {
                await this.checkCore() 
            } catch(err) {}
            await new Promise(r => setTimeout(r, 10800000)) // sleep in 3 hours
        }
    }



    /**
     * Core function that checks all accounts to see if they have been logged out.
     * If an account is found to be logged out, it will be set as unauthenticated.
     * This function is called by {@link checkRuntime} in an infinite loop with a 3 hour interval.
     * It will open a headless browser, set the cookies for each account, navigate to the settings page, and check if the page is the login page.
     * If the page is the login page, it sets the account as unauthenticated.
     * It will also log the URL of the page to the console.
     * If an error occurs while checking an account, it will delay 1 second before continuing to the next account.
     * After checking all accounts, it will close the browser and try to kill the browser process.
     * @returns {Promise<void>} A promise that resolves when the function is finished.
     */ 
    public async checkCore(): Promise<void> {
        const ids = await this.account.ids()
        const { browser, page } = await this.browserEngine.getBrowser('logout_checker', [
            '--window-position=-2400,-2400',
        ])
        for(const id of ids) {
            try {
                const account = await this.account.get(id, true)
                if(!account.authenticated) { continue }
                await this.browserEngine.clearData(page)
                // @ts-ignore
                await page.setCookie(...account.cookies)
                await this.browserEngine.navigatePage(page, 'view-source:https://tokopedia.com/user/settings', 0)
                const url = page.url()
                if(url.includes('login')) {
                    await this.account.setAuthenticated(account.id, false)
                }
            } 
            catch(err) { await new Promise(r => setTimeout(r, 1000)) } // delay 1 second when the error is throwed in the program
            finally {
                await new Promise(r => setTimeout(r, 2000))
            }
            console.log('Checked')
        }
        await browser.close()
        console.log('Closed!')
        try {       
            await browser.process().kill()
        } catch(err) {}
    }
}   