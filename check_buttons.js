const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.goto('http://localhost:3000/therapy', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('button:has-text("Demo Mode")', { timeout: 5000 });
        await page.click('button:has-text("Demo Mode")');
        await page.waitForTimeout(5000);
        
        const buttons = await page.$$eval('button, a, div[role="button"], h3', els => els.map(e => e.innerText));
        console.log("AVAILABLE AFTER DEMO LOGIN:", buttons);
        
        const headings = await page.$$eval('h1, h2, h3', els => els.map(e => e.innerText));
        console.log("HEADINGS:", headings);

    } finally {
        await browser.close();
    }
})();
