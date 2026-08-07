export interface RGB {
	r: number;
	g: number;
	b: number;
}

export type RoofStyle = 'cone' | 'crenellated' | 'dome' | 'flat' | 'stepped';

export interface FortTheme {
	countryCode: string;
	nameAr: string;
	nameEn: string;
	roofStyle: RoofStyle;
	fortBody: RGB;
	fortRoof: RGB;
	accent: RGB;
	ground: RGB;
	sky: RGB;
	rock: RGB;
	trunk: RGB;
	frond: RGB;
	mountain: RGB;
}

function c(r: number, g: number, b: number): RGB {
	return { r, g, b };
}

export const GCC_FORT_THEMES: readonly FortTheme[] = [
	{
		countryCode: 'OM',
		nameAr: 'عُمان',
		nameEn: 'Oman',
		roofStyle: 'cone',
		fortBody: c(0.76, 0.48, 0.34),
		fortRoof: c(0.55, 0.34, 0.24),
		accent: c(0.93, 0.88, 0.72),
		ground: c(0.82, 0.72, 0.52),
		sky: c(0.52, 0.8, 0.92),
		rock: c(0.55, 0.5, 0.45),
		trunk: c(0.55, 0.4, 0.26),
		frond: c(0.32, 0.58, 0.24),
		mountain: c(0.62, 0.55, 0.46)
	},
	{
		countryCode: 'SA',
		nameAr: 'السعودية',
		nameEn: 'Saudi Arabia',
		roofStyle: 'crenellated',
		fortBody: c(0.78, 0.52, 0.36),
		fortRoof: c(0.58, 0.38, 0.26),
		accent: c(0.92, 0.85, 0.7),
		ground: c(0.82, 0.7, 0.48),
		sky: c(0.55, 0.78, 0.9),
		rock: c(0.6, 0.52, 0.44),
		trunk: c(0.55, 0.4, 0.26),
		frond: c(0.28, 0.55, 0.22),
		mountain: c(0.65, 0.56, 0.45)
	},
	{
		countryCode: 'AE',
		nameAr: 'الإمارات',
		nameEn: 'UAE',
		roofStyle: 'dome',
		fortBody: c(0.83, 0.72, 0.58),
		fortRoof: c(0.66, 0.55, 0.42),
		accent: c(0.95, 0.9, 0.78),
		ground: c(0.86, 0.76, 0.58),
		sky: c(0.5, 0.76, 0.92),
		rock: c(0.58, 0.52, 0.45),
		trunk: c(0.55, 0.42, 0.28),
		frond: c(0.34, 0.6, 0.24),
		mountain: c(0.6, 0.55, 0.48)
	},
	{
		countryCode: 'QA',
		nameAr: 'قطر',
		nameEn: 'Qatar',
		roofStyle: 'stepped',
		fortBody: c(0.72, 0.56, 0.46),
		fortRoof: c(0.55, 0.4, 0.32),
		accent: c(0.9, 0.84, 0.7),
		ground: c(0.82, 0.72, 0.54),
		sky: c(0.52, 0.78, 0.92),
		rock: c(0.56, 0.5, 0.44),
		trunk: c(0.52, 0.38, 0.25),
		frond: c(0.3, 0.56, 0.22),
		mountain: c(0.58, 0.52, 0.45)
	},
	{
		countryCode: 'BH',
		nameAr: 'البحرين',
		nameEn: 'Bahrain',
		roofStyle: 'flat',
		fortBody: c(0.82, 0.74, 0.64),
		fortRoof: c(0.64, 0.56, 0.48),
		accent: c(0.95, 0.92, 0.82),
		ground: c(0.85, 0.78, 0.62),
		sky: c(0.55, 0.8, 0.92),
		rock: c(0.6, 0.55, 0.48),
		trunk: c(0.55, 0.42, 0.28),
		frond: c(0.35, 0.62, 0.25),
		mountain: c(0.62, 0.58, 0.5)
	},
	{
		countryCode: 'KW',
		nameAr: 'الكويت',
		nameEn: 'Kuwait',
		roofStyle: 'cone',
		fortBody: c(0.76, 0.4, 0.32),
		fortRoof: c(0.58, 0.3, 0.24),
		accent: c(0.92, 0.86, 0.7),
		ground: c(0.82, 0.7, 0.5),
		sky: c(0.52, 0.8, 0.92),
		rock: c(0.6, 0.52, 0.45),
		trunk: c(0.55, 0.4, 0.26),
		frond: c(0.32, 0.58, 0.24),
		mountain: c(0.65, 0.55, 0.48)
	}
];

const THEMES_BY_CODE = new Map(GCC_FORT_THEMES.map((t) => [t.countryCode, t]));

export function getThemeByCountry(code: string): FortTheme | undefined {
	return THEMES_BY_CODE.get(code);
}

export function pickRandomTheme(rng: () => number = Math.random): FortTheme {
	const index = Math.floor(rng() * GCC_FORT_THEMES.length);
	return GCC_FORT_THEMES[index];
}
