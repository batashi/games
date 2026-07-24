export type SouqGood =
	| 'dates'
	| 'qahwa'
	| 'luban'
	| 'oud'
	| 'saffron'
	| 'halwa'
	| 'pearls';

export const SOUQ_GOODS: Record<
	SouqGood,
	{ name: string; price: number; unlockedByLevel: number }
> = {
	dates: { name: 'تمر', price: 5, unlockedByLevel: 1 },
	halwa: { name: 'حلوى', price: 7, unlockedByLevel: 1 },
	qahwa: { name: 'قهوة', price: 8, unlockedByLevel: 2 },
	luban: { name: 'لبان', price: 10, unlockedByLevel: 2 },
	oud: { name: 'عود', price: 12, unlockedByLevel: 3 },
	saffron: { name: 'زعفران', price: 15, unlockedByLevel: 4 },
	pearls: { name: 'لؤلؤ', price: 18, unlockedByLevel: 5 }
};

export type WorkerRole = 'restocker' | 'cashier';

export interface SouqWorker {
	id: number;
	role: WorkerRole;
	position: Point2D;
	target: Point2D | null;
	carrying: SouqGood | null;
	speed: number;
	capacity: number;
}

export interface SouqCustomer {
	id: number;
	position: Point2D;
	target: Point2D | null;
	state: 'entering' | 'shopping' | 'walkingToCashier' | 'paying' | 'leaving';
	desiredGood: SouqGood;
	patience: number;
	paid: boolean;
}

export interface SouqShelf {
	id: number;
	position: Point2D;
	capacity: number;
	goods: SouqGood[];
}

export interface Point2D {
	x: number;
	y: number;
}

export interface SouqPlayer {
	position: Point2D;
	target: Point2D | null;
	carrying: SouqGood | null;
	speed: number;
	capacity: number;
}

export interface SouqCrate {
	position: Point2D;
	spawnTimer: number;
	spawnInterval: number;
	nextGood: SouqGood | null;
}

export interface SouqCashierMat {
	position: Point2D;
	queue: number[]; // customer ids waiting to pay
}

export type SouqGameState = 'menu' | 'playing' | 'levelComplete' | 'levelFailed';

export interface SouqManagerState {
	gameState: SouqGameState;
	level: number;
	coins: number;
	targetCoins: number;
	timeRemaining: number;
	stars: number;
	player: SouqPlayer;
	crate: SouqCrate;
	shelves: SouqShelf[];
	cashierMat: SouqCashierMat;
	customers: SouqCustomer[];
	workers: SouqWorker[];
	unlockedGoods: SouqGood[];
	message: string;
	totalCoinsEarned: number;
}

export interface SouqLevelConfig {
	level: number;
	targetCoins: number;
	durationSeconds: number;
	spawnInterval: number;
	maxCustomers: number;
	shelfCount: number;
	shelfCapacity: number;
	unlockedGoods: SouqGood[];
	startingCoins?: number;
}

export const SOUQ_LEVELS: SouqLevelConfig[] = [
	{
		level: 1,
		targetCoins: 60,
		durationSeconds: 90,
		spawnInterval: 5,
		maxCustomers: 3,
		shelfCount: 2,
		shelfCapacity: 4,
		unlockedGoods: ['dates', 'halwa'],
		startingCoins: 0
	},
	{
		level: 2,
		targetCoins: 120,
		durationSeconds: 100,
		spawnInterval: 4.5,
		maxCustomers: 4,
		shelfCount: 3,
		shelfCapacity: 4,
		unlockedGoods: ['dates', 'halwa', 'qahwa', 'luban']
	},
	{
		level: 3,
		targetCoins: 200,
		durationSeconds: 110,
		spawnInterval: 4,
		maxCustomers: 5,
		shelfCount: 3,
		shelfCapacity: 5,
		unlockedGoods: ['dates', 'halwa', 'qahwa', 'luban', 'oud']
	},
	{
		level: 4,
		targetCoins: 320,
		durationSeconds: 120,
		spawnInterval: 3.5,
		maxCustomers: 6,
		shelfCount: 4,
		shelfCapacity: 5,
		unlockedGoods: ['dates', 'halwa', 'qahwa', 'luban', 'oud', 'saffron']
	},
	{
		level: 5,
		targetCoins: 480,
		durationSeconds: 130,
		spawnInterval: 3,
		maxCustomers: 7,
		shelfCount: 4,
		shelfCapacity: 6,
		unlockedGoods: ['dates', 'halwa', 'qahwa', 'luban', 'oud', 'saffron', 'pearls']
	}
];

export interface SouqManagerConfig {
	playerSpeed?: number;
	workerSpeed?: number;
	crateSpawnInterval?: number;
	customerSpeed?: number;
	customerPatience?: number;
	workerCapacity?: number;
	maxWorkers?: number;
	workerCost?: number;
	upgradeSpeedCost?: number;
	upgradeCapacityCost?: number;
}

export const DEFAULT_SOUQ_MANAGER_CONFIG: Required<SouqManagerConfig> = {
	playerSpeed: 8,
	workerSpeed: 5,
	crateSpawnInterval: 3,
	customerSpeed: 2.5,
	customerPatience: 20,
	workerCapacity: 1,
	maxWorkers: 2,
	workerCost: 50,
	upgradeSpeedCost: 40,
	upgradeCapacityCost: 60
};

export interface SouqManagerCallbacks {
	onCoinCollected?: (amount: number) => void;
	onCustomerServed?: () => void;
	onLevelComplete?: (stars: number) => void;
	onLevelFailed?: () => void;
	onWorkerHired?: (role: WorkerRole) => void;
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

	private player: SouqPlayer;
	private crate: SouqCrate;
	private shelves: SouqShelf[];
	private cashierMat: SouqCashierMat;
	private customers: SouqCustomer[] = [];
	private workers: SouqWorker[] = [];

	private customerSpawnTimer = 0;
	private nextCustomerId = 1;
	private nextWorkerId = 1;

	private persistentUpgrades = {
		playerSpeedBonus: 0,
		playerCapacityBonus: 0,
		workerSpeedBonus: 0,
		workerCapacityBonus: 0
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
		this.crate = this.createCrate();
		this.shelves = this.createShelves();
		this.cashierMat = this.createCashierMat();
		this.notify();
	}

	// --- Public getters ----------------------------------------------------

	getState(): SouqManagerState {
		return {
			gameState: this.gameState,
			level: this.levelConfig.level,
			coins: this.coins,
			targetCoins: this.levelConfig.targetCoins,
			timeRemaining: Math.max(0, this.timeRemaining),
			stars: this.stars,
			player: { ...this.player, position: { ...this.player.position } },
			crate: {
				...this.crate,
				position: { ...this.crate.position },
				nextGood: this.crate.nextGood
			},
			shelves: this.shelves.map((s) => ({ ...s, position: { ...s.position }, goods: [...s.goods] })),
			cashierMat: {
				...this.cashierMat,
				position: { ...this.cashierMat.position },
				queue: [...this.cashierMat.queue]
			},
			customers: this.customers.map((c) => ({
				...c,
				position: { ...c.position },
				target: c.target ? { ...c.target } : null
			})),
			workers: this.workers.map((w) => ({
				...w,
				position: { ...w.position },
				target: w.target ? { ...w.target } : null
			})),
			unlockedGoods: [...this.levelConfig.unlockedGoods],
			message: this.getMessage(),
			totalCoinsEarned: this.totalCoinsEarned
		};
	}

	getConfig(): Required<SouqManagerConfig> {
		return { ...this.config };
	}

	// --- Setup / persistence helpers ---------------------------------------

	private createPlayer(): SouqPlayer {
		return {
			position: { x: 0, y: 0 },
			target: null,
			carrying: null,
			speed: this.config.playerSpeed + this.persistentUpgrades.playerSpeedBonus,
			capacity: 1 + this.persistentUpgrades.playerCapacityBonus
		};
	}

	private createCrate(): SouqCrate {
		return {
			position: { x: -6, y: -4 },
			spawnTimer: 0,
			spawnInterval: this.config.crateSpawnInterval,
			nextGood: null
		};
	}

	private createShelves(): SouqShelf[] {
		return Array.from({ length: this.levelConfig.shelfCount }, (_, i) => ({
			id: i,
			position: { x: -2 + i * 3, y: 2 },
			capacity: this.levelConfig.shelfCapacity,
			goods: []
		}));
	}

	private createCashierMat(): SouqCashierMat {
		return {
			position: { x: 5, y: -3 },
			queue: []
		};
	}

	// --- Level flow --------------------------------------------------------

	startLevel(levelNumber: number): void {
		const config = SOUQ_LEVELS.find((l) => l.level === levelNumber) ?? SOUQ_LEVELS[SOUQ_LEVELS.length - 1];
		this.levelConfig = config;
		this.gameState = 'playing';
		this.coins = config.startingCoins ?? 0;
		this.totalCoinsEarned = 0;
		this.timeRemaining = config.durationSeconds;
		this.stars = 0;
		this.customerSpawnTimer = config.spawnInterval;
		this.nextCustomerId = 1;
		this.customers = [];
		this.player = this.createPlayer();
		this.crate = this.createCrate();
		this.shelves = this.createShelves();
		this.cashierMat = this.createCashierMat();
		this.notify();
	}

	restartLevel(): void {
		this.startLevel(this.levelConfig.level);
	}

	// --- Input actions -----------------------------------------------------

	setPlayerTarget(target: Point2D): void {
		if (this.gameState !== 'playing') return;
		this.player.target = { ...target };
		this.notify();
	}

	movePlayerToPoint(point: Point2D): void {
		this.setPlayerTarget(point);
	}

	movePlayerToCrate(): void {
		this.setPlayerTarget({ ...this.crate.position });
	}

	movePlayerToShelf(shelfId: number): void {
		const shelf = this.shelves.find((s) => s.id === shelfId);
		if (shelf) this.setPlayerTarget({ ...shelf.position });
	}

	movePlayerToCashier(): void {
		this.setPlayerTarget({ ...this.cashierMat.position });
	}

	private pickGoodFromCrate(character: SouqPlayer | SouqWorker): boolean {
		if (!this.crate.nextGood) return false;
		if (character.carrying) return false;
		character.carrying = this.crate.nextGood;
		this.crate.nextGood = null;
		this.crate.spawnTimer = 0;
		return true;
	}

	private placeGoodOnShelf(character: SouqPlayer | SouqWorker, shelf: SouqShelf): boolean {
		if (!character.carrying) return false;
		if (shelf.goods.length >= shelf.capacity) return false;
		shelf.goods.push(character.carrying);
		character.carrying = null;
		return true;
	}

	// --- Shop / meta actions -----------------------------------------------

