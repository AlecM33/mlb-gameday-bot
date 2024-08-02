const puppeteer = require('puppeteer');
const LOGGER = require('../logger')(process.env.LOG_LEVEL?.trim() || globals.LOG_LEVEL.INFO);

class ReusableBrowser {
    constructor () {
        LOGGER.trace('Launching ReusableBrowser...');
        const launchBrowser = async () => {
            this.browser = false;
            this.browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ]
            });
            this.page = await this.browser.newPage();
            this.browser.on('disconnected', launchBrowser);
        };

        (async () => {
            await launchBrowser();
        })();
    }

    getCurrentPage = async () => {
        if (this.page && !this.page.isClosed()) {
            return this.page;
        }
        this.page = await this.browser.newPage();
        LOGGER.trace('The ReusableBrowser has ' + (await this.browser.pages()).length + ' pages.');
        return this.page;
    };
}

module.exports = ReusableBrowser;
