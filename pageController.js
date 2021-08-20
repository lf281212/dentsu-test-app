const pageScraper = require('./pageScraper');
async function scrapeAll(browserInstance){
    let browser;
    try{
        browser = await browserInstance;
        await pageScraper.scraper(browser);
        await browser.close();
    }
    catch(err){
        console.log("Не удалось открыть браузер => : ", err);
    }
}

module.exports = (browserInstance) => scrapeAll(browserInstance)