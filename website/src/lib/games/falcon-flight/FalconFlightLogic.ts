export type FalconFlightPhase = 'menu' | 'playing' | 'result';

export type PreyType = 'hare' | 'houbara' | 'quail';
export type HazardType = 'cliff' | 'dustDevil' | 'vulture' | 'updraft';
export type PowerUpType = 'tailwind' | 'sharperEyes' | 'secondWind';
export type ObjectType = 'prey' | 'hazard' | 'powerup';

export interface Falcon {
	x: number;
	y: number;
	vy: number;
}

export interface WorldChunk {
	id: number;
	type: 'dune' | 'rock' | 'palms' | 'fort' | 'cloud';
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface WorldObject {
	id: number;
	category: ObjectType;
	kind: PreyType | HazardType | PowerUpType;
	x: number;
	y: number;
	radius: number;
	active: boolean;
}

export interface FalconFlightState {
	phase: FalconFlightPhase;
	falcon: Falcon;
	energy: number;
	score: number;
	distance: number;
	speed: number;
	bestDistance: number;
	preyCount: number;
	chunks: WorldChunk[];
	objects: WorldObject[];
	gameOverReason: string | null;
	streakCount: number;
	streakTimer: number;
	tailwindTimer: number;
	sharperEyesTimer: number;
	secondWindUsed: boolean;
}

export interface FalconFlightInput {
	active: boolean;
}

export interface FalconFlightConfig {
	gravity: number;
	lift: number;
	maxVy: number;
	minVy: number;
	baseSpeed: number;
	maxSpeed: number;
	speedRamp: number;
	energyDrain: number;
	groundY: number;
	ceilingY: number;
	falconRadius: number;
	spawnDistance: number;
	chunkSpacing: number;
}

export const DEFAULT_FALCON_FLIGHT_CONFIG: FalconFlightConfig = {
	gravity: 9.0,
	lift: 14.0,
	maxVy: 7.0,
	minVy: -9.0,
	baseSpeed: 5.0,
	maxSpeed: 14.0,
	speedRamp: 0.25,
	energyDrain: 3.5,
	groundY: 0,
	ceilingY: 18.5,
	falconRadius: 0.45,
	spawnDistance: 22,
	chunkSpacing: 8
};

const PREY_CONFIG: Record<PreyType, { radius: number; score: number; energy: number }> = {
	hare: { radius: 0.55, score: 5, energy: 8 },
	houbara: { radius: 0.6, score: 10, energy: 12 },
	quail: { radius: 0.45, score: 8, energy: 6 }
};

const HAZARD_CONFIG: Record<HazardType, { radius: number }> = {
	cliff: { radius: 1.0 },
	dustDevil: { radius: 0.85 },
	vulture: { radius: 0.75 },
	updraft: { radius: 0.9 }
};

const POWERUP_CONFIG: Record<PowerUpType, { radius: number }> = {
	tailwind: { radius: 0.7 },
	sharperEyes: { radius: 0.7 },
	secondWind: { radius: 0.7 }
};

export interface FalconFlightCallbacks {
	onPreyCollected?: (kind: PreyType, position: { x: number; y: number }) => void;
	onPowerUpCollected?: (kind: PowerUpType, position: { x: number; y: number }) => void;
	onHazardHit?: (kind: HazardType, position: { x: number; y: number }) => void;
	onGameOver?: (reason: string, distance: number, score: number) => void;
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export class FalconFlightLogic {
	private config: FalconFlightConfig;
	private onChange: (state: FalconFlightState) => void;
	private callbacks: FalconFlightCallbacks;

	private phase: FalconFlightPhase = 'menu';
	private falcon: Falcon = { x: 0, y: 5, vy: 0 };
	private energy = 100;
	private score = 0;
	private distance = 0;
	private speed = DEFAULT_FALCON_FLIGHT_CONFIG.baseSpeed;
	private bestDistance = 0;
	private preyCount = 0;
	private chunks: WorldChunk[] = [];
	private objects: WorldObject[] = [];
	private gameOverReason: string | null = null;
	private streakCount = 0;
	private streakTimer = 0;
	private tailwindTimer = 0;
	private sharperEyesTimer = 0;
	private secondWindUsed = false;

	private nextChunkId = 1;
	private nextObjectId = 1;
	private objectSpawnTimer = 0;
	private lastChunkX = 0;

	constructor(
		onChange: (state: FalconFlightState) => void,
		config: Partial<FalconFlightConfig> = {},
		callbacks: FalconFlightCallbacks = {}
	) {
		this.onChange = onChange;
		this.config = { ...DEFAULT_FALCON_FLIGHT_CONFIG, ...config };
		this.callbacks = callbacks;
		this.bestDistance = this.loadBestDistance();
		this.resetToMenu();
	}

	private loadBestDistance(): number {
		if (typeof localStorage === 'undefined') return 0;
		try {
			const value = localStorage.getItem('falcon-best-distance');
			return value ? Math.max(0, parseFloat(value)) : 0;
		} catch {
			return 0;
		}
	}

	private saveBestDistance(): void {
		if (typeof localStorage === 'undefined') return;
		try {
			localStorage.setItem('falcon-best-distance', String(this.bestDistance));
		} catch {
			// ignore
		}
	}

	getState(): FalconFlightState {
		return {
			phase: this.phase,
			falcon: { ...this.falcon },
			energy: this.energy,
			score: this.score,
			distance: Math.floor(this.distance),
			speed: this.speed,
			bestDistance: Math.floor(this.bestDistance),
			preyCount: this.preyCount,
			chunks: this.chunks.map((c) => ({ ...c })),
			objects: this.objects.map((o) => ({ ...o })),
			gameOverReason: this.gameOverReason,
			streakCount: this.streakCount,
			streakTimer: this.streakTimer,
			tailwindTimer: this.tailwindTimer,
			sharperEyesTimer: this.sharperEyesTimer,
			secondWindUsed: this.secondWindUsed
		};
	}

	startRun(): void {
		this.phase = 'playing';
		this.falcon = { x: 0, y: 5, vy: 0 };
		this.energy = 100;
		this.score = 0;
		this.distance = 0;
		this.speed = this.config.baseSpeed;
		this.preyCount = 0;
		this.chunks = [];
		this.objects = [];
		this.gameOverReason = null;
		this.streakCount = 0;
		this.streakTimer = 0;
		this.tailwindTimer = 0;
		this.sharperEyesTimer = 0;
		this.secondWindUsed = false;
		this.nextChunkId = 1;
		this.nextObjectId = 1;
		this.objectSpawnTimer = 0;
		this.lastChunkX = 0;

		this.seedStartingChunks();
		this.notify();
	}

	restart(): void {
		this.startRun();
	}

	resetToMenu(): void {
		this.phase = 'menu';
		this.falcon = { x: 0, y: 5, vy: 0 };
		this.energy = 100;
		this.score = 0;
		this.distance = 0;
		this.speed = this.config.baseSpeed;
		this.preyCount = 0;
		this.chunks = [];
		this.objects = [];
		this.gameOverReason = null;
		this.streakCount = 0;
		this.streakTimer = 0;
		this.tailwindTimer = 0;
		this.sharperEyesTimer = 0;
		this.secondWindUsed = false;
		this.nextChunkId = 1;
		this.nextObjectId = 1;
		this.objectSpawnTimer = 0;
		this.lastChunkX = 0;
		this.seedStartingChunks();
		this.notify();
	}

	update(dt: number, input: FalconFlightInput): void {
		if (this.phase !== 'playing') return;

		const clampedDt = Math.min(dt, 0.05);

		// Update power-up timers.
		if (this.tailwindTimer > 0) {
			this.tailwindTimer -= clampedDt;
			if (this.tailwindTimer < 0) this.tailwindTimer = 0;
		}
		if (this.sharperEyesTimer > 0) {
			this.sharperEyesTimer -= clampedDt;
			if (this.sharperEyesTimer < 0) this.sharperEyesTimer = 0;
		}
		if (this.streakTimer > 0) {
			this.streakTimer -= clampedDt;
			if (this.streakTimer <= 0) {
				this.streakCount = 0;
				this.streakTimer = 0;
			}
		}

		// Horizontal progress.
		const tailwindMultiplier = this.tailwindTimer > 0 ? 1.6 : 1.0;
		this.speed = clamp(
			this.speed + this.config.speedRamp * clampedDt,
			this.config.baseSpeed,
			this.config.maxSpeed
		);
		this.distance += this.speed * tailwindMultiplier * clampedDt;

		// Falcon vertical physics.
		const lift = input.active ? this.config.lift : 0;
		this.falcon.vy += (lift - this.config.gravity) * clampedDt;
		this.falcon.vy = clamp(this.falcon.vy, this.config.minVy, this.config.maxVy);
		this.falcon.y += this.falcon.vy * clampedDt;

		// Energy drains over time; prey refills it.
		this.energy -= this.config.energyDrain * clampedDt;
		if (this.energy <= 0) {
			this.energy = 0;
			// Low energy: falcon slows and gradually descends.
			this.speed = clamp(this.speed - 2 * clampedDt, this.config.baseSpeed * 0.6, this.speed);
			this.falcon.vy -= 1.5 * clampedDt;
		}

		// World scroll: move chunks and objects left.
		const scroll = this.speed * tailwindMultiplier * clampedDt;
		for (const chunk of this.chunks) {
			chunk.x -= scroll;
		}
		for (const object of this.objects) {
			object.x -= scroll;
		}

		// Spawn and recycle world content.
		this.updateChunks();
		this.updateObjects(clampedDt);

		// Collisions.
		this.checkCollisions();

		// Out of bounds.
		if (this.falcon.y <= this.config.groundY + this.config.falconRadius) {
			this.endRun('اصطدمت بالأرض');
			return;
		}
		if (this.falcon.y >= this.config.ceilingY) {
			this.endRun('ارتفعت كثيراً عن السماء');
			return;
		}

		this.notify();
	}

	private seedStartingChunks(): void {
		this.chunks = [];
		this.lastChunkX = 0;
		for (let i = 0; i < 5; i++) {
			this.spawnChunk(i * this.config.chunkSpacing);
		}
	}

	private spawnChunk(atX?: number): void {
		const types: WorldChunk['type'][] = ['dune', 'dune', 'rock', 'palms', 'cloud', 'fort'];
		const roll = Math.random();
		let type: WorldChunk['type'];
		if (roll < 0.45) type = 'dune';
		else if (roll < 0.65) type = 'rock';
		else if (roll < 0.8) type = 'palms';
		else if (roll < 0.92) type = 'cloud';
		else type = 'fort';

		const x = atX ?? this.lastChunkX + this.config.chunkSpacing + Math.random() * 2;
		this.lastChunkX = x;

		const chunk: WorldChunk = {
			id: this.nextChunkId++,
			type,
			x,
			y: type === 'cloud' ? 12 + Math.random() * 5 : 0,
			width: type === 'cloud' ? 5 + Math.random() * 5 : 6 + Math.random() * 6,
			height:
				type === 'dune'
					? 1.5 + Math.random() * 2
					: type === 'rock'
						? 2 + Math.random() * 3
						: type === 'palms'
							? 3 + Math.random() * 2
							: type === 'fort'
								? 5 + Math.random() * 3
								: 1.5
		};
		this.chunks.push(chunk);
	}

	private updateChunks(): void {
		// Recycle chunks that have moved off the left edge.
		const recycleThreshold = -12;
		const spawnThreshold = this.config.spawnDistance;
		this.chunks = this.chunks.filter((chunk) => chunk.x + chunk.width / 2 > recycleThreshold);

		const rightmost = this.chunks.length > 0 ? Math.max(...this.chunks.map((c) => c.x + c.width / 2)) : 0;
		if (this.chunks.length === 0 || rightmost < spawnThreshold) {
			this.spawnChunk(rightmost + this.config.chunkSpacing + Math.random() * 2);
		}
		while (this.chunks.length < 8) {
			const last = this.chunks[this.chunks.length - 1];
			this.spawnChunk(last.x + last.width / 2 + this.config.chunkSpacing + Math.random() * 2);
		}
	}

	private updateObjects(dt: number): void {
		this.objectSpawnTimer -= dt;
		if (this.objectSpawnTimer <= 0) {
			this.spawnObjectWave();
			this.objectSpawnTimer = this.nextSpawnInterval();
		}

		const recycleThreshold = -8;
		this.objects = this.objects.filter((obj) => obj.x > recycleThreshold && obj.active);
	}

	private nextSpawnInterval(): number {
		// Hazards become denser as speed increases; prey density lowers.
		const difficultyFactor = 1 - (this.speed - this.config.baseSpeed) / (this.config.maxSpeed - this.config.baseSpeed);
		return 1.2 + difficultyFactor * 1.6 + Math.random() * 0.6;
	}

	private spawnObjectWave(): void {
		const baseX = this.config.spawnDistance + Math.random() * 6;
		const roll = Math.random();

		if (roll < 0.55) {
			// Prey wave: 1-3 prey in a loose arc.
			const count = Math.random() < 0.6 ? 1 : Math.random() < 0.75 ? 2 : 3;
			const kinds: PreyType[] = ['hare', 'houbara', 'quail'];
			const baseY = 3 + Math.random() * 9;
			for (let i = 0; i < count; i++) {
				const kind = kinds[Math.floor(Math.random() * kinds.length)];
				const config = PREY_CONFIG[kind];
				this.objects.push({
					id: this.nextObjectId++,
					category: 'prey',
					kind,
					x: baseX + i * 1.6,
					y: clamp(baseY + (Math.random() - 0.5) * 3, 2, this.config.ceilingY - 2),
					radius: config.radius,
					active: true
				});
			}
		} else if (roll < 0.85) {
			// Hazard.
			const kinds: HazardType[] = ['cliff', 'dustDevil', 'vulture', 'updraft'];
			const kind = kinds[Math.floor(Math.random() * kinds.length)];
			const config = HAZARD_CONFIG[kind];
			const y = kind === 'cliff' ? this.config.groundY + 1.5 : 3 + Math.random() * 9;
			this.objects.push({
				id: this.nextObjectId++,
				category: 'hazard',
				kind,
				x: baseX,
				y,
				radius: config.radius,
				active: true
			});
		} else {
			// Power-up.
			const kinds: PowerUpType[] = ['tailwind', 'sharperEyes', 'secondWind'];
			const kind = kinds[Math.floor(Math.random() * kinds.length)];
			const config = POWERUP_CONFIG[kind];
			this.objects.push({
				id: this.nextObjectId++,
				category: 'powerup',
				kind,
				x: baseX,
				y: 4 + Math.random() * 8,
				radius: config.radius,
				active: true
			});
		}
	}

	private checkCollisions(): void {
		for (const object of this.objects) {
			if (!object.active) continue;
			const dx = this.falcon.x - object.x;
			const dy = this.falcon.y - object.y;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist <= this.config.falconRadius + object.radius) {
				this.handleCollision(object);
			}
		}
	}

