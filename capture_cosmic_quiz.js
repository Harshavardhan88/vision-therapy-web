const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('Launching browser...');
    const browser = await chromium.launch({
        headless: true, // Headless for speed
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        // Grant permissions for device orientation if possible (though Playwright support is limited)
        permissions: ['accelerometer', 'gyroscope', 'magnetometer']
    });
    const page = await context.newPage();

    try {
        // 1. Login
        console.log('Navigating to login...');
        await page.goto('http://localhost:3000/login');
        await page.fill('input[type="email"]', 'patient@test.com');
        await page.fill('input[type="password"]', 'test123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard/patient');

        // 2. Go to Therapy Page
        console.log('Navigating to therapy page...');
        await page.goto('http://localhost:3000/therapy');

        // 3. Select Cosmic Quiz
        // Wait for game cards to load
        await page.waitForSelector('text=Cosmic Quiz', { timeout: 10000 });
        console.log('Selecting Cosmic Quiz...');
        await page.click('text=Cosmic Quiz');

        // 4. Wait for Game to Load
        // Look for "COSMIC QUIZ ACTIVE" or specific game element
        await page.waitForTimeout(3000);

        // 5. Capture Screenshot
        const artifactsDir = 'C:\\Users\\HARSHAVARDHAN\\.gemini\\antigravity\\brain\\34c24f1c-d442-416a-8d81-41e392f44a5e';
        const screenshotPath = path.join(artifactsDir, 'cosmic_quiz_preview.png');

        console.log(`Saving screenshot to: ${screenshotPath}`);
        await page.screenshot({ path: screenshotPath });

        console.log('=== Cosmic Quiz Preview Complete ===');

    } catch (error) {
        console.error('Error during capture:', error);
    } finally {
        await browser.close();
    }
})();
