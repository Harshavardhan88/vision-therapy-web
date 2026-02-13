const { chromium } = require('playwright');
const path = require('path');

(async () => {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true }); // Run headless
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true
    });
    const page = await context.newPage();

    // 0. Authenticate
    console.log('Authenticating...');
    const token = 'mock_token_' + Date.now();

    await context.addInitScript((token) => {
        localStorage.setItem('token', token);
        document.cookie = `auth_token=${token}; path=/;`;
    }, token);

    await context.addCookies([{
        name: 'auth_token',
        value: token,
        domain: 'localhost',
        path: '/'
    }]);

    // 1. Navigate to Therapy Page
    console.log('Navigating to Therapy Selection...');
    await page.goto('http://localhost:3000/therapy', { waitUntil: 'networkidle' });

    // 2. Select Balloon Game
    console.log('Starting Balloon Game Settings...');
    await page.click('text="Balloon Pop"');

    // Wait for settings UI
    await page.waitForTimeout(1000);

    // Capture Settings UI
    await page.screenshot({ path: '.gemini/antigravity/brain/a0c6dd06-ba59-4519-9642-de40956a1bb9/balloon_settings_ui.png' });
    console.log('Captured Settings UI');

    // 3. Enable Dichoptic Mode (SKIPPED - Default Enabled for Verification)
    console.log('Dichoptic Mode enabled by default...');
    // const toggleButton = page.locator('div[class*="bg-slate-800/50"] button');
    // await toggleButton.click(); 

    // 4. Start Game
    console.log('Starting Game...');
    await page.click('text="Start Therapy Session"');

    // Wait for game to load
    await page.waitForTimeout(3000);

    // Capture Gameplay
    console.log('Capturing Dichoptic Gameplay...');
    await page.screenshot({ path: '.gemini/antigravity/brain/a0c6dd06-ba59-4519-9642-de40956a1bb9/balloon_dichoptic_running.png' });

    await browser.close();
    console.log('Done.');
})();
