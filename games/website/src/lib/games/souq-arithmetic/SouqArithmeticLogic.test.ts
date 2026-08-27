import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	SouqArithmeticLogic,
	SOUQ_LEVELS,
	GOODS,
	COIN_VALUES,
	orderTotal,
	cartTotal,
	formatMoney,
	generateRestockProblem
} from './SouqArithmeticLogic';

describe('SouqArithmetic money helpers', () => {
	it('formats baisa as riyals', () => {
		expect(formatMoney(150)).toBe('1.50 ر.ع');
		expect(formatMoney(200)).toBe('2 ر.ع');
		expect(formatMoney(0)).toBe('0 ر.ع');
	});

	it('computes order total', () => {
		const order = { dates: 2, dallah: 1, spice: 0, frankincense: 0, khanjar: 0 };
		expect(orderTotal(order)).toBe(2 * 50 + 1 * 200);
	});

	it('computes cart total', () => {
		const cart = { dates: 0, dallah: 2, spice: 1, frankincense: 0, khanjar: 0 };
		expect(cartTotal(cart)).toBe(2 * 200 + 1 * 75);
	});
});

describe('SouqArithmeticLogic', () => {
	let logic: SouqArithmeticLogic;
	let states: ReturnType<typeof logic.getState>[];

	beforeEach(() => {
		states = [];
		logic = new SouqArithmeticLogic((s) => states.push(s));
	});

	it('starts in menu phase', () => {
		const state = logic.getState();
		expect(state.phase).toBe('menu');
		expect(state.customer).toBeNull();
	});

	it('starts a level and spawns a customer', () => {
		logic.startLevel(1);
		const state = logic.getState();
		expect(state.phase).toBe('playing');
		expect(state.customer).not.toBeNull();
		expect(state.customerQuota).toBe(SOUQ_LEVELS[0].customers);
		expect(state.reputation).toBe(3);
	});

	it('accepts a correct exact-payment transaction', () => {
		logic.startLevel(1);
		const customer = logic.getState().customer!;
		const total = orderTotal(customer.order);

		for (const good of GOODS) {
			for (let i = 0; i < (customer.order[good.id] ?? 0); i++) {
				logic.addToCart(good.id);
			}
		}

		// Level 1 is exact payment, so change should be 0.
		expect(customer.payment).toBe(total);
		logic.submitTransaction();

		expect(logic.getState().customersServed).toBe(1);
		expect(logic.getState().score).toBeGreaterThan(0);
		expect(states.some((s) => s.feedback === 'correct')).toBe(true);
	});

	it('rejects an incorrect transaction and lowers reputation', () => {
		logic.startLevel(1);
		const customer = logic.getState().customer!;

		for (const good of GOODS) {
			for (let i = 0; i < (customer.order[good.id] ?? 0); i++) {
				logic.addToCart(good.id);
			}
		}

		// Give wrong change.
		logic.addChange(25);
		const beforeReputation = logic.getState().reputation;
		logic.submitTransaction();

		expect(logic.getState().reputation).toBe(beforeReputation - 1);
		expect(states.some((s) => s.feedback === 'incorrect')).toBe(true);
		expect(logic.getState().combo).toBe(0);
	});

	it('gives correct change for non-exact payment', () => {
		logic.startLevel(2);
		const customer = logic.getState().customer!;
		const total = orderTotal(customer.order);
		const expectedChange = customer.payment - total;

		for (const good of GOODS) {
			for (let i = 0; i < (customer.order[good.id] ?? 0); i++) {
				logic.addToCart(good.id);
			}
		}

		// Build exact change from coin values.
		let remaining = expectedChange;
		for (const coin of [...COIN_VALUES].sort((a, b) => b - a)) {
			while (remaining >= coin) {
				logic.addChange(coin);
				remaining -= coin;
			}
		}

		logic.submitTransaction();
		expect(logic.getState().customersServed).toBe(1);
		expect(states.some((s) => s.feedback === 'correct')).toBe(true);
	});

	it('builds combos on fast correct answers', () => {
		logic.startLevel(1);
		for (let i = 0; i < 3; i++) {
			const customer = logic.getState().customer!;
			for (const good of GOODS) {
				for (let j = 0; j < (customer.order[good.id] ?? 0); j++) {
					logic.addToCart(good.id);
				}
			}
			logic.submitTransaction();
		}
		expect(logic.getState().combo).toBeGreaterThanOrEqual(2);
		expect(logic.getState().maxCombo).toBeGreaterThanOrEqual(2);
	});

	it('handles restock problem correctly', () => {
		logic.startLevel(3);
		// Serve customers until restock triggers.
		for (let i = 0; i < 20; i++) {
			if (logic.getState().restockProblem) break;
			const customer = logic.getState().customer;
			if (!customer) {
				logic.submitTransaction();
				continue;
			}
			for (const good of GOODS) {
				for (let j = 0; j < (customer.order[good.id] ?? 0); j++) {
					logic.addToCart(good.id);
				}
			}
			// Give correct change.
			const total = orderTotal(customer.order);
			const expectedChange = customer.payment - total;
			let remaining = expectedChange;
			for (const coin of [...COIN_VALUES].sort((a, b) => b - a)) {
				while (remaining >= coin) {
					logic.addChange(coin);
					remaining -= coin;
				}
			}
			logic.submitTransaction();
		}

		const state = logic.getState();
		expect(state.restockProblem).not.toBeNull();

		const problem = state.restockProblem!;
		logic.submitRestock(problem.answer);
		expect(logic.getState().restockProblem).toBeNull();
		expect(logic.getState().stock.dates).toBe(10);
	});

	it('penalizes wrong restock answer with time loss', () => {
		logic.startLevel(3);
		// Serve customers until restock triggers.
		for (let i = 0; i < 20; i++) {
			if (logic.getState().restockProblem) break;
			const customer = logic.getState().customer;
			if (!customer) {
				logic.submitTransaction();
				continue;
			}
			for (const good of GOODS) {
				for (let j = 0; j < (customer.order[good.id] ?? 0); j++) {
					logic.addToCart(good.id);
				}
			}
			// Give correct change.
			const total = orderTotal(customer.order);
			const expectedChange = customer.payment - total;
			let remaining = expectedChange;
			for (const coin of [...COIN_VALUES].sort((a, b) => b - a)) {
				while (remaining >= coin) {
					logic.addChange(coin);
					remaining -= coin;
				}
			}
			logic.submitTransaction();
		}

		const beforeTime = logic.getState().timeRemaining;
		logic.submitRestock(-1);
		expect(logic.getState().timeRemaining).toBeLessThan(beforeTime);
		expect(states.some((s) => s.feedback === 'incorrect')).toBe(true);
	});

	it('loses when reputation hits zero', () => {
		logic.startLevel(1);
		for (let i = 0; i < 4; i++) {
			// Submit without adding anything to cart.
			logic.submitTransaction();
		}
		const state = logic.getState();
		expect(state.phase).toBe('result');
		expect(state.stars).toBe(0);
	});

	it('generates restock problems with one correct option', () => {
		const problem = generateRestockProblem(SOUQ_LEVELS[4]);
		expect(problem.options).toContain(problem.answer);
		expect(problem.options.length).toBe(4);
	});

	it('disposes without error', () => {
		logic.startLevel(1);
		logic.dispose();
		expect(logic.getState().phase).toBe('playing'); // timer stops but state unchanged
	});
});
