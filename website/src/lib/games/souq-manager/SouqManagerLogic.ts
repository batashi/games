export type GoodType = 'dates' | 'qahwa' | 'luban';

export type ItemStage =
	| 'sapling'
	| 'fresh'
	| 'drying'
	| 'dried'
	| 'packed'
	| 'beans'
	| 'roasting'
	| 'roasted'
	| 'ground'
	| 'brewed'
	| 'rawResin'
	| 'sorted';

export interface Item {
	type: GoodType;
	stage: ItemStage;
}

export type StationType =
	| 'palmPlot'
	| 'dryingMat'
	| 'packagingTable'
	| 'brazier'
	| 'mortar'
	| 'dallah'
	| 'sortingMat'
	| 'greenBeans'
	| 'rawResin';

export interface Station {
	id: number;
	type: StationType;
	position: Point2D;
	input: Item | null;
	output: Item | null;
	progress: number;
	processingTime: number;
	status: 'idle' | 'processing' | 'ready';
	assignedWorkerId: number | null;
}

export interface Shelf {
	id: number;
	position: Point2D;
	capacity: number;
	items: Item[];
}

export interface Point2D {
	x: number;
	y: number;
}

export interface SouqPlayer {
	position: Point2D;
	target: Point2D | null;
	carrying: Item | null;
	speed: number;
	capacity: number;
}

export interface SouqCustomer {
	id: number;
	position: Point2D;
	target: Point2D | null;
	state: 'entering' | 'shopping' | 'walkingToCashier' | 'paying' | 'leaving';
	desiredGood: GoodType;
	patience: number;
	paid: boolean;
}

export interface SouqWorker {
	id: number;
	stationId: number | null;
	position: Point2D;
	target: Point2D | null;
	speed: number;
}

export interface SouqCashierMat {
	position: Point2D;
	queue: number[];
}

export type SouqGameState = 'menu' | 'playing' | 'levelComplete' | 'levelFailed';

export interface TemporaryDrop {
	item: Item;
	position: Point2D;
	life: number;
	maxLife: number;
}

export interface SouqManagerState {
	gameState: SouqGameState;
	level: number;
	coins: number;
	targetCoins: number;
	timeRemaining: number;
	stars: number;
	player: SouqPlayer;
	stations: Station[];
	shelves: Shelf[];
	cashierMat: SouqCashierMat;
	customers: SouqCustomer[];
	workers: SouqWorker[];
	unlockedGoods: GoodType[];
	message: string;
	totalCoinsEarned: number;
	reputation: number;
	canUnloadHere: boolean;
	temporaryDrop: TemporaryDrop | null;
	canTemporaryDrop: boolean;
}

export interface SouqLevelConfig {
	level: number;
	targetCoins: number;
	durationSeconds: number;
	spawnInterval: number;
	maxCustomers: number;
	shelfCapacity: number;
	unlockedGoods: GoodType[];
	startingCoins?: number;
}

export const SOUQ_LEVELS: SouqLevelConfig[] = [
	{
		level: 1,
		targetCoins: 60,
		durationSeconds: 120,
		spawnInterval: 6,
		maxCustomers: 3,
		shelfCapacity: 4,
		unlockedGoods: ['dates'],
		startingCoins: 0
	},
	{
		level: 2,
		targetCoins: 140,
		durationSeconds: 140,
		spawnInterval: 5.5,
		maxCustomers: 4,
		shelfCapacity: 4,
		unlockedGoods: ['dates', 'luban'],
		startingCoins: 20
	},
	{
		level: 3,
		targetCoins: 260,
		durationSeconds: 160,
		spawnInterval: 5,
		maxCustomers: 5,
		shelfCapacity: 5,
		unlockedGoods: ['dates', 'luban', 'qahwa'],
		startingCoins: 40
	}
];

export const GOOD_PRICES: Record<GoodType, number> = {
	dates: 5,
	qahwa: 8,
	luban: 10
};

export const STATION_CONFIG: Record<
	StationType,
	{ input?: { type: GoodType; stage: ItemStage }; output?: { type: GoodType; stage: ItemStage }; time: number; label: string }
