const puppeteer = require('puppeteer');
const path = require('path');

async function capturePreview() {
    console.log('🚀 Starting Depth Reach VR preview capture...');

    let browser;
    try {
        // Launch browser
        browser = await puppeteer.launch({
            headless: false, // Show browser so you can see what's happening
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        console.log('📱 Navigating to game page...');
        await page.goto('http://localhost:3000/dashboard/patient/games/balloon-pop', {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        // Screenshot 1: Settings page
        console.log('📸 Capturing settings page...');
        await page.screenshot({
            path: path.join(__dirname, 'preview_1_settings.png'),
            fullPage: true
        });

        // Click the "ENTER VR THERAPY" button
        console.log('🎮 Clicking ENTER VR THERAPY button...');
        await page.waitForSelector('button', { timeout: 5000 });
        const buttons = await page.$$('button');
        // Find the button with "ENTER VR THERAPY" text
        for (const button of buttons) {
            const text = await page.evaluate(el => el.textContent, button);
            if (text.includes('ENTER VR THERAPY')) {
                await button.click();
                break;
            }
        }

        // Wait for game to load and switch to preview mode
        console.log('⏳ Waiting for preview mode to activate...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Screenshot 2: Preview mode activated
        console.log('📸 Capturing preview mode...');
        await page.screenshot({
            path: path.join(__dirname, 'preview_2_game_loaded.png'),
            fullPage: true
        });

        // Wait for targets to spawn
        console.log('⏳ Waiting for targets to spawn...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Screenshot 3: Targets visible
        console.log('📸 Capturing targets...');
        await page.screenshot({
            path: path.join(__dirname, 'preview_3_targets.png'),
            fullPage: true
        });

        // Try to click on a target (click in the center of the canvas)
        console.log('🎯 Attempting to click a target...');
        const canvas = await page.$('canvas');
        if (canvas) {
            const box = await canvas.boundingBox();
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Screenshot 4: After clicking
            console.log('📸 Capturing after click...');
            await page.screenshot({
                path: path.join(__dirname, 'preview_4_after_click.png'),
                fullPage: true
            });
        }

        console.log('✅ Preview capture complete!');
        console.log('📁 Screenshots saved to:');
        console.log('   - preview_1_settings.png');
        console.log('   - preview_2_game_loaded.png');
        console.log('   - preview_3_targets.png');
        console.log('   - preview_4_after_click.png');

    } catch (error) {
        console.error('❌ Error capturing preview:', error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the capture
capturePreview().catch(console.error);
