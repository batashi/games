import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	MajlisHostLogic,
	DEFAULT_MAJLIS_HOST_CONFIG,
	STANDARD_SEQUENCE,
	VIP_SEQUENCES,
	MAJLIS_LEVELS,
	type MajlisHostState,
	type ServingItem
} from './MajlisHostLogic';

describe('MajlisHostLogic', () => {
	let state: MajlisHostState | null = null;
	let logic: MajlisHostLogic;

	beforeEach(() => {
		state = null;
		logic = new MajlisHostLogic((s) => {
			state = s;
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	function waitForGuest() {
		// Wait until a guest has spawned and finished arriving (spawn timer + 1.2s arrival).
		for (let i = 0; i < 300; i++) {
			logic.update(0.05);
			if (state?.activeGuest?.state === 'waiting') break;
		}
	}

	function serveSequence(sequence: ServingItem[]) {
		for (const item of sequence) {
			logic.serveItem(item);
		}
	}

	it('starts in menu phase', () => {
		expect(state?.phase).toBe('menu');
		expect(state?.score).toBe(0);
	});

	it('serves the standard sequence correctly and marks guest happy', () => {
		logic.startLevel(1);
		waitForGuest();

		const guest = state!.activeGuest;
		expect(guest).not.toBeNull();
		expect(guest!.sequence).toEqual(STANDARD_SEQUENCE);

		serveSequence(STANDARD_SEQUENCE);

		expect(state!.happyGuests).toBe(1);
		expect(state!.activeGuest).toBeNull();
		expect(state!.score).toBeGreaterThan(0);
	});

	it('penalizes wrong step and resets combo', () => {
		logic.startLevel(1);
		waitForGuest();

		const initialPatience = state!.activeGuest!.patience;
		logic.serveItem('bukhoor'); // correct
		expect(state!.combo).toBe(1);

		logic.serveItem('water'); // wrong: should be qahwa
		expect(state!.combo).toBe(0);
		expect(state!.activeGuest!.patience).toBeLessThan(initialPatience);
	});

	it('gives combo bonus for consecutive correct steps', () => {
		logic.startLevel(1);
		waitForGuest();

		let score = 0;
		for (let i = 0; i < STANDARD_SEQUENCE.length; i++) {
			logic.serveItem(STANDARD_SEQUENCE[i]);
			expect(state!.combo).toBe(i + 1);
			expect(state!.score).toBeGreaterThan(score);
			score = state!.score;
		}
	});

	it('gives perfect and tip bonus for camel served perfectly', () => {
		logic.startLevel(1);
		waitForGuest();

		// Level 1 only allows camel and sheep; force camel by mocking random.
		vi.spyOn(Math, 'random').mockReturnValue(0);
		logic.restartLevel();
		waitForGuest();

		expect(state!.activeGuest!.type).toBe('camel');
		const scoreBefore = state!.score;
		serveSequence(STANDARD_SEQUENCE);

		// Perfect bonus + camel tip should have been awarded.
		expect(state!.score - scoreBefore).toBeGreaterThan(
			DEFAULT_MAJLIS_HOST_CONFIG.baseScorePerStep * STANDARD_SEQUENCE.length +
				DEFAULT_MAJLIS_HOST_CONFIG.perfectBonus
		);
	});

	it('restores patience on correct step', () => {
		logic.startLevel(1);
		waitForGuest();

		const patienceBefore = state!.activeGuest!.patience;
		logic.update(1); // drain some patience
		const patienceAfterDrain = state!.activeGuest!.patience;
		expect(patienceAfterDrain).toBeLessThan(patienceBefore);

		logic.serveItem('bukhoor');
		expect(state!.activeGuest!.patience).toBeGreaterThan(patienceAfterDrain);
	});

	it('drains patience over time and makes guest leave angry when depleted', () => {
		logic.startLevel(1);
		waitForGuest();

		const initialLives = state!.lives;
		// Drain patience rapidly by advancing time.
		while (state!.activeGuest) {
			logic.update(0.05);
		}

		expect(state!.angryGuests).toBeGreaterThanOrEqual(1);
		expect(state!.lives).toBe(initialLives - 1);
	});

	it('proud oryx leaves quietly on wrong step without losing a life', () => {
		// Use level 3 where oryx is allowed.
		logic.startLevel(3);
		// Force an oryx guest.
		let randomCalls = 0;
		const guestPool = MAJLIS_LEVELS[2].allowedGuests;
		const oryxIndex = guestPool.indexOf('oryx');
		vi.spyOn(Math, 'random').mockImplementation(() => {
			randomCalls++;
			// First call picks guest type: return value that selects oryx.
			if (randomCalls === 1) return oryxIndex / guestPool.length;
			return 0;
		});
		waitForGuest();

		expect(state!.activeGuest!.type).toBe('oryx');
		const livesBefore = state!.lives;

		logic.serveItem('qahwa'); // wrong first step

		expect(state!.angryGuests).toBe(1);
		expect(state!.lives).toBe(livesBefore);
		expect(state!.activeGuest).toBeNull();
	});

	it('generates VIP sequences with refill or halwa', () => {
		logic.startLevel(3);
		// Force a VIP guest by returning a value below vipChance on sequence roll.
		let randomCalls = 0;
		vi.spyOn(Math, 'random').mockImplementation(() => {
			randomCalls++;
			if (randomCalls === 1) return 0; // camel guest type
			if (randomCalls === 2) return 0; // VIP sequence (first one)
			return 0;
		});
		waitForGuest();

		expect(state!.activeGuest!.sequence.length).toBeGreaterThan(STANDARD_SEQUENCE.length);
		expect(VIP_SEQUENCES.some((s) => s.join(',') === state!.activeGuest!.sequence.join(','))).toBe(true);
	});

	it('completes the level after serving enough happy guests', () => {
		logic.startLevel(1);
		const target = state!.targetGuests;

		for (let i = 0; i < target; i++) {
			waitForGuest();
			serveSequence(state!.activeGuest!.sequence);
		}

		expect(state!.phase).toBe('result');
		expect(state!.happyGuests).toBe(target);
		expect(state!.stars).toBeGreaterThanOrEqual(1);
	});

	it('fails the level when lives reach zero', () => {
		logic.startLevel(1);
		const lives = state!.lives;

		for (let i = 0; i < lives; i++) {
			waitForGuest();
			// Let patience drain to zero.
			while (state!.activeGuest) {
				logic.update(0.05);
			}
		}

		expect(state!.phase).toBe('result');
		expect(state!.lives).toBe(0);
	});

	it('fails the level when time runs out', () => {
		// Use a config that makes patience drain negligible so lives do not run out first.
		logic = new MajlisHostLogic(
			(s) => {
				state = s;
			},
			{ guestDrainMultiplier: 0.01 }
		);
		logic.startLevel(1);
		waitForGuest();
		// Advance far beyond the level duration.
		for (let i = 0; i < 2000; i++) {
			logic.update(0.05);
			if (state!.phase === 'result') break;
		}

		expect(state!.phase).toBe('result');
		expect(state!.resultReason).toBe('time_up');
		expect(state!.timeRemaining).toBe(0);
	});

	it('Fresh Bukhoor power-up slows patience drain', () => {
		logic.startLevel(1);
		waitForGuest();

		logic.usePowerUp('freshBukhoor');
		expect(state!.freshBukhoorTimer).toBe(DEFAULT_MAJLIS_HOST_CONFIG.freshBukhoorDuration);

		const patienceBefore = state!.activeGuest!.patience;
		// Advance 2 seconds while power-up is active (dt is clamped to 0.05s per update).
		for (let i = 0; i < 40; i++) logic.update(0.05);
		const drainedWithPowerUp = patienceBefore - state!.activeGuest!.patience;

		// Wait for power-up to expire (8+ seconds) then measure normal drain for 1 second.
		for (let i = 0; i < 170; i++) logic.update(0.05);
		const patienceBeforeNormal = state!.activeGuest!.patience;
		for (let i = 0; i < 20; i++) logic.update(0.05);
		const drainedNormal = patienceBeforeNormal - state!.activeGuest!.patience;

		expect(drainedWithPowerUp).toBeLessThan(drainedNormal);
	});

	it('Quick Pour power-up auto-completes the next step', () => {
		logic.startLevel(1);
		waitForGuest();

		const progressBefore = state!.activeGuest!.progress;
		logic.usePowerUp('quickPour');
		expect(state!.activeGuest!.progress).toBe(progressBefore + 1);
	});

	it('Extra Hand power-up serves an additional step after a correct serve', () => {
		logic.startLevel(1);
		waitForGuest();

		logic.usePowerUp('extraHand');
		expect(state!.extraHandCharges).toBe(1);

		const progressBefore = state!.activeGuest!.progress;
		logic.serveItem('bukhoor'); // correct; extra hand should also serve qahwa
		expect(state!.activeGuest!.progress).toBe(progressBefore + 2);
		expect(state!.extraHandCharges).toBe(0);
	});

	it('goat gives bonus time when happy', () => {
		logic.startLevel(3);
		// Force a goat guest.
		const guestPool = MAJLIS_LEVELS[2].allowedGuests;
		const goatIndex = guestPool.indexOf('goat');
		let randomCalls = 0;
		vi.spyOn(Math, 'random').mockImplementation(() => {
			randomCalls++;
			if (randomCalls === 1) return goatIndex / guestPool.length;
			return 1; // avoid VIP/fox paths
		});
		waitForGuest();

		expect(state!.activeGuest!.type).toBe('goat');
		const timeBefore = state!.timeRemaining;
		serveSequence(STANDARD_SEQUENCE);
		expect(state!.timeRemaining).toBe(timeBefore + DEFAULT_MAJLIS_HOST_CONFIG.goatBonusTime);
	});

	it('restartLevel resets the current level', () => {
		logic.startLevel(2);
		waitForGuest();
		logic.serveItem('bukhoor');
		logic.restartLevel();

		expect(state!.phase).toBe('playing');
		expect(state!.level).toBe(2);
		expect(state!.score).toBe(0);
		expect(state!.happyGuests).toBe(0);
		expect(state!.activeGuest).toBeNull();
	});

	it('resetToMenu returns to menu state', () => {
		logic.startLevel(1);
		waitForGuest();
		logic.resetToMenu();

		expect(state!.phase).toBe('menu');
		expect(state!.activeGuest).toBeNull();
	});
});
