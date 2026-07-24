import { test, expect, type Page } from '@playwright/test';

function captureConsoleErrors(page: Page): { errors: string[]; warnings: string[] } {
	const errors: string[] = [];
	const warnings: string[] = [];

	page.on('pageerror', (err) => {
		errors.push(`pageerror: ${err.message}`);
	});

	page.on('console', (msg) => {
		const text = msg.text();
		if (msg.type() === 'error') {
			errors.push(`console.error: ${text}`);
		} else if (msg.type() === 'warning') {
			warnings.push(`console.warn: ${text}`);
		}
	});

	return { errors, warnings };
}

test.describe('game smoke tests', () => {
	test('Fort Battle loads without console errors', async ({ page }) => {
		const { errors, warnings } = captureConsoleErrors(page);

		await page.goto('/play/archery');

		// Wait for the page title and game header to render.
		await expect(page).toHaveTitle(/معركة القلاع/);
		await expect(page.getByRole('heading', { name: 'معركة القلاع', exact: true })).toBeVisible();

		// Wait for the Babylon.js canvas and the mode picker to be ready.
		const canvas = page.locator('canvas');
		await expect(canvas).toBeAttached();
		await expect(canvas).toBeVisible();
		await expect(page.getByRole('button', { name: /ضد الكمبيوتر/ })).toBeVisible();

		// Give async game initialization a moment to finish.
		await page.waitForTimeout(2500);

		expect(errors, `Unexpected console/page errors: ${errors.join('\n')}`).toHaveLength(0);
		// Warnings are informational for now; fail only on errors.
		console.log('Console warnings:', warnings);
	});

	test('Fort Battle single-player vs AI starts and the AI takes its turn', async ({ page }) => {
		const { errors } = captureConsoleErrors(page);

		await page.goto('/play/archery');

		// Wait for the mode picker before interacting.
		await expect(page.getByRole('button', { name: /ضد الكمبيوتر/ })).toBeVisible();

		// Pick "vs AI" mode on easy difficulty.
		await page.getByRole('button', { name: /ضد الكمبيوتر/ }).click();
		await page.getByRole('button', { name: 'سهل' }).click();

		// The HUD should appear once the game starts.
		await expect(page.getByText('قلعتك')).toBeVisible();
		await expect(page.getByText('قلعة الكمبيوتر')).toBeVisible();

		// Fire a quick low-power shot so the turn passes to the AI.
		const canvas = page.locator('canvas');
		await expect(canvas).toBeVisible();
		const box = await canvas.boundingBox();
		if (!box) throw new Error('canvas has no bounding box');
		const cx = box.x + box.width / 2;
		const cy = box.y + box.height / 2;
		await page.mouse.move(cx, cy - 100);
		await page.mouse.down();
		await page.waitForTimeout(200);
		await page.mouse.up();

		// The AI should take over: the turn indicator shows "الكمبيوتر".
		await expect(page.getByText('الكمبيوتر', { exact: true })).toBeVisible({ timeout: 15000 });

		// Let the AI aim, charge, and fire.
		await page.waitForTimeout(6000);

		expect(errors, `Unexpected console/page errors: ${errors.join('\n')}`).toHaveLength(0);
	});

	test('Souq al-Khaleej loads and starts a level without console errors', async ({ page }) => {
		const { errors, warnings } = captureConsoleErrors(page);

		await page.goto('/play/souq-manager');

		// Wait for the page title and game header to render.
		await expect(page).toHaveTitle(/سوق الخليج/);
		await expect(page.getByRole('heading', { name: 'سوق الخليج', exact: true })).toBeVisible();

		// Wait for the Babylon.js canvas and the level picker to be ready.
		const canvas = page.locator('canvas');
		await expect(canvas).toBeAttached();
		await expect(canvas).toBeVisible();
		await expect(page.locator('[data-level="1"]')).toBeVisible();

		// Start level 1.
		await page.locator('[data-level="1"]').click();

		// The HUD should appear once the level starts.
		await expect(page.getByText('الهدف')).toBeVisible();
		await expect(page.getByText('الوقت')).toBeVisible();
		await expect(page.getByText('الرصيد')).toBeVisible();

		// Give async game initialization a moment to finish.
		await page.waitForTimeout(2500);

		expect(errors, `Unexpected console/page errors: ${errors.join('\n')}`).toHaveLength(0);
		console.log('Console warnings:', warnings);
	});
});