> = {
	palmPlot: {
		output: { type: 'dates', stage: 'fresh' },
		time: 4,
		label: 'نخلة التمر'
	},
	dryingMat: {
		input: { type: 'dates', stage: 'fresh' },
		output: { type: 'dates', stage: 'dried' },
		time: 3,
		label: 'سجادة التجفيف'
	},
	packagingTable: {
		time: 2,
		label: 'طاولة التعبئة'
	},
	brazier: {
		input: { type: 'qahwa', stage: 'beans' },
		output: { type: 'qahwa', stage: 'roasted' },
		time: 3,
		label: 'محمص القهوة'
	},
	mortar: {
		input: { type: 'qahwa', stage: 'roasted' },
		output: { type: 'qahwa', stage: 'ground' },
		time: 2,
		label: 'الهاون'
	},
	dallah: {
		input: { type: 'qahwa', stage: 'ground' },
		output: { type: 'qahwa', stage: 'brewed' },
		time: 3,
		label: 'الدلة'
	},
	sortingMat: {
		input: { type: 'luban', stage: 'rawResin' },
		output: { type: 'luban', stage: 'sorted' },
		time: 2.5,
		label: 'سجادة فرز اللبان'
	},
	greenBeans: {
		output: { type: 'qahwa', stage: 'beans' },
		time: 0,
		label: ' كيس البن الأخضر'
	},
	rawResin: {
		output: { type: 'luban', stage: 'rawResin' },
		time: 0,
		label: 'كومة اللبان الخام'
	}
};

export interface SouqManagerConfig {
	playerSpeed?: number;
	workerSpeed?: number;
	customerSpeed?: number;
	customerPatience?: number;
	maxWorkers?: number;
	workerCost?: number;
	upgradeSpeedCost?: number;
	upgradeCapacityCost?: number;
}

export const DEFAULT_SOUQ_MANAGER_CONFIG: Required<SouqManagerConfig> = {
	playerSpeed: 8,
	workerSpeed: 5,
	customerSpeed: 2.5,
	customerPatience: 25,
	maxWorkers: 2,
	workerCost: 60,
	upgradeSpeedCost: 40,
	upgradeCapacityCost: 60
};

export interface SouqManagerCallbacks {
	onCoinCollected?: (amount: number) => void;
	onCustomerServed?: () => void;
	onLevelComplete?: (stars: number) => void;
	onLevelFailed?: () => void;
	onWorkerHired?: () => void;
}

