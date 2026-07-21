import {
	Engine,
	Scene,
	Vector3,
	Color3,
	HemisphericLight,
	DirectionalLight,
	UniversalCamera,
	MeshBuilder,
	StandardMaterial,
	Mesh,
	TransformNode,
	KeyboardEventTypes,
	PointerEventTypes
} from '@babylonjs/core';

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

export class FortBattleGame {
	private engine: Engine;
	private scene: Scene;
	private canvas: HTMLCanvasElement;

	private ground: Mesh;
	private fortMeshes: Mesh[] = [];
	private fortHitBoxes: Mesh[] = [];
	private arrowRoot: TransformNode;
	private arrowShaft: Mesh;
	private arrowHead: Mesh;
	private windIndicator: Mesh;

	private onChange: (state: FortBattleState) => void;

	private healths: [number, number] = [100, 100];
	private currentPlayer = 0;
	private angle = 45; // degrees from +X axis
	private power = 0;
	private wind = 0; // horizontal acceleration units
	private gameState: 'aiming' | 'flying' | 'gameover' = 'aiming';
	private winner: number | null = null;

	private charging = false;
	private chargeStartTime = 0;
	private arrowVelocity = Vector3.Zero();
	private arrowFlying = false;

	private readonly PLAYER_ANGLES = [45, 135];
	private readonly FORT_X = [-25, 25];
	private readonly MAX_POWER = 100;
	private readonly MIN_POWER = 10;
	private readonly POWER_SCALE = 0.22;
	private readonly GRAVITY = 11;
	private readonly WIND_SCALE = 0.45;
	private readonly DAMAGE = 25;
	private readonly GROUND_Y = 0;
	private readonly ARROW_RADIUS = 0.35;
	private readonly FORT_WIDTH = 6;
	private readonly FORT_HEIGHT = 8;
	private readonly FORT_DEPTH = 6;
	private readonly MAX_ANGLE = 170;
	private readonly MIN_ANGLE = 10;

	private lastState: FortBattleState | null = null;

	constructor(canvas: HTMLCanvasElement, onChange: (state: FortBattleState) => void) {
		this.canvas = canvas;
		this.onChange = onChange;

		this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
		this.scene = this.createScene();
		this.setupEnvironment();
		this.setupInput();

		this.engine.runRenderLoop(() => {
			this.update(this.engine.getDeltaTime() / 1000);
			this.scene.render();
		});

		window.addEventListener('resize', this.handleResize);
		this.resetTurn();
		this.notify();
	}

	private createScene(): Scene {
		const scene = new Scene(this.engine);
		scene.clearColor = new Color3(0.52, 0.8, 0.92).toColor4(1); // sky

		const camera = new UniversalCamera('camera', new Vector3(0, 16, -55), scene);
		camera.setTarget(Vector3.Zero());
		camera.inputs.clear();

		new HemisphericLight('hemi', new Vector3(0, 1, 0), scene).intensity = 0.7;
		const dir = new DirectionalLight('dir', new Vector3(-0.5, -1, 0.5), scene);
		dir.intensity = 0.8;
		dir.position = new Vector3(20, 40, -30);

		return scene;
	}

