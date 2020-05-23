const pupHelper = require('./puppeteerhelper');
const fs = require('fs');
const pLimit = require('p-limit');
const moment = require('moment');
const {
  siteLink_BizBuySell,
  siteLink_BizQuest,
  siteLink_BusinessesForSale,
  siteLink_Flippa,
} = require('./keys');
let browser;
let results = [];

(async () => {
  try {
    console.log('Started Scraping...');
    browser = await pupHelper.launchBrowser();
    // browser.on('disconnected', async () => {
    //   browser = false;
    //   browser = await pupHelper.launchBrowser(true);
    // });
  
    await scrapeBizBuySell();
    await scrapeBizQuest();
    await scrapeBusinessesForSale();
    await scrapeFlippa();

    await saveResults();
    
    await browser.close();
    console.log('Finished Scraping...');
    return true;
  } catch (error) {
    if (browser) await browser.close();
    console.log(`Bot Run Error: ${error.message}`);
    return error;
  }
})()

const scrapeBizBuySell = () => new Promise(async (resolve, reject) => {
  let page;
  try {
    console.log('Started Scraping BizBuySell');
    page = await pupHelper.launchPage(browser);
    await page.goto(siteLink_BizBuySell, {timeout: 0, waitUntil: 'load'});

    await page.waitForSelector('.pagination > ul > li:nth-last-child(2) > a');
    const noOfPages = parseInt(await pupHelper.getTxt('.pagination > ul > li:nth-last-child(2) > a', page));
    console.log(`Number of pages: ${noOfPages}`);
    await page.close();

    const limit = pLimit(3);
    const promises = [];

    for (let pageNumber = 1; pageNumber <= noOfPages; pageNumber++) {
      promises.push(limit(() => fetchDetailsBizBuySell(pageNumber, noOfPages)));
    }

    await Promise.all(promises);

    console.log(`Finished Scraping BizBuySell, Found ${results.length} listings`);

    resolve(true);
  } catch (error) {
    if (page) await page.close();
    console.log(`BizBuySell Run Error: ${error.message}`);
    reject(error);
  }
});

