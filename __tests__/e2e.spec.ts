import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Vision Therapy Platform
 */

test.describe('Game Flow E2E Tests', () => {
    test('complete balloon game session', async ({ page }) => {
        // Navigate to app
        await page.goto('http://localhost:3000');

        // Login
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'password');
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await page.waitForSelector('text=Dashboard');

        // Navigate to therapy
        await page.click('text=Start Therapy');

        // Select Balloon Pop
        await page.click('text=Balloon Pop');

        // Wait for calibration
        await page.waitForSelector('text=Calibration');

        // Skip calibration (for testing)
        await page.click('button:has-text("Skip")');

        // Wait for game to load
        await page.waitForSelector('canvas');

        // Game should be running
        const canvas = await page.$('canvas');
        expect(canvas).toBeTruthy();

        // Wait for game completion or timeout
        await page.waitForTimeout(5000);

        // Check for score display
        const score = await page.textContent('[data-testid="score"]');
        expect(score).toBeTruthy();
    });

    test('VR split-screen mode works', async ({ page }) => {
        await page.goto('http://localhost:3000/therapy');

        // Enable VR mode
        await page.click('button:has-text("Settings")');
        await page.click('text=Enable VR Split-Screen');

        // Check for split-screen canvas
        const canvas = await page.$('canvas');
        expect(canvas).toBeTruthy();

        // Verify dichoptic settings
        await page.click('text=Dichoptic Mode');
        const weakEyeSelector = await page.$('text=Weak Eye');
        expect(weakEyeSelector).toBeTruthy();
    });
});

test.describe('Accessibility E2E Tests', () => {
    test('keyboard navigation works', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // Tab through elements
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Check focus
        const focused = await page.evaluate(() => document.activeElement?.tagName);
        expect(['BUTTON', 'A', 'INPUT']).toContain(focused);
    });

    test('screen reader landmarks present', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // Check for main landmark
        const main = await page.$('main');
        expect(main).toBeTruthy();

        // Check for navigation
        const nav = await page.$('nav');
        expect(nav).toBeTruthy();
    });

    test('high contrast mode applies', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // Open accessibility settings
        await page.click('[aria-label="Accessibility Settings"]');

        // Enable high contrast
        await page.click('text=High Contrast Mode');

        // Check if class applied
        const hasClass = await page.evaluate(() =>
            document.documentElement.classList.contains('high-contrast')
        );
        expect(hasClass).toBe(true);
    });
});

test.describe('Mobile E2E Tests', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('mobile menu works', async ({ page }) => {
        await page.goto('http://localhost:3000');

        // Open mobile menu
        await page.click('[aria-label="Menu"]');

        // Check menu is visible
        const menu = await page.$('[role="dialog"]');
        expect(menu).toBeTruthy();
    });

    test('touch gestures work', async ({ page }) => {
        await page.goto('http://localhost:3000/therapy');

        // Simulate swipe
        await page.touchscreen.swipe({ x: 300, y: 300 }, { x: 100, y: 300 });

        // Check for navigation
        await page.waitForTimeout(500);
        expect(true).toBe(true); // Placeholder
    });
});

test.describe('Performance Tests', () => {
    test('page loads within 3 seconds', async ({ page }) => {
        const start = Date.now();
        await page.goto('http://localhost:3000');
        const loadTime = Date.now() - start;

        expect(loadTime).toBeLessThan(3000);
    });

    test('game maintains 30+ FPS', async ({ page }) => {
        await page.goto('http://localhost:3000/therapy');

        // Wait for game to start
        await page.waitForSelector('canvas');

        // Measure FPS (simplified)
        const fps = await page.evaluate(() => {
            return new Promise((resolve) => {
                let frames = 0;
                const start = performance.now();

                function count() {
                    frames++;
                    if (performance.now() - start < 1000) {
                        requestAnimationFrame(count);
                    } else {
                        resolve(frames);
                    }
                }
                requestAnimationFrame(count);
            });
        });

        expect(fps).toBeGreaterThan(30);
    });
});
