export interface Game {
	id: string;
	slug: string;
	nameAr: string;
	nameEn: string;
	taglineAr: string;
	taglineEn: string;
	descriptionAr: string;
	descriptionEn: string;
	icon: string;
	genre: string;
	genreLabelAr: string;
	genreLabelEn: string;
	ageRange: string;
	sessionLength: string;
	modes: string[];
	countries: string[];
	status: 'ready' | 'beta' | 'coming-soon';
	supportedPlatforms: ('desktop' | 'tablet' | 'mobile')[];
	heroImage: string;
	thumbnail: string;
	video: string;
	howToPlayAr: string[];
	howToPlayEn: string[];
	culturalNoteAr: string;
	culturalNoteEn: string;
	metaTitleAr: string;
	metaTitleEn: string;
	metaDescriptionAr: string;
	metaDescriptionEn: string;
}

export interface GamesData {
	$schema: string;
	version: string;
	lastUpdated: string;
	games: Game[];
}

export const MODE_LABELS: Record<string, { ar: string; en: string }> = {
	single: { ar: 'فردي', en: 'Single' },
	local: { ar: 'محلي لاعبان', en: 'Local 2P' },
	online: { ar: 'أونلاين', en: 'Online' },
	async: { ar: 'دور غير متزامن', en: 'Async' },
	daily: { ar: 'تحدي يومي', en: 'Daily' },
	practice: { ar: 'تدريب', en: 'Practice' },
	coop: { ar: 'تعاوني', en: 'Co-op' },
	team: { ar: 'فريق', en: 'Team' }
};

export const COUNTRY_LABELS: Record<string, { ar: string; en: string; flag: string }> = {
	OM: { ar: 'عُمان', en: 'Oman', flag: '🇴🇲' },
	SA: { ar: 'السعودية', en: 'Saudi Arabia', flag: '🇸🇦' },
	AE: { ar: 'الإمارات', en: 'UAE', flag: '🇦🇪' },
	QA: { ar: 'قطر', en: 'Qatar', flag: '🇶🇦' },
	BH: { ar: 'البحرين', en: 'Bahrain', flag: '🇧🇭' },
	KW: { ar: 'الكويت', en: 'Kuwait', flag: '🇰🇼' }
};

export const PLATFORM_LABELS: Record<'desktop' | 'tablet' | 'mobile', { ar: string; icon: string }> = {
	desktop: { ar: 'كمبيوتر', icon: '🖥️' },
	tablet: { ar: 'تابلت', icon: '📱' },
	mobile: { ar: 'جوال', icon: '📲' }
};
