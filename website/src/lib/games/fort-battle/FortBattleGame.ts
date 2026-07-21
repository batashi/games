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

class GameAudio {
	private ctx: AudioContext | null = null;
	private muted = false;

	constructor() {}

	setMuted(muted: boolean) {
		this.muted = muted;
	}

	getMuted() {
		return this.muted;
	}

	private ensureCtx() {
		if (this.muted) return null;
		if (!this.ctx) {
			this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
		}
		if (this.ctx.state === 'suspended') {
			this.ctx.resume();
		}
		return this.ctx;
	}

	playShoot() {
		const ctx = this.ensureCtx();
		if (!ctx) return;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(180, ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.18);
		gain.gain.setValueAtTime(0.25, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start();
		osc.stop(ctx.currentTime + 0.2);
	}

	playHit() {
		const ctx = this.ensureCtx();
		if (!ctx) return;
		// noise burst + low thud
		const bufferSize = ctx.sampleRate * 0.25;
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) {
			data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
		}
		const noise = ctx.createBufferSource();
		noise.buffer = buffer;
		const noiseGain = ctx.createGain();
		noiseGain.gain.setValueAtTime(0.35, ctx.currentTime);
		noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
		const filter = ctx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value = 800;
		noise.connect(filter);
		filter.connect(noiseGain);
		noiseGain.connect(ctx.destination);
		noise.start();

		const osc = ctx.createOscillator();
		const oscGain = ctx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(90, ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);
		oscGain.gain.setValueAtTime(0.4, ctx.currentTime);
		oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
		osc.connect(oscGain);
		oscGain.connect(ctx.destination);
		osc.start();
		osc.stop(ctx.currentTime + 0.22);
	}

	playMiss() {
		const ctx = this.ensureCtx();
		if (!ctx) return;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = 'triangle';
		osc.frequency.setValueAtTime(220, ctx.currentTime);
		osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.2);
		gain.gain.setValueAtTime(0.15, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start();
		osc.stop(ctx.currentTime + 0.25);
	}

	playWin() {
		const ctx = this.ensureCtx();
		if (!ctx) return;
		[330, 392, 494, 659].forEach((freq, i) => {
			const osc = ctx!.createOscillator();
			const gain = ctx!.createGain();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(freq, ctx!.currentTime + i * 0.12);
			gain.gain.setValueAtTime(0.0001, ctx!.currentTime + i * 0.12);
			gain.gain.exponentialRampToValueAtTime(0.2, ctx!.currentTime + i * 0.12 + 0.03);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx!.currentTime + i * 0.12 + 0.35);
			osc.connect(gain);
			gain.connect(ctx!.destination);
			osc.start(ctx!.currentTime + i * 0.12);
			osc.stop(ctx!.currentTime + i * 0.12 + 0.4);
		});
	}
}

export class FortBattleGame {
	private engine: Engine;
	private scene: Scene;
	private canvas: HTMLCanvasElement;

	private ground!: Mesh;
	private fortRoots: TransformNode[] = [];
	private fortHitBoxes: Mesh[] = [];
	private archers: TransformNode[] = [];
	private arrowRoot!: TransformNode;
	private arrowShaft!: Mesh;
	private arrowHead!: Mesh;
	private fletching: Mesh[] = [];
	private windIndicator!: Mesh;
	private aimGuideRoot!: TransformNode;
	private aimGuideDots: Mesh[] = [];
	private aimGuideLine!: Mesh;
	private aimPlane!: Mesh;

	private audio = new GameAudio();
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
	private readonly FORT_RADIUS = 3.5;
	private readonly FORT_HEIGHT = 8;
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
		this.ground = MeshBuilder.CreateGround('ground', { width: 140, height: 60 }, this.scene);
		this.ground.position.y = this.GROUND_Y;
		const groundMat = new StandardMaterial('groundMat', this.scene);
		groundMat.diffuseColor = new Color3(0.82, 0.72, 0.52);
		groundMat.specularColor = new Color3(0.1, 0.1, 0.1);
		this.ground.material = groundMat;

		// Invisible aiming plane at z=0 for mouse-to-world conversion
		this.aimPlane = MeshBuilder.CreatePlane('aimPlane', { width: 200, height: 100 }, this.scene);
		this.aimPlane.position.z = 0;
		this.aimPlane.rotation.y = Math.PI; // face camera
		this.aimPlane.isVisible = false;
		this.aimPlane.isPickable = true;

		// Forts
		for (let i = 0; i < 2; i++) {
			const x = this.FORT_X[i];
			const color = i === 0 ? new Color3(0.82, 0.48, 0.36) : new Color3(0.36, 0.55, 0.78);
			const darker = color.scale(0.75);

			const root = new TransformNode(`fortRoot${i}`, this.scene);
			root.position.x = x;
			this.fortRoots.push(root);

			// Round Omani-style tower body
			const body = MeshBuilder.CreateCylinder(`fortBody${i}`, {
				height: this.FORT_HEIGHT,
				diameter: this.FORT_RADIUS * 2,
				tessellation: 32
			}, this.scene);
			body.position.y = this.FORT_HEIGHT / 2;
			body.parent = root;
			const fortMat = new StandardMaterial(`fortMat${i}`, this.scene);
			fortMat.diffuseColor = color;
			fortMat.specularColor = new Color3(0.1, 0.1, 0.1);
			body.material = fortMat;

			// Pointed conical roof
			const roof = MeshBuilder.CreateCylinder(`fortRoof${i}`, {
				height: 4,
				diameterTop: 0,
				diameterBottom: this.FORT_RADIUS * 2.1,
				tessellation: 32
			}, this.scene);
			roof.position.y = this.FORT_HEIGHT + 2;
			roof.parent = root;
			const roofMat = new StandardMaterial(`roofMat${i}`, this.scene);
			roofMat.diffuseColor = darker;
			roofMat.specularColor = new Color3(0.1, 0.1, 0.1);
			roof.material = roofMat;

			// Recessed arched window near bottom (Omani-style)
			const archFrame = MeshBuilder.CreateTorus(`fortWindow${i}`, {
				diameter: 1.7,
				thickness: 0.22,
				tessellation: 24
			}, this.scene);
			archFrame.scaling.y = 1.35;
			archFrame.position = new Vector3(0, 2.3, this.FORT_RADIUS + 0.04);
			archFrame.rotation.x = Math.PI / 2;
			archFrame.parent = root;
			const archFrameMat = new StandardMaterial(`windowFrameMat${i}`, this.scene);
			archFrameMat.diffuseColor = darker;
			archFrame.material = archFrameMat;

			const archDark = MeshBuilder.CreateSphere(`fortWindowDark${i}`, { diameter: 1.25 }, this.scene);
			archDark.scaling.y = 1.3;
			archDark.position = new Vector3(0, 2.3, this.FORT_RADIUS + 0.08);
			archDark.parent = root;
			const archDarkMat = new StandardMaterial(`windowDarkMat${i}`, this.scene);
			archDarkMat.diffuseColor = new Color3(0.12, 0.1, 0.08);
			archDark.material = archDarkMat;

			// Invisible hit box aligned with the round body
			const hitBox = MeshBuilder.CreateCylinder(`fortHit${i}`, {
				height: this.FORT_HEIGHT,
				diameter: this.FORT_RADIUS * 2,
				tessellation: 16
			}, this.scene);
			hitBox.position.y = this.FORT_HEIGHT / 2;
			hitBox.parent = root;
			hitBox.isVisible = false;
			hitBox.isPickable = false;
			this.fortHitBoxes.push(hitBox);

			// Archer on top
			this.archers.push(this.createArcher(root, i));
		}

		// Arrow with fletching
		this.arrowRoot = new TransformNode('arrowRoot', this.scene);
		this.arrowShaft = MeshBuilder.CreateCylinder('arrowShaft', { height: 1.8, diameter: 0.14 }, this.scene);
		this.arrowShaft.rotation.z = -Math.PI / 2;
		this.arrowShaft.position.x = 0.45;
		this.arrowShaft.parent = this.arrowRoot;
		const shaftMat = new StandardMaterial('shaftMat', this.scene);
		shaftMat.diffuseColor = new Color3(0.55, 0.32, 0.18);
		this.arrowShaft.material = shaftMat;

		this.arrowHead = MeshBuilder.CreateCylinder('arrowHead', { height: 0.55, diameterTop: 0, diameterBottom: 0.32, tessellation: 5 }, this.scene);
		this.arrowHead.rotation.z = -Math.PI / 2;
		this.arrowHead.position.x = 1.5;
		this.arrowHead.parent = this.arrowRoot;
		const headMat = new StandardMaterial('headMat', this.scene);
		headMat.diffuseColor = new Color3(0.75, 0.75, 0.78);
		headMat.specularColor = new Color3(0.4, 0.4, 0.4);
		this.arrowHead.material = headMat;

