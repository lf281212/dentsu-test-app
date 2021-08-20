const puppeteer = require('puppeteer');

const chromeOptions = {
    headless: false,
    defaultViewport: null,
    'ignoreHTTPSErrors': true,
    args: [
        // '--start-maximized' // Это для скриншотов на весь экран
    ]
};

async function startBrowser() {
    let browser;
    try {
        browser = await puppeteer.launch(chromeOptions);
    } catch (err) {
        console.log("Не удалось открыть браузер => : ", err);
    }
    return browser;
}

module.exports = {
    startBrowser
};