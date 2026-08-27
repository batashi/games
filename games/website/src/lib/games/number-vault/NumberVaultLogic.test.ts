import { describe, it, expect, vi } from 'vitest';
import {
	NumberVaultLogic,
	generateNumber,
	generatePlaceValuePuzzle,
	generateOrderPuzzle,
	generateRoundPuzzle,
	generateSequencePuzzle,
	NUMBER_VAULT_LEVELS,
	numberToArabicWords
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

	it('generates an order puzzle whose answer is correctly sorted', () => {
		const puzzle = generateOrderPuzzle(3);
		expect(puzzle.type).toBe('order');
		expect(Array.isArray(puzzle.answer)).toBe(true);
		const sorted = [...(puzzle.options ?? [])].sort((a, b) => a - b);
		const isAscending = puzzle.promptAr.includes('تصاعدياً');
		const expected = isAscending ? sorted : sorted.reverse();
		expect(puzzle.answer).toEqual(expected);
	});

	it('generates a rounding puzzle with a mathematically correct answer', () => {
		const puzzle = generateRoundPuzzle(4, [10, 100, 1000]);
		expect(puzzle.type).toBe('round');
		const match = puzzle.promptAr.match(/العدد ([\d,]+)/);
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

	it('renders zero and small numbers in Arabic words', () => {
		expect(numberToArabicWords(0)).toBe('صفر');
		expect(numberToArabicWords(5)).toBe('خمسة');
		expect(numberToArabicWords(15)).toBe('خمسة عشر');
	});
});

describe('NumberVaultLogic', () => {
	it('starts at the menu phase', () => {
		const logic = new NumberVaultLogic(vi.fn());
		expect(logic.getState().phase).toBe('menu');
	});

	it('transitions to playing and generates a puzzle on startLevel', () => {
		const logic = new NumberVaultLogic(vi.fn());
		logic.startLevel(1);
		const state = logic.getState();
		expect(state.phase).toBe('playing');
		expect(state.level).toBe(1);
		expect(state.currentPuzzle).not.toBeNull();
	});

	it('awards score and advances on a correct answer', () => {
		const onChange = vi.fn();
		const logic = new NumberVaultLogic(onChange);
		logic.startLevel(1);
		const puzzle = logic.getState().currentPuzzle!;
		logic.submitAnswer(puzzle.answer);
		expect(logic.getState().score).toBeGreaterThan(0);
		expect(logic.getState().doorsSolved).toBe(1);
	});

	it('increments retries on an incorrect answer', () => {
		const logic = new NumberVaultLogic(vi.fn());
		logic.startLevel(1);
		logic.submitAnswer(-9999);
		expect(logic.getState().retries).toBe(1);
		expect(logic.getState().feedback).toBe('incorrect');
	});

	it('completes the level after solving all doors', () => {
		const onLevelComplete = vi.fn();
		const logic = new NumberVaultLogic(vi.fn(), { onLevelComplete });
		logic.startLevel(1);
		const config = NUMBER_VAULT_LEVELS[0];
		for (let i = 0; i < config.doors; i++) {
			const puzzle = logic.getState().currentPuzzle!;
			logic.submitAnswer(puzzle.answer);
			logic.advanceAfterFeedback();
		}
		expect(logic.getState().phase).toBe('result');
		expect(onLevelComplete).toHaveBeenCalled();
		expect(logic.getState().stars).toBeGreaterThanOrEqual(1);
	});

	it('returns to menu from backToMenu', () => {
		const logic = new NumberVaultLogic(vi.fn());
		logic.startLevel(1);
		logic.backToMenu();
		expect(logic.getState().phase).toBe('menu');
	});
});
