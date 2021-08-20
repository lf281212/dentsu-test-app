const browserObject = require('./browser');
const scraperController = require('./pageController');
const settings = require('./settings');

settings.applySettings(process.env.APP_REGION);

let browserInstance = browserObject.startBrowser();
scraperController(browserInstance);