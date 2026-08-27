export type NumberVaultPhase = 'menu' | 'playing' | 'result';

export type PuzzleType = 'place-value' | 'order' | 'round' | 'sequence';

export interface NumberVaultPuzzle {
	type: PuzzleType;
	promptAr: string;
	promptEn: string;
	answer: number | number[];
	options?: number[];
	hintAr: string;
	hintEn: string;
	placeValueDigits?: number;
}

export interface NumberVaultState {
	phase: NumberVaultPhase;
	level: number;
	score: number;
	stars: number;
	doorsSolved: number;
	totalDoors: number;
	currentPuzzle: NumberVaultPuzzle | null;
	feedback: 'none' | 'correct' | 'incorrect';
	feedbackMessage: string;
	retries: number;
	maxRetries: number;
	completed: boolean;
}

export interface NumberVaultLevelConfig {
	level: number;
	doors: number;
	digitRange: [number, number];
	puzzleTypes: PuzzleType[];
	roundingPlaces?: (10 | 100 | 1000 | 10000)[];
	sequenceTypes?: ('add' | 'subtract' | 'multiple')[];
}

export const NUMBER_VAULT_LEVELS: NumberVaultLevelConfig[] = [
	{
		level: 1,
		doors: 5,
		digitRange: [3, 4],
		puzzleTypes: ['place-value']
	},
	{
		level: 2,
		doors: 5,
		digitRange: [4, 5],
		puzzleTypes: ['place-value', 'order']
	},
	{
		level: 3,
		doors: 5,
		digitRange: [5, 6],
		puzzleTypes: ['place-value', 'order', 'round'],
		roundingPlaces: [10, 100, 1000]
	},
	{
		level: 4,
		doors: 5,
		digitRange: [5, 6],
		puzzleTypes: ['order', 'round', 'sequence'],
		roundingPlaces: [100, 1000, 10000],
		sequenceTypes: ['add', 'subtract']
	},
	{
		level: 5,
		doors: 5,
		digitRange: [5, 6],
		puzzleTypes: ['place-value', 'order', 'round', 'sequence'],
		roundingPlaces: [10, 100, 1000, 10000],
		sequenceTypes: ['add', 'subtract', 'multiple']
	}
];

