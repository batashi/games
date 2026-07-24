import type { FortBattleConfig, Point2D } from './FortBattleLogic';
import { arrowStartPosition } from './FortBattleLogic';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface AIShot {
	angle: number;
	power: number;
}

/**
 * Simulates a full shot with the same physics as FortBattleLogic.
 * Returns 'hit' when the arrow intersects the target fort, otherwise the
 * x position where the flight ended (ground impact or out of bounds).
 */
export function simulateShot(
	config: FortBattleConfig,
	start: Point2D,
	angleDeg: number,
	power: number,
	wind: number,
	targetFort: number
): 'hit' | number {
	const rad = (angleDeg * Math.PI) / 180;
	const speed = power * config.POWER_SCALE;
	const vel = { x: Math.cos(rad) * speed, y: Math.sin(rad) * speed };
	const pos = { ...start };
	const dt = 0.02;

	for (let i = 0; i < 1000; i++) {
		vel.x += wind * config.WIND_SCALE * dt;
		vel.y -= config.GRAVITY * dt;
		pos.x += vel.x * dt;
		pos.y += vel.y * dt;

		const dx = Math.abs(pos.x - config.FORT_X[targetFort]);
		const dy = Math.abs(pos.y - config.FORT_HEIGHT / 2);
		if (dx <= config.FORT_RADIUS + config.ARROW_RADIUS && dy <= config.FORT_HEIGHT / 2 + config.ARROW_RADIUS) {
			return 'hit';
		}

		if (pos.y <= config.GROUND_Y + config.ARROW_RADIUS) return pos.x;
		if (pos.x < config.BOUNDS.minX || pos.x > config.BOUNDS.maxX || pos.y > config.BOUNDS.maxY) return pos.x;
	}
	return pos.x;
}

/**
 * Deterministically solves an (angle, power) pair that hits the target fort,
 * fully accounting for wind. Tries a few lob angles and binary-searches power.
 */
export function solveShot(
	config: FortBattleConfig,
	shooterIndex: number,
	targetIndex: number,
	wind: number
): AIShot | null {
	const start = arrowStartPosition(config, shooterIndex);
	const baseAngles = shooterIndex === 0 ? [45, 55, 35] : [135, 125, 145];

	for (const angle of baseAngles) {
		let lo = config.MIN_POWER;
		let hi = config.MAX_POWER;

		for (let i = 0; i < 28; i++) {
			const mid = (lo + hi) / 2;
			const result = simulateShot(config, start, angle, mid, wind, targetIndex);
			if (result === 'hit') {
				return { angle, power: mid };
			}
			// Shots travelling right (+x) need more power when they land short (left of target)
			// and vice versa for shots travelling left.
			const shortOfTarget =
				shooterIndex === 0 ? result < config.FORT_X[targetIndex] : result > config.FORT_X[targetIndex];
			if (shortOfTarget) {
				lo = mid;
			} else {
				hi = mid;
			}
		}
	}
	return null;
}

/**
 * For a fixed angle, finds a power value that hits the target fort.
 * Used by aim assist: the player controls angle, the assist suggests power.
 */
export function solvePowerForAngle(
	config: FortBattleConfig,
	shooterIndex: number,
	targetIndex: number,
	wind: number,
	angleDeg: number
): number | null {
	const start = arrowStartPosition(config, shooterIndex);
	let lo = config.MIN_POWER;
	let hi = config.MAX_POWER;
	let best: number | null = null;

	for (let i = 0; i < 30; i++) {
		const mid = (lo + hi) / 2;
		const result = simulateShot(config, start, angleDeg, mid, wind, targetIndex);
		if (result === 'hit') {
			best = mid;
			hi = mid; // prefer a lower power solution
			continue;
		}

		const shortOfTarget =
			shooterIndex === 0 ? result < config.FORT_X[targetIndex] : result > config.FORT_X[targetIndex];
		if (shortOfTarget) {
			lo = mid;
		} else {
			hi = mid;
		}
	}
	return best;
}

const DIFFICULTY_ERROR: Record<AIDifficulty, { angle: number; power: number }> = {
	easy: { angle: 12, power: 22 },
	medium: { angle: 5, power: 9 },
	hard: { angle: 1.5, power: 2.5 }
};

/**
 * Computes the AI's next shot. Hard difficulty fires the near-perfect solved
 * shot (wind accounted for); easier difficulties add growing random error so
 * they miss more often.
 */
export function computeAIShot(
	config: FortBattleConfig,
	shooterIndex: number,
	targetIndex: number,
	wind: number,
	difficulty: AIDifficulty,
	rng: () => number = Math.random
): AIShot {
	const solved = solveShot(config, shooterIndex, targetIndex, wind);
	const fallback: AIShot = {
		angle: shooterIndex === 0 ? 45 : 135,
		power: (config.MIN_POWER + config.MAX_POWER) / 2
	};
	const base = solved ?? fallback;

	if (difficulty === 'hard' && solved) {
		return { angle: Math.round(base.angle), power: Math.round(base.power) };
	}

	const err = DIFFICULTY_ERROR[difficulty];
	const angleError = (rng() * 2 - 1) * err.angle;
	const powerError = (rng() * 2 - 1) * err.power;

	return {
		angle: Math.round(Math.max(config.MIN_ANGLE, Math.min(config.MAX_ANGLE, base.angle + angleError))),
		power: Math.round(Math.max(config.MIN_POWER, Math.min(config.MAX_POWER, base.power + powerError)))
	};
}
