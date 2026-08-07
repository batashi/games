export type ServingItem = 'bukhoor' | 'qahwa' | 'dates' | 'water' | 'halwa' | 'refill';

export type GuestType = 'camel' | 'falcon' | 'oryx' | 'fox' | 'goat' | 'sheep';

export type PowerUpType = 'freshBukhoor' | 'quickPour' | 'extraHand';

export type MajlisHostPhase = 'menu' | 'playing' | 'result';

export interface Guest {
	id: number;
	type: GuestType;
	sequence: ServingItem[];
	progress: number;
	patience: number;
	maxPatience: number;
	state: 'arriving' | 'waiting' | 'leaving-happy' | 'leaving-angry';
	arrivalTimer: number;
	perfectSoFar: boolean;
}

export interface MajlisHostState {
	phase: MajlisHostPhase;
	level: number;
	score: number;
	combo: number;
	lives: number;
	maxLives: number;
	timeRemaining: number;
	targetGuests: number;
	happyGuests: number;
	angryGuests: number;
	activeGuest: Guest | null;
	freshBukhoorTimer: number;
	extraHandCharges: number;
	message: string;
	stars: number;
	resultReason: string;
}

export interface MajlisHostLevelConfig {
	level: number;
	targetGuests: number;
	durationSeconds: number;
	spawnInterval: number;
	vipChance: number;
	foxChance: number;
	allowedGuests: GuestType[];
	startingLives: number;
}

export interface MajlisHostConfig {
	baseScorePerStep: number;
	comboBonus: number;
	perfectBonus: number;
	wrongStepPatiencePenalty: number;
	correctStepPatienceRestore: number;
	freshBukhoorDuration: number;
	freshBukhoorDrainMultiplier: number;
	guestDrainMultiplier: number;
	goatBonusTime: number;
	camelTipBonus: number;
}

export const DEFAULT_MAJLIS_HOST_CONFIG: MajlisHostConfig = {
	baseScorePerStep: 10,
	comboBonus: 2,
	perfectBonus: 25,
	wrongStepPatiencePenalty: 15,
	correctStepPatienceRestore: 3,
	freshBukhoorDuration: 10,
	freshBukhoorDrainMultiplier: 0.4,
	guestDrainMultiplier: 1,
	goatBonusTime: 8,
	camelTipBonus: 20
};

export const STANDARD_SEQUENCE: ServingItem[] = ['bukhoor', 'qahwa', 'dates', 'water'];

export const VIP_SEQUENCES: ServingItem[][] = [
	['bukhoor', 'qahwa', 'dates', 'refill', 'water'],
	['bukhoor', 'qahwa', 'dates', 'halwa', 'water']
];

export const MAJLIS_LEVELS: MajlisHostLevelConfig[] = [
	{
		level: 1,
		targetGuests: 5,
		durationSeconds: 90,
		spawnInterval: 3,
		vipChance: 0,
		foxChance: 0,
		allowedGuests: ['camel', 'sheep'],
		startingLives: 3
	},
	{
		level: 2,
		targetGuests: 7,
		durationSeconds: 100,
		spawnInterval: 2.8,
		vipChance: 0.15,
		foxChance: 0,
		allowedGuests: ['camel', 'sheep', 'goat', 'falcon'],
		startingLives: 3
	},
	{
		level: 3,
		targetGuests: 9,
		durationSeconds: 120,
		spawnInterval: 2.5,
		vipChance: 0.25,
		foxChance: 0.2,
		allowedGuests: ['camel', 'sheep', 'goat', 'falcon', 'oryx', 'fox'],
		startingLives: 4
	},
	{
		level: 4,
		targetGuests: 12,
		durationSeconds: 130,
		spawnInterval: 2.2,
		vipChance: 0.35,
		foxChance: 0.3,
		allowedGuests: ['camel', 'sheep', 'goat', 'falcon', 'oryx', 'fox'],
		startingLives: 4
	},
	{
		level: 5,
		targetGuests: 15,
		durationSeconds: 150,
		spawnInterval: 2,
		vipChance: 0.4,
		foxChance: 0.35,
		allowedGuests: ['camel', 'sheep', 'goat', 'falcon', 'oryx', 'fox'],
		startingLives: 5
	}
];

const GUEST_STATS: Record<
	GuestType,
	{ maxPatience: number; drainRate: number; tip: number; icon: string }
> = {
	camel: { maxPatience: 20, drainRate: 1.4, tip: 20, icon: '🐪' },
	falcon: { maxPatience: 10, drainRate: 3.4, tip: 5, icon: '🦅' },
	oryx: { maxPatience: 14, drainRate: 2.2, tip: 8, icon: '🦌' },
	fox: { maxPatience: 12, drainRate: 2.8, tip: 6, icon: '🦊' },
	goat: { maxPatience: 14, drainRate: 2.2, tip: 8, icon: '🐐' },
	sheep: { maxPatience: 22, drainRate: 1.2, tip: 10, icon: '🐑' }
};

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export interface MajlisHostCallbacks {
	onStepServed?: (item: ServingItem, correct: boolean) => void;
	onGuestComplete?: (happy: boolean, type: GuestType) => void;
	onLevelComplete?: (stars: number) => void;
	onLevelFailed?: (reason: string) => void;
}

export class MajlisHostLogic {
	private config: MajlisHostConfig;
	private onChange: (state: MajlisHostState) => void;
	private callbacks: MajlisHostCallbacks;

	private phase: MajlisHostPhase = 'menu';
	private levelConfig: MajlisHostLevelConfig = MAJLIS_LEVELS[0];
	private score = 0;
	private combo = 0;
	private lives = 3;
	private maxLives = 3;
	private timeRemaining = 0;
	private targetGuests = 0;
	private happyGuests = 0;
	private angryGuests = 0;
	private activeGuest: Guest | null = null;
	private freshBukhoorTimer = 0;
	private extraHandCharges = 0;
	private stars = 0;
	private resultReason = '';

	private nextGuestId = 1;
	private spawnTimer = 0;

	constructor(
		onChange: (state: MajlisHostState) => void,
		config: Partial<MajlisHostConfig> = {},
		callbacks: MajlisHostCallbacks = {}
	) {
		this.onChange = onChange;
		this.config = { ...DEFAULT_MAJLIS_HOST_CONFIG, ...config };
		this.callbacks = callbacks;
		this.resetToMenu();
	}

	getState(): MajlisHostState {
		return {
			phase: this.phase,
			level: this.levelConfig.level,
			score: this.score,
			combo: this.combo,
			lives: this.lives,
			maxLives: this.maxLives,
			timeRemaining: Math.max(0, this.timeRemaining),
			targetGuests: this.targetGuests,
			happyGuests: this.happyGuests,
			angryGuests: this.angryGuests,
			activeGuest: this.activeGuest ? this.cloneGuest(this.activeGuest) : null,
			freshBukhoorTimer: Math.max(0, this.freshBukhoorTimer),
			extraHandCharges: this.extraHandCharges,
			message: this.getMessage(),
			stars: this.stars,
			resultReason: this.resultReason
		};
	}

	private cloneGuest(guest: Guest): Guest {
		return {
			...guest,
			sequence: [...guest.sequence]
		};
	}

	startLevel(level: number): void {
		const config = MAJLIS_LEVELS.find((l) => l.level === level) ?? MAJLIS_LEVELS[MAJLIS_LEVELS.length - 1];
		this.levelConfig = config;
		this.phase = 'playing';
		this.score = 0;
		this.combo = 0;
		this.lives = config.startingLives;
		this.maxLives = config.startingLives;
		this.timeRemaining = config.durationSeconds;
		this.targetGuests = config.targetGuests;
		this.happyGuests = 0;
		this.angryGuests = 0;
		this.activeGuest = null;
		this.freshBukhoorTimer = 0;
		this.extraHandCharges = 0;
		this.stars = 0;
		this.resultReason = '';
		this.nextGuestId = 1;
		this.spawnTimer = 1;
		this.notify();
	}

	restartLevel(): void {
		this.startLevel(this.levelConfig.level);
	}

	resetToMenu(): void {
		this.levelConfig = MAJLIS_LEVELS[0];
		this.phase = 'menu';
		this.score = 0;
		this.combo = 0;
		this.lives = 3;
		this.maxLives = 3;
		this.timeRemaining = 0;
		this.targetGuests = 0;
		this.happyGuests = 0;
		this.angryGuests = 0;
		this.activeGuest = null;
		this.freshBukhoorTimer = 0;
		this.extraHandCharges = 0;
		this.stars = 0;
		this.resultReason = '';
		this.nextGuestId = 1;
		this.spawnTimer = 0;
		this.notify();
	}