		for (let k = 0; k < 3; k++) {
			const fletch = MeshBuilder.CreatePlane(`fletch${k}`, { width: 0.35, height: 0.45 }, this.scene);
			fletch.position.x = -0.55;
			fletch.rotation.x = (k * Math.PI * 2) / 3;
			fletch.rotation.y = Math.PI / 2;
			fletch.parent = this.arrowRoot;
			const fletchMat = new StandardMaterial(`fletchMat${k}`, this.scene);
			fletchMat.diffuseColor = new Color3(0.9, 0.25, 0.2);
			fletchMat.backFaceCulling = false;
			fletch.material = fletchMat;
			this.fletching.push(fletch);
		}

		this.arrowRoot.setEnabled(false);

		// Aim guide (dotted trajectory + line)
		this.aimGuideRoot = new TransformNode('aimGuideRoot', this.scene);
		const guideMat = new StandardMaterial('guideMat', this.scene);
		guideMat.diffuseColor = new Color3(1, 0.95, 0.6);
		guideMat.emissiveColor = new Color3(0.5, 0.45, 0.15);
		guideMat.alpha = 0.85;

		this.aimGuideLine = MeshBuilder.CreateLines('aimGuideLine', {
			points: [Vector3.Zero(), Vector3.Zero()],
			updatable: true
		}, this.scene);
		this.aimGuideLine.color = new Color3(1, 0.95, 0.7);
		this.aimGuideLine.parent = this.aimGuideRoot;

		for (let k = 0; k < 18; k++) {
			const dot = MeshBuilder.CreateSphere(`guideDot${k}`, { diameter: 0.32 }, this.scene);
			dot.material = guideMat;
			dot.parent = this.aimGuideRoot;
			this.aimGuideDots.push(dot);
		}
		this.aimGuideRoot.setEnabled(false);

