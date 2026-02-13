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
        // 1. Navigate to therapy page (will show login modal)
        console.log('Navigating to therapy page...');
        await page.goto('http://localhost:3000/therapy', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);

        // 2. Login via modal
        console.log('Logging in as patient...');

        // Wait for login modal to appear
        await page.waitForSelector('input[type="email"]', { timeout: 5000 });

        await page.fill('input[type="email"]', 'patient@test.com');
        await page.fill('input[type="password"]', 'test123');

        // Take screenshot before clicking sign in
        await page.screenshot({ path: 'login_modal.png' });
        console.log('[OK] Captured login modal');

        await page.click('button:has-text("Sign In")');

        // Wait for login to complete
        await page.waitForTimeout(5000);

        // Capture therapy selection page after login
        await page.screenshot({ path: 'therapy_games_authenticated.png', fullPage: true });
        console.log('[OK] Captured therapy game selection (authenticated)');

        // Try to click on a game to see settings
        try {
            console.log('Attempting to open Balloon Pop settings...');
            const balloonButton = await page.locator('text="Balloon Pop"').first();
            if (await balloonButton.isVisible({ timeout: 2000 })) {
                await balloonButton.click();
                await page.waitForTimeout(2000);
                await page.screenshot({ path: 'balloon_game_settings.png', fullPage: true });
                console.log('[OK] Captured Balloon Pop settings');
            }
        } catch (e) {
            console.log('[SKIP] Could not capture game settings:', e.message);
        }

        console.log('\n=== Authenticated Preview Complete ===');
        console.log('Screenshots saved:');
        console.log('  - login_modal.png');
        console.log('  - therapy_games_authenticated.png');
        console.log('  - balloon_game_settings.png (if available)');

    } catch (error) {
        console.error('[ERROR] Error during preview:', error.message);

        // Take screenshot of current state for debugging
        try {
            await page.screenshot({ path: 'error_state_2.png', fullPage: true });
            console.log('Error screenshot saved to error_state_2.png');
        } catch (e) {
            console.log('Could not capture error screenshot');
        }
    } finally {
        await browser.close();
    }
})();
