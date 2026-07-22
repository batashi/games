export type GameDifficulty = 'easy' | 'medium' | 'hard';
export type GiftType = 'health' | 'power';

export interface Gift {
	type: GiftType;
	position: Point2D;
	active: boolean;
}

export interface FortBattleState {
	healths: [number, number];
	currentPlayer: number;
	angle: number;
	power: number;
	wind: number;
	gameState: 'aiming' | 'flying' | 'gameover';
	winner: number | null;
	message: string;
	gift: { type: GiftType; x: number; y: number } | null;
	powerShotActive: boolean;
	difficulty: GameDifficulty;
}

export interface FortBattleConfig {
	PLAYER_ANGLES: [number, number];
	FORT_X: [number, number];
	MAX_POWER: number;
	MIN_POWER: number;
	POWER_SCALE: number;
	GRAVITY: number;
	WIND_SCALE: number;
	DAMAGE: number;
	INITIAL_HEALTH: number;
	GROUND_Y: number;
	ARROW_RADIUS: number;
	FORT_RADIUS: number;
	FORT_HEIGHT: number;
	MAX_ANGLE: number;
	MIN_ANGLE: number;
	BOUNDS: { minX: number; maxX: number; maxY: number };
	/** Display names used in turn/win messages. Defaults to red/blue player names. */
	playerNames?: [string, string];
	/** Overall difficulty. Defaults to medium. */
	difficulty?: GameDifficulty;
	/** Chance (0-1) a gift spawns at the start of a turn. */
	GIFT_SPAWN_CHANCE?: number;
	/** Vertical fall speed of a gift (units/sec). */
	GIFT_FALL_SPEED?: number;
	/** Gift collision radius. */
	GIFT_RADIUS?: number;
	/** Horizontal drift multiplier from wind. */
	GIFT_DRIFT?: number;
	/** Damage dealt by a powered-up shot. */
	POWER_DAMAGE?: number;
	/** Wind magnitude cap. */
	MAX_WIND?: number;
}

export const DEFAULT_FORT_BATTLE_CONFIG: FortBattleConfig = {
	PLAYER_ANGLES: [45, 135],
	FORT_X: [-25, 25],
	MAX_POWER: 100,
	MIN_POWER: 10,
	POWER_SCALE: 0.22,
	GRAVITY: 11,
	WIND_SCALE: 0.45,
	DAMAGE: 25,
	INITIAL_HEALTH: 100,
	GROUND_Y: 0,
	ARROW_RADIUS: 0.35,
	FORT_RADIUS: 3.5,
	FORT_HEIGHT: 8,
	MAX_ANGLE: 170,
	MIN_ANGLE: 10,
	BOUNDS: { minX: -80, maxX: 80, maxY: 60 }
};

export interface Point2D {
	x: number;
	y: number;
}

const DEFAULT_PLAYER_NAMES: [string, string] = ['اللاعب الأحمر', 'اللاعب الأزرق'];

function difficultyDefaults(difficulty: GameDifficulty) {
	switch (difficulty) {
		case 'easy':
			return { GIFT_SPAWN_CHANCE: 0.5, MAX_WIND: 2, GIFT_FALL_SPEED: 1.6 };
		case 'hard':
			return { GIFT_SPAWN_CHANCE: 0.15, MAX_WIND: 4, GIFT_FALL_SPEED: 2.4 };
		case 'medium':
		default:
			return { GIFT_SPAWN_CHANCE: 0.3, MAX_WIND: 3, GIFT_FALL_SPEED: 2.0 };
	}
}

export function arrowStartPosition(config: FortBattleConfig, playerIndex: number): Point2D {
	const x =
		config.FORT_X[playerIndex] +
		(playerIndex === 0 ? config.FORT_RADIUS! + 0.8 : -(config.FORT_RADIUS! + 0.8));
	const y = config.FORT_HEIGHT! + 1.6;
	return { x, y };
}

export interface FortBattleCallbacks {
	onHit?: (fortIndex: number, position: Point2D) => void;
	onMiss?: (message: string) => void;
	onWin?: (winner: number) => void;
	onGiftCollected?: (type: GiftType, position: Point2D) => void;
}

