import { describe, it, expect, vi } from 'vitest';
import {
	SouqManagerLogic,
	DEFAULT_SOUQ_MANAGER_CONFIG,
	SOUQ_LEVELS,
	GOOD_PRICES,
	type SouqManagerConfig,
	type StationType,
	type Item
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

function stationByType(logic: SouqManagerLogic, type: StationType) {
	return logic.getState().stations.find((s) => s.type === type)!;
}

describe('SouqManagerLogic', () => {
	describe('initial state', () => {
		it('starts in menu state', () => {
			const { logic } = createLogic();
			const state = logic.getState();
			expect(state.gameState).toBe('menu');
			expect(state.level).toBe(1);
			expect(state.coins).toBe(0);
			expect(state.customers).toHaveLength(0);
			expect(state.workers).toHaveLength(0);
			expect(state.player.carrying).toBeNull();
		});

		it('creates all production stations', () => {
			const { logic } = createLogic();
			const types = logic.getState().stations.map((s) => s.type);
			expect(types).toContain('palmPlot');
			expect(types).toContain('dryingMat');
			expect(types).toContain('packagingTable');
			expect(types).toContain('brazier');
			expect(types).toContain('mortar');
			expect(types).toContain('dallah');
			expect(types).toContain('sortingMat');
			expect(types).toContain('greenBeans');
			expect(types).toContain('rawResin');
		});
	});

	describe('level flow', () => {
		it('starts level 1 with dates only', () => {
			const { logic } = createLogic();
			logic.startLevel(1);
			const state = logic.getState();
			expect(state.gameState).toBe('playing');
			expect(state.unlockedGoods).toEqual(['dates']);
			expect(state.targetCoins).toBe(SOUQ_LEVELS[0].targetCoins);
		});

		it('unlocks luban and qahwa in later levels', () => {
			const { logic } = createLogic();
			logic.startLevel(2);
			expect(logic.getState().unlockedGoods).toEqual(['dates', 'luban']);
			logic.startLevel(3);
			expect(logic.getState().unlockedGoods).toEqual(['dates', 'luban', 'qahwa']);
		});
	});

	describe('dates production chain', () => {
		it('plants a sapling and harvests fresh dates', () => {
			const { logic } = createLogic({ playerSpeed: 50 });
			logic.startLevel(1);
			const palm = stationByType(logic, 'palmPlot');

			logic.movePlayerToStation(palm.id);
			simulateTime(logic, 1);

			let state = logic.getState();
			expect(state.stations.find((s) => s.id === palm.id)?.status).toBe('processing');

			simulateTime(logic, 5);
			state = logic.getState();
			expect(state.stations.find((s) => s.id === palm.id)?.status).toBe('ready');

			logic.movePlayerToStation(palm.id);
			simulateTime(logic, 1);
			expect(logic.getState().player.carrying).toEqual({ type: 'dates', stage: 'fresh' });
		});

		it('dries and packs dates for the shelf', () => {
			const { logic } = createLogic({ playerSpeed: 50 });
			logic.startLevel(1);

			// Plant and harvest.
			const palm = stationByType(logic, 'palmPlot');
			logic.movePlayerToStation(palm.id);
			simulateTime(logic, 6);
			logic.movePlayerToStation(palm.id);
			simulateTime(logic, 1);

			// Dry.
			const drying = stationByType(logic, 'dryingMat');
			logic.movePlayerToStation(drying.id);
			simulateTime(logic, 1);
			logic.unloadAtContext();
			simulateTime(logic, 4);

			// Collect dried dates.
			logic.movePlayerToStation(drying.id);
			simulateTime(logic, 1);
			expect(logic.getState().player.carrying).toEqual({ type: 'dates', stage: 'dried' });

			// Pack.
			const packaging = stationByType(logic, 'packagingTable');
			logic.movePlayerToStation(packaging.id);
			simulateTime(logic, 1);
			logic.unloadAtContext();
			simulateTime(logic, 3);

			// Collect packed dates.
			logic.movePlayerToStation(packaging.id);
			simulateTime(logic, 1);
			expect(logic.getState().player.carrying).toEqual({ type: 'dates', stage: 'packed' });

			// Place on shelf.
			const shelf = logic.getState().shelves[0];
			logic.movePlayerToShelf(shelf.id);
			simulateTime(logic, 1);
			logic.unloadAtContext();
			expect(logic.getState().shelves[0].items).toContainEqual({ type: 'dates', stage: 'packed' });
		});
	});

	describe('qahwa production chain', () => {
		it('produces brewed qahwa from green beans', () => {
			const { logic } = createLogic({ playerSpeed: 50 });
			logic.startLevel(3);

			// Take green beans.
			const beans = stationByType(logic, 'greenBeans');
			logic.movePlayerToStation(beans.id);
			simulateTime(logic, 1);
			expect(logic.getState().player.carrying).toEqual({ type: 'qahwa', stage: 'beans' });

			// Roast.
			const brazier = stationByType(logic, 'brazier');
			logic.movePlayerToStation(brazier.id);
			simulateTime(logic, 1);
			logic.unloadAtContext();
			simulateTime(logic, 4);
			logic.movePlayerToStation(brazier.id);
			simulateTime(logic, 1);
			expect(logic.getState().player.carrying).toEqual({ type: 'qahwa', stage: 'roasted' });

			// Grind.
			const mortar = stationByType(logic, 'mortar');
			logic.movePlayerToStation(mortar.id);
			simulateTime(logic, 1);
			logic.unloadAtContext();
			simulateTime(logic, 3);
			logic.movePlayerToStation(mortar.id);
			simulateTime(logic, 1);
			expect(logic.getState().player.carrying).toEqual({ type: 'qahwa', stage: 'ground' });

			// Brew.
			const dallah = stationByType(logic, 'dallah');
			logic.movePlayerToStation(dallah.id);
			simulateTime(logic, 1);
			logic.unloadAtContext();
			simulateTime(logic, 4);
			logic.movePlayerToStation(dallah.id);
			simulateTime(logic, 1);
			expect(logic.getState().player.carrying).toEqual({ type: 'qahwa', stage: 'brewed' });
		});
	});

	describe('luban production chain', () => {
		it('produces packed luban from raw resin', () => {
			const { logic } = createLogic({ playerSpeed: 50 });
			logic.startLevel(2);

			const raw = stationByType(logic, 'rawResin');
			logic.movePlayerToStation(raw.id);
			simulateTime(logic, 1);
			expect(logic.getState().player.carrying).toEqual({ type: 'luban', stage: 'rawResin' });

			const sorting = stationByType(logic, 'sortingMat');
			logic.movePlayerToStation(sorting.id);
			simulateTime(logic, 1);
			logic.unloadAtContext();
			simulateTime(logic, 3);
			logic.movePlayerToStation(sorting.id);
			simulateTime(logic, 1);
			expect(logic.getState().player.carrying).toEqual({ type: 'luban', stage: 'sorted' });

			const packaging = stationByType(logic, 'packagingTable');
			logic.movePlayerToStation(packaging.id);
			simulateTime(logic, 1);
			logic.unloadAtContext();
			simulateTime(logic, 3);
			logic.movePlayerToStation(packaging.id);
			simulateTime(logic, 1);
			expect(logic.getState().player.carrying).toEqual({ type: 'luban', stage: 'packed' });
		});
	});

	describe('customers and payments', () => {
		it('customer buys packed dates and pays at cashier', () => {
			const { logic, callbacks } = createLogic({
				playerSpeed: 50,
				customerSpeed: 50,
				customerPatience: 60
			});
			logic.startLevel(1);

			// Stock shelf with packed dates manually for deterministic test.
			logic['shelves'][0].items.push({ type: 'dates', stage: 'packed' });

			// Spawn and direct a customer to dates.
			simulateTime(logic, 7);
			expect(logic['customers'].length).toBeGreaterThan(0);
			logic['customers'][0].desiredGood = 'dates';
			logic['customers'][0].state = 'entering';
			logic['customers'][0].target = null;

			// Let customer shop and queue.
			simulateTime(logic, 3);
			expect(logic.getState().cashierMat.queue.length).toBeGreaterThan(0);

			// Collect payment.
			const beforeCoins = logic.getState().coins;
			logic.movePlayerToCashier();
			simulateTime(logic, 2);

			expect(logic.getState().coins).toBe(beforeCoins + GOOD_PRICES.dates);
			expect(callbacks.onCoinCollected).toHaveBeenCalled();
			expect(callbacks.onCustomerServed).toHaveBeenCalled();
		});
	});

	describe('workers', () => {
		it('hires a worker and assigns to a station', () => {
			const { logic, callbacks } = createLogic();
			logic.startLevel(1);
			logic['coins'] = 100;
			const palm = stationByType(logic, 'palmPlot');
			const hired = logic.hireWorker(palm.id);

			expect(hired).toBe(true);
			expect(logic.getState().workers).toHaveLength(1);
			expect(logic.getState().stations.find((s) => s.id === palm.id)?.assignedWorkerId).not.toBeNull();
			expect(callbacks.onWorkerHired).toHaveBeenCalled();
		});

		it('worker speeds up palm plot processing', () => {
			const { logic } = createLogic({ playerSpeed: 50 });
			logic.startLevel(1);
			logic['coins'] = 100;
			const palm = stationByType(logic, 'palmPlot');
			logic.hireWorker(palm.id);

			logic.movePlayerToStation(palm.id);
			simulateTime(logic, 1);

			// With worker bonus, palm should finish in ~4 seconds instead of 4.
			simulateTime(logic, 3);
			expect(logic.getState().stations.find((s) => s.id === palm.id)?.status).toBe('ready');
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
