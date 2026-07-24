import { describe, it, expect, vi } from 'vitest';
import {
	SouqManagerLogic,
	DEFAULT_SOUQ_MANAGER_CONFIG,
	SOUQ_GOODS,
	SOUQ_LEVELS,
	type SouqManagerConfig
} from './SouqManagerLogic';

function createLogic(config?: SouqManagerConfig) {
	const onChange = vi.fn();
	const callbacks = {
		onCoinCollected: vi.fn(),
		onCustomerServed: vi.fn(),
		onLevelComplete: vi.fn(),
		onLevelFailed: vi.fn(),
		onWorkerHired: vi.fn()
	};
	const logic = new SouqManagerLogic(onChange, config, callbacks);
	return { logic, onChange, callbacks };
}

function simulateTime(logic: SouqManagerLogic, seconds: number): void {
	const steps = Math.ceil(seconds / 0.05);
	for (let i = 0; i < steps; i++) logic.update(0.05);
}

describe('SouqManagerLogic', () => {
	describe('initial state', () => {
		it('starts in menu state with sensible defaults', () => {
			const { logic } = createLogic();
			const state = logic.getState();

			expect(state.gameState).toBe('menu');
			expect(state.level).toBe(1);
			expect(state.coins).toBe(0);
			expect(state.customers).toHaveLength(0);
			expect(state.workers).toHaveLength(0);
			expect(state.player.carrying).toBeNull();
		});

		it('notifies on creation', () => {
			const { onChange } = createLogic();
			expect(onChange).toHaveBeenCalled();
		});

		it('uses default config values', () => {
			const { logic } = createLogic();
			const config = logic.getConfig();
			expect(config.playerSpeed).toBe(DEFAULT_SOUQ_MANAGER_CONFIG.playerSpeed);
			expect(config.maxWorkers).toBe(DEFAULT_SOUQ_MANAGER_CONFIG.maxWorkers);
		});
	});

	describe('level flow', () => {
		it('starts level 1 with correct targets', () => {
			const { logic } = createLogic();
			logic.startLevel(1);
			const state = logic.getState();

			expect(state.gameState).toBe('playing');
			expect(state.level).toBe(1);
			expect(state.targetCoins).toBe(SOUQ_LEVELS[0].targetCoins);
			expect(state.timeRemaining).toBe(SOUQ_LEVELS[0].durationSeconds);
			expect(state.shelves).toHaveLength(SOUQ_LEVELS[0].shelfCount);
		});

		it('restarts the current level', () => {
			const { logic } = createLogic();
			logic.startLevel(2);
			logic.restartLevel();
			const state = logic.getState();
			expect(state.level).toBe(2);
			expect(state.gameState).toBe('playing');
			expect(state.coins).toBe(0);
		});
	});

	describe('crate and stocking', () => {
		it('spawns a good after the crate interval', () => {
			const { logic } = createLogic({ crateSpawnInterval: 1 });
			logic.startLevel(1);
			expect(logic.getState().crate.nextGood).toBeNull();

			simulateTime(logic, 1.1);
			expect(logic.getState().crate.nextGood).not.toBeNull();
		});

		it('player can pick from crate and place on shelf', () => {
			const { logic } = createLogic({ crateSpawnInterval: 0.1, playerSpeed: 20 });
			logic.startLevel(1);
			simulateTime(logic, 0.2);

			const good = logic.getState().crate.nextGood;
			expect(good).not.toBeNull();

			logic.movePlayerToCrate();
			simulateTime(logic, 1);

			expect(logic.getState().player.carrying).toBe(good);

			logic.movePlayerToShelf(0);
			simulateTime(logic, 1);

			expect(logic.getState().player.carrying).toBeNull();
			expect(logic.getState().shelves[0].goods).toContain(good);
		});

		it('does not place on a full shelf', () => {
			const { logic } = createLogic({ crateSpawnInterval: 0.1, playerSpeed: 50 });
			logic.startLevel(1);
			// Level 1 shelf capacity is 4.
			for (let i = 0; i < 5; i++) {
				simulateTime(logic, 0.2);
				logic.movePlayerToCrate();
				simulateTime(logic, 0.5);
				logic.movePlayerToShelf(0);
				simulateTime(logic, 0.5);
			}
			expect(logic.getState().shelves[0].goods.length).toBeLessThanOrEqual(4);
		});
	});

	describe('customers', () => {
		it('spawns customers up to the level maximum', () => {
			const { logic } = createLogic({ crateSpawnInterval: 0.1 });
			logic.startLevel(1);
			simulateTime(logic, 30);
			expect(logic.getState().customers.length).toBeLessThanOrEqual(SOUQ_LEVELS[0].maxCustomers);
		});

		it('customer picks a desired good from unlocked goods', () => {
			const { logic } = createLogic({ crateSpawnInterval: 0.1 });
			logic.startLevel(1);
			simulateTime(logic, 6);
			const state = logic.getState();
			expect(state.customers.length).toBeGreaterThan(0);
			expect(SOUQ_LEVELS[0].unlockedGoods).toContain(state.customers[0].desiredGood);
		});

		it('customer buys a stocked item and moves to cashier', () => {
			const { logic, callbacks } = createLogic({
				crateSpawnInterval: 0.1,
				playerSpeed: 50,
				customerSpeed: 50,
				customerPatience: 60
			});
			logic.startLevel(1);

			// Stock shelf 0.
			simulateTime(logic, 0.2);
			logic.movePlayerToCrate();
			simulateTime(logic, 0.2);
			logic.movePlayerToShelf(0);
			simulateTime(logic, 0.2);

			// Wait for a customer to spawn and make it desire the stocked good.
			simulateTime(logic, 6);
			expect(logic['customers'].length).toBeGreaterThan(0);
			const stockedGood = logic.getState().shelves[0].goods[0];
			logic['customers'][0].desiredGood = stockedGood;
			logic['customers'][0].state = 'entering';
			logic['customers'][0].target = null;

			// Let the customer shop and walk to cashier.
			simulateTime(logic, 3);

			const state = logic.getState();
			expect(state.cashierMat.queue.length).toBeGreaterThan(0);
			expect(callbacks.onCustomerServed).not.toHaveBeenCalled();
		});
	});

	describe('cashier and payments', () => {
		it('collects payment when player reaches cashier mat', () => {
			const { logic, callbacks } = createLogic({
				crateSpawnInterval: 0.1,
				playerSpeed: 50,
				customerSpeed: 50,
				customerPatience: 60
			});
			logic.startLevel(1);

			// Place a customer directly at the cashier mat ready to pay.
			const customerId = 99;
			logic['customers'].push({
				id: customerId,
				position: { x: 5, y: -3 },
				target: null,
				state: 'paying',
				desiredGood: 'dates',
				patience: 60,
				paid: false
			});
			logic['cashierMat'].queue.push(customerId);

			const beforeCoins = logic.getState().coins;
			logic.movePlayerToCashier();
			simulateTime(logic, 2);

			const state = logic.getState();
			expect(state.coins).toBe(beforeCoins + SOUQ_GOODS.dates.price);
			expect(callbacks.onCoinCollected).toHaveBeenCalled();
			expect(callbacks.onCustomerServed).toHaveBeenCalled();
		});
	});

	describe('workers', () => {
		it('can hire a worker when enough coins', () => {
			const { logic, callbacks } = createLogic();
			logic.startLevel(1);
			logic['coins'] = 100;
			const hired = logic.hireWorker('restocker');

			expect(hired).toBe(true);
			expect(logic.getState().workers).toHaveLength(1);
			expect(callbacks.onWorkerHired).toHaveBeenCalledWith('restocker');
		});

		it('cannot hire a worker without enough coins', () => {
			const { logic } = createLogic();
			logic.startLevel(1);
			const hired = logic.hireWorker('cashier');
			expect(hired).toBe(false);
			expect(logic.getState().workers).toHaveLength(0);
		});

		it('enforces max worker limit', () => {
			const { logic } = createLogic({ maxWorkers: 1 });
			logic.startLevel(1);
			logic['coins'] = 200;
			logic.hireWorker('restocker');
			const hired = logic.hireWorker('cashier');
			expect(hired).toBe(false);
		});

		it('restocker moves goods from crate to shelf', () => {
			const { logic } = createLogic({
				crateSpawnInterval: 0.1,
				workerSpeed: 50,
				maxWorkers: 2
			});
			logic.startLevel(1);
			logic['coins'] = 100;
			logic.hireWorker('restocker');

			simulateTime(logic, 3);

			expect(logic.getState().shelves.some((s) => s.goods.length > 0)).toBe(true);
		});
	});

	describe('upgrades', () => {
		it('upgrades player speed', () => {
			const { logic } = createLogic();
			logic.startLevel(1);
			logic['coins'] = 100;
			const beforeSpeed = logic.getState().player.speed;
			const upgraded = logic.upgradePlayerSpeed();

			expect(upgraded).toBe(true);
			expect(logic.getState().player.speed).toBe(beforeSpeed + 1);
		});

		it('upgrades player capacity', () => {
			const { logic } = createLogic();
			logic.startLevel(1);
			logic['coins'] = 100;
			const beforeCapacity = logic.getState().player.capacity;
			const upgraded = logic.upgradePlayerCapacity();

			expect(upgraded).toBe(true);
			expect(logic.getState().player.capacity).toBe(beforeCapacity + 1);
		});
	});

	describe('level end and stars', () => {
		it('completes level when target coins are earned', () => {
			const { logic, callbacks } = createLogic();
			logic.startLevel(1);
			logic['totalCoinsEarned'] = SOUQ_LEVELS[0].targetCoins;
			logic.update(0.05);

			const state = logic.getState();
			expect(state.gameState).toBe('levelComplete');
			expect(state.stars).toBe(1);
			expect(callbacks.onLevelComplete).toHaveBeenCalledWith(1);
		});

		it('awards two stars at 120% target', () => {
			const { logic } = createLogic();
			logic.startLevel(1);
			logic['totalCoinsEarned'] = Math.floor(SOUQ_LEVELS[0].targetCoins * 1.2);
			logic.update(0.05);
			expect(logic.getState().stars).toBe(2);
		});

		it('awards three stars at 150% target', () => {
			const { logic } = createLogic();
			logic.startLevel(1);
			logic['totalCoinsEarned'] = Math.floor(SOUQ_LEVELS[0].targetCoins * 1.5);
			logic.update(0.05);
			expect(logic.getState().stars).toBe(3);
		});

		it('fails level when time runs out', () => {
			const { logic, callbacks } = createLogic();
			logic.startLevel(1);
			logic['timeRemaining'] = 0;
			logic.update(0.05);

			const state = logic.getState();
			expect(state.gameState).toBe('levelFailed');
			expect(state.stars).toBe(0);
			expect(callbacks.onLevelFailed).toHaveBeenCalled();
		});
	});
});