function distance(a: Point2D, b: Point2D): number {
	return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function moveTowards(current: Point2D, target: Point2D, speed: number, dt: number): Point2D {
	const d = distance(current, target);
	if (d <= 0.001) return { ...target };
	const step = speed * dt;
	if (step >= d) return { ...target };
	const ratio = step / d;
	return {
		x: current.x + (target.x - current.x) * ratio,
		y: current.y + (target.y - current.y) * ratio
	};
}

function itemsMatch(a: Item, b: Item): boolean {
	return a.type === b.type && a.stage === b.stage;
}

function isFinishedGood(item: Item): boolean {
	return (
		(item.type === 'dates' && item.stage === 'packed') ||
		(item.type === 'qahwa' && item.stage === 'brewed') ||
		(item.type === 'luban' && item.stage === 'packed')
	);
}

function canPackage(item: Item): boolean {
	return (
		(item.type === 'dates' && item.stage === 'dried') ||
		(item.type === 'luban' && item.stage === 'sorted')
	);
}

const TEMPORARY_DROP_POSITION: Point2D = { x: 0, y: -5 };
const TEMPORARY_DROP_LIFE = 10;

export class SouqManagerLogic {
	private config: Required<SouqManagerConfig>;
	private onChange: (state: SouqManagerState) => void;
	private callbacks: SouqManagerCallbacks;

	private levelConfig: SouqLevelConfig;
	private gameState: SouqGameState = 'menu';
	private coins = 0;
	private totalCoinsEarned = 0;
	private timeRemaining = 0;
	private stars = 0;
	private reputation = 0;

	private player: SouqPlayer;
	private stations: Station[];
	private shelves: Shelf[];
	private cashierMat: SouqCashierMat;
	private customers: SouqCustomer[] = [];
	private workers: SouqWorker[] = [];

	private customerSpawnTimer = 0;
	private nextCustomerId = 1;
	private nextWorkerId = 1;

	private playerNearStationId: number | null = null;
	private playerNearShelfId: number | null = null;
	private temporaryDrop: TemporaryDrop | null = null;

	private persistentUpgrades = {
		playerSpeedBonus: 0,
		playerCapacityBonus: 0,
		workerSpeedBonus: 0
	};

	constructor(
		onChange: (state: SouqManagerState) => void,
		config: SouqManagerConfig = {},
		callbacks: SouqManagerCallbacks = {}
	) {
		this.onChange = onChange;
		this.config = { ...DEFAULT_SOUQ_MANAGER_CONFIG, ...config };
		this.callbacks = callbacks;
		this.levelConfig = SOUQ_LEVELS[0];
		this.player = this.createPlayer();
		this.stations = this.createStations();
		this.shelves = this.createShelves();
		this.cashierMat = this.createCashierMat();
		this.notify();
	}

	private createPlayer(): SouqPlayer {
		return {
			position: { x: 0, y: 0 },
			target: null,
			carrying: null,
			speed: this.config.playerSpeed + this.persistentUpgrades.playerSpeedBonus,
			capacity: 1 + this.persistentUpgrades.playerCapacityBonus
		};
	}

	private createStations(): Station[] {
		return [
			{ id: 0, type: 'palmPlot', position: { x: -7, y: -2 }, input: null, output: null, progress: 0, processingTime: STATION_CONFIG.palmPlot.time, status: 'idle', assignedWorkerId: null },
			{ id: 1, type: 'dryingMat', position: { x: -4, y: -2 }, input: null, output: null, progress: 0, processingTime: STATION_CONFIG.dryingMat.time, status: 'idle', assignedWorkerId: null },
			{ id: 2, type: 'packagingTable', position: { x: -1, y: -2 }, input: null, output: null, progress: 0, processingTime: STATION_CONFIG.packagingTable.time, status: 'idle', assignedWorkerId: null },
			{ id: 3, type: 'greenBeans', position: { x: -7, y: 1 }, input: null, output: null, progress: 0, processingTime: 0, status: 'idle', assignedWorkerId: null },
			{ id: 4, type: 'brazier', position: { x: -4, y: 1 }, input: null, output: null, progress: 0, processingTime: STATION_CONFIG.brazier.time, status: 'idle', assignedWorkerId: null },
			{ id: 5, type: 'mortar', position: { x: -1, y: 1 }, input: null, output: null, progress: 0, processingTime: STATION_CONFIG.mortar.time, status: 'idle', assignedWorkerId: null },
			{ id: 6, type: 'dallah', position: { x: 2, y: 1 }, input: null, output: null, progress: 0, processingTime: STATION_CONFIG.dallah.time, status: 'idle', assignedWorkerId: null },
			{ id: 7, type: 'rawResin', position: { x: -7, y: 4 }, input: null, output: null, progress: 0, processingTime: 0, status: 'idle', assignedWorkerId: null },
			{ id: 8, type: 'sortingMat', position: { x: -4, y: 4 }, input: null, output: null, progress: 0, processingTime: STATION_CONFIG.sortingMat.time, status: 'idle', assignedWorkerId: null }
		];
	}

	private createShelves(): Shelf[] {
		return [
			{ id: 0, position: { x: 3, y: -1 }, capacity: this.levelConfig.shelfCapacity, items: [] },
			{ id: 1, position: { x: 5, y: -1 }, capacity: this.levelConfig.shelfCapacity, items: [] },
			{ id: 2, position: { x: 3, y: 2 }, capacity: this.levelConfig.shelfCapacity, items: [] }
		];
	}

	private createCashierMat(): SouqCashierMat {
		return { position: { x: 6, y: -4 }, queue: [] };
	}

	getState(): SouqManagerState {
		return {
			gameState: this.gameState,
			level: this.levelConfig.level,
			coins: this.coins,
			targetCoins: this.levelConfig.targetCoins,
			timeRemaining: Math.max(0, this.timeRemaining),
			stars: this.stars,
			player: { ...this.player, position: { ...this.player.position } },
			stations: this.stations.map((s) => ({ ...s, position: { ...s.position }, input: s.input ? { ...s.input } : null, output: s.output ? { ...s.output } : null })),
			shelves: this.shelves.map((s) => ({ ...s, position: { ...s.position }, items: s.items.map((i) => ({ ...i })) })),
			cashierMat: { ...this.cashierMat, position: { ...this.cashierMat.position }, queue: [...this.cashierMat.queue] },
			customers: this.customers.map((c) => ({ ...c, position: { ...c.position }, target: c.target ? { ...c.target } : null })),
			workers: this.workers.map((w) => ({ ...w, position: { ...w.position }, target: w.target ? { ...w.target } : null })),
			unlockedGoods: [...this.levelConfig.unlockedGoods],
			message: this.getMessage(),
			totalCoinsEarned: this.totalCoinsEarned,
			reputation: this.reputation,
			canUnloadHere:
				this.player.carrying !== null &&
				(this.playerNearStationId !== null || this.playerNearShelfId !== null),
			temporaryDrop: this.temporaryDrop
				? {
						item: { ...this.temporaryDrop.item },
						position: { ...this.temporaryDrop.position },
						life: this.temporaryDrop.life,
						maxLife: this.temporaryDrop.maxLife
					}
				: null,
			canTemporaryDrop: this.player.carrying !== null && this.temporaryDrop === null
		};
	}

	getConfig(): Required<SouqManagerConfig> {
		return { ...this.config };
	}

	startLevel(levelNumber: number): void {
		const config = SOUQ_LEVELS.find((l) => l.level === levelNumber) ?? SOUQ_LEVELS[SOUQ_LEVELS.length - 1];
		this.levelConfig = config;
		this.gameState = 'playing';
		this.coins = config.startingCoins ?? 0;
		this.totalCoinsEarned = 0;
		this.timeRemaining = config.durationSeconds;
		this.stars = 0;
		this.reputation = 0;
		this.customerSpawnTimer = config.spawnInterval;
		this.nextCustomerId = 1;
		this.customers = [];
		this.workers = [];
		this.temporaryDrop = null;
		this.player = this.createPlayer();
		this.stations = this.createStations();
		this.shelves = this.createShelves();
		this.cashierMat = this.createCashierMat();
		this.notify();
	}

	restartLevel(): void {
		this.startLevel(this.levelConfig.level);
	}

	setPlayerTarget(target: Point2D): void {
		if (this.gameState !== 'playing') return;
		this.player.target = { ...target };
		this.notify();
	}

	movePlayerToStation(stationId: number): void {
		const station = this.stations.find((s) => s.id === stationId);
		if (station) this.setPlayerTarget({ ...station.position });
	}

	movePlayerToShelf(shelfId: number): void {
		const shelf = this.shelves.find((s) => s.id === shelfId);
		if (shelf) this.setPlayerTarget({ ...shelf.position });
	}

	movePlayerToCashier(): void {
		this.setPlayerTarget({ ...this.cashierMat.position });
	}

	private handlePlayerArrival(): void {
		// Auto-deposit carried items when the player arrives at a valid station or shelf.
		if (this.player.carrying) {
			const station = this.findNearestStation(this.player.position, 1.2);
			if (station && station.status === 'idle' && this.canStationAccept(station, this.player.carrying)) {
				station.input = this.player.carrying;
				this.player.carrying = null;
				station.status = 'processing';
				station.progress = 0;
				this.updatePlayerContext();
				this.notify();
				return;
			}

			const shelf = this.findNearestShelf(this.player.position, 1.2);
			if (shelf && shelf.items.length < shelf.capacity && isFinishedGood(this.player.carrying)) {
				shelf.items.push(this.player.carrying);
				this.player.carrying = null;
				this.updatePlayerContext();
				this.notify();
				return;
			}
		}

		for (const station of this.stations) {
			if (distance(this.player.position, station.position) < 1.2) {
				this.interactWithStation(station);
				return;
			}
		}
		if (distance(this.player.position, this.cashierMat.position) < 1.2) {
			this.collectPayments();
		}
	}

	unloadAtContext(): void {
		if (this.gameState !== 'playing') return;
		if (!this.player.carrying) return;

		const station = this.findNearestStation(this.player.position, 1.2);
		if (station && station.status === 'idle' && this.canStationAccept(station, this.player.carrying)) {
			station.input = this.player.carrying;
			this.player.carrying = null;
			station.status = 'processing';
			station.progress = 0;
			this.updatePlayerContext();
			this.notify();
			return;
		}

		const shelf = this.findNearestShelf(this.player.position, 1.2);
		if (shelf && shelf.items.length < shelf.capacity && isFinishedGood(this.player.carrying)) {
			shelf.items.push(this.player.carrying);
			this.player.carrying = null;
			this.updatePlayerContext();
			this.notify();
		}
	}

	private findNearestStation(position: Point2D, radius: number): Station | null {
		let nearest: Station | null = null;
		let best = radius * radius;
		for (const station of this.stations) {
			const d2 = (station.position.x - position.x) ** 2 + (station.position.y - position.y) ** 2;
			if (d2 < best) {
				best = d2;
				nearest = station;
			}
		}
		return nearest;
	}

	private findNearestShelf(position: Point2D, radius: number): Shelf | null {
		let nearest: Shelf | null = null;
		let best = radius * radius;
		for (const shelf of this.shelves) {
			const d2 = (shelf.position.x - position.x) ** 2 + (shelf.position.y - position.y) ** 2;
			if (d2 < best) {
				best = d2;
				nearest = shelf;
			}
		}
		return nearest;
	}

	private updatePlayerContext(): void {
		this.playerNearStationId = null;
		this.playerNearShelfId = null;
		if (this.gameState !== 'playing' || !this.player.carrying) return;

		const station = this.findNearestStation(this.player.position, 1.2);
		if (station && station.status === 'idle' && this.canStationAccept(station, this.player.carrying)) {
			this.playerNearStationId = station.id;
			return;
		}

		const shelf = this.findNearestShelf(this.player.position, 1.2);
		if (shelf && shelf.items.length < shelf.capacity && isFinishedGood(this.player.carrying)) {
			this.playerNearShelfId = shelf.id;
		}
	}

	dropItemTemporarily(): boolean {
		if (this.gameState !== 'playing') return false;
		if (!this.player.carrying || this.temporaryDrop) return false;
		this.temporaryDrop = {
			item: this.player.carrying,
			position: { ...TEMPORARY_DROP_POSITION },
			life: TEMPORARY_DROP_LIFE,
			maxLife: TEMPORARY_DROP_LIFE
		};
		this.player.carrying = null;
		this.updatePlayerContext();
		this.notify();
		return true;
	}

	private collectTemporaryDrop(): void {
		if (!this.temporaryDrop || this.player.carrying) return;
		if (distance(this.player.position, this.temporaryDrop.position) < 1.2) {
			this.player.carrying = this.temporaryDrop.item;
			this.temporaryDrop = null;
			this.updatePlayerContext();
			this.notify();
		}
	}

	private updateTemporaryDrop(dt: number): void {
		if (!this.temporaryDrop) return;
		this.temporaryDrop.life -= dt;
		if (this.temporaryDrop.life <= 0) {
			this.temporaryDrop = null;
			this.notify();
		}
	}

	private interactWithStation(station: Station): void {
		// Source stations (raw goods) provide output instantly.
		if (station.type === 'greenBeans' || station.type === 'rawResin') {
			if (this.player.carrying) return;
			const config = STATION_CONFIG[station.type];
			if (config.output) {
				this.player.carrying = { ...config.output };
			}
			return;
		}

		// Palm plot: if idle, plant sapling; if ready, harvest fresh dates.
		if (station.type === 'palmPlot') {
			if (station.status === 'idle' && !this.player.carrying) {
				station.input = { type: 'dates', stage: 'sapling' };
				station.status = 'processing';
				station.progress = 0;
			} else if (station.status === 'ready' && !this.player.carrying) {
				this.player.carrying = station.output;
				station.output = null;
				station.status = 'idle';
				station.progress = 0;
			}
			return;
		}

		// Processing stations: auto-collect finished output; deposit input happens automatically on arrival.
		if (station.status === 'ready' && !this.player.carrying) {
			this.player.carrying = station.output;
			station.output = null;
			station.input = null;
			station.status = 'idle';
			station.progress = 0;
		}
	}

	private canStationAccept(station: Station, item: Item): boolean {
		if (station.type === 'packagingTable') {
			return canPackage(item);
		}
		const config = STATION_CONFIG[station.type];
		if (!config.input) return false;
		return itemsMatch(item, config.input);
	}

	private interactWithShelf(shelf: Shelf): void {
		if (this.player.carrying && isFinishedGood(this.player.carrying) && shelf.items.length < shelf.capacity) {
			shelf.items.push(this.player.carrying);
			this.player.carrying = null;
		}
	}

	private collectPayments(): void {
		let collected = 0;
		for (const customerId of this.cashierMat.queue) {
			const customer = this.customers.find((c) => c.id === customerId);
			if (!customer || customer.paid) continue;
			customer.paid = true;
			const price = GOOD_PRICES[customer.desiredGood] ?? 0;
			this.coins += price;
			this.totalCoinsEarned += price;
			collected += price;
			customer.state = 'leaving';
			this.callbacks.onCustomerServed?.();
		}
		this.cashierMat.queue = [];
		if (collected > 0) {
			this.callbacks.onCoinCollected?.(collected);
		}
	}

	hireWorker(stationId: number): boolean {
		if (this.workers.length >= this.config.maxWorkers) return false;
		if (this.coins < this.config.workerCost) return false;
		const station = this.stations.find((s) => s.id === stationId);
		if (!station) return false;
		this.coins -= this.config.workerCost;
		const worker: SouqWorker = {
			id: this.nextWorkerId++,
			stationId,
			position: { x: 0, y: -5 },
			target: { ...station.position },
			speed: this.config.workerSpeed + this.persistentUpgrades.workerSpeedBonus
		};
		if (station.assignedWorkerId !== null) {
			const oldWorker = this.workers.find((w) => w.id === station.assignedWorkerId);
			if (oldWorker) oldWorker.stationId = null;
		}
		station.assignedWorkerId = worker.id;
		this.workers.push(worker);
		this.callbacks.onWorkerHired?.();
		this.notify();
		return true;
	}

	upgradePlayerSpeed(): boolean {
		if (this.coins < this.config.upgradeSpeedCost) return false;
		this.coins -= this.config.upgradeSpeedCost;
		this.persistentUpgrades.playerSpeedBonus += 1;
		this.player.speed = this.config.playerSpeed + this.persistentUpgrades.playerSpeedBonus;
		this.notify();
		return true;
	}

	upgradePlayerCapacity(): boolean {
		if (this.coins < this.config.upgradeCapacityCost) return false;
		this.coins -= this.config.upgradeCapacityCost;
		this.persistentUpgrades.playerCapacityBonus += 1;
		this.player.capacity = 1 + this.persistentUpgrades.playerCapacityBonus;
		this.notify();
		return true;
	}

	update(dt: number): void {
		if (this.gameState !== 'playing') return;
		const clampedDt = Math.min(dt, 0.05);
		this.updateTimer(clampedDt);
		this.updatePlayer(clampedDt);
		this.collectTemporaryDrop();
		this.updatePlayerContext();
		this.updateStations(clampedDt);
		this.updateWorkers(clampedDt);
		this.updateCustomers(clampedDt);
		this.updateTemporaryDrop(clampedDt);
		this.spawnCustomers(clampedDt);
		this.checkLevelEnd();
		this.notify();
	}

	private updateTimer(dt: number): void {
		this.timeRemaining -= dt;
		if (this.timeRemaining <= 0) {
			this.timeRemaining = 0;
		}
	}

	private updatePlayer(dt: number): void {
		if (this.player.target) {
			this.player.position = moveTowards(this.player.position, this.player.target, this.player.speed, dt);
			if (distance(this.player.position, this.player.target) < 0.2) {
				this.handlePlayerArrival();
				this.player.target = null;
			}
		}
	}

	private updateStations(dt: number): void {
		for (const station of this.stations) {
			if (station.status === 'processing') {
				const workerBonus = station.assignedWorkerId !== null ? 1.5 : 1;
				station.progress += (dt / station.processingTime) * workerBonus;
				if (station.progress >= 1) {
					station.progress = 1;
					station.status = 'ready';
					const config = STATION_CONFIG[station.type];
					if (config.output) {
						station.output = { ...config.output };
					} else if (station.type === 'palmPlot' && station.input) {
						station.output = { type: 'dates', stage: 'fresh' };
						station.input = null;
					} else if (station.type === 'packagingTable' && station.input) {
						if (station.input.type === 'dates') {
							station.output = { type: 'dates', stage: 'packed' };
						} else if (station.input.type === 'luban') {
							station.output = { type: 'luban', stage: 'packed' };
						}
						station.input = null;
					}
				}
			}
		}
	}

	private updateWorkers(dt: number): void {
		for (const worker of this.workers) {
			const station = worker.stationId !== null ? this.stations.find((s) => s.id === worker.stationId) : null;
			if (!station) continue;
			if (worker.target) {
				worker.position = moveTowards(worker.position, worker.target, worker.speed, dt);
				if (distance(worker.position, worker.target) < 0.3) {
					worker.target = null;
				}
			} else {
				worker.target = { ...station.position };
			}
		}
	}

	private spawnCustomers(dt: number): void {
		if (this.customers.length >= this.levelConfig.maxCustomers) return;
		this.customerSpawnTimer -= dt;
		if (this.customerSpawnTimer <= 0) {
			this.spawnCustomer();
			this.customerSpawnTimer = this.levelConfig.spawnInterval;
		}
	}

	private spawnCustomer(): void {
		const desired = this.pickDesiredGood();
		if (!desired) return;
		this.customers.push({
			id: this.nextCustomerId++,
			position: { x: 8, y: 5 },
			target: null,
			state: 'entering',
			desiredGood: desired,
			patience: this.config.customerPatience,
			paid: false
		});
	}

	private pickDesiredGood(): GoodType | null {
		const finished = this.levelConfig.unlockedGoods.filter((g) =>
			this.shelves.some((s) => s.items.some((i) => i.type === g && isFinishedGood(i)))
		);
		const pool = finished.length > 0 ? finished : this.levelConfig.unlockedGoods;
		return pool[Math.floor(Math.random() * pool.length)] ?? null;
	}

	private updateCustomers(dt: number): void {
		for (const customer of this.customers) {
			if (customer.state === 'entering') {
				const shelf = this.findShelfWithFinishedGood(customer.desiredGood);
				if (shelf) {
					customer.target = { ...shelf.position };
					customer.state = 'shopping';
				} else {
					customer.patience -= dt;
					if (customer.patience <= 0) {
						customer.state = 'leaving';
						customer.target = { x: 8, y: 8 };
					}
				}
				continue;
			}

			if (customer.target) {
				customer.position = moveTowards(customer.position, customer.target, this.config.customerSpeed, dt);
			}

			if (customer.state === 'shopping' && customer.target && distance(customer.position, customer.target) < 0.3) {
				const shelf = this.findShelfWithFinishedGood(customer.desiredGood);
				if (shelf) {
					this.removeFinishedGoodFromShelf(shelf, customer.desiredGood);
					if (!this.cashierMat.queue.includes(customer.id)) {
						this.cashierMat.queue.push(customer.id);
					}
					customer.state = 'walkingToCashier';
				} else {
					customer.state = 'entering';
					customer.target = null;
				}
			}

			if (customer.state === 'walkingToCashier' || customer.state === 'paying') {
				const index = this.cashierMat.queue.indexOf(customer.id);
				if (index !== -1) {
					customer.target = this.getCashierQueuePosition(index);
				}
			}

			if (customer.state === 'walkingToCashier' && customer.target && distance(customer.position, customer.target) < 0.2) {
				customer.state = 'paying';
			}

			if (customer.state === 'paying') {
				customer.patience -= dt;
				if (customer.patience <= 0) {
					customer.paid = false;
					customer.state = 'leaving';
					this.cashierMat.queue = this.cashierMat.queue.filter((id) => id !== customer.id);
				}
			}

			if (customer.state === 'leaving' && !customer.target) {
				customer.target = { x: 8, y: 8 };
			}
		}

		this.customers = this.customers.filter((c) => {
			if (c.state !== 'leaving') return true;
			if (!c.target) return false;
			return distance(c.position, c.target) > 0.3;
		});
	}

	private getCashierQueuePosition(index: number): Point2D {
		const base = this.cashierMat.position;
		if (index <= 0) return { ...base };
		const spacing = 0.9;
		const side = index % 2 === 1 ? -1 : 1;
		const row = Math.floor((index + 1) / 2);
		return {
			x: base.x + side * spacing,
			y: base.y + row * spacing
		};
	}

	private findShelfWithFinishedGood(good: GoodType): Shelf | null {
		return this.shelves.find((s) => s.items.some((i) => i.type === good && isFinishedGood(i))) ?? null;
	}

	private removeFinishedGoodFromShelf(shelf: Shelf, good: GoodType): void {
		const index = shelf.items.findIndex((i) => i.type === good && isFinishedGood(i));
		if (index !== -1) shelf.items.splice(index, 1);
	}

	private checkLevelEnd(): void {
		if (this.gameState !== 'playing') return;
		if (this.totalCoinsEarned >= this.levelConfig.targetCoins) {
			this.completeLevel();
		} else if (this.timeRemaining <= 0) {
			this.failLevel();
		}
	}

	private completeLevel(): void {
		const ratio = this.totalCoinsEarned / this.levelConfig.targetCoins;
		if (ratio >= 1.5) this.stars = 3;
		else if (ratio >= 1.2) this.stars = 2;
		else this.stars = 1;
		this.gameState = 'levelComplete';
		this.callbacks.onLevelComplete?.(this.stars);
		this.notify();
	}

	private failLevel(): void {
		this.stars = 0;
		this.gameState = 'levelFailed';
		this.callbacks.onLevelFailed?.();
		this.notify();
	}

	private getMessage(): string {
		if (this.gameState === 'levelComplete') return `ممتاز! حصلت على ${this.stars} نجوم 🌟`;
		if (this.gameState === 'levelFailed') return 'انتهى الوقت! حاول مرة أخرى 💪';
		if (this.gameState === 'menu') return 'اختر مستوى لبدء اللعب';
		if (this.player.carrying) {
			const item = this.player.carrying;
			return `تحمل ${this.itemName(item)} — اذهب إلى المحطة أو الرف المناسب`;
		}
		if (this.cashierMat.queue.length > 0) return 'زبون ينتظر الدفع! اذهب إلى بساط الصندوق';
		if (this.stations.some((s) => s.status === 'ready')) return 'محطة جاهزة! اجمع الإنتاج';
		if (this.shelves.some((s) => s.items.length < s.capacity)) return 'أنتج بضاعة وضعها على الرفوف';
		return 'زرع النخيل، جفف التمر، احمص القهوة، وفرز اللبان';
	}

	private itemName(item: Item): string {
		const names: Record<string, string> = {
			'dates-sapling': 'شتلة نخيل',
			'dates-fresh': 'تمر طازج',
			'dates-drying': 'تمر يجفف',
			'dates-dried': 'تمر مجفف',
			'dates-packed': 'علبة تمر',
			'qahwa-beans': 'بن أخضر',
			'qahwa-roasting': 'بن يحمص',
			'qahwa-roasted': 'بن محمص',
			'qahwa-ground': 'بن مطحون',
			'qahwa-brewed': 'قهوة عربية',
			'luban-rawResin': 'لبان خام',
			'luban-sorted': 'لبان مفرز',
			'luban-packed': 'كيس لبان'
		};
		return names[`${item.type}-${item.stage}`] ?? 'سلعة';
	}

	private notify(): void {
		this.onChange(this.getState());
	}
}