	private getMessage(): string {
		if (this.phase === 'menu') return 'اختر مستوى لبدء اللعب';
		if (this.phase === 'result') {
			if (this.resultReason === 'level_complete') return 'ممتاز! أحسنت الضيافة 🌟';
			if (this.resultReason === 'time_up') return 'انتهى الوقت! حاول مرة أخرى 💪';
			return 'حاول مرة أخرى';
		}
		if (!this.activeGuest) return 'ضيف قادم...';
		const next = this.activeGuest.sequence[this.activeGuest.progress];
		if (!next) return 'الضيف استمتع بالضيافة!';
		const names: Record<ServingItem, string> = {
			bukhoor: 'البخور',
			qahwa: 'القهوة',
			dates: 'التمر',
			water: 'الماء',
			halwa: 'الحلوى',
			refill: 'إعادة ملء القهوة'
		};
		return `قدّم ${names[next]} للضيف`;
	}

	serveItem(item: ServingItem): void {
		if (this.phase !== 'playing' || !this.activeGuest) return;

		const guest = this.activeGuest;
		const expected = guest.sequence[guest.progress];

		if (item === expected) {
			this.handleCorrectStep(guest, item);
			this.callbacks.onStepServed?.(item, true);
		} else {
			this.handleWrongStep(guest, item);
			this.callbacks.onStepServed?.(item, false);
		}

		this.notify();
	}

	private handleCorrectStep(guest: Guest, item: ServingItem): void {
		guest.progress += 1;
		guest.patience = clamp(guest.patience + this.config.correctStepPatienceRestore, 0, guest.maxPatience);

		const stepScore = this.config.baseScorePerStep + this.combo * this.config.comboBonus;
		this.score += stepScore;
		this.combo += 1;

		if (guest.progress >= guest.sequence.length) {
			this.completeGuestHappy(guest);
			return;
		}

		// Extra Hand: helper serves the next required item immediately after a correct step.
		if (this.extraHandCharges > 0) {
			this.extraHandCharges -= 1;
			const nextItem = guest.sequence[guest.progress];
			if (nextItem) {
				this.handleCorrectStep(guest, nextItem);
			}
		}
	}

	private handleWrongStep(guest: Guest, item: ServingItem): void {
		guest.perfectSoFar = false;
		this.combo = 0;

		// Proud oryx leaves quietly on a wrong step without draining further patience.
		if (guest.type === 'oryx') {
			this.completeGuestAngry(guest, 'oryx_wrong');
			return;
		}

		let penalty = this.config.wrongStepPatiencePenalty;
		if (guest.type === 'sheep') {
			penalty *= 0.5;
		}
		guest.patience = clamp(guest.patience - penalty, 0, guest.maxPatience);

		if (guest.patience <= 0) {
			this.completeGuestAngry(guest, 'patience');
		}
	}

	private completeGuestHappy(guest: Guest): void {
		guest.state = 'leaving-happy';
		this.happyGuests += 1;

		let bonus = this.config.perfectBonus;
		if (guest.perfectSoFar && guest.type === 'camel') {
			bonus += this.config.camelTipBonus;
		}
		this.score += bonus;

		if (guest.type === 'goat') {
			this.timeRemaining += this.config.goatBonusTime;
		}

		this.callbacks.onGuestComplete?.(true, guest.type);
		this.activeGuest = null;
		this.spawnTimer = this.levelConfig.spawnInterval;
		this.checkLevelEnd();
	}

	private completeGuestAngry(guest: Guest, reason: string): void {
		guest.state = 'leaving-angry';
		this.angryGuests += 1;

		if (reason !== 'oryx_wrong') {
			this.lives = clamp(this.lives - 1, 0, this.maxLives);
		}
		this.combo = 0;

		this.callbacks.onGuestComplete?.(false, guest.type);
		this.activeGuest = null;
		this.spawnTimer = this.levelConfig.spawnInterval;
		this.checkLevelEnd();
	}

	usePowerUp(type: PowerUpType): void {
		if (this.phase !== 'playing') return;

		switch (type) {
			case 'freshBukhoor':
				this.freshBukhoorTimer = this.config.freshBukhoorDuration;
				break;
			case 'quickPour':
				if (this.activeGuest) {
					const next = this.activeGuest.sequence[this.activeGuest.progress];
					if (next) this.serveItem(next);
				}
				break;
			case 'extraHand':
				this.extraHandCharges += 1;
				break;
		}
		this.notify();
	}

