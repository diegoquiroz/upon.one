const puppeteer = require('puppeteer')

async function ssr(url, browserWSEndpoint,sub) {
    
    console.info('Connecting to existing Chrome instance.');
    const browser = await puppeteer.connect({browserWSEndpoint});
  
    const page = await browser.newPage();

    await page.setRequestInterception(true);

    page.on('request', req => {
      // 2. Ignore requests for resources that don't produce DOM

      // (images, stylesheets, media).

      let noWhiteList = false

      const whitelist = ['document', 'script', 'xhr', 'fetch'];
      const allImageLoadForTheseDomain = ['roastagram'];

      if (!whitelist.includes(req.resourceType()) && !allImageLoadForTheseDomain.includes(sub) ) {
        return req.abort();
      }
      

      //don't load google analytics as it will intefere with actual statistics
      const blacklist = ['www.google-analytics.com', '/gtag/js', 'ga.js', 'analytics.js'];
      if (blacklist.find(regex => req.url().match(regex))) {
        return req.abort();
      }
  
      // 3. Pass through all other requests.
      req.continue();
    });


    await page.goto(url, {waitUntil: 'networkidle0'});
    const html = await page.content(); // serialized HTML of page DOM.

    await page.close(); // Close the page we opened here (not the browser).
  
    return {html};
}


module.exports = ssr