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
		await expect(page.getByRole('heading', { name: /معركة القلاع/ })).toBeVisible();

		// Wait for the Babylon.js canvas to be attached.
		const canvas = page.locator('canvas');
		await expect(canvas).toBeAttached();
		await expect(canvas).toBeVisible();

		// Give async game initialization a moment to finish.
		await page.waitForTimeout(2500);

		expect(errors, `Unexpected console/page errors: ${errors.join('\n')}`).toHaveLength(0);
		// Warnings are informational for now; fail only on errors.
		console.log('Console warnings:', warnings);
	});
});
