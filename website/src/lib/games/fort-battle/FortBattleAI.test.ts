import { describe, it, expect } from 'vitest';
import { DEFAULT_FORT_BATTLE_CONFIG, arrowStartPosition } from './FortBattleLogic';
import { computeAIShot, simulateShot, solveShot } from './FortBattleAI';

const config = DEFAULT_FORT_BATTLE_CONFIG;

describe('FortBattleAI', () => {
	describe('solveShot', () => {
		it('finds a hitting shot for the AI (player 1) across all wind values', () => {
			for (let wind = -3; wind <= 3; wind++) {
				const shot = solveShot(config, 1, 0, wind);
				expect(shot, `wind=${wind}`).not.toBeNull();
				const start = arrowStartPosition(config, 1);
				expect(simulateShot(config, start, shot!.angle, shot!.power, wind, 0), `wind=${wind}`).toBe('hit');
			}
		});

		it('finds a hitting shot for player 0 across all wind values', () => {
			for (let wind = -3; wind <= 3; wind++) {
				const shot = solveShot(config, 0, 1, wind);
				expect(shot, `wind=${wind}`).not.toBeNull();
				const start = arrowStartPosition(config, 0);
				expect(simulateShot(config, start, shot!.angle, shot!.power, wind, 1), `wind=${wind}`).toBe('hit');
			}
		});
	});

	describe('computeAIShot', () => {
		it('hard difficulty fires the solved shot and hits', () => {
			for (let wind = -3; wind <= 3; wind++) {
				const shot = computeAIShot(config, 1, 0, wind, 'hard');
				const start = arrowStartPosition(config, 1);
				expect(simulateShot(config, start, shot.angle, shot.power, wind, 0), `wind=${wind}`).toBe('hit');
			}
		});

		it('keeps results within config bounds', () => {
			for (const difficulty of ['easy', 'medium', 'hard'] as const) {
				const shot = computeAIShot(config, 1, 0, 2, difficulty);
				expect(shot.angle).toBeGreaterThanOrEqual(config.MIN_ANGLE);
				expect(shot.angle).toBeLessThanOrEqual(config.MAX_ANGLE);
				expect(shot.power).toBeGreaterThanOrEqual(config.MIN_POWER);
				expect(shot.power).toBeLessThanOrEqual(config.MAX_POWER);
			}
		});

		it('applies larger error on easy than medium for the same rng', () => {
			const rng = () => 1; // maximum positive error
			const easyShot = computeAIShot(config, 1, 0, 0, 'easy', rng);
			const mediumShot = computeAIShot(config, 1, 0, 0, 'medium', rng);
			const base = solveShot(config, 1, 0, 0)!;

			expect(Math.abs(easyShot.power - base.power)).toBeGreaterThan(Math.abs(mediumShot.power - base.power));
		});
	});
});