export class FortBattleLogic {
	private config: Required<FortBattleConfig>;
	private onChange: (state: FortBattleState) => void;
	private callbacks: FortBattleCallbacks;

	private healths: [number, number] = [100, 100];
	private currentPlayer = 0;
	private angle = DEFAULT_FORT_BATTLE_CONFIG.PLAYER_ANGLES[0];
	private power = DEFAULT_FORT_BATTLE_CONFIG.MIN_POWER;
	private wind = 0;
	private gameState: FortBattleState['gameState'] = 'aiming';
	private winner: number | null = null;
	private charging = false;
	private chargeElapsedSeconds = 0;
	private arrowPosition: Point2D = { x: 0, y: 0 };
	private arrowVelocity: Point2D = { x: 0, y: 0 };
	private arrowFlying = false;
	private lastMessage = '';

	private gift: Gift | null = null;
	private powerShotActive = false;

	constructor(
		onChange: (state: FortBattleState) => void,
		config: Partial<FortBattleConfig> = {},
		callbacks: FortBattleCallbacks = {}
	) {
		this.onChange = onChange;
		const difficulty = config.difficulty ?? 'medium';
		this.config = {
			...(DEFAULT_FORT_BATTLE_CONFIG as Required<FortBattleConfig>),
			...difficultyDefaults(difficulty),
			...config,
			difficulty,
			GIFT_RADIUS: 1.2,
			GIFT_DRIFT: 0.3,
			POWER_DAMAGE: 50
		} as Required<FortBattleConfig>;
		this.callbacks = callbacks;
		this.resetGame();
	}

	private getInitialHealths(): [number, number] {
		return [this.config.INITIAL_HEALTH, this.config.INITIAL_HEALTH];
	}

	// --- Public getters ----------------------------------------------------

	getState(): FortBattleState {
		return {
			healths: [...this.healths] as [number, number],
			currentPlayer: this.currentPlayer,
			angle: Math.round(this.angle),
			power: Math.round(this.power),
			wind: this.wind,
			gameState: this.gameState,
			winner: this.winner,
			message: this.getMessage(),
			gift: this.gift ? { type: this.gift.type, x: this.gift.position.x, y: this.gift.position.y } : null,
			powerShotActive: this.powerShotActive,
			difficulty: this.config.difficulty
		};
	}

	getArrowPosition(): Point2D {
		return { ...this.arrowPosition };
	}

	getArrowVelocity(): Point2D {
		return { ...this.arrowVelocity };
	}

	isArrowFlying(): boolean {
		return this.arrowFlying;
	}

	isCharging(): boolean {
		return this.charging;
	}

	getCurrentPlayer(): number {
		return this.currentPlayer;
	}

	getConfig(): Required<FortBattleConfig> {
		return { ...this.config };
	}

	getGift(): Gift | null {
		return this.gift;
	}

	// --- Input actions -----------------------------------------------------

	setAngle(angle: number): void {
		if (this.gameState !== 'aiming') return;
		this.angle = Math.max(this.config.MIN_ANGLE, Math.min(this.config.MAX_ANGLE, angle));
		this.notify();
	}

	adjustAngle(delta: number): void {
		if (this.gameState !== 'aiming') return;
		this.setAngle(this.angle + delta);
	}

	startCharge(): void {
		if (this.gameState !== 'aiming' || this.charging) return;
		this.charging = true;
		this.chargeElapsedSeconds = 0;
		this.power = this.config.MIN_POWER;
		this.notify();
	}

	updateCharge(elapsedSeconds: number): void {
		if (!this.charging) return;
		this.chargeElapsedSeconds = elapsedSeconds;
		this.power = Math.min(
			this.config.MAX_POWER,
			this.config.MIN_POWER + (elapsedSeconds / 1.4) * (this.config.MAX_POWER - this.config.MIN_POWER)
		);
		this.notify();
	}

	releaseCharge(): void {
		if (!this.charging) return;
		this.charging = false;
		this.fire();
	}

