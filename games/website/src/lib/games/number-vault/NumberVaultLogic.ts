export type NumberVaultPhase = 'menu' | 'playing' | 'result';

export type PuzzleType = 'place-value' | 'order' | 'round' | 'sequence';

export type GhoulType = 'sand' | 'wind' | 'echo' | 'boss';

export interface Ghoul {
	id: number;
	type: GhoulType;
	position: number; // 0 = far tunnel, 100 = vault door
	puzzle: NumberVaultPuzzle;
	health: number;
	maxHealth: number;
}

export interface NumberVaultPuzzle {
	type: PuzzleType;
	promptAr: string;
	promptEn: string;
	answer: number | number[];
	options: number[];
	hintAr: string;
	hintEn: string;
}

export interface NumberVaultState {
	phase: NumberVaultPhase;
	level: number;
	wave: number;
	totalWaves: number;
	score: number;
	combo: number;
	maxCombo: number;
	treasures: number;
	maxTreasures: number;
	ghouls: Ghoul[];
	feedback: 'none' | 'correct' | 'incorrect' | 'slow';
	feedbackMessage: string;
	waveMessage: string;
	completed: boolean;
	stars: number;
}

export interface NumberVaultLevelConfig {
	level: number;
	waves: number;
	ghoulsPerWave: [number, number];
	digitRange: [number, number];
	puzzleTypes: PuzzleType[];
	bossEvery: number;
	treasures: number;
}

export const NUMBER_VAULT_LEVELS: NumberVaultLevelConfig[] = [
	{
		level: 1,
		waves: 3,
		ghoulsPerWave: [1, 2],
		digitRange: [3, 3],
		puzzleTypes: ['place-value'],
		bossEvery: 99,
		treasures: 3
	},
	{
		level: 2,
		waves: 4,
		ghoulsPerWave: [2, 3],
		digitRange: [3, 4],
		puzzleTypes: ['place-value', 'order'],
		bossEvery: 99,
		treasures: 3
	},
	{
		level: 3,
		waves: 4,
		ghoulsPerWave: [2, 3],
		digitRange: [4, 5],
		puzzleTypes: ['place-value', 'order', 'round'],
		bossEvery: 99,
		treasures: 3
	},
	{
		level: 4,
		waves: 5,
		ghoulsPerWave: [3, 4],
		digitRange: [5, 6],
		puzzleTypes: ['order', 'round', 'sequence'],
		bossEvery: 4,
		treasures: 3
	},
	{
		level: 5,
		waves: 5,
		ghoulsPerWave: [3, 4],
		digitRange: [5, 6],
		puzzleTypes: ['place-value', 'order', 'round', 'sequence'],
		bossEvery: 3,
		treasures: 3
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

	const distractors = new Set<number>();
	while (distractors.size < 3) {
		const d = randomInt(0, 9);
		if (d !== digit) distractors.add(d);
	}
	const options = shuffle([digit, ...distractors]);

	return {
		type: 'place-value',
		promptAr: `${number.toLocaleString('en')} — خانة ${placeNameAr}؟`,
		promptEn: `${number.toLocaleString('en')} — ${placeNameAr} digit?`,
		answer: digit,
		options,
		hintAr: `ابحث عن خانة ${placeNameAr} في ${number.toLocaleString('en')}.`,
		hintEn: `Find the ${placeNameAr} digit in ${number.toLocaleString('en')}.`
	};
}

export function generateOrderPuzzle(digits: number): NumberVaultPuzzle {
	const count = randomInt(3, 4);
	const numbers = Array.from({ length: count }, () => generateNumber(digits));
	const sorted = [...numbers].sort((a, b) => a - b);
	const isAscending = Math.random() > 0.5;
	const answer = isAscending ? sorted[0] : sorted[sorted.length - 1];

	return {
		type: 'order',
		promptAr: `${isAscending ? 'الأصغر' : 'الأكبر'}؟`,
		promptEn: `${isAscending ? 'Smallest' : 'Largest'}?`,
		answer,
		options: shuffle([...numbers]),
		hintAr: `اختر ${isAscending ? 'الأصغر' : 'الأكبر'}.`,
		hintEn: `Pick the ${isAscending ? 'smallest' : 'largest'}.`
	};
}

export function generateRoundPuzzle(
	digits: number,
	places: (10 | 100 | 1000 | 10000)[] = [10, 100, 1000]
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
		promptAr: `${number.toLocaleString('en')} ≈ ؟ (${placeNameAr[place]})`,
		promptEn: `${number.toLocaleString('en')} ≈ ? (${placeNameAr[place]})`,
		answer: rounded,
		options,
		hintAr: `أقرب حد لـ ${placeNameAr[place]}.`,
		hintEn: `Nearest ${placeNameAr[place]}.`
	};
}

