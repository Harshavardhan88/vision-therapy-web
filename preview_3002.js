const { chromium } = require('playwright');

(async () => {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true
    });
    const page = await context.newPage();

    try {
        // Navigate to home page on port 3002
        console.log('Navigating to home page on http://localhost:3002...');
        await page.goto('http://localhost:3002', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(5000);

        // Capture home page
        await page.screenshot({ path: 'verify_home.png', fullPage: true });
        console.log('✓ Captured home page');

        // Check for common elements
        const title = await page.title();
        console.log(`Page Title: ${title}`);

    } catch (error) {
        console.error('Error during preview capture:', error.message);
    } finally {
        await browser.close();
    }
})();