	update(dt: number): void {
		if (this.phase !== 'playing') return;

		const clampedDt = Math.min(dt, 0.05);

		this.timeRemaining -= clampedDt;
		if (this.timeRemaining <= 0) {
			this.timeRemaining = 0;
			this.failLevel('time_up');
			return;
		}

		if (this.freshBukhoorTimer > 0) {
			this.freshBukhoorTimer -= clampedDt;
			if (this.freshBukhoorTimer < 0) this.freshBukhoorTimer = 0;
		}

		if (this.activeGuest) {
			this.updateGuest(this.activeGuest, clampedDt);
		} else {
			this.spawnTimer -= clampedDt;
			if (this.spawnTimer <= 0) {
				this.spawnGuest();
				this.spawnTimer = this.levelConfig.spawnInterval;
			}
		}

		this.checkLevelEnd();
		this.notify();
	}

	private updateGuest(guest: Guest, dt: number): void {
		if (guest.state !== 'arriving' && guest.state !== 'waiting') return;

		if (guest.state === 'arriving') {
			guest.arrivalTimer -= dt;
			if (guest.arrivalTimer <= 0) {
				guest.state = 'waiting';
			}
			return;
		}

		const drainMultiplier =
			(this.freshBukhoorTimer > 0 ? this.config.freshBukhoorDrainMultiplier : 1) *
			this.config.guestDrainMultiplier;
		guest.patience -= GUEST_STATS[guest.type].drainRate * drainMultiplier * dt;

		if (guest.patience <= 0) {
			guest.patience = 0;
			this.completeGuestAngry(guest, 'patience');
		}
	}

	private spawnGuest(): void {
		const type = this.pickGuestType();
		const stats = GUEST_STATS[type];
		const sequence = this.generateSequence(type);

		const guest: Guest = {
			id: this.nextGuestId++,
			type,
			sequence,
			progress: 0,
			patience: stats.maxPatience,
			maxPatience: stats.maxPatience,
			state: 'arriving',
			arrivalTimer: 1.2,
			perfectSoFar: true
		};

		this.activeGuest = guest;
	}

	private pickGuestType(): GuestType {
		const pool = this.levelConfig.allowedGuests;
		return pool[Math.floor(Math.random() * pool.length)] ?? 'camel';
	}

	private generateSequence(type: GuestType): ServingItem[] {
		// Desert Fox sometimes asks for a reversed or shortened sequence.
		if (type === 'fox' && Math.random() < this.levelConfig.foxChance + 0.3) {
			if (Math.random() < 0.5) {
				return [...STANDARD_SEQUENCE].reverse();
			}
			return STANDARD_SEQUENCE.slice(0, 3);
		}

		if (Math.random() < this.levelConfig.vipChance) {
			const vip = VIP_SEQUENCES[Math.floor(Math.random() * VIP_SEQUENCES.length)];
			return [...vip];
		}

		return [...STANDARD_SEQUENCE];
	}

	private checkLevelEnd(): void {
		if (this.phase !== 'playing') return;

		if (this.happyGuests >= this.targetGuests) {
			this.completeLevel();
		} else if (this.lives <= 0) {
			this.failLevel('lives');
		}
	}

	private completeLevel(): void {
		const timeRatio = this.timeRemaining / this.levelConfig.durationSeconds;
		const lifeRatio = this.lives / this.maxLives;

		if (timeRatio >= 0.25 && lifeRatio >= 0.75) {
			this.stars = 3;
		} else if (timeRatio >= 0.1 && lifeRatio >= 0.4) {
			this.stars = 2;
		} else {
			this.stars = 1;
		}

		this.phase = 'result';
		this.resultReason = 'level_complete';
		this.callbacks.onLevelComplete?.(this.stars);
		this.notify();
	}

	private failLevel(reason: string): void {
		this.stars = 0;
		this.phase = 'result';
		this.resultReason = reason === 'time_up' ? 'time_up' : 'lives';
		this.callbacks.onLevelFailed?.(this.resultReason);
		this.notify();
	}

	private notify(): void {
		this.onChange(this.getState());
	}
}
