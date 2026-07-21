export interface FortBattleState {
	healths: [number, number];
	currentPlayer: number;
	angle: number;
	power: number;
	wind: number;
	gameState: 'aiming' | 'flying' | 'gameover';
	winner: number | null;
	message: string;
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

export interface FortBattleCallbacks {
	onHit?: (fortIndex: number, position: Point2D) => void;
	onMiss?: (message: string) => void;
	onWin?: (winner: number) => void;
}

export class FortBattleLogic {
	private config: FortBattleConfig;
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

	constructor(
		onChange: (state: FortBattleState) => void,
		config: Partial<FortBattleConfig> = {},
		callbacks: FortBattleCallbacks = {}
	) {
		this.onChange = onChange;
		this.config = { ...DEFAULT_FORT_BATTLE_CONFIG, ...config };
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
			message: this.getMessage()
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

	getConfig(): FortBattleConfig {
		return { ...this.config };
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
		const x =
			this.config.FORT_X[this.currentPlayer] +
			(this.currentPlayer === 0 ? this.config.FORT_RADIUS + 0.8 : -(this.config.FORT_RADIUS + 0.8));
		const y = this.config.FORT_HEIGHT + 1.6;
		return { x, y };
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

	private handleHit(fortIndex: number): void {
		this.arrowFlying = false;
		this.healths[fortIndex] = Math.max(0, this.healths[fortIndex] - this.config.DAMAGE);
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
		this.wind = Math.floor(Math.random() * 7) - 3; // -3 to +3
		this.notify();
	}

	// --- Messaging ---------------------------------------------------------

	private getMessage(): string {
		if (this.gameState === 'gameover' && this.winner !== null) {
			return this.winner === 0 ? 'فاز اللاعب الأحمر! 🎉' : 'فاز اللاعب الأزرق! 🎉';
		}
		if (this.lastMessage && this.gameState === 'aiming') {
			return this.lastMessage;
		}
		if (this.charging) return 'استمر بالضغط لشحن القوة...';
		if (this.gameState === 'aiming') {
			return this.currentPlayer === 0
				? 'دور اللاعب الأحمر: حرك الماوس للتصويب ثم اضغط لشحن القوة'
				: 'دور اللاعب الأزرق: حرك الماوس للتصويب ثم اضغط لشحن القوة';
		}
		if (this.gameState === 'flying') return 'السهم في الجو...';
		return '';
	}

	private notify(): void {
		this.onChange(this.getState());
	}
}