	private handleCollision(object: WorldObject): void {
		if (object.category === 'prey') {
			const kind = object.kind as PreyType;
			const config = PREY_CONFIG[kind];
			object.active = false;
			this.preyCount += 1;
			this.energy = clamp(this.energy + config.energy, 0, 100);

			// Streak logic: collect 3 prey within ~4 seconds for a multiplier.
			this.streakCount += 1;
			this.streakTimer = 4;
			let multiplier = 1;
			if (this.streakCount >= 3) {
				multiplier = 2;
				if (this.streakCount >= 6) multiplier = 3;
			}
			this.score += config.score * multiplier;

			this.callbacks.onPreyCollected?.(kind, { x: object.x, y: object.y });
		} else if (object.category === 'powerup') {
			const kind = object.kind as PowerUpType;
			object.active = false;
			switch (kind) {
				case 'tailwind':
					this.tailwindTimer = 6;
					break;
				case 'sharperEyes':
					this.sharperEyesTimer = 8;
					break;
				case 'secondWind':
					if (!this.secondWindUsed) {
						this.energy = 100;
						this.secondWindUsed = true;
					}
					break;
			}
			this.callbacks.onPowerUpCollected?.(kind, { x: object.x, y: object.y });
		} else if (object.category === 'hazard') {
			const kind = object.kind as HazardType;
			// Tailwind grants temporary invincibility from wind hazards.
			if (this.tailwindTimer > 0 && (kind === 'dustDevil' || kind === 'updraft')) {
				object.active = false;
				return;
			}
			object.active = false;
			this.callbacks.onHazardHit?.(kind, { x: object.x, y: object.y });
			const reason =
				kind === 'cliff'
					? 'اصطدمت بصخرة الوادي'
					: kind === 'dustDevil'
						? 'دفعتك عاصفة رملية'
						: kind === 'vulture'
							? 'اصطدمت بالنسر'
							: 'ضربتك تيارات هوائية عنيفة';
			this.endRun(reason);
		}
	}

	private endRun(reason: string): void {
		this.phase = 'result';
		this.gameOverReason = reason;
		if (this.distance > this.bestDistance) {
			this.bestDistance = this.distance;
			this.saveBestDistance();
		}
		this.callbacks.onGameOver?.(reason, this.distance, this.score);
		this.notify();
	}

	private notify(): void {
		this.onChange(this.getState());
	}
}