		// Wind indicator (simple arrow in the sky)
		this.windIndicator = MeshBuilder.CreateCylinder('windInd', { height: 2.2, diameterTop: 0, diameterBottom: 0.22, tessellation: 8 }, this.scene);
		this.windIndicator.rotation.z = -Math.PI / 2;
		this.windIndicator.position = new Vector3(0, 22, -10);
		const windMat = new StandardMaterial('windMat', this.scene);
		windMat.diffuseColor = new Color3(1, 1, 0.9);
		windMat.emissiveColor = new Color3(0.2, 0.2, 0.15);
		this.windIndicator.material = windMat;
	}

	private createArcher(parent: TransformNode, index: number): TransformNode {
		const archer = new TransformNode(`archer${index}`, this.scene);
		archer.parent = parent;
		archer.position = new Vector3(0, this.FORT_HEIGHT + 0.1, 0);
		archer.scaling.setAll(1.35);

		const skinMat = new StandardMaterial(`skinMat${index}`, this.scene);
		skinMat.diffuseColor = new Color3(0.76, 0.6, 0.45);

		const clothesMat = new StandardMaterial(`clothesMat${index}`, this.scene);
		clothesMat.diffuseColor = index === 0 ? new Color3(0.75, 0.3, 0.25) : new Color3(0.25, 0.45, 0.7);

		// Robe / body
		const body = MeshBuilder.CreateCylinder(`archerBody${index}`, { height: 1.2, diameter: 0.55 }, this.scene);
		body.position.y = 0.6;
		body.parent = archer;
		body.material = clothesMat;

		// Head
		const head = MeshBuilder.CreateSphere(`archerHead${index}`, { diameter: 0.48 }, this.scene);
		head.position.y = 1.35;
		head.parent = archer;
		head.material = skinMat;

		// Keffiyeh / headscarf
		const turban = MeshBuilder.CreateTorus(`archerTurban${index}`, { diameter: 0.54, thickness: 0.14 }, this.scene);
		turban.position.y = 1.42;
		turban.rotation.x = Math.PI / 2;
		turban.parent = archer;
		const turbanMat = new StandardMaterial(`turbanMat${index}`, this.scene);
		turbanMat.diffuseColor = new Color3(0.93, 0.88, 0.72);
		turban.material = turbanMat;

		// Legs
		for (let s = -1; s <= 1; s += 2) {
			const leg = MeshBuilder.CreateCylinder(`archerLeg${index}_${s}`, { height: 0.75, diameter: 0.2 }, this.scene);
			leg.position = new Vector3(s * 0.18, -0.38, 0);
			leg.parent = archer;
			leg.material = clothesMat;
		}

		// Arms (one forward holding bow, one back drawing string)
		const armL = MeshBuilder.CreateCylinder(`archerArmL${index}`, { height: 0.7, diameter: 0.16 }, this.scene);
		armL.position = new Vector3(-0.35, 0.95, 0.28);
		armL.rotation.z = -0.5;
		armL.rotation.x = 0.8;
		armL.parent = archer;
		armL.material = skinMat;

		const armR = MeshBuilder.CreateCylinder(`archerArmR${index}`, { height: 0.7, diameter: 0.16 }, this.scene);
		armR.position = new Vector3(0.35, 0.95, -0.18);
		armR.rotation.z = 0.5;
		armR.rotation.x = -0.6;
		armR.parent = archer;
		armR.material = skinMat;

		// Bow (curved tube-like torus segment)
		const bow = MeshBuilder.CreateTorus(`archerBow${index}`, { diameter: 1.2, thickness: 0.07, tessellation: 24 }, this.scene);
		bow.position = new Vector3(-0.6, 0.95, 0.38);
		bow.rotation.y = Math.PI / 2;
		bow.rotation.x = 0.4;
		bow.scaling.z = 1.6;
		bow.parent = archer;
		const bowMat = new StandardMaterial(`bowMat${index}`, this.scene);
		bowMat.diffuseColor = new Color3(0.45, 0.28, 0.15);
		bow.material = bowMat;

		// Bowstring
		const bowString = MeshBuilder.CreateLines(`archerBowString${index}`, {
			points: [
				new Vector3(-0.25, 1.55, 0.38),
				new Vector3(-0.95, 0.35, 0.38),
			],
		}, this.scene);
		bowString.color = new Color3(0.85, 0.8, 0.7);
		bowString.parent = archer;

		// Quiver on back
		const quiver = MeshBuilder.CreateCylinder(`archerQuiver${index}`, { height: 0.9, diameter: 0.22 }, this.scene);
		quiver.position = new Vector3(0.3, 0.8, -0.35);
		quiver.rotation.x = -0.5;
		quiver.rotation.z = -0.2;
		quiver.parent = archer;
		const quiverMat = new StandardMaterial(`quiverMat${index}`, this.scene);
		quiverMat.diffuseColor = new Color3(0.55, 0.32, 0.18);
		quiver.material = quiverMat;

		return archer;
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

		// Mouse / touch: move to aim, press to charge, release to fire
		let pointerDown = false;
		this.scene.onPointerObservable.add((pointerInfo) => {
			if (this.gameState === 'gameover') return;

			if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
				if (this.gameState === 'aiming' && !this.charging) {
					this.aimFromPointer();
				}
			} else if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
				if (this.gameState === 'aiming' && !this.charging) {
					pointerDown = true;
					this.startCharge();
				}
			} else if (pointerInfo.type === PointerEventTypes.POINTERUP && pointerDown) {
				pointerDown = false;
				this.releaseCharge();
			}
		});
	}

	private aimFromPointer(): void {
		const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => mesh === this.aimPlane);
		if (!pickResult.hit || !pickResult.pickedPoint) return;

		const start = this.getArrowStartPosition();
		const target = pickResult.pickedPoint;
		const dx = target.x - start.x;
		const dy = target.y - start.y;
		let newAngle = (Math.atan2(dy, dx) * 180) / Math.PI;

		// Face the enemy side
		if (this.currentPlayer === 0) {
			newAngle = Math.max(this.MIN_ANGLE, Math.min(90, newAngle));
		} else {
			newAngle = Math.max(90, Math.min(this.MAX_ANGLE, newAngle));
		}

		this.angle = Math.round(newAngle);
		this.updateAimVisuals();
		this.notify();
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

	setMuted(muted: boolean): void {
		this.audio.setMuted(muted);
	}

	getMuted(): boolean {
		return this.audio.getMuted();
	}

	private fire(): void {
		if (this.gameState !== 'aiming') return;
		this.gameState = 'flying';
		this.aimGuideRoot.setEnabled(false);

		const start = this.getArrowStartPosition();
		this.arrowRoot.position.copyFrom(start);
		this.arrowRoot.setEnabled(true);

		const rad = (this.angle * Math.PI) / 180;
		const speed = this.power * this.POWER_SCALE;
		this.arrowVelocity.set(Math.cos(rad) * speed, Math.sin(rad) * speed, 0);
		this.arrowFlying = true;
		this.updateArrowRotation();
		this.audio.playShoot();
		this.notify();
	}

	private getArrowStartPosition(): Vector3 {
		const x = this.FORT_X[this.currentPlayer] + (this.currentPlayer === 0 ? this.FORT_RADIUS + 0.8 : -(this.FORT_RADIUS + 0.8));
		const y = this.FORT_HEIGHT + 1.6;
		return new Vector3(x, y, 0);
	}

	private updateAimVisuals(): void {
		if (this.gameState !== 'aiming') return;
		const start = this.getArrowStartPosition();
		this.arrowRoot.position.copyFrom(start);
		this.arrowRoot.setEnabled(true);
		this.updateArrowRotation();
		this.updateAimGuide();
	}

	private updateAimGuide(): void {
		if (this.gameState !== 'aiming') {
			this.aimGuideRoot.setEnabled(false);
			return;
		}
		const rad = (this.angle * Math.PI) / 180;
		const speed = this.power * this.POWER_SCALE;
		const vx = Math.cos(rad) * speed;
		const vy = Math.sin(rad) * speed;
		const start = this.getArrowStartPosition();

		this.aimGuideRoot.setEnabled(true);
		const linePoints: Vector3[] = [start];
		for (let i = 0; i < this.aimGuideDots.length; i++) {
			const t = (i + 1) * 0.12;
			const pos = new Vector3(
				start.x + vx * t + 0.5 * this.wind * this.WIND_SCALE * t * t,
				start.y + vy * t - 0.5 * this.GRAVITY * t * t,
				0
			);
			this.aimGuideDots[i].position.copyFrom(pos);
			const scale = 1 - i / this.aimGuideDots.length * 0.45;
			this.aimGuideDots[i].scaling.setAll(scale);
			linePoints.push(pos);
		}
		this.aimGuideLine = MeshBuilder.CreateLines(null, {
			points: linePoints,
			instance: this.aimGuideLine as any
		});
	}

	private updateArrowRotation(): void {
		const angleRad = this.arrowFlying
			? Math.atan2(this.arrowVelocity.y, this.arrowVelocity.x)
			: (this.angle * Math.PI) / 180;
		// Cylinder default axis is Y; we rotated it to point along +X at rest, so root rotation equals the flight angle.
		this.arrowRoot.rotation.z = angleRad;

		// Point archer and bow toward aim direction.
		// The archer mesh was built facing +X in the X-Y plane, so rotate around Z to match the aim angle.
		const archer = this.archers[this.currentPlayer];
		if (archer) {
			archer.rotation.z = angleRad;
		}
	}

	private update(dt: number): void {
		if (this.gameState === 'gameover') return;

		if (this.charging) {
			const elapsed = (performance.now() - this.chargeStartTime) / 1000;
			this.power = Math.min(this.MAX_POWER, this.MIN_POWER + (elapsed / 1.4) * (this.MAX_POWER - this.MIN_POWER));
			this.updateAimGuide();
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
		if (pos.x < -80 || pos.x > 80 || pos.y > 60) {
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

		this.healths[fortIndex] = Math.max(0, this.healths[fortIndex] - this.DAMAGE);
		this.spawnParticles(this.arrowRoot.position);
		this.audio.playHit();

		if (this.healths[fortIndex] <= 0) {
			this.winner = fortIndex === 0 ? 1 : 0;
			this.gameState = 'gameover';
			this.audio.playWin();
			this.notify();
			return;
		}

		this.scheduleNextTurn();
	}

	private handleMiss(message: string): void {
		this.arrowFlying = false;
		this.arrowRoot.setEnabled(false);
		this.audio.playMiss();
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
		for (let i = 0; i < 8; i++) {
			const particle = MeshBuilder.CreateSphere(`hit${i}`, { diameter: 0.5 + Math.random() * 0.4 }, this.scene);
			particle.position = position.clone();
			const mat = new StandardMaterial(`hitMat${i}`, this.scene);
			mat.diffuseColor = new Color3(1, 0.5 + Math.random() * 0.2, 0.1);
			particle.material = mat;

			const vel = new Vector3((Math.random() - 0.5) * 6, Math.random() * 6, (Math.random() - 0.5) * 4);
			let life = 0;
			const obs = this.scene.onBeforeRenderObservable.add(() => {
				const dt = this.engine.getDeltaTime() / 1000;
				life += dt;
				vel.y -= this.GRAVITY * dt;
				particle.position.addInPlace(vel.scale(dt));
				particle.scaling.scaleInPlace(1.02);
				mat.alpha = 1 - life / 0.7;
				if (life >= 0.7) {
					this.scene.onBeforeRenderObservable.remove(obs);
					particle.dispose();
					mat.dispose();
				}
			});
		}
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
				? 'دور اللاعب الأحمر: حرك الماوس للتصويب ثم اضغط لشحن القوة'
				: 'دور اللاعب الأزرق: حرك الماوس للتصويب ثم اضغط لشحن القوة';
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