export function generateSequencePuzzle(
	digits: number,
	types: ('add' | 'subtract' | 'multiple')[] = ['add']
): NumberVaultPuzzle {
	const type = types[randomInt(0, types.length - 1)];
	const maxStart = 10 ** (digits - 1);
	const start = randomInt(1, maxStart);

	let step: number;
	let sequence: number[];
	let answer: number;

	if (type === 'add') {
		step = randomInt(2, 9) * 10 ** randomInt(0, Math.min(2, digits - 1));
		sequence = [start, start + step, start + step * 2];
		answer = start + step * 3;
	} else if (type === 'subtract') {
		step = randomInt(2, 9) * 10 ** randomInt(0, Math.min(2, digits - 1));
		sequence = [start + step * 3, start + step * 2, start + step];
		answer = start;
	} else {
		step = randomInt(2, 9);
		sequence = [start, start * step, start * step * 2];
		answer = start * step * 3;
	}

	return {
		type: 'sequence',
		promptAr: `${sequence.map((n) => n.toLocaleString('en')).join(' → ')} → ؟`,
		promptEn: `${sequence.map((n) => n.toLocaleString('en')).join(' → ')} → ?`,
		answer,
		options: shuffle([answer, answer + step, answer - step, answer + step * 2]),
		hintAr: type === 'multiple' ? 'ما العملية؟' : 'ما الفرق؟',
		hintEn: type === 'multiple' ? 'What is the operation?' : 'What is the difference?'
	};
}

export function generatePuzzle(
	digits: number,
	types: PuzzleType[],
	places?: (10 | 100 | 1000 | 10000)[],
	sequenceTypes?: ('add' | 'subtract' | 'multiple')[]
): NumberVaultPuzzle {
	const type = types[randomInt(0, types.length - 1)];
	switch (type) {
		case 'place-value':
			return generatePlaceValuePuzzle(digits);
		case 'order':
			return generateOrderPuzzle(digits);
		case 'round':
			return generateRoundPuzzle(digits, places ?? [10, 100]);
		case 'sequence':
			return generateSequencePuzzle(digits, sequenceTypes ?? ['add']);
	}
}

export interface NumberVaultCallbacks {
	onWaveCleared?: () => void;
	onLevelComplete?: (stars: number) => void;
	onTreasureStolen?: () => void;
}

export class NumberVaultLogic {
	private onChange: (state: NumberVaultState) => void;
	private callbacks: NumberVaultCallbacks;

	private phase: NumberVaultPhase = 'menu';
	private levelConfig: NumberVaultLevelConfig = NUMBER_VAULT_LEVELS[0];
	private wave = 0;
	private score = 0;
	private combo = 0;
	private maxCombo = 0;
	private treasures = 3;
	private ghouls: Ghoul[] = [];
	private feedback: 'none' | 'correct' | 'incorrect' | 'slow' = 'none';
	private feedbackMessage = '';
	private waveMessage = '';
	private stars = 0;

	private nextGhoulId = 1;
	private tickTimer: ReturnType<typeof setInterval> | null = null;
	private lastAnswerAt = 0;

	constructor(onChange: (state: NumberVaultState) => void, callbacks: NumberVaultCallbacks = {}) {
		this.onChange = onChange;
		this.callbacks = callbacks;
		this.emit();
	}

