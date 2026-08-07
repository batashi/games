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

function stationByTypeNear(logic: SouqManagerLogic, type: StationType, x: number, y: number) {
	return logic.getState().stations.find(
		(s) => s.type === type && Math.abs(s.position.x - x) < 1 && Math.abs(s.position.y - y) < 1
	)!;
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

			// Dry (auto-unload on arrival).
			const drying = stationByType(logic, 'dryingMat');
			logic.movePlayerToStation(drying.id);
			simulateTime(logic, 1);
			simulateTime(logic, 4);

			// Collect dried dates.
			logic.movePlayerToStation(drying.id);
			simulateTime(logic, 1);
			expect(logic.getState().player.carrying).toEqual({ type: 'dates', stage: 'dried' });

			// Pack (auto-unload on arrival).
			const packaging = stationByTypeNear(logic, 'packagingTable', -3, 6);
			logic.movePlayerToStation(packaging.id);
			simulateTime(logic, 1);
			simulateTime(logic, 3);

			// Collect packed dates.
			logic.movePlayerToStation(packaging.id);
			simulateTime(logic, 1);
			expect(logic.getState().player.carrying).toEqual({ type: 'dates', stage: 'packed' });

			// Place on shelf (auto-unload on arrival).
			const shelf = logic.getState().shelves[0];
			logic.movePlayerToShelf(shelf.id);
			simulateTime(logic, 1);
			expect(logic.getState().shelves[0].items).toContainEqual({ type: 'dates', stage: 'packed' });
		});

		it('auto-unloads carried items when arriving at a valid station or shelf', () => {
			const { logic } = createLogic({ playerSpeed: 50 });
			logic.startLevel(1);

			// Harvest fresh dates.
			const palm = stationByType(logic, 'palmPlot');
			logic.movePlayerToStation(palm.id);
			simulateTime(logic, 6);
			logic.movePlayerToStation(palm.id);
			simulateTime(logic, 1);
			expect(logic.getState().player.carrying).toEqual({ type: 'dates', stage: 'fresh' });

			// Walking to the drying mat should deposit them automatically.
			const drying = stationByType(logic, 'dryingMat');
			logic.movePlayerToStation(drying.id);
			simulateTime(logic, 1);
			expect(logic.getState().player.carrying).toBeNull();
			expect(logic.getState().stations.find((s) => s.id === drying.id)?.status).toBe('processing');
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

			// Roast (auto-unload on arrival).
			const brazier = stationByType(logic, 'brazier');
			logic.movePlayerToStation(brazier.id);
			simulateTime(logic, 1);
			simulateTime(logic, 4);
			logic.movePlayerToStation(brazier.id);
			simulateTime(logic, 1);
			expect(logic.getState().player.carrying).toEqual({ type: 'qahwa', stage: 'roasted' });

			// Grind (auto-unload on arrival).
			const mortar = stationByType(logic, 'mortar');
			logic.movePlayerToStation(mortar.id);
			simulateTime(logic, 1);
			simulateTime(logic, 3);
			logic.movePlayerToStation(mortar.id);
			simulateTime(logic, 1);
			expect(logic.getState().player.carrying).toEqual({ type: 'qahwa', stage: 'ground' });

			// Brew (auto-unload on arrival).
			const dallah = stationByType(logic, 'dallah');
			logic.movePlayerToStation(dallah.id);
			simulateTime(logic, 1);
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
			simulateTime(logic, 3);
			logic.movePlayerToStation(sorting.id);
			simulateTime(logic, 1);
			expect(logic.getState().player.carrying).toEqual({ type: 'luban', stage: 'sorted' });

			const packaging = stationByTypeNear(logic, 'packagingTable', 6, 0);
			logic.movePlayerToStation(packaging.id);
			simulateTime(logic, 1);
			simulateTime(logic, 3);
			logic.movePlayerToStation(packaging.id);
			simulateTime(logic, 1);
			expect(logic.getState().player.carrying).toEqual({ type: 'luban', stage: 'packed' });
		});
	});

	describe('temporary drop area', () => {
		it('places carried item on the resting mat and frees the player', () => {
			const { logic } = createLogic({ playerSpeed: 50 });
			logic.startLevel(1);

			const palm = stationByType(logic, 'palmPlot');
			logic.movePlayerToStation(palm.id);
			simulateTime(logic, 6);
			logic.movePlayerToStation(palm.id);
			simulateTime(logic, 1);

			const carrying = logic.getState().player.carrying;
			expect(carrying).not.toBeNull();

			const dropped = logic.dropItemTemporarily();
			expect(dropped).toBe(true);
			expect(logic.getState().player.carrying).toBeNull();
			expect(logic.getState().temporaryDrop?.item).toEqual(carrying);
			expect(logic.getState().canTemporaryDrop).toBe(false);
		});

		it('collects the temporary drop when walking over it', () => {
			const { logic } = createLogic({ playerSpeed: 50 });
			logic.startLevel(1);

			logic['player'].carrying = { type: 'dates', stage: 'fresh' };
			logic.dropItemTemporarily();
			expect(logic.getState().temporaryDrop).not.toBeNull();

			// Move player onto the temporary drop mat.
			logic.setPlayerTarget({ x: 0, y: -5 });
			simulateTime(logic, 1);

			expect(logic.getState().player.carrying).toEqual({ type: 'dates', stage: 'fresh' });
			expect(logic.getState().temporaryDrop).toBeNull();
		});

		it('loses the temporary drop after the timer expires', () => {
			const { logic } = createLogic({ playerSpeed: 50 });
			logic.startLevel(1);

			logic['player'].carrying = { type: 'dates', stage: 'fresh' };
			logic.dropItemTemporarily();
			expect(logic.getState().temporaryDrop).not.toBeNull();

			simulateTime(logic, 12);

			expect(logic.getState().temporaryDrop).toBeNull();
		});
	});

	describe('customer spacing and bounds', () => {
		it('assigns left and right slots to customers at the same shelf', () => {
			const { logic } = createLogic({ playerSpeed: 50, customerSpeed: 50, customerPatience: 60 });
			logic.startLevel(1);

			// Stock shelf 0 with two packed dates.
			logic['shelves'][0].items.push({ type: 'dates', stage: 'packed' });
			logic['shelves'][0].items.push({ type: 'dates', stage: 'packed' });

			// Spawn two customers wanting dates.
			logic['customers'] = [
				{
					id: 1,
					position: { x: 8, y: 5 },
					target: null,
					targetShelfId: null,
					state: 'entering',
					desiredGood: 'dates',
					patience: 60,
					paid: false
				},
				{
					id: 2,
					position: { x: 8, y: 5 },
					target: null,
					targetShelfId: null,
					state: 'entering',
					desiredGood: 'dates',
					patience: 60,
					paid: false
				}
			];
			logic['nextCustomerId'] = 3;

			// Let them pick targets.
			logic.update(0.05);

			const targets = logic['customers'].map((c) => c.target);
			expect(targets[0]).not.toBeNull();
			expect(targets[1]).not.toBeNull();
			expect(targets[0]!.x).not.toBeCloseTo(targets[1]!.x, 1);
		});

		it('keeps customer targets inside the play-space bounds', () => {
			const { logic } = createLogic({ playerSpeed: 50, customerSpeed: 50, customerPatience: 60 });
			logic.startLevel(1);
			logic['shelves'][0].items.push({ type: 'dates', stage: 'packed' });
			logic['customers'] = [
				{
					id: 1,
					position: { x: 8, y: 5 },
					target: null,
					targetShelfId: null,
					state: 'entering',
					desiredGood: 'dates',
					patience: 60,
					paid: false
				}
			];
			logic['nextCustomerId'] = 2;

			logic.update(0.05);
			simulateTime(logic, 2);

			const state = logic.getState();
			for (const customer of state.customers) {
				if (!customer.target) continue;
				expect(customer.target.x).toBeGreaterThanOrEqual(-11);
				expect(customer.target.x).toBeLessThanOrEqual(11);
				expect(customer.target.y).toBeGreaterThanOrEqual(-9);
				expect(customer.target.y).toBeLessThanOrEqual(9);
			}
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
