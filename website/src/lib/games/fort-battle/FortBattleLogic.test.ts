import { describe, it, expect, vi } from 'vitest';
import { FortBattleLogic, DEFAULT_FORT_BATTLE_CONFIG } from './FortBattleLogic';

function createLogic(config?: Partial<typeof DEFAULT_FORT_BATTLE_CONFIG>) {
	const onChange = vi.fn();
	const logic = new FortBattleLogic(onChange, config);
	return { logic, onChange };
}

describe('FortBattleLogic', () => {
	describe('initial state', () => {
		it('starts with full health and player 0 aiming', () => {
			const { logic } = createLogic();
			const state = logic.getState();

			expect(state.healths).toEqual([100, 100]);
			expect(state.currentPlayer).toBe(0);
			expect(state.gameState).toBe('aiming');
			expect(state.winner).toBeNull();
			expect(state.angle).toBe(45);
			expect(state.power).toBe(10);
			expect(state.difficulty).toBe('medium');
			expect(state.powerShotActive).toBe(false);
		});

		it('notifies on creation', () => {
			const { onChange } = createLogic();
			expect(onChange).toHaveBeenCalled();
		});
	});

	describe('difficulty', () => {
		it('applies medium defaults', () => {
			const { logic } = createLogic();
			const config = logic.getConfig();
			expect(config.difficulty).toBe('medium');
			expect(config.GIFT_SPAWN_CHANCE).toBe(0.3);
			expect(config.MAX_WIND).toBe(3);
		});

		it('applies easy and hard parameters', () => {
			const easy = createLogic({ difficulty: 'easy' }).logic.getConfig();
			expect(easy.GIFT_SPAWN_CHANCE).toBe(0.5);
			expect(easy.MAX_WIND).toBe(2);

			const hard = createLogic({ difficulty: 'hard' }).logic.getConfig();
			expect(hard.GIFT_SPAWN_CHANCE).toBe(0.15);
			expect(hard.MAX_WIND).toBe(4);
		});

		it('clamps wind magnitude to the difficulty cap', () => {
			const { logic } = createLogic({ difficulty: 'hard' });
			for (let i = 0; i < 30; i++) {
				logic.resetGame();
				expect(Math.abs(logic.getState().wind)).toBeLessThanOrEqual(4);
			}
		});
	});

	describe('air gifts', () => {
		it('spawns a gift when chance is 1', () => {
			const { logic } = createLogic({ GIFT_SPAWN_CHANCE: 1 });
			expect(logic.getGift()).not.toBeNull();
			expect(logic.getState().gift).not.toBeNull();
		});

		it('does not spawn a gift when chance is 0', () => {
			const { logic } = createLogic({ GIFT_SPAWN_CHANCE: 0 });
			expect(logic.getGift()).toBeNull();
		});

		it('gift falls over time', () => {
			const { logic } = createLogic({ GIFT_SPAWN_CHANCE: 1, GIFT_FALL_SPEED: 5 });
			const startY = logic.getGift()!.position.y;
			logic.updateGift(0.5);
			expect(logic.getGift()!.position.y).toBeLessThan(startY);
		});

		it('collecting a health gift restores health up to the cap', () => {
			const { logic } = createLogic({
				GIFT_SPAWN_CHANCE: 1,
				INITIAL_HEALTH: 80,
				WIND_SCALE: 0
			});
			const gift = logic.getGift()!;
			gift.type = 'health';

			logic.startCharge();
			logic.updateCharge(2);
			logic.releaseCharge();

			while (logic.getState().gameState === 'flying') {
				gift.position = { ...logic.getArrowPosition() };
				logic.updateFlight(0.05);
			}

			const state = logic.getState();
			expect(state.healths[0]).toBe(80); // current player was already at cap after reset
			expect(state.message).toContain('+25');
		});

		it('collecting a power gift doubles the next shot damage', () => {
			const { logic } = createLogic({ GIFT_SPAWN_CHANCE: 1, WIND_SCALE: 0 });
			const gift = logic.getGift()!;
			gift.type = 'power';

			logic.startCharge();
			logic.updateCharge(2);
			logic.releaseCharge();

			while (logic.getState().gameState === 'flying') {
				gift.position = { ...logic.getArrowPosition() };
				logic.updateFlight(0.05);
			}

			expect(logic.getState().powerShotActive).toBe(true);

			// Next turn: fire a powered shot at the enemy fort.
			logic.startCharge();
			logic.updateCharge(2);
			logic.releaseCharge();

			for (let i = 0; i < 400 && logic.getState().gameState === 'flying'; i++) {
				logic.updateFlight(0.05);
			}

			expect(logic.getState().healths[0]).toBe(50); // player 1 hit player 0 with 50 damage
		});

		it('missed gifts disappear when they hit the ground', () => {
			const { logic } = createLogic({ GIFT_SPAWN_CHANCE: 1, GIFT_FALL_SPEED: 50 });
			while (logic.getGift()) {
				logic.updateGift(0.1);
			}
			expect(logic.getState().message).toContain('فاتتك');
		});
	});

	describe('aiming', () => {
		it('adjusts angle within bounds', () => {
			const { logic } = createLogic();
			logic.adjustAngle(10);
			expect(logic.getState().angle).toBe(55);

			logic.adjustAngle(-100);
			expect(logic.getState().angle).toBe(10);

			logic.adjustAngle(200);
			expect(logic.getState().angle).toBe(170);
		});

		it('sets angle directly', () => {
			const { logic } = createLogic();
			logic.setAngle(60);
			expect(logic.getState().angle).toBe(60);
		});

		it('clamps setAngle to min/max', () => {
			const { logic } = createLogic();
			logic.setAngle(5);
			expect(logic.getState().angle).toBe(10);

			logic.setAngle(180);
			expect(logic.getState().angle).toBe(170);
		});

		it('ignores angle changes while flying', () => {
			const { logic } = createLogic();
			logic.startCharge();
			logic.updateCharge(0.5);
			logic.releaseCharge();
			expect(logic.getState().gameState).toBe('flying');

			logic.adjustAngle(20);
			expect(logic.getState().angle).toBe(45);
		});
	});

	describe('charging and firing', () => {
		it('charges power over time', () => {
			const { logic } = createLogic();
			logic.startCharge();
			logic.updateCharge(0.7);

			const state = logic.getState();
			expect(state.power).toBeGreaterThan(10);
			expect(state.power).toBeLessThanOrEqual(100);
		});

		it('caps power at max', () => {
			const { logic } = createLogic();
			logic.startCharge();
			logic.updateCharge(10);

			expect(logic.getState().power).toBe(100);
		});

		it('fires and enters flying state', () => {
			const { logic } = createLogic();
			logic.startCharge();
			logic.updateCharge(1);
			logic.releaseCharge();

			expect(logic.getState().gameState).toBe('flying');
			expect(logic.isArrowFlying()).toBe(true);
			expect(logic.getArrowVelocity().x).toBeGreaterThan(0);
		});

		it('cannot start charge while flying', () => {
			const { logic } = createLogic();
			logic.startCharge();
			logic.releaseCharge();
			logic.startCharge();

			expect(logic.isCharging()).toBe(false);
		});
	});

	describe('physics', () => {
		it('arrow moves and gravity pulls it down', () => {
			const { logic } = createLogic();
			logic.setAngle(45);
			logic.startCharge();
			logic.updateCharge(1);
			logic.releaseCharge();

			const posBefore = logic.getArrowPosition();
			const velBefore = logic.getArrowVelocity();

			logic.updateFlight(0.1);

			const posAfter = logic.getArrowPosition();
			const velAfter = logic.getArrowVelocity();

			expect(posAfter.x).toBeGreaterThan(posBefore.x);
			expect(velAfter.y).toBeLessThan(velBefore.y);
		});

		it('wind accelerates the arrow horizontally', () => {
			const { logic } = createLogic();
			logic.startCharge();
			logic.updateCharge(1);
			logic.releaseCharge();

			const wind = logic.getState().wind;
			const vxBefore = logic.getArrowVelocity().x;
			logic.updateFlight(0.1);
			const vxAfter = logic.getArrowVelocity().x;

			if (wind > 0) expect(vxAfter).toBeGreaterThan(vxBefore);
			else if (wind < 0) expect(vxAfter).toBeLessThan(vxBefore);
			else expect(vxAfter).toBeCloseTo(vxBefore, 5);
		});

		it('computes a downward-curving trajectory', () => {
			const { logic } = createLogic();
			logic.setAngle(45);
			logic.startCharge();
			logic.updateCharge(1);

			const trajectory = logic.computeTrajectory(20);
			expect(trajectory.length).toBe(21);
			expect(trajectory[0].x).toBeLessThan(trajectory[20].x);
			// Eventually gravity should pull the arc down below the start height.
			expect(trajectory[20].y).toBeLessThan(trajectory[0].y);
		});
	});

	describe('collisions and turns', () => {
		it('hits the ground as a miss', () => {
			const { logic, onChange } = createLogic();
			logic.setAngle(10);
			logic.startCharge();
			logic.updateCharge(0.2);
			logic.releaseCharge();

			// Step until ground hit
			for (let i = 0; i < 200; i++) {
				logic.updateFlight(0.05);
				if (logic.getState().gameState !== 'flying') break;
			}

			const state = logic.getState();
			expect(state.gameState).toBe('aiming');
			expect(state.currentPlayer).toBe(1);
			expect(state.message).toContain('الأرض');
		});

		it('hits the enemy fort and deals damage', () => {
			// Remove random wind and gifts so the default 45° shot is deterministic.
			const { logic } = createLogic({ WIND_SCALE: 0, GIFT_SPAWN_CHANCE: 0 });
			logic.startCharge();
			logic.updateCharge(2); // max power
			logic.releaseCharge();

			for (let i = 0; i < 400; i++) {
				logic.updateFlight(0.05);
				if (logic.getState().gameState !== 'flying') break;
			}

			const state = logic.getState();
			expect(state.healths[1]).toBe(75); // player 0 hit player 1
			expect(state.currentPlayer).toBe(1);
		});

		it('declares a winner after two hits', () => {
			// Reduce health and remove wind/gifts so player 0 wins on its second successful hit.
			const { logic } = createLogic({
				INITIAL_HEALTH: 50,
				DAMAGE: 25,
				WIND_SCALE: 0,
				GIFT_SPAWN_CHANCE: 0
			});

			let turns = 0;
			while (logic.getState().gameState !== 'gameover' && turns < 20) {
				// Use the default player angles (45° and 135°) with max power; these
				// are tuned to reach the enemy fort in the default layout.
				logic.startCharge();
				logic.updateCharge(2);
				logic.releaseCharge();

				for (let step = 0; step < 400 && logic.getState().gameState === 'flying'; step++) {
					logic.updateFlight(0.05);
				}
				turns++;
			}

			const state = logic.getState();
			expect(state.healths[1]).toBe(0);
			expect(state.gameState).toBe('gameover');
			expect(state.winner).toBe(0);
		});
	});

	describe('reset', () => {
		it('resets the entire game', () => {
			const { logic } = createLogic();
			logic.startCharge();
			logic.updateCharge(1);
			logic.releaseCharge();
			logic.updateFlight(0.1);

			logic.resetGame();

			const state = logic.getState();
			expect(state.healths).toEqual([100, 100]);
			expect(state.currentPlayer).toBe(0);
			expect(state.gameState).toBe('aiming');
			expect(state.winner).toBeNull();
		});
	});
});
