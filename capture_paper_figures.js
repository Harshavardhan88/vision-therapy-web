const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\HARSHAVARDHAN\\.gemini\\antigravity\\brain\\2626a77b-3011-4973-9d4c-b12ab19e8c71\\';

(async () => {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    
    try {
        // --- Capture Fig 3: Clinician Dashboard ---
        console.log('--- Capturing Clinician Dashboard (Fig 3) ---');
        const contextDash = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const pageDash = await contextDash.newPage();
        await pageDash.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await pageDash.waitForTimeout(4000); // Allow data/charts to load
        
        const fig3Path = path.join(ARTIFACT_DIR, 'fig3_clinician_dashboard.png');
        await pageDash.screenshot({ path: fig3Path, fullPage: true });
        console.log('[OK] Captured Clinician Dashboard ->', fig3Path);
        await contextDash.close();

        // --- Capture Fig 1: VR Therapy View ---
        console.log('--- Capturing VR Therapy View (Fig 1) ---');
        const contextVR = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
        const pageVR = await contextVR.newPage();
        await pageVR.goto('http://localhost:3000/therapy', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await pageVR.waitForTimeout(3000);
        
        // Wait for login modal and login
        await pageVR.waitForSelector('input[type="email"]', { timeout: 5000 });
        await pageVR.fill('input[type="email"]', 'patient@test.com');
        await pageVR.fill('input[type="password"]', 'test123');
        await pageVR.click('button:has-text("Sign In")');

        await pageVR.waitForTimeout(5000); // Wait for auth and redirect

        // Click Balloon Pop game
        await pageVR.screenshot({ path: path.join(ARTIFACT_DIR, 'debug_therapy_page.png'), fullPage: true });
        const balloonButton = await pageVR.locator('text="Balloon Pop"').first();
        if (await balloonButton.isVisible({ timeout: 5000 })) {
            await balloonButton.click();
            await pageVR.waitForTimeout(2000);

            // Click start therapy session
            const startButton = await pageVR.locator('button:has-text("Start")').first();
            if (await startButton.isVisible({ timeout: 2000 })) {
                await startButton.click();
                await pageVR.waitForTimeout(5000); // wait for game to render

                const fig1Path = path.join(ARTIFACT_DIR, 'fig1_vr_split_screen.png');
                await pageVR.screenshot({ path: fig1Path, fullPage: false });
                console.log('[OK] Captured VR Therapy View ->', fig1Path);
            } else {
                console.log('[ERROR] Start therapy button not found.');
            }
        } else {
            console.log('[ERROR] Balloon Pop game button not found.');
        }
        await contextVR.close();

    } catch (error) {
        console.error('[ERROR] Error during capture:', error.message);
    } finally {
        await browser.close();
        console.log('Done.');
    }
})();
