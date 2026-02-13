const { chromium } = require('playwright');

(async () => {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }, // Wider viewport for split-screen
        ignoreHTTPSErrors: true
    });
    const page = await context.newPage();

    try {
        // 1. Navigate to therapy page
        console.log('Navigating to therapy page...');
        await page.goto('http://localhost:3000/therapy', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);

        // 2. Login
        console.log('Logging in as patient...');
        await page.waitForSelector('input[type="email"]', { timeout: 5000 });
        await page.fill('input[type="email"]', 'patient@test.com');
        await page.fill('input[type="password"]', 'test123');
        await page.click('button:has-text("Sign In")');
        await page.waitForTimeout(5000);

        // 3. Click on Balloon Pop game
        console.log('Opening Balloon Pop game...');
        const balloonButton = await page.locator('text="Balloon Pop"').first();
        if (await balloonButton.isVisible({ timeout: 3000 })) {
            await balloonButton.click();
            await page.waitForTimeout(2000);

            // Capture game settings page
            await page.screenshot({ path: 'balloon_settings.png', fullPage: true });
            console.log('[OK] Captured game settings');

            // 4. Make sure dichoptic mode is enabled (it should be by default)
            // Look for the "Start Therapy Session" button
            const startButton = await page.locator('button:has-text("Start")').first();
            if (await startButton.isVisible({ timeout: 2000 })) {
                await startButton.click();
                console.log('[OK] Started therapy session');

                // Wait for game to load
                await page.waitForTimeout(5000);

                // Capture VR split-screen view
                await page.screenshot({ path: 'vr_split_screen.png', fullPage: false });
                console.log('[OK] Captured VR split-screen view');

                // Wait a bit more to capture gameplay
                await page.waitForTimeout(3000);
                await page.screenshot({ path: 'vr_gameplay.png', fullPage: false });
                console.log('[OK] Captured VR gameplay');
            }
        }

        console.log('\n=== VR Split-Screen Preview Complete ===');
        console.log('Screenshots saved:');
        console.log('  - balloon_settings.png');
        console.log('  - vr_split_screen.png');
        console.log('  - vr_gameplay.png');

    } catch (error) {
        console.error('[ERROR] Error during preview:', error.message);

        try {
            await page.screenshot({ path: 'vr_error_state.png', fullPage: true });
            console.log('Error screenshot saved to vr_error_state.png');
        } catch (e) {
            console.log('Could not capture error screenshot');
        }
    } finally {
        await browser.close();
    }
})();