const fetchDetailsBizBuySell = (pageNumber, noOfPages) => new Promise(async (resolve, reject) => {
  let page;
  try {
    console.log(`Fetching Details from Page Number: ${pageNumber}/${noOfPages}`)
    page = await pupHelper.launchPage(browser);
    await page.goto(`${siteLink_BizBuySell}${pageNumber}`, {timeout: 0, waitUntil: 'load'});

    await page.waitForSelector('a[data-listnumber]');
    const listings = await page.$$('a[data-listnumber]');
    
    for (let i = 0; i < listings.length; i++) {
      const result = {};
      result.url = await page.evaluate(elm => 'https://www.bizbuysell.com' + elm.getAttribute('href'), listings[i]);
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
    console.log(`fetchDetails [${pageNumber}] Error: ${error}`);
    reject(error.message);
  }
});

const scrapeBizQuest = () => new Promise(async (resolve, reject) => {
  let page;
  try {
    console.log('Started Scraping BizQuest');
    page = await pupHelper.launchPage(browser);
    await page.goto(siteLink_BizQuest, {timeout: 0, waitUntil: 'load'});

    await page.waitForSelector('ul.pagination > li:nth-last-child(2) > a');
    const noOfPages = parseInt(await pupHelper.getTxt('ul.pagination > li:nth-last-child(2) > a', page));
    console.log(`Number of pages: ${noOfPages}`);
    await page.close();

    const limit = pLimit(3);
    const promises = [];

    for (let pageNumber = 1; pageNumber <= noOfPages; pageNumber++) {
      promises.push(limit(() => fetchDetailsBizQuest(pageNumber, noOfPages)));
    }

    await Promise.all(promises);

    console.log(`Finished Scraping BizQuest, Found ${results.length} listings`);

    resolve(true);
  } catch (error) {
    if (page) await page.close();
    console.log(`BizQuest Run Error: ${error.message}`);
    reject(error);
  }
});

const fetchDetailsBizQuest = (pageNumber, noOfPages) => new Promise(async (resolve, reject) => {
  let page;
  try {
    console.log(`Fetching Details from Page Number: ${pageNumber}/${noOfPages}`)
    page = await pupHelper.launchPage(browser);
    await page.goto(`${siteLink_BizQuest}page-${pageNumber}/`, {timeout: 0, waitUntil: 'load'});

    await page.waitForSelector('#results > .result');
    const listings = await page.$$('#results > .result:not(.broker):not(.srfranchise)');
    
    for (let i = 0; i < listings.length; i++) {
      const result = {};
      result.url = await pupHelper.getAttr('b.title > a', 'href', listings[i]);
      result.headline = await pupHelper.getTxt('b.title', listings[i]);
      result.subHeadline = await pupHelper.getTxt('i.tagline', listings[i]);
      result.price = await pupHelper.getTxt('.price > .asking', listings[i]);
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
});

const scrapeBusinessesForSale = () => new Promise(async (resolve, reject) => {
  let page;
  try {
    console.log('Started Scraping BusinessesForSale');
    page = await pupHelper.launchPage(browser);
    await page.goto(siteLink_BusinessesForSale, {timeout: 0, waitUntil: 'load'});

    await page.waitForSelector('.pagination > ul > li:nth-last-child(2)');
    const noOfPages = parseInt(await pupHelper.getTxt('.pagination > ul > li:nth-last-child(2)', page));
    console.log(`Number of pages: ${noOfPages}`);
    await page.close();

    const limit = pLimit(3);
    const promises = [];

    for (let pageNumber = 1; pageNumber <= noOfPages; pageNumber++) {
      promises.push(limit(() => fetchDetailsBusinessesForSale(pageNumber, noOfPages)));
    }

    await Promise.all(promises);

    console.log(`Finished Scraping BusinessesForSale, Found ${results.length} listings`);

    resolve(true);
  } catch (error) {
    if (page) await page.close();
    console.log(`BizQuest Run Error: ${error.message}`);
    reject(error);
  }
});

const fetchDetailsBusinessesForSale = (pageNumber, noOfPages) => new Promise(async (resolve, reject) => {
  let page;
  try {
    console.log(`Fetching Details from Page Number: ${pageNumber}/${noOfPages}`)
    page = await pupHelper.launchPage(browser);
    await page.goto(siteLink_BusinessesForSale.replace(/(?<=businesses-for-sale-).*(?=\?)/gi, pageNumber), {timeout: 0, waitUntil: 'load'});

    await page.waitForSelector('.search-results > .result');
    const listings = await page.$$('.search-results > .result');
    
    for (let i = 0; i < listings.length; i++) {
      const result = {};
      result.url = await pupHelper.getAttr('h2 > a', 'href', listings[i]);
      result.headline = await pupHelper.getTxt('h2', listings[i]);
      result.price = await pupHelper.getTxt('.t-finance tr:first-of-type > td', listings[i]);
      result.price = result.price.replace(/\$/gi, '').replace(/\,/gi, '').trim();
      result.revenue = await pupHelper.getTxt('.t-finance tr:nth-of-type(2) > td', listings[i]);
      result.revenue = result.revenue.replace(/\$/gi, '').replace(/\,/gi, '').trim();
      result.cashFlow = await pupHelper.getTxt('.t-finance tr:nth-of-type(3) > td', listings[i]);
      result.cashFlow = result.cashFlow.replace(/\$/gi, '').replace(/\,/gi, '').trim();
      result.description = await pupHelper.getTxt('.t-desc p', listings[i]);
      results.push(result);
    }

    await page.close();
    resolve(true);
  } catch (error) {
    if (page) await page.close();
    console.log(`fetchDetails [${pageNumber}] Error: ${error.message}`);
    reject(error.message);
  }
});

const scrapeFlippa = () => new Promise(async (resolve, reject) => {
  let page;
  try {
    console.log('Started Scraping Flippa');
    page = await pupHelper.launchPage(browser);
    await page.goto(`${siteLink_Flippa}1`, {timeout: 0, waitUntil: 'load'});

    await page.waitForSelector('#searchResults > div.mt-4.row > div.col-12.col-lg-7.d-flex.flex-wrap.d-lg-block.justify-content-between > span:nth-child(3)');
    const noOfPages = parseInt(await pupHelper.getTxt('#searchResults > div.mt-4.row > div.col-12.col-lg-7.d-flex.flex-wrap.d-lg-block.justify-content-between > span:nth-child(3)', page));
    console.log(`Number of pages: ${noOfPages}`);
    await page.close();

    const limit = pLimit(3);
    const promises = [];

    for (let pageNumber = 1; pageNumber <= noOfPages; pageNumber++) {
      promises.push(limit(() => fetchDetailsFlippa(pageNumber, noOfPages)));
    }

    await Promise.all(promises);

    console.log(`Finished Scraping Flippa, Found ${results.length} listings`);

    resolve(true);
  } catch (error) {
    if (page) await page.close();
    console.log(`BizQuest Run Error: ${error.message}`);
    reject(error);
  }
});

const fetchDetailsFlippa = (pageNumber, noOfPages) => new Promise(async (resolve, reject) => {
  let page;
  try {
    console.log(`Fetching Details from Page Number: ${pageNumber}/${noOfPages}`)
    page = await pupHelper.launchPage(browser);
    await page.goto(`${siteLink_Flippa}${pageNumber}`, {timeout: 0, waitUntil: 'load'});

    await page.waitForSelector('#searchResults > .listing-card');
    const listings = await page.$$('#searchResults > .listing-card');
    
    for (let i = 0; i < listings.length; i++) {
      const result = {};
      result.url = await pupHelper.getAttr('h5.card-title > a', 'href', listings[i]);
      result.url = 'https://flippa.com/' + result.url;
      result.headline = await pupHelper.getTxt('h5.card-title', listings[i]);
      result.type = await pupHelper.getTxt('.d-flex.flex-nowrap.justify-content-between > div:first-child > h6', listings[i]);
      result.monetization = await pupHelper.getTxt('.d-flex.flex-nowrap.justify-content-between > div:nth-child(3) > h6', listings[i]);
      result.netProfit = await pupHelper.getTxt('.d-flex.flex-nowrap.justify-content-between > div:last-child > h6', listings[i]);
      
      result.price = await pupHelper.getTxt('h5.m-0.mt-2', listings[i]);
      result.price = result.price.replace(/\$/gi, '').replace(/\,/gi, '').trim();
      results.push(result);
    }

    await page.close();
    resolve(true);
  } catch (error) {
    if (page) await page.close();
    console.log(`fetchDetails [${pageNumber}] Error: ${error.message}`);
    reject(error.message);
  }
});

const saveResults = () => new Promise(async (resolve, reject) => {
  try {
    for (let i = 0; i < results.length; i++) {
      for (const key in results[i]) {
        results[i][key] = results[i][key].replace(/"/gi, "'");
      }
    }

    const fileName = `results ${moment().format('MM-DD-YYYY HH-mm')}`
    let csv = `"URL","Headline","Sub Headline","Price","Type","Monetization","Net Profit","Revenue","Cash Flow","Description"\r\n`;

    for (let i = 0; i < results.length; i++) {
      csv+= `"${results[i].url ? results[i].url : ''}"`;
      csv+= `,"${results[i].headline ? results[i].headline : ''}"`;
      csv+= `,"${results[i].subHeadline ? results[i].subHeadline : ''}"`;
      csv+= `,"${results[i].price ? results[i].price : ''}"`;
      csv+= `,"${results[i].type ? results[i].type : ''}"`;
      csv+= `,"${results[i].monetization ? results[i].monetization : ''}"`;
      csv+= `,"${results[i].netProfit ? results[i].netProfit : ''}"`;
      csv+= `,"${results[i].revenue ? results[i].revenue : ''}"`;
      csv+= `,"${results[i].cashFlow ? results[i].cashFlow : ''}"`;
      csv+= `,"${results[i].description ? results[i].description : ''}"`;
      csv+= "\r\n";
    }

    fs.writeFileSync(`${fileName}.csv`, csv);

    resolve(true);
  } catch (error) {
    console.log('saveResults Error: ', error.message);
    reject(error);
  }
});