function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(array: T[]): T[] {
	const copy = [...array];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

export function numberToArabicWords(n: number): string {
	// Simplified Arabic number-to-words for place-value prompts.
	// Full implementation can be swapped in later; this covers the core cases.
	const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
	const teens = [
		'عشرة',
		'أحد عشر',
		'اثنا عشر',
		'ثلاثة عشر',
		'أربعة عشر',
		'خمسة عشر',
		'ستة عشر',
		'سبعة عشر',
		'ثمانية عشر',
		'تسعة عشر'
	];
	const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
	const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

	if (n === 0) return 'صفر';
	if (n < 10) return ones[n];
	if (n < 20) return teens[n - 10];
	if (n < 100) {
		const t = Math.floor(n / 10);
		const o = n % 10;
		return o === 0 ? tens[t] : `${ones[o]} و${tens[t]}`;
	}
	if (n < 1000) {
		const h = Math.floor(n / 100);
		const r = n % 100;
		if (r === 0) return hundreds[h];
		return `${hundreds[h]} و${numberToArabicWords(r)}`;
	}

	const parts: string[] = [];
	let remaining = n;

	const millions = Math.floor(remaining / 1_000_000);
	remaining %= 1_000_000;
	if (millions > 0) {
		parts.push(`${numberToArabicWords(millions)} مليون`);
	}

	const thousands = Math.floor(remaining / 1_000);
	remaining %= 1_000;
	if (thousands > 0) {
		parts.push(`${numberToArabicWords(thousands)} ألف`);
	}

	if (remaining > 0) {
		parts.push(numberToArabicWords(remaining));
	}

	return parts.join(' و');
}

export function generateNumber(digits: number): number {
	const min = 10 ** (digits - 1);
	const max = 10 ** digits - 1;
	return randomInt(min, max);
}

export function generatePlaceValuePuzzle(digits: number): NumberVaultPuzzle {
	const number = generateNumber(digits);
	const digitsArray = number.toString().split('').map(Number);
	const position = randomInt(0, digitsArray.length - 1);
	const placeNamesAr = ['آحاد', 'عشرات', 'مئات', 'آلاف', 'عشرات الآلاف', 'مئات الآلاف'];
	const placeNameAr = placeNamesAr[digitsArray.length - 1 - position] ?? '';
	const digit = digitsArray[position];

	return {
		type: 'place-value',
		promptAr: `انظر إلى العدد ${number.toLocaleString('en')}. ما الرقم في خانة ${placeNameAr}؟`,
		promptEn: `Look at the number ${number.toLocaleString('en')}. What is the digit in the ${placeNameAr} place?`,
		answer: digit,
		options: shuffle([digit, ...Array.from({ length: 3 }, () => randomInt(0, 9)).filter((d) => d !== digit)]).slice(0, 4),
		hintAr: `العدد مكوّن من ${digits} أرقام. ابحث عن خانة ${placeNameAr} من اليمين.`,
		hintEn: `The number has ${digits} digits. Find the ${placeNameAr} place from the right.`,
		placeValueDigits: digits
	};
}

export function generateOrderPuzzle(digits: number): NumberVaultPuzzle {
	const count = randomInt(3, 5);
	const numbers = Array.from({ length: count }, () => generateNumber(digits));
	const sorted = [...numbers].sort((a, b) => a - b);
	const isAscending = Math.random() > 0.5;
	const answer = isAscending ? sorted : sorted.reverse();

	return {
		type: 'order',
		promptAr: `رتّب هذه الأعداد ${isAscending ? 'تصاعدياً' : 'تنازلياً'}: ${numbers.map((n) => n.toLocaleString('en')).join('، ')}.`,
		promptEn: `Arrange these numbers in ${isAscending ? 'ascending' : 'descending'} order: ${numbers.map((n) => n.toLocaleString('en')).join(', ')}.`,
		answer,
		options: [...numbers],
		hintAr: `قارن الأعداد من اليسار إلى اليمين، ثم ضع الأصغر ${isAscending ? 'أولاً' : 'آخراً'}.`,
		hintEn: `Compare the numbers from left to right, then place the smallest ${isAscending ? 'first' : 'last'}.`,
		placeValueDigits: digits
	};
}

export function generateRoundPuzzle(
	digits: number,
	places: (10 | 100 | 1000 | 10000)[]
): NumberVaultPuzzle {
	const number = generateNumber(digits);
	const place = places[randomInt(0, places.length - 1)];
	const rounded = Math.round(number / place) * place;

	const placeNameAr: Record<number, string> = {
		10: 'أقرب عشرة',
		100: 'أقرب مائة',
		1000: 'أقرب ألف',
		10000: 'أقرب عشرة آلاف'
	};

	const options = shuffle([
		rounded,
		rounded + place,
		rounded - place,
		rounded + (Math.random() > 0.5 ? place / 2 : -(place / 2))
	]);

	return {
		type: 'round',
		promptAr: `قَرِّب العدد ${number.toLocaleString('en')} إلى ${placeNameAr[place]}.`,
		promptEn: `Round ${number.toLocaleString('en')} to the nearest ${placeNameAr[place]}.`,
		answer: rounded,
		options,
		hintAr: `ابحث عن أقرب حد للعدد ${placeNameAr[place]}، ثم قرّب حسب المنتصف.`,
		hintEn: `Find the nearest ${placeNameAr[place]} boundary, then round based on the midpoint.`,
		placeValueDigits: digits
	};
}

export function generateSequencePuzzle(
	digits: number,
	types: ('add' | 'subtract' | 'multiple')[]
): NumberVaultPuzzle {
	const type = types[randomInt(0, types.length - 1)];
	const maxStart = 10 ** (digits - 1);
	const start = randomInt(1, maxStart);

	let step: number;
	let sequence: number[];
	let answer: number;

	if (type === 'add') {
		step = randomInt(2, 9) * 10 ** randomInt(0, Math.min(2, digits - 1));
		sequence = [start, start + step, start + step * 2, start + step * 3];
		answer = start + step * 4;
	} else if (type === 'subtract') {
		step = randomInt(2, 9) * 10 ** randomInt(0, Math.min(2, digits - 1));
		sequence = [start + step * 4, start + step * 3, start + step * 2, start + step];
		answer = start;
	} else {
		step = randomInt(2, 9);
		sequence = [start, start * step, start * step * 2, start * step * 3];
		answer = start * step * 4;
	}

	return {
		type: 'sequence',
		promptAr: `أكمل المتتالية: ${sequence.map((n) => n.toLocaleString('en')).join('، ')}، ؟`,
		promptEn: `Complete the sequence: ${sequence.map((n) => n.toLocaleString('en')).join(', ')}, ?`,
		answer,
		options: shuffle([answer, answer + step, answer - step, answer + step * 2]),
		hintAr: type === 'multiple' ? 'ابحث عن العملية التي تربط كل عدد بالعدد الذي يليه.' : 'احسب الفرق بين كل عددين متتاليين.',
		hintEn:
			type === 'multiple'
				? 'Find the operation that links each number to the next.'
				: 'Calculate the difference between each pair of consecutive numbers.',
		placeValueDigits: digits
	};
}

export interface NumberVaultCallbacks {
	onDoorSolved?: () => void;
	onLevelComplete?: (stars: number) => void;
}

export class NumberVaultLogic {
	private onChange: (state: NumberVaultState) => void;
	private callbacks: NumberVaultCallbacks;

	private phase: NumberVaultPhase = 'menu';
	private levelConfig: NumberVaultLevelConfig = NUMBER_VAULT_LEVELS[0];
	private score = 0;
	private stars = 0;
	private doorsSolved = 0;
	private currentPuzzle: NumberVaultPuzzle | null = null;
	private feedback: 'none' | 'correct' | 'incorrect' = 'none';
	private feedbackMessage = '';
	private retries = 0;
	private maxRetries = 3;

	constructor(onChange: (state: NumberVaultState) => void, callbacks: NumberVaultCallbacks = {}) {
		this.onChange = onChange;
		this.callbacks = callbacks;
		this.emit();
	}

	getState(): NumberVaultState {
		return {
			phase: this.phase,
			level: this.levelConfig.level,
			score: this.score,
			stars: this.stars,
			doorsSolved: this.doorsSolved,
			totalDoors: this.levelConfig.doors,
			currentPuzzle: this.currentPuzzle,
			feedback: this.feedback,
			feedbackMessage: this.feedbackMessage,
			retries: this.retries,
			maxRetries: this.maxRetries,
			completed: this.phase === 'result'
		};
	}

	private emit(): void {
		this.onChange(this.getState());
	}

	startLevel(level: number): void {
		const config = NUMBER_VAULT_LEVELS.find((l) => l.level === level);
		if (!config) return;

		this.levelConfig = config;
		this.phase = 'playing';
		this.score = 0;
		this.stars = 0;
		this.doorsSolved = 0;
		this.retries = 0;
		this.feedback = 'none';
		this.feedbackMessage = '';
		this.nextPuzzle();
	}

	restartLevel(): void {
		this.startLevel(this.levelConfig.level);
	}

	backToMenu(): void {
		this.phase = 'menu';
		this.currentPuzzle = null;
		this.emit();
	}

	nextPuzzle(): void {
		if (this.doorsSolved >= this.levelConfig.doors) {
			this.completeLevel();
			return;
		}

		const type = this.levelConfig.puzzleTypes[randomInt(0, this.levelConfig.puzzleTypes.length - 1)];
		const digits = randomInt(this.levelConfig.digitRange[0], this.levelConfig.digitRange[1]);

		switch (type) {
			case 'place-value':
				this.currentPuzzle = generatePlaceValuePuzzle(digits);
				break;
			case 'order':
				this.currentPuzzle = generateOrderPuzzle(digits);
				break;
			case 'round':
				this.currentPuzzle = generateRoundPuzzle(digits, this.levelConfig.roundingPlaces ?? [10, 100]);
				break;
			case 'sequence':
				this.currentPuzzle = generateSequencePuzzle(
					digits,
					this.levelConfig.sequenceTypes ?? ['add']
				);
				break;
		}

		this.feedback = 'none';
		this.feedbackMessage = '';
		this.retries = 0;
		this.emit();
	}

	submitAnswer(answer: number | number[]): void {
		if (!this.currentPuzzle || this.phase !== 'playing') return;

		const correct = Array.isArray(this.currentPuzzle.answer)
			? Array.isArray(answer) &&
				this.currentPuzzle.answer.length === answer.length &&
				this.currentPuzzle.answer.every((v, i) => v === answer[i])
			: answer === this.currentPuzzle.answer;

		if (correct) {
			const baseScore = 10;
			const retryBonus = Math.max(0, this.maxRetries - this.retries) * 2;
			this.score += baseScore + retryBonus;
			this.doorsSolved++;
			this.feedback = 'correct';
			this.feedbackMessage = 'ممتاز! فتح الباب.';
			this.callbacks.onDoorSolved?.();
			this.emit();
		} else {
			this.retries++;
			this.feedback = 'incorrect';
			this.feedbackMessage = 'ليس بالضبط. حاول مرة أخرى!';

			if (this.retries >= this.maxRetries) {
				this.feedbackMessage = `الإجابة الصحيحة: ${Array.isArray(this.currentPuzzle.answer) ? this.currentPuzzle.answer.join('، ') : this.currentPuzzle.answer.toLocaleString('ar-EG')}`;
				this.doorsSolved++;
				this.emit();
				return;
			}

			this.emit();
		}
	}

	advanceAfterFeedback(): void {
		if (this.phase !== 'playing') return;
		this.nextPuzzle();
	}

	showHint(): void {
		if (!this.currentPuzzle) return;
		this.feedback = 'incorrect';
		this.feedbackMessage = this.currentPuzzle.hintAr;
		this.emit();
	}

	private completeLevel(): void {
		const ratio = this.score / (this.levelConfig.doors * 16);
		if (ratio >= 0.9) this.stars = 3;
		else if (ratio >= 0.7) this.stars = 2;
		else this.stars = 1;

		this.phase = 'result';
		this.currentPuzzle = null;
		this.callbacks.onLevelComplete?.(this.stars);
		this.emit();
	}

	dispose(): void {
		// No timers or observables to clean up in this logic-only class.
	}
}