	resetGame(): void {
		this.healths = this.getInitialHealths();
		this.currentPlayer = 0;
		this.winner = null;
		this.powerShotActive = false;
		this.gift = null;
		this.resetTurn();
	}

	// --- Game loop ---------------------------------------------------------

	updateFlight(dt: number): void {
		if (this.gameState !== 'flying' || !this.arrowFlying) return;

		const dtClamped = Math.min(dt, 0.05);
		this.arrowVelocity.x += this.wind * this.config.WIND_SCALE * dtClamped;
		this.arrowVelocity.y -= this.config.GRAVITY * dtClamped;

		this.arrowPosition.x += this.arrowVelocity.x * dtClamped;
		this.arrowPosition.y += this.arrowVelocity.y * dtClamped;

		this.checkCollisions();
	}

	updateGift(dt: number): void {
		if (!this.gift?.active || this.gameState === 'gameover') return;

		const dtClamped = Math.min(dt, 0.05);
		this.gift.position.y -= this.config.GIFT_FALL_SPEED * dtClamped;
		this.gift.position.x += this.wind * this.config.GIFT_DRIFT * dtClamped;

		if (this.gift.position.y <= this.config.GROUND_Y + this.config.GIFT_RADIUS) {
			this.gift = null;
			this.lastMessage = 'فاتتك الهدية!';
			this.notify();
		}
	}

	// --- Physics helpers ---------------------------------------------------

	fire(): void {
		if (this.gameState !== 'aiming') return;
		this.gameState = 'flying';
		this.arrowFlying = true;

		const start = this.getArrowStartPosition();
		this.arrowPosition = { ...start };

		const rad = (this.angle * Math.PI) / 180;
		const speed = this.power * this.config.POWER_SCALE;
		this.arrowVelocity = {
			x: Math.cos(rad) * speed,
			y: Math.sin(rad) * speed
		};

		this.notify();
	}

	getArrowStartPosition(): Point2D {
		return arrowStartPosition(this.config, this.currentPlayer);
	}

	computeTrajectory(steps = 18, stepDelta = 0.12): Point2D[] {
		const rad = (this.angle * Math.PI) / 180;
		const speed = this.power * this.config.POWER_SCALE;
		const vx = Math.cos(rad) * speed;
		const vy = Math.sin(rad) * speed;
		const start = this.getArrowStartPosition();

		const points: Point2D[] = [start];
		for (let i = 1; i <= steps; i++) {
			const t = i * stepDelta;
			points.push({
				x: start.x + vx * t + 0.5 * this.wind * this.config.WIND_SCALE * t * t,
				y: start.y + vy * t - 0.5 * this.config.GRAVITY * t * t
			});
		}
		return points;
	}

	getArrowAngleRad(): number {
		if (this.arrowFlying) {
			return Math.atan2(this.arrowVelocity.y, this.arrowVelocity.x);
		}
		return (this.angle * Math.PI) / 180;
	}

	// --- Collision & turn management ---------------------------------------

	private checkCollisions(): void {
		const pos = this.arrowPosition;

		// Gift (must be collected before hitting anything else)
		if (this.gift?.active && this.arrowIntersectsGift(pos)) {
			this.collectGift();
			return;
		}

		// Ground
		if (pos.y <= this.config.GROUND_Y + this.config.ARROW_RADIUS) {
			this.handleMiss('السهم وقع على الأرض');
			return;
		}

		// Bounds
		if (pos.x < this.config.BOUNDS.minX || pos.x > this.config.BOUNDS.maxX || pos.y > this.config.BOUNDS.maxY) {
			this.handleMiss('السهم خرج عن الميدان');
			return;
		}

		// Forts
		for (let i = 0; i < 2; i++) {
			if (this.arrowIntersectsFort(pos, i)) {
				this.handleHit(i);
				return;
			}
		}
	}

	private arrowIntersectsFort(arrowPos: Point2D, fortIndex: number): boolean {
		const fortX = this.config.FORT_X[fortIndex];
		const dx = arrowPos.x - fortX;
		const dy = arrowPos.y - this.config.FORT_HEIGHT / 2;
		const horizontalDist = Math.abs(dx);
		const verticalDist = Math.abs(dy);

		return (
			horizontalDist <= this.config.FORT_RADIUS + this.config.ARROW_RADIUS &&
			verticalDist <= this.config.FORT_HEIGHT / 2 + this.config.ARROW_RADIUS
		);
	}