	private setupEnvironment(): void {
		// Ground
		this.ground = MeshBuilder.CreateGround('ground', { width: 120, height: 40 }, this.scene);
		this.ground.position.y = this.GROUND_Y;
		const groundMat = new StandardMaterial('groundMat', this.scene);
		groundMat.diffuseColor = new Color3(0.85, 0.75, 0.55);
		groundMat.specularColor = new Color3(0.1, 0.1, 0.1);
		this.ground.material = groundMat;

		// Forts
		for (let i = 0; i < 2; i++) {
			const x = this.FORT_X[i];
			const color = i === 0 ? new Color3(0.85, 0.45, 0.35) : new Color3(0.35, 0.55, 0.85);

			const fort = MeshBuilder.CreateBox(`fort${i}`, {
				width: this.FORT_WIDTH,
				height: this.FORT_HEIGHT,
				depth: this.FORT_DEPTH
			}, this.scene);
			fort.position = new Vector3(x, this.FORT_HEIGHT / 2, 0);
			const fortMat = new StandardMaterial(`fortMat${i}`, this.scene);
			fortMat.diffuseColor = color;
			fort.material = fortMat;

			// Crenellations
			for (let j = -1; j <= 1; j++) {
				const cren = MeshBuilder.CreateBox(`cren${i}_${j}`, { width: 1.2, height: 1, depth: 1.5 }, this.scene);
				cren.position = new Vector3(j * 1.8, this.FORT_HEIGHT / 2 + 1, 0);
				cren.parent = fort;
				const crenMat = new StandardMaterial(`crenMat${i}_${j}`, this.scene);
				crenMat.diffuseColor = color.scale(0.85);
				cren.material = crenMat;
			}

			this.fortMeshes.push(fort);

			// Invisible hit box for easier collision detection
			const hitBox = MeshBuilder.CreateBox(`fortHit${i}`, {
				width: this.FORT_WIDTH,
				height: this.FORT_HEIGHT,
				depth: this.FORT_DEPTH
			}, this.scene);
			hitBox.position = new Vector3(x, this.FORT_HEIGHT / 2, 0);
			hitBox.isVisible = false;
			hitBox.isPickable = false;
			this.fortHitBoxes.push(hitBox);
		}

		// Arrow
		this.arrowRoot = new TransformNode('arrowRoot', this.scene);
		this.arrowShaft = MeshBuilder.CreateCylinder('arrowShaft', { height: 1.6, diameter: 0.18 }, this.scene);
		this.arrowShaft.rotation.z = -Math.PI / 2;
		this.arrowShaft.position.x = 0.4;
		this.arrowShaft.parent = this.arrowRoot;
		const shaftMat = new StandardMaterial('shaftMat', this.scene);
		shaftMat.diffuseColor = new Color3(0.6, 0.35, 0.2);
		this.arrowShaft.material = shaftMat;

		this.arrowHead = MeshBuilder.CreateCylinder('arrowHead', { height: 0.5, diameterTop: 0, diameterBottom: 0.35, tessellation: 4 }, this.scene);
		this.arrowHead.rotation.z = -Math.PI / 2;
		this.arrowHead.position.x = 1.35;
		this.arrowHead.parent = this.arrowRoot;
		const headMat = new StandardMaterial('headMat', this.scene);
		headMat.diffuseColor = new Color3(0.7, 0.7, 0.75);
		this.arrowHead.material = headMat;

		this.arrowRoot.setEnabled(false);

		// Wind indicator (simple arrow in the sky)
		this.windIndicator = MeshBuilder.CreateCylinder('windInd', { height: 2, diameterTop: 0, diameterBottom: 0.2, tessellation: 8 }, this.scene);
		this.windIndicator.rotation.z = -Math.PI / 2;
		this.windIndicator.position = new Vector3(0, 22, -10);
		const windMat = new StandardMaterial('windMat', this.scene);
		windMat.diffuseColor = new Color3(1, 1, 0.9);
		windMat.emissiveColor = new Color3(0.2, 0.2, 0.15);
		this.windIndicator.material = windMat;
	}

