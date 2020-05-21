const pupHelper = require('./puppeteerhelper');
const fs = require('fs');
const pLimit = require('p-limit');
const moment = require('moment');
const {siteLink} = require('./keys');
let browser;
let results = [];

(async () => {
  try {
    browser = await pupHelper.launchBrowser();
    browser.on('disconnected', async () => {
      browser = false;
      browser = await pupHelper.launchBrowser();
    });
  
    await run();
    
    await browser.close();
  } catch (error) {
    if (browser) await browser.close();
    console.log(`Bot Run Error: ${error.message}`);
    return error;
  }
})()

const run = () => new Promise(async (resolve, reject) => {
  let page;
  try {
    console.log('Started Scraping...');
    page = await pupHelper.launchPage(browser);
    await page.goto(`${siteLink}/online-and-technology-businesses-for-sale/`, {timeout: 0, waitUntil: 'load'});

    await page.waitForSelector('.pagination > ul > li:nth-last-child(2) > a');
    const noOfPages = parseInt(await pupHelper.getTxt('.pagination > ul > li:nth-last-child(2) > a', page));
    console.log(`Number of pages: ${noOfPages}`);
    await page.close();

    const limit = pLimit(1);
    const promises = [];

    for (let pageNumber = 1; pageNumber <= noOfPages; pageNumber++) {
      promises.push(limit(() => fetchDetails(pageNumber, noOfPages)));
    }

    await Promise.all(promises);

    console.log(`Found ${results.length} listings. Saving now to csv...`)
    await saveResults();
    console.log('Finished Scraping...');

    resolve(true);
  } catch (error) {
    if (page) await page.close();
    console.log(`Run Error: ${error.message}`);
    reject(error);
  }
})

const saveResults = () => new Promise(async (resolve, reject) => {
  try {
    const fileName = `results ${moment().format('MM-DD-YYYY HH-mm')}`
    // fs.writeFileSync(`${fileName}.json`, JSON.stringify(results));
    let csv = `"URL","Headline","Sub Headline","Price","Description"\r\n`;

    for (let i = 0; i < results.length; i++) {
      csv+= `"${results[i].url}","${results[i].headline}","${results[i].subHeadline}","${results[i].price}","${results[i].description}"\r\n`;
    }

    fs.writeFileSync(`${fileName}.csv`, csv);

    resolve(true);
  } catch (error) {
    console.log('saveResults Error: ', error.message);
    reject(error);
  }
});

const fetchDetails = (pageNumber, noOfPages) => new Promise(async (resolve, reject) => {
  let page;
  try {
    console.log(`Fetching Details from Page Number: ${pageNumber}/${noOfPages}`)
    page = await pupHelper.launchPage(browser);
    await page.goto(`${siteLink}/online-and-technology-businesses-for-sale/${pageNumber}`, {timeout: 0, waitUntil: 'load'});

    await page.waitForSelector('a[data-listnumber]');
    const listings = await page.$$('a[data-listnumber]');
    
    for (let i = 0; i < listings.length; i++) {
      const result = {};
      result.url = await page.evaluate(elm => elm.getAttribute('href'), listings[i]);
      result.url = siteLink + result.url;
      result.headline = await pupHelper.getTxt('b.title.visible-desktop', listings[i]);
      result.subHeadline = await pupHelper.getTxt('i.tagline.visible-desktop', listings[i]);
      result.price = await pupHelper.getTxt('.priceBlock > .price', listings[i]);
      result.price = result.price.replace(/\$/gi, '').replace(/\,/gi, '').trim();
      result.description = await pupHelper.getTxt('p.desc', listings[i]);
      results.push(result);
    }

    await page.close();
    resolve(true);
  } catch (error) {
    if (page) await page.close();
    console.log(`fetchDetails [${pageNumber}] Error: ${error.message}`);
    reject(error.message);
  }
})