	getState(): NumberVaultState {
		return {
			phase: this.phase,
			level: this.levelConfig.level,
			wave: this.wave,
			totalWaves: this.levelConfig.waves,
			score: this.score,
			combo: this.combo,
			maxCombo: this.maxCombo,
			treasures: this.treasures,
			maxTreasures: this.levelConfig.treasures,
			ghouls: this.ghouls,
			feedback: this.feedback,
			feedbackMessage: this.feedbackMessage,
			waveMessage: this.waveMessage,
			completed: this.phase === 'result',
			stars: this.stars
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
		this.wave = 0;
		this.score = 0;
		this.combo = 0;
		this.maxCombo = 0;
		this.treasures = config.treasures;
		this.ghouls = [];
		this.feedback = 'none';
		this.feedbackMessage = '';
		this.waveMessage = '';
		this.stars = 0;
		this.lastAnswerAt = Date.now();

		this.startTick();
		this.spawnWave();
	}

	restartLevel(): void {
		this.stopTick();
		this.startLevel(this.levelConfig.level);
	}

	backToMenu(): void {
		this.stopTick();
		this.phase = 'menu';
		this.ghouls = [];
		this.emit();
	}

	private startTick(): void {
		this.stopTick();
		this.tickTimer = setInterval(() => this.tick(), 700);
	}

	private stopTick(): void {
		if (this.tickTimer) {
			clearInterval(this.tickTimer);
			this.tickTimer = null;
		}
	}

	private tick(): void {
		if (this.phase !== 'playing') return;

		// Ghouls advance slowly over time if player is idle.
		this.ghouls.forEach((ghoul) => {
			if (ghoul.type === 'wind') {
				ghoul.position += 2.5;
			} else if (ghoul.type === 'sand') {
				ghoul.position += 1.8;
			} else {
				ghoul.position += 1.5;
			}
		});

		this.checkVaultCollision();
		this.emit();
	}

	private spawnWave(): void {
		if (this.wave >= this.levelConfig.waves) {
			this.completeLevel();
			return;
		}

		this.wave++;
		const isBossWave = this.wave % this.levelConfig.bossEvery === 0 && this.wave > 1;
		const [min, max] = this.levelConfig.ghoulsPerWave;
		const count = isBossWave ? 1 : randomInt(min, max);
		const newGhouls: Ghoul[] = [];

		for (let i = 0; i < count; i++) {
			const isBoss = isBossWave;
			const type: GhoulType = isBoss
				? 'boss'
				: (['sand', 'wind', 'echo'] as GhoulType[])[randomInt(0, 2)];
			const digits = randomInt(this.levelConfig.digitRange[0], this.levelConfig.digitRange[1]);
			const puzzle = generatePuzzle(
				digits,
				this.levelConfig.puzzleTypes,
				[10, 100, 1000, 10000],
				['add', 'subtract', 'multiple']
			);

			newGhouls.push({
				id: this.nextGhoulId++,
				type,
				position: -15 - i * 15, // staggered entry
				puzzle,
				health: type === 'boss' ? 3 : 1,
				maxHealth: type === 'boss' ? 3 : 1
			});
		}

		this.ghouls = newGhouls;
		this.waveMessage = isBossWave ? 'موجة الزعيم!' : `الموجة ${this.wave}`;
		this.feedback = 'none';
		this.feedbackMessage = '';
		this.emit();
	}

	private checkVaultCollision(): void {
		const reached = this.ghouls.filter((g) => g.position >= 100);
		if (reached.length > 0) {
			reached.forEach(() => {
				this.treasures = Math.max(0, this.treasures - 1);
				this.callbacks.onTreasureStolen?.();
			});
			this.ghouls = this.ghouls.filter((g) => g.position < 100);
			this.combo = 0;
			this.feedback = 'incorrect';
			this.feedbackMessage = 'سُرق كنز! 😢';

			if (this.treasures <= 0) {
				this.completeLevel();
				return;
			}
		}

		if (this.ghouls.length === 0 && this.phase === 'playing') {
			this.callbacks.onWaveCleared?.();
			this.spawnWave();
		}
	}

	submitAnswer(answer: number | number[]): void {
		if (this.phase !== 'playing' || this.ghouls.length === 0) return;

		const lead = this.ghouls[0];
		const correct = Array.isArray(lead.puzzle.answer)
			? Array.isArray(answer) &&
				lead.puzzle.answer.length === answer.length &&
				lead.puzzle.answer.every((v, i) => v === answer[i])
			: answer === lead.puzzle.answer;

		const elapsed = (Date.now() - this.lastAnswerAt) / 1000;
		this.lastAnswerAt = Date.now();

		if (correct) {
			const fast = elapsed <= 3;
			if (fast) {
				this.combo++;
				this.maxCombo = Math.max(this.maxCombo, this.combo);
			} else {
				this.combo = 0;
			}

			const baseScore = lead.type === 'boss' ? 30 : 10;
			const comboBonus = Math.min(this.combo * 2, 20);
			this.score += baseScore + comboBonus;

			lead.health--;
			const knockback = fast ? 55 : 30;
			lead.position = Math.max(0, lead.position - knockback);

			if (lead.health <= 0) {
				this.ghouls.shift();
			}

			this.feedback = fast ? 'correct' : 'slow';
			if (fast && this.combo >= 5) {
				this.feedbackMessage = 'هجوم أسطوري! ⚡🔥';
			} else if (fast && this.combo >= 3) {
				this.feedbackMessage = 'ضربة مدمرة! 💥';
			} else if (fast) {
				this.feedbackMessage = 'صحيح! 💥';
			} else {
				this.feedbackMessage = 'صحيح، لكن أسرع! ⏱️';
			}
		} else {
			this.combo = 0;
			lead.position += 25;
			this.feedback = 'incorrect';
			this.feedbackMessage = 'خطأ! تقدّم الغول 👿';
		}

		this.checkVaultCollision();
		this.emit();
	}

	showHint(): void {
		if (this.ghouls.length === 0) return;
		this.feedback = 'slow';
		this.feedbackMessage = this.ghouls[0].puzzle.hintAr;
		this.ghouls[0].position += 10; // small time penalty
		this.emit();
	}

	private completeLevel(): void {
		this.stopTick();

		if (this.treasures <= 0) {
			this.stars = 0;
		} else if (this.treasures === this.levelConfig.treasures) {
			this.stars = 3;
		} else if (this.treasures >= this.levelConfig.treasures - 1) {
			this.stars = 2;
		} else {
			this.stars = 1;
		}

		this.phase = 'result';
		this.ghouls = [];
		this.feedback = 'none';
		this.feedbackMessage = this.treasures <= 0 ? 'الخزنة سُرقت! حاول مرة أخرى.' : 'حمايت الخزنة!';
		this.callbacks.onLevelComplete?.(this.stars);
		this.emit();
	}

	dispose(): void {
		this.stopTick();
	}
}