	private setupInput(): void {
		this.scene.onKeyboardObservable.add((kbInfo) => {
			if (this.gameState === 'gameover') return;

			if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
				switch (kbInfo.event.key) {
					case 'ArrowUp':
						kbInfo.event.preventDefault();
						this.adjustAngle(2);
						break;
					case 'ArrowDown':
						kbInfo.event.preventDefault();
						this.adjustAngle(-2);
						break;
					case ' ':
					case 'Spacebar':
						kbInfo.event.preventDefault();
						if (this.gameState === 'aiming' && !this.charging) {
							this.startCharge();
						}
						break;
				}
			} else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
				if ((kbInfo.event.key === ' ' || kbInfo.event.key === 'Spacebar') && this.charging) {
					kbInfo.event.preventDefault();
					this.releaseCharge();
				}
			}
		});

		// Touch / mouse drag support through pointer observables
		let pointerDown = false;
		this.scene.onPointerObservable.add((pointerInfo) => {
			if (this.gameState !== 'aiming') return;
			if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
				pointerDown = true;
				this.startCharge();
			} else if (pointerInfo.type === PointerEventTypes.POINTERUP && pointerDown) {
				pointerDown = false;
				this.releaseCharge();
			}
		});
	}

	private handleResize = (): void => {
		this.engine.resize();
	};

	adjustAngle(delta: number): void {
		if (this.gameState !== 'aiming') return;
		this.angle = Math.max(this.MIN_ANGLE, Math.min(this.MAX_ANGLE, this.angle + delta));
		this.updateAimVisuals();
		this.notify();
	}

	startCharge(): void {
		if (this.gameState !== 'aiming' || this.charging) return;
		this.charging = true;
		this.power = this.MIN_POWER;
		this.chargeStartTime = performance.now();
		this.notify();
	}

	releaseCharge(): void {
		if (!this.charging) return;
		this.charging = false;
		this.fire();
	}

	private fire(): void {
		if (this.gameState !== 'aiming') return;
		this.gameState = 'flying';

		const start = this.getArrowStartPosition();
		this.arrowRoot.position.copyFrom(start);
		this.arrowRoot.setEnabled(true);

		const rad = (this.angle * Math.PI) / 180;
		const speed = this.power * this.POWER_SCALE;
		this.arrowVelocity.set(
			Math.cos(rad) * speed,
			Math.sin(rad) * speed,
			0
		);
		this.arrowFlying = true;
		this.updateArrowRotation();
		this.notify();
	}

	private getArrowStartPosition(): Vector3 {
		const x = this.FORT_X[this.currentPlayer] + (this.currentPlayer === 0 ? 4 : -4);
		const y = this.FORT_HEIGHT + 1.5;
		return new Vector3(x, y, 0);
	}

	private updateAimVisuals(): void {
		if (this.gameState !== 'aiming') return;
		const start = this.getArrowStartPosition();
		this.arrowRoot.position.copyFrom(start);
		this.arrowRoot.setEnabled(true);
		this.updateArrowRotation();
	}

	private updateArrowRotation(): void {
		const angleRad = Math.atan2(this.arrowVelocity.y, this.arrowVelocity.x);
		// Cylinder default axis is Y; we rotated it to point along X at rest.
		this.arrowRoot.rotation.z = angleRad - Math.PI / 2;
	}

	private update(dt: number): void {
		if (this.gameState === 'gameover') return;

		if (this.charging) {
			const elapsed = (performance.now() - this.chargeStartTime) / 1000;
			this.power = Math.min(
				this.MAX_POWER,
				this.MIN_POWER + (elapsed / 1.4) * (this.MAX_POWER - this.MIN_POWER)
			);
			this.notify();
		}

		if (this.arrowFlying) {
			const dtClamped = Math.min(dt, 0.05);
			this.arrowVelocity.x += this.wind * this.WIND_SCALE * dtClamped;
			this.arrowVelocity.y -= this.GRAVITY * dtClamped;

			this.arrowRoot.position.x += this.arrowVelocity.x * dtClamped;
			this.arrowRoot.position.y += this.arrowVelocity.y * dtClamped;
			this.updateArrowRotation();

			this.checkCollisions();
		}
	}

	private checkCollisions(): void {
		const pos = this.arrowRoot.position;

		// Ground
		if (pos.y <= this.GROUND_Y + this.ARROW_RADIUS) {
			this.handleMiss('السهم وقع على الأرض');
			return;
		}

		// Bounds
		if (pos.x < -70 || pos.x > 70 || pos.y > 50) {
			this.handleMiss('السهم خرج عن الميدان');
			return;
		}

		// Forts
		for (let i = 0; i < 2; i++) {
			if (this.arrowShaft.intersectsMesh(this.fortHitBoxes[i], false)) {
				this.handleHit(i);
				return;
			}
		}
	}

	private handleHit(fortIndex: number): void {
		this.arrowFlying = false;
		this.arrowRoot.setEnabled(false);

		// Self-damage if you hit your own fort (rare but possible with wind)
		this.healths[fortIndex] = Math.max(0, this.healths[fortIndex] - this.DAMAGE);
		this.spawnParticles(this.arrowRoot.position);

		if (this.healths[fortIndex] <= 0) {
			this.winner = fortIndex === 0 ? 1 : 0;
			this.gameState = 'gameover';
			this.notify();
			return;
		}

		this.scheduleNextTurn();
	}

	private handleMiss(message: string): void {
		this.arrowFlying = false;
		this.arrowRoot.setEnabled(false);
		this.scheduleNextTurn(message);
	}

	private scheduleNextTurn(message = ''): void {
		setTimeout(() => {
			this.switchPlayer();
			if (message) {
				this.lastState = { ...this.lastState!, message };
			}
			this.notify();
		}, 1200);
	}

	private switchPlayer(): void {
		this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
		this.resetTurn();
	}

	private resetTurn(): void {
		this.gameState = 'aiming';
		this.angle = this.PLAYER_ANGLES[this.currentPlayer];
		this.power = this.MIN_POWER;
		this.charging = false;
		this.arrowFlying = false;
		this.wind = Math.floor(Math.random() * 7) - 3; // -3 to +3
		this.updateWindVisual();
		this.updateAimVisuals();
		this.notify();
	}

	private updateWindVisual(): void {
		const scale = Math.abs(this.wind) * 0.3 + 0.3;
		this.windIndicator.scaling = new Vector3(scale, 1, 1);
		this.windIndicator.rotation.z = this.wind >= 0 ? -Math.PI / 2 : Math.PI / 2;
	}

	private spawnParticles(position: Vector3): void {
		const particle = MeshBuilder.CreateSphere('hit', { diameter: 0.8 }, this.scene);
		particle.position = position.clone();
		const mat = new StandardMaterial('hitMat', this.scene);
		mat.diffuseColor = new Color3(1, 0.6, 0.2);
		particle.material = mat;

		let life = 0;
		const obs = this.scene.onBeforeRenderObservable.add(() => {
			life += this.engine.getDeltaTime() / 1000;
			particle.scaling.scaleInPlace(1.05);
			mat.alpha = 1 - life / 0.5;
			if (life >= 0.5) {
				this.scene.onBeforeRenderObservable.remove(obs);
				particle.dispose();
				mat.dispose();
			}
		});
	}

	private notify(): void {
		const state: FortBattleState = {
			healths: [...this.healths] as [number, number],
			currentPlayer: this.currentPlayer,
			angle: Math.round(this.angle),
			power: Math.round(this.power),
			wind: this.wind,
			gameState: this.gameState,
			winner: this.winner,
			message: this.getMessage()
		};
		this.lastState = state;
		this.onChange(state);
	}

	private getMessage(): string {
		if (this.gameState === 'gameover' && this.winner !== null) {
			return this.winner === 0 ? 'فاز اللاعب الأحمر! 🎉' : 'فاز اللاعب الأزرق! 🎉';
		}
		if (this.charging) return 'استمر بالضغط لشحن القوة...';
		if (this.gameState === 'aiming') {
			return this.currentPlayer === 0
				? 'دور اللاعب الأحمر: اضبط الزاوية ثم اضغط لشحن القوة'
				: 'دور اللاعب الأزرق: اضبط الزاوية ثم اضغط لشحن القوة';
		}
		if (this.gameState === 'flying') return 'السهم في الجو...';
		return '';
	}

	resetGame(): void {
		this.healths = [100, 100];
		this.currentPlayer = 0;
		this.winner = null;
		this.resetTurn();
	}

	dispose(): void {
		window.removeEventListener('resize', this.handleResize);
		this.engine.dispose();
	}
}