	hireWorker(role: WorkerRole): boolean {
		if (this.workers.length >= this.config.maxWorkers) return false;
		if (this.coins < this.config.workerCost) return false;
		this.coins -= this.config.workerCost;
		this.workers.push({
			id: this.nextWorkerId++,
			role,
			position: { x: 0, y: -5 },
			target: null,
			carrying: null,
			speed: this.config.workerSpeed + this.persistentUpgrades.workerSpeedBonus,
			capacity: this.config.workerCapacity + this.persistentUpgrades.workerCapacityBonus
		});
		this.callbacks.onWorkerHired?.(role);
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

	// --- Game loop ---------------------------------------------------------

	update(dt: number): void {
		if (this.gameState !== 'playing') return;

		const clampedDt = Math.min(dt, 0.05);

		this.updateTimer(clampedDt);
		this.updateCrate(clampedDt);
		this.updatePlayer(clampedDt);
		this.updateCustomers(clampedDt);
		this.updateWorkers(clampedDt);
		this.spawnCustomers(clampedDt);
		this.checkLevelEnd();
		this.notify();
	}

	private updateTimer(dt: number): void {
		this.timeRemaining -= dt;
		if (this.timeRemaining <= 0) {
			this.timeRemaining = 0;
			this.checkLevelEnd();
		}
	}

	private updateCrate(dt: number): void {
		if (this.crate.nextGood) return;
		this.crate.spawnTimer += dt;
		if (this.crate.spawnTimer >= this.crate.spawnInterval) {
			this.crate.nextGood = this.pickRandomGood();
			this.crate.spawnTimer = 0;
		}
	}

	private pickRandomGood(): SouqGood {
		const goods = this.levelConfig.unlockedGoods;
		return goods[Math.floor(Math.random() * goods.length)];
	}

	private updatePlayer(dt: number): void {
		if (this.player.target) {
			this.player.position = moveTowards(
				this.player.position,
				this.player.target,
				this.player.speed,
				dt
			);
			if (distance(this.player.position, this.player.target) < 0.2) {
				this.handlePlayerArrival();
				this.player.target = null;
			}
		}
	}

	private handlePlayerArrival(): void {
		if (distance(this.player.position, this.crate.position) < 1) {
			this.pickGoodFromCrate(this.player);
		}

		for (const shelf of this.shelves) {
			if (distance(this.player.position, shelf.position) < 1) {
				this.placeGoodOnShelf(this.player, shelf);
			}
		}

		if (distance(this.player.position, this.cashierMat.position) < 1) {
			this.collectPayments();
		}
	}

	private collectPayments(): void {
		let collected = 0;
		for (const customerId of this.cashierMat.queue) {
			const customer = this.customers.find((c) => c.id === customerId);
			if (!customer || customer.paid) continue;
			customer.paid = true;
			const price = SOUQ_GOODS[customer.desiredGood]?.price ?? 0;
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

	// --- Customer logic ----------------------------------------------------

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

	private pickDesiredGood(): SouqGood | null {
		const stocked = this.levelConfig.unlockedGoods.filter((g) =>
			this.shelves.some((s) => s.goods.includes(g))
		);
		const pool = stocked.length > 0 ? stocked : this.levelConfig.unlockedGoods;
		return pool[Math.floor(Math.random() * pool.length)] ?? null;
	}

	private updateCustomers(dt: number): void {
		for (const customer of this.customers) {
			if (customer.state === 'entering') {
				const shelf = this.findShelfWithGood(customer.desiredGood);
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
				customer.position = moveTowards(
					customer.position,
					customer.target,
					this.config.customerSpeed,
					dt
				);
			}

			if (customer.state === 'shopping' && customer.target && distance(customer.position, customer.target) < 0.3) {
				const shelf = this.findShelfWithGood(customer.desiredGood);
				if (shelf) {
					this.removeGoodFromShelf(shelf, customer.desiredGood);
					customer.target = { ...this.cashierMat.position };
					customer.state = 'walkingToCashier';
				} else {
					customer.state = 'entering';
					customer.target = null;
				}
			}

			if (
				customer.state === 'walkingToCashier' &&
				customer.target &&
				distance(customer.position, customer.target) < 0.3
			) {
				customer.state = 'paying';
				customer.target = null;
				if (!this.cashierMat.queue.includes(customer.id)) {
					this.cashierMat.queue.push(customer.id);
				}
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

	private findShelfWithGood(good: SouqGood): SouqShelf | null {
		return this.shelves.find((s) => s.goods.includes(good)) ?? null;
	}

	private removeGoodFromShelf(shelf: SouqShelf, good: SouqGood): void {
		const index = shelf.goods.indexOf(good);
		if (index !== -1) shelf.goods.splice(index, 1);
	}

	// --- Worker logic ------------------------------------------------------

	private updateWorkers(dt: number): void {
		for (const worker of this.workers) {
			if (worker.target) {
				worker.position = moveTowards(worker.position, worker.target, worker.speed, dt);
				if (distance(worker.position, worker.target) < 0.3) {
					this.handleWorkerArrival(worker);
				}
			} else {
				this.assignWorkerTask(worker);
			}
		}
	}

	private assignWorkerTask(worker: SouqWorker): void {
		if (worker.role === 'restocker') {
			if (worker.carrying) {
				const shelf = this.findEmptyShelf();
				if (shelf) worker.target = { ...shelf.position };
			} else if (this.crate.nextGood) {
				worker.target = { ...this.crate.position };
			}
		} else if (worker.role === 'cashier') {
			if (this.cashierMat.queue.length > 0) {
				worker.target = { ...this.cashierMat.position };
			}
		}
	}

	private handleWorkerArrival(worker: SouqWorker): void {
		worker.target = null;

		if (worker.role === 'restocker') {
			if (!worker.carrying && this.crate.nextGood && distance(worker.position, this.crate.position) < 1) {
				this.pickGoodFromCrate(worker);
			} else if (worker.carrying) {
				const shelf = this.findEmptyShelf();
				if (shelf && distance(worker.position, shelf.position) < 1) {
					this.placeGoodOnShelf(worker, shelf);
				}
			}
		} else if (worker.role === 'cashier') {
			if (distance(worker.position, this.cashierMat.position) < 1) {
				this.collectPayments();
			}
		}
	}

	private findEmptyShelf(): SouqShelf | null {
		return this.shelves.find((s) => s.goods.length < s.capacity) ?? null;
	}

	// --- Level end ---------------------------------------------------------

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

	// --- Messaging ---------------------------------------------------------

	private getMessage(): string {
		if (this.gameState === 'levelComplete') return `ممتاز! حصلت على ${this.stars} نجوم 🌟`;
		if (this.gameState === 'levelFailed') return 'انتهى الوقت! حاول مرة أخرى 💪';
		if (this.gameState === 'menu') return 'اختر مستوى لبدء اللعب';
		if (this.player.carrying) return `تحمل ${SOUQ_GOODS[this.player.carrying].name} — ضعه على الرف`;
		if (this.cashierMat.queue.length > 0) return 'زبون ينتظر الدفع! اذهب إلى الصندوق';
		if (this.shelves.some((s) => s.goods.length < s.capacity)) return 'اجلب بضاعة من الصندوق واملأ الرفوف';
		return 'املأ الرفوف لاستقبال المزيد من الزبائن';
	}

	private notify(): void {
		this.onChange(this.getState());
	}
}
