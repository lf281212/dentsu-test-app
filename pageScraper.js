const regionSettings = require('./settings');
const fs = require('fs');

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function selectCity(page) {
    // Это плашка с названием города
    let [button] = await page.$x("//div[@class='kxa6']");
    if (button) button.click();

    // Здесь ждём поле для ввода и фокусимся на него
    // Можно просто выбрать город, но при плохом интернете целый список не подгружается, 
    // а работает по принципу автокомплита, своеобразная защита
    await page.waitForSelector("input._16XE._2HHF", { visible: true });
    await page.focus("input._16XE._2HHF");

    // Вводим название нужного города
    await Promise.all([
        await page.keyboard.type(regionSettings.regionName),
        await page.waitForXPath("//a[contains(., '" + regionSettings.regionName + "')]")
    ]);

    // Выбираем что нужно, эвэйтим страничку
    [button] = await page.$x("//a[contains(., '" + regionSettings.regionName + "')]");
    if (button) {
        await Promise.all([
            button.click(),
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ]);
    }
}

async function processPage(page, counter) {
    try {
        let prodArr = await getProductsInfo(page);
        await page.screenshot({ path: 'page' + counter + '.png', fullPage: true });

        let [button] = await page.$x("//div[@class='kxa6'][contains(.,'Дальше')]");
        if (button) {
            await Promise.all([
                button.click(),
                page.waitForNavigation({ waitUntil: 'networkidle2' }),
            ]);
            prodArr = prodArr.concat(await processPage(page, counter + 1, prodArr));
        }
        return prodArr;
    } catch (err) {
        throw err;
    }
}

const scraperObject = {
    urlMain: 'http://ozon.com',
    urlKvas: 'https://www.ozon.ru/category/kvas-9469/',
    async scraper(browser) {
        let page = await browser.newPage();

        // На главную
        await page.goto(this.urlMain);

        // Выбираем город
        await selectCity(page);

        // Вперёд к квасу
        await Promise.all([
            page.goto(this.urlKvas),
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            // Нужно дождаться загрузки страницы, чтобы список был полным (вроде как там пагинация по 10 позиций)
            // networkidle0 не срабатывает, скорее всего, потому, что Озон постоянно пытается собирать
            // в фоновом режиме какие-то данные с разных источников, активные подключения есть всегда
        ]);

        // Рекурсивно обходим все странички пока доступна кнопка "Дальше"
        let prodArr = [];
        try {
            prodArr = await processPage(page, 1);
        } catch (err) {
            // Здесь нужно обрабатывать ошибку, TODO
            console.error(err);
        }

        const data = JSON.stringify(prodArr);

        fs.writeFile('result.json', data, (err) => {
            if (err) {
                throw err;
            }
        });
    }
}

async function getProductsInfo(page) {
    let element = await page.$$('div.e3f7 div.e3f5');
    let prodArr = [];
    for (let item of element) {
        // На странице явно не указан артикул, указан только на странице товара, но можно получить из ссылки
        let elementHref = await page.evaluate((el) => {
            try {
                return Object.values(el.children).filter(child => child.className == 'e3w6 tile-hover-target')[0].href;
            } catch (err) {
                return '';
            }
        }, item);
        let vendorName = getVendorCode(elementHref);

        // Получим наименование из тега
        let elementName = await page.evaluate((el) => {
            try {
                let container1 = Object.values(el.children).filter(child => child.className == 'e3s5')[0];
                return Object.values(container1.children).filter(child => child.className == 'tile-hover-target e3t0')[0].textContent;
            } catch (err) {
                return '';
            }
        }, item);

        // Получим цены из тега
        let elementPrices = await page.evaluate((el) => {
            try {
                let container1 = Object.values(el.children).filter(child => child.className == 'e3s5')[0];
                let container2 = Object.values(container1.children).filter(child => child.className == 'e3r7 tile-hover-target')[0];
                let value = Object.values(container2.children).filter(child => child.className == '_24d4')[0].textContent;

                let splPrice = value.split('₽').filter(el => el);

                return {
                    noDiscPrice: splPrice.length == 2 ? splPrice[1] : splPrice[0],
                    discPrice: splPrice.length == 2 ? splPrice[0] : ''
                };
            } catch (err) {
                return {
                    noDiscPrice: '',
                    discPrice: ''
                };
            }
        }, item);

        prodArr.push({
            vendorName: vendorName,
            elementName: elementName,
            noDiscPrice: elementPrices.noDiscPrice,
            discPrice: elementPrices.discPrice,
        })
    }

    return prodArr;
}

// На странице артикула нет, но можно достать из href, чтобы не открывать каждую страницу отдельно
function getVendorCode(href) {
    try {
        let str = href.split('/product/')[1].split('/')[0];
        let fullnameArr = str.split('-');
        return fullnameArr[fullnameArr.length - 1];
    } catch (err) {
        console.error('Не удалось обработать ссылку ' + href);
        return href;
    }
}

module.exports = scraperObject;