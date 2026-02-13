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
        // Navigate to home page
        console.log('Navigating to home page...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);

        // Capture home page
        await page.screenshot({ path: 'home_page.png', fullPage: true });
        console.log('✓ Captured home page');

        // Check if login page
        const hasLogin = await page.locator('input[type="email"], input[type="password"]').count() > 0;

        if (hasLogin) {
            console.log('Login page detected');
            await page.screenshot({ path: 'login_page.png' });
            console.log('✓ Captured login page');
        }

        // Try to navigate to therapy page
        try {
            console.log('Attempting to navigate to therapy selection...');
            await page.goto('http://localhost:3000/therapy', { waitUntil: 'networkidle', timeout: 10000 });
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'therapy_selection.png', fullPage: true });
            console.log('✓ Captured therapy selection page');
        } catch (e) {
            console.log('Could not access therapy page (may require auth)');
        }

        // Try to navigate to dashboard
        try {
            console.log('Attempting to navigate to dashboard...');
            await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle', timeout: 10000 });
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'dashboard.png', fullPage: true });
            console.log('✓ Captured dashboard page');
        } catch (e) {
            console.log('Could not access dashboard (may require auth)');
        }

        console.log('\n=== Preview Capture Complete ===');
        console.log('Screenshots saved to current directory');

    } catch (error) {
        console.error('Error during preview capture:', error.message);
    } finally {
        await browser.close();
    }
})();
