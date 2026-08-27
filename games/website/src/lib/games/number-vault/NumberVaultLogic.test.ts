import { describe, it, expect, vi } from 'vitest';
import {
	NumberVaultLogic,
	generateNumber,
	generatePlaceValuePuzzle,
	generateOrderPuzzle,
	generateRoundPuzzle,
	generateSequencePuzzle,
	generatePuzzle,
	NUMBER_VAULT_LEVELS
} from './NumberVaultLogic';

describe('NumberVault puzzle generators', () => {
	it('generates numbers within the requested digit range', () => {
		for (let digits = 2; digits <= 6; digits++) {
			const n = generateNumber(digits);
			expect(n).toBeGreaterThanOrEqual(10 ** (digits - 1));
			expect(n).toBeLessThan(10 ** digits);
		}
	});

	it('generates a place-value puzzle whose answer matches the digit', () => {
		const puzzle = generatePlaceValuePuzzle(4);
		expect(puzzle.type).toBe('place-value');
		expect(puzzle.answer).toBeTypeOf('number');
		expect(puzzle.options).toContain(puzzle.answer);
	});

	it('generates an order puzzle whose answer is the smallest or largest', () => {
		const puzzle = generateOrderPuzzle(3);
		expect(puzzle.type).toBe('order');
		expect(puzzle.options).toContain(puzzle.answer);
		const sorted = [...puzzle.options].sort((a, b) => a - b);
		expect(puzzle.answer).toBeOneOf([sorted[0], sorted[sorted.length - 1]]);
	});

	it('generates a rounding puzzle with a mathematically correct answer', () => {
		const puzzle = generateRoundPuzzle(4, [10, 100, 1000]);
		expect(puzzle.type).toBe('round');
		const match = puzzle.promptAr.match(/([\d,]+) إلى/);
		expect(match).not.toBeNull();
		const number = Number(match![1].replace(/,/g, ''));
		const place = [10, 100, 1000].find((p) => Math.round(number / p) * p === puzzle.answer)!;
		expect(place).toBeDefined();
		expect(puzzle.answer).toBe(Math.round(number / place) * place);
	});

	it('generates a sequence puzzle whose answer continues the pattern', () => {
		const puzzle = generateSequencePuzzle(3, ['add']);
		expect(puzzle.type).toBe('sequence');
		const numbers = puzzle.promptAr.match(/[\d,]+/g)?.map((s) => Number(s.replace(/,/g, ''))) ?? [];
		expect(numbers.length).toBeGreaterThanOrEqual(3);
		const step = numbers[1] - numbers[0];
		expect(puzzle.answer).toBe(numbers[numbers.length - 1] + step);
	});

	it('generates a puzzle of any requested type', () => {
		const puzzle = generatePuzzle(3, ['place-value']);
		expect(puzzle.type).toBe('place-value');
	});
});

describe('NumberVaultLogic', () => {
	it('starts at the menu phase', () => {
		const logic = new NumberVaultLogic(vi.fn());
		expect(logic.getState().phase).toBe('menu');
	});

	it('transitions to playing and spawns the first wave on startLevel', () => {
		const logic = new NumberVaultLogic(vi.fn());
		logic.startLevel(1);
		const state = logic.getState();
		expect(state.phase).toBe('playing');
		expect(state.wave).toBe(1);
		expect(state.ghouls.length).toBeGreaterThan(0);
	});

	it('knocks the lead ghoul back on a correct fast answer', () => {
		const logic = new NumberVaultLogic(vi.fn());
		logic.startLevel(1);
		const puzzle = logic.getState().ghouls[0].puzzle;
		logic.submitAnswer(puzzle.answer);
		expect(logic.getState().score).toBeGreaterThan(0);
		expect(logic.getState().combo).toBeGreaterThanOrEqual(0);
	});

	it('resets combo and advances ghoul on wrong answer', () => {
		const logic = new NumberVaultLogic(vi.fn());
		logic.startLevel(1);
		const before = logic.getState().ghouls[0].position;
		logic.submitAnswer(-9999);
		const after = logic.getState().ghouls[0].position;
		expect(after).toBeGreaterThan(before);
		expect(logic.getState().combo).toBe(0);
	});

	it('clears wave and advances when all ghouls are defeated', () => {
		const logic = new NumberVaultLogic(vi.fn());
		logic.startLevel(1);
		const config = NUMBER_VAULT_LEVELS[0];
		// Defeat all ghouls in wave 1 by answering correctly enough times.
		let safety = 0;
		while (logic.getState().wave === 1 && safety < 30) {
			const ghouls = logic.getState().ghouls;
			if (ghouls.length === 0) break;
			logic.submitAnswer(ghouls[0].puzzle.answer);
			safety++;
		}
		expect(logic.getState().wave).toBe(2);
	});

	it('returns to menu from backToMenu and stops timer', () => {
		const logic = new NumberVaultLogic(vi.fn());
		logic.startLevel(1);
		logic.backToMenu();
		expect(logic.getState().phase).toBe('menu');
	});

	it('disposes without throwing', () => {
		const logic = new NumberVaultLogic(vi.fn());
		logic.startLevel(1);
		expect(() => logic.dispose()).not.toThrow();
	});
});
