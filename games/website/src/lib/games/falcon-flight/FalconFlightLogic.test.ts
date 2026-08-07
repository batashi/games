import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FalconFlightLogic, DEFAULT_FALCON_FLIGHT_CONFIG } from './FalconFlightLogic';

describe('FalconFlightLogic', () => {
	let latestState = null as ReturnType<FalconFlightLogic['getState']> | null;
	let logic: FalconFlightLogic;

	beforeEach(() => {
		latestState = null;
		logic = new FalconFlightLogic((state) => {
			latestState = state;
		});
	});

	it('starts in menu phase and startRun resets state', () => {
		expect(logic.getState().phase).toBe('menu');
		logic.startRun();
		const state = logic.getState();
		expect(state.phase).toBe('playing');
		expect(state.falcon.y).toBe(5);
		expect(state.energy).toBe(100);
		expect(state.score).toBe(0);
		expect(state.distance).toBe(0);
		expect(state.preyCount).toBe(0);
		expect(state.gameOverReason).toBeNull();
	});

	it('climbing increases y when input is active', () => {
		logic.startRun();
		const startY = logic.getState().falcon.y;
		logic.update(0.5, { active: true });
		expect(logic.getState().falcon.y).toBeGreaterThan(startY);
		expect(logic.getState().falcon.vy).toBeGreaterThan(0);
	});

	it('diving increases downward velocity when input is released', () => {
		logic.startRun();
		// Give the falcon a small upward push first.
		logic.update(0.2, { active: true });
		const vyAfterClimb = logic.getState().falcon.vy;
		logic.update(0.3, { active: false });
		expect(logic.getState().falcon.vy).toBeLessThan(vyAfterClimb);
	});

	it('prey collection adds score and energy', () => {
		logic.startRun();
		logic['energy'] = 50;
		const initialScore = logic.getState().score;
		const initialEnergy = logic.getState().energy;

		// Inject a hare directly in front of the falcon.
		logic['objects'].push({
			id: 999,
			category: 'prey',
			kind: 'hare',
			x: 0,
			y: 5,
			radius: 0.55,
			active: true
		});

		logic.update(0.05, { active: false });
		const state = logic.getState();
		expect(state.score).toBeGreaterThan(initialScore);
		expect(state.energy).toBeGreaterThan(initialEnergy);
		expect(state.preyCount).toBe(1);
	});

	it('hazard collision ends the game', () => {
		logic.startRun();
		logic['objects'].push({
			id: 998,
			category: 'hazard',
			kind: 'vulture',
			x: 0,
			y: 5,
			radius: 0.75,
			active: true
		});

		logic.update(0.05, { active: false });
		const state = logic.getState();
		expect(state.phase).toBe('result');
		expect(state.gameOverReason).toContain('النسر');
	});

	it('distance increases while playing', () => {
		logic.startRun();
		const startDistance = logic.getState().distance;
		// Advance in small steps to avoid dt clamping.
		for (let i = 0; i < 30; i++) {
			logic.update(0.05, { active: false });
		}
		expect(logic.getState().distance).toBeGreaterThan(startDistance);
	});

	it('game over on ground hit', () => {
		logic.startRun();
		// Force falcon below ground.
		logic['falcon'].y = DEFAULT_FALCON_FLIGHT_CONFIG.groundY;
		logic.update(0.05, { active: false });
		expect(logic.getState().phase).toBe('result');
		expect(logic.getState().gameOverReason).toContain('الأرض');
	});

	it('game over on flying too high', () => {
		logic.startRun();
		logic['falcon'].y = DEFAULT_FALCON_FLIGHT_CONFIG.ceilingY;
		logic.update(0.05, { active: true });
		expect(logic.getState().phase).toBe('result');
		expect(logic.getState().gameOverReason).toContain('السماء');
	});

	it('restart resets state to a fresh run', () => {
		logic.startRun();
		logic.update(2.0, { active: true });
		logic.restart();
		const state = logic.getState();
		expect(state.phase).toBe('playing');
		expect(state.distance).toBe(0);
		expect(state.score).toBe(0);
		expect(state.energy).toBe(100);
	});

	it('tailwind grants invincibility from wind hazards', () => {
		logic.startRun();
		logic['tailwindTimer'] = 2;
		logic['objects'].push({
			id: 997,
			category: 'hazard',
			kind: 'dustDevil',
			x: 0,
			y: 5,
			radius: 0.85,
			active: true
		});

		logic.update(0.05, { active: false });
		expect(logic.getState().phase).toBe('playing');
	});
});