	private arrowIntersectsGift(arrowPos: Point2D): boolean {
		if (!this.gift) return false;
		const dx = arrowPos.x - this.gift.position.x;
		const dy = arrowPos.y - this.gift.position.y;
		return Math.sqrt(dx * dx + dy * dy) <= this.config.GIFT_RADIUS + this.config.ARROW_RADIUS;
	}

	private collectGift(): void {
		if (!this.gift) return;
		const type = this.gift.type;
		const position = { ...this.gift.position };
		this.arrowFlying = false;
		this.gift = null;

		if (type === 'health') {
			this.healths[this.currentPlayer] = Math.min(
				this.config.INITIAL_HEALTH,
				this.healths[this.currentPlayer] + 25
			);
			this.lastMessage = '+25 صحة! 💚';
		} else {
			this.powerShotActive = true;
			this.lastMessage = 'سهم قوي! 🔥';
		}

		this.callbacks.onGiftCollected?.(type, position);
		this.switchPlayer();
	}

	private handleHit(fortIndex: number): void {
		this.arrowFlying = false;
		const damage = this.powerShotActive ? this.config.POWER_DAMAGE : this.config.DAMAGE;
		this.powerShotActive = false;
		this.healths[fortIndex] = Math.max(0, this.healths[fortIndex] - damage);
		this.callbacks.onHit?.(fortIndex, { ...this.arrowPosition });

		if (this.healths[fortIndex] <= 0) {
			this.winner = fortIndex === 0 ? 1 : 0;
			this.gameState = 'gameover';
			this.lastMessage = this.getMessage();
			this.callbacks.onWin?.(this.winner);
			this.notify();
			return;
		}

		this.switchPlayer();
	}

	private handleMiss(message: string): void {
		this.arrowFlying = false;
		this.lastMessage = message;
		this.callbacks.onMiss?.(message);
		this.switchPlayer();
	}

	private switchPlayer(): void {
		this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
		this.resetTurn();
	}

	private resetTurn(): void {
		this.gameState = 'aiming';
		this.angle = this.config.PLAYER_ANGLES[this.currentPlayer];
		this.power = this.config.MIN_POWER;
		this.charging = false;
		this.chargeElapsedSeconds = 0;
		this.arrowFlying = false;
		const maxWind = this.config.MAX_WIND;
		this.wind = Math.floor(Math.random() * (maxWind * 2 + 1)) - maxWind;
		this.maybeSpawnGift();
		this.notify();
	}

	private maybeSpawnGift(): void {
		if (this.gift?.active) return;
		if (Math.random() >= this.config.GIFT_SPAWN_CHANCE) return;

		const type: GiftType = Math.random() < 0.5 ? 'health' : 'power';
		const minX = this.config.BOUNDS.minX + 10;
		const maxX = this.config.BOUNDS.maxX - 10;
		const x = Math.random() * (maxX - minX) + minX;
		const y = Math.random() * 14 + 18;
		this.gift = { type, position: { x, y }, active: true };
	}

	// --- Messaging ---------------------------------------------------------

	private get playerNames(): [string, string] {
		return this.config.playerNames ?? DEFAULT_PLAYER_NAMES;
	}

	private getMessage(): string {
		if (this.gameState === 'gameover' && this.winner !== null) {
			return `فاز ${this.playerNames[this.winner]}! 🎉`;
		}
		if (this.lastMessage && this.gameState === 'aiming') {
			return this.lastMessage;
		}
		if (this.charging) return 'استمر بالضغط لشحن القوة...';
		if (this.gameState === 'aiming') {
			return `دور ${this.playerNames[this.currentPlayer]}: حرك الماوس للتصويب ثم اضغط لشحن القوة`;
		}
		if (this.gameState === 'flying') return 'السهم في الجو...';
		return '';
	}

	private notify(): void {
		this.onChange(this.getState());
	}
}
