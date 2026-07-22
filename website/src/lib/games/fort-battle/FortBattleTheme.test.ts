import { describe, it, expect } from 'vitest';
import { GCC_FORT_THEMES, getThemeByCountry, pickRandomTheme, type FortTheme } from './FortBattleTheme';

describe('FortBattleTheme', () => {
	it('has exactly one theme per GCC country', () => {
		expect(GCC_FORT_THEMES).toHaveLength(6);
		const codes = GCC_FORT_THEMES.map((t) => t.countryCode);
		expect(new Set(codes).size).toBe(codes.length);
		expect(codes.sort()).toEqual(['AE', 'BH', 'KW', 'OM', 'QA', 'SA']);
	});

	it('every theme has required fields and valid RGB values', () => {
		const requiredColors: (keyof FortTheme)[] = [
			'fortBody',
			'fortRoof',
			'accent',
			'ground',
			'sky',
			'rock',
			'trunk',
			'frond',
			'mountain'
		];
		for (const theme of GCC_FORT_THEMES) {
			expect(theme.nameAr).toBeTruthy();
			expect(theme.nameEn).toBeTruthy();
			expect(theme.roofStyle).toBeTruthy();
			for (const key of requiredColors) {
				const { r, g, b } = theme[key] as { r: number; g: number; b: number };
				expect(r).toBeGreaterThanOrEqual(0);
				expect(r).toBeLessThanOrEqual(1);
				expect(g).toBeGreaterThanOrEqual(0);
				expect(g).toBeLessThanOrEqual(1);
				expect(b).toBeGreaterThanOrEqual(0);
				expect(b).toBeLessThanOrEqual(1);
			}
		}
	});

	it('returns a theme by country code', () => {
		expect(getThemeByCountry('OM')?.nameEn).toBe('Oman');
		expect(getThemeByCountry('SA')?.nameAr).toBe('السعودية');
		expect(getThemeByCountry('XX')).toBeUndefined();
	});

	it('pickRandomTheme returns a valid theme', () => {
		const theme = pickRandomTheme(() => 0.5);
		expect(GCC_FORT_THEMES).toContain(theme);
	});
});
