import {
	Engine,
	Scene,
	Vector3,
	Color3,
	Color4,
	HemisphericLight,
	DirectionalLight,
	PointLight,
	UniversalCamera,
	MeshBuilder,
	StandardMaterial,
	Mesh,
	TransformNode,
	PointerEventTypes,
	DynamicTexture,
	Animation,
	VertexBuffer,
	Plane,
	Matrix,
	Material
} from '@babylonjs/core';
import {
	MajlisHostLogic,
	DEFAULT_MAJLIS_HOST_CONFIG,
	type MajlisHostState,
	type MajlisHostConfig,
	type ServingItem,
	type GuestType,
	type PowerUpType
} from './MajlisHostLogic';

export type { MajlisHostState };

export interface MajlisHostGameOptions {
	level?: number;
	config?: Partial<MajlisHostConfig>;
}

const ITEM_ORDER: ServingItem[] = ['bukhoor', 'qahwa', 'dates', 'water'];

const GUEST_ICONS: Record<GuestType, string> = {
	camel: '🐪',
	falcon: '🦅',
	oryx: '🦌',
	fox: '🦊',
	goat: '🐐',
	sheep: '🐑'
};

const ITEM_ICONS: Record<ServingItem, string> = {
	bukhoor: '🌿',
	qahwa: '☕',
	dates: '🌴',
	water: '💧',
	halwa: '🍬',
	refill: '♨️'
};

class MajlisHostAudio {
	private ctx: AudioContext | null = null;
	private muted = false;
	private musicTimer: ReturnType<typeof setInterval> | null = null;

	setMuted(muted: boolean): void {
		this.muted = muted;
		if (muted) this.stopMusic();
		else this.playMusic();
	}

	getMuted(): boolean {
		return this.muted;
	}

	private getCtx(): AudioContext {
		if (!this.ctx) {
			this.ctx = new (window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
		}
		if (this.ctx.state === 'suspended') this.ctx.resume();
		return this.ctx;
	}

	private ensureCtx(): AudioContext | null {
		if (this.muted) return null;
		return this.getCtx();
	}

	playMusic(): void {
		if (this.musicTimer || this.muted) return;
		this.musicTimer = setInterval(() => {
			if (!this.muted) this.playMusicBar(this.getCtx());
		}, 6200);
		if (!this.muted) this.playMusicBar(this.getCtx());
	}

	stopMusic(): void {
		if (this.musicTimer) {
			clearInterval(this.musicTimer);
			this.musicTimer = null;
		}
	}

	private playMusicBar(ctx: AudioContext): void {
		const now = ctx.currentTime;
		// Maqam Rast on D (D, E, F#4, G, A, Bb, C5) — warm Gulf/coffee-song feel.
		// Stylistic nod to "والله تصبوها القهوة وزيدوها هيل" / صبوا القهوة.
		const scale = [293.66, 329.63, 369.99, 392.0, 440.0, 466.16, 523.25];
		const phrase = [0, 2, 4, 3, 2, 1, 0, 0, 2, 3, 2, 1, 0];
		const durations = [0.42, 0.32, 0.52, 0.3, 0.32, 0.38, 0.6, 0.32, 0.36, 0.32, 0.36, 0.42, 0.78];
		let t = 0;
		phrase.forEach((noteIdx, i) => {
			this.playOudNote(ctx, now + t, scale[noteIdx], durations[i]);
			// Soft frame-drum / tar pulse on the strong beats.
			if (i === 0 || i === 4 || i === 7 || i === 10) {
				this.playFrameDrum(ctx, now + t, i === 0 ? 0.045 : 0.028);
			}
			t += durations[i] + 0.06;
		});
	}

	private playOudNote(ctx: AudioContext, when: number, freq: number, duration: number): void {
		const osc = ctx.createOscillator();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(freq * 1.01, when);
		osc.frequency.exponentialRampToValueAtTime(freq, when + 0.05);

		const filter = ctx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.setValueAtTime(1300, when);
		filter.frequency.exponentialRampToValueAtTime(600, when + 0.3);
		filter.Q.value = 0.5;

		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0, when);
		gain.gain.linearRampToValueAtTime(0.04, when + 0.008);
		gain.gain.exponentialRampToValueAtTime(0.015, when + 0.2);
		gain.gain.exponentialRampToValueAtTime(0.001, when + duration);

		osc.connect(filter);
		filter.connect(gain);
		gain.connect(ctx.destination);
		osc.start(when);
		osc.stop(when + duration + 0.08);
	}

	private playFrameDrum(ctx: AudioContext, when: number, volume: number): void {
		const bufferSize = Math.floor(ctx.sampleRate * 0.12);
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) {
			const envelope = Math.max(0, 1 - i / bufferSize) ** 1.8;
			data[i] = (Math.random() * 2 - 1) * envelope;
		}
		const noise = ctx.createBufferSource();
		noise.buffer = buffer;

		const filter = ctx.createBiquadFilter();
		filter.type = 'bandpass';
		filter.frequency.value = 220;
		filter.Q.value = 0.8;

		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0, when);
		gain.gain.linearRampToValueAtTime(volume, when + 0.005);
		gain.gain.exponentialRampToValueAtTime(0.001, when + 0.12);

		noise.connect(filter);
		filter.connect(gain);
		gain.connect(ctx.destination);
		noise.start(when);
	}

	playServe(item: ServingItem): void {
		const ctx = this.ensureCtx();
		if (!ctx) return;
		const now = ctx.currentTime;

		switch (item) {
			case 'bukhoor':
				this.playSizzle(ctx, now);
				break;
			case 'qahwa':
			case 'refill':
				this.playPour(ctx, now);
				break;
			case 'dates':
				this.playClink(ctx, now, 880);
				break;
			case 'halwa':
				this.playClink(ctx, now, 1100);
				break;
			case 'water':
				this.playSplash(ctx, now);
				break;
		}
	}

	private playPour(ctx: AudioContext, when: number): void {
		const bufferSize = ctx.sampleRate * 0.25;
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) {
			data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize) * 0.5;
		}
		const noise = ctx.createBufferSource();
		noise.buffer = buffer;
		const filter = ctx.createBiquadFilter();
		filter.type = 'bandpass';
		filter.frequency.value = 600;
		filter.Q.value = 1.5;
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.05, when);
		gain.gain.exponentialRampToValueAtTime(0.001, when + 0.25);
		noise.connect(filter);
		filter.connect(gain);
		gain.connect(ctx.destination);
		noise.start(when);
	}

	private playSizzle(ctx: AudioContext, when: number): void {
		const bufferSize = ctx.sampleRate * 0.18;
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) {
			data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
		}
		const noise = ctx.createBufferSource();
		noise.buffer = buffer;
		const filter = ctx.createBiquadFilter();
		filter.type = 'highpass';
		filter.frequency.value = 1200;
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.03, when);
		gain.gain.exponentialRampToValueAtTime(0.001, when + 0.18);
		noise.connect(filter);
		filter.connect(gain);
		gain.connect(ctx.destination);
		noise.start(when);
	}

	private playClink(ctx: AudioContext, when: number, freq: number): void {
		const osc = ctx.createOscillator();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(freq, when);
		osc.frequency.exponentialRampToValueAtTime(freq * 1.5, when + 0.06);
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.05, when);
		gain.gain.exponentialRampToValueAtTime(0.001, when + 0.1);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(when);
		osc.stop(when + 0.1);
	}

	private playSplash(ctx: AudioContext, when: number): void {
		const bufferSize = ctx.sampleRate * 0.15;
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) {
			data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
		}
		const noise = ctx.createBufferSource();
		noise.buffer = buffer;
		const filter = ctx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value = 900;
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.04, when);
		gain.gain.exponentialRampToValueAtTime(0.001, when + 0.15);
		noise.connect(filter);
		filter.connect(gain);
		gain.connect(ctx.destination);
		noise.start(when);
	}

	playMistake(): void {
		const ctx = this.ensureCtx();
		if (!ctx) return;
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(150, now);
		osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
		const filter = ctx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value = 400;
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.08, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
		osc.connect(filter);
		filter.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + 0.25);
	}

	playGuestHappy(): void {
		const ctx = this.ensureCtx();
		if (!ctx) return;
		const now = ctx.currentTime;
		[523, 659, 784].forEach((freq, i) => {
			const osc = ctx.createOscillator();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(freq, now + i * 0.06);
			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.0001, now + i * 0.06);
			gain.gain.exponentialRampToValueAtTime(0.1, now + i * 0.06 + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.35);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now + i * 0.06);
			osc.stop(now + i * 0.06 + 0.4);
		});
	}

	playWin(): void {
		const ctx = this.ensureCtx();
		if (!ctx) return;
		const now = ctx.currentTime;
		[392, 523, 659, 784, 1047].forEach((freq, i) => {
			const osc = ctx.createOscillator();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(freq, now + i * 0.1);
			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.0001, now + i * 0.1);
			gain.gain.exponentialRampToValueAtTime(0.14, now + i * 0.1 + 0.03);
			gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now + i * 0.1);
			osc.stop(now + i * 0.1 + 0.55);
		});
	}
}

interface ServingItemMesh {
	item: ServingItem;
	root: TransformNode;
	itemRoot: TransformNode;
	collider: Mesh;
	highlight: Mesh;
}

interface GuestMesh {
	root: TransformNode;
	body: Mesh;
	icon: Mesh;
	patienceBar: Mesh;
	patienceBg: Mesh;
}

export class MajlisHostGame {
	private canvas: HTMLCanvasElement;
	private engine: Engine;
	private scene: Scene;
	private camera: UniversalCamera;
	private logic: MajlisHostLogic;
	private audio: MajlisHostAudio;
	private onChange: (state: MajlisHostState) => void;

	private servingItems: ServingItemMesh[] = [];
	private guestMesh: GuestMesh | null = null;
	private smokeParticles: { mesh: Mesh; life: number; vy: number; vx: number; vz: number }[] = [];
	private floatingLabels: { mesh: Mesh; life: number; vy: number }[] = [];

	private dragPlane: Mesh | null = null;
	private guestDropZone: Mesh | null = null;
	private guestHighlight: Mesh | null = null;
	private dragState: {
		item: ServingItem | null;
		ghost: TransformNode | null;
		startRootPos: Vector3;
		targetPos: Vector3;
		isOverGuest: boolean;
	} = { item: null, ghost: null, startRootPos: Vector3.Zero(), targetPos: Vector3.Zero(), isOverGuest: false };

	private hoveredItem: ServingItem | null = null;
	private steamParticles: { mesh: Mesh; life: number; maxLife: number; vy: number; vx: number; vz: number }[] = [];
	private steamTimer = 0;

	private disposed = false;
	private time = 0;
	private lastGuestId = -1;
	private lastState: MajlisHostState | null = null;
	private guestEntranceTimer = 0;
	private leavingGuest: {
		root: TransformNode;
		body: Mesh;
		icon: Mesh;
		type: GuestType;
		happy: boolean;
		timer: number;
		startPos: Vector3;
		phase: 'react' | 'fly';
	} | null = null;

	private handleResize: () => void;
	private handleKeydown: (e: KeyboardEvent) => void;

	constructor(
		canvas: HTMLCanvasElement,
		onChange: (state: MajlisHostState) => void,
		options: MajlisHostGameOptions = {}
	) {
		this.canvas = canvas;
		this.onChange = onChange;
		this.audio = new MajlisHostAudio();

		this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
		this.scene = this.createScene();
		this.camera = this.createCamera();
		this.setupLights();
		this.setupEnvironment();
		this.setupServingItems();
		this.setupGuestArea();
		this.setupDragAndDrop();
		this.setupInput();

		this.logic = new MajlisHostLogic(
			(state) => {
				this.lastState = state;
				this.onChange(state);
			},
			options.config,
			{
				onStepServed: (item, correct) => {
					if (correct) {
						this.audio.playServe(item);
						this.animateItem(item);
						this.spawnFloatingLabel(correct ? '✨' : '❌');
					} else {
						this.audio.playMistake();
						this.spawnFloatingLabel('❌');
					}
				},
				onGuestComplete: (happy, type) => {
					this.spawnFloatingLabel(happy ? '😊' : '😞');
					this.startGuestLeave(happy, type);
				},
				onLevelComplete: () => this.audio.playWin(),
				onLevelFailed: () => this.audio.playMistake()
			}
		);

		this.handleResize = () => this.engine.resize();
		window.addEventListener('resize', this.handleResize);

		this.handleKeydown = (e: KeyboardEvent) => {
			const keyMap: Record<string, ServingItem> = {
				Digit1: 'bukhoor',
				Digit2: 'qahwa',
				Digit3: 'dates',
				Digit4: 'water'
			};
			const item = keyMap[e.code];
			if (item) {
				e.preventDefault();
				this.logic.serveItem(item);
			}
		};
		window.addEventListener('keydown', this.handleKeydown);

		this.engine.runRenderLoop(() => {
			if (this.disposed) return;
			const dt = this.engine.getDeltaTime() / 1000;
			this.time += dt;
			this.logic.update(dt);
			this.syncScene();
			this.updateHover(dt);
			this.updateSteam(dt);
			this.updateLeavingGuest(dt);
			this.updateParticles(dt);
			this.scene.render();
		});

		if (options.level) {
			this.logic.startLevel(options.level);
			this.audio.playMusic();
		}
	}

	private createScene(): Scene {
		const scene = new Scene(this.engine);
		// Warm sandy interior.
		scene.clearColor = new Color4(0.92, 0.82, 0.68, 1);
		return scene;
	}

	private createCamera(): UniversalCamera {
		const camera = new UniversalCamera('camera', new Vector3(0, 9, -12), this.scene);
		camera.setTarget(new Vector3(0, 0, 0));
		camera.mode = UniversalCamera.ORTHOGRAPHIC_CAMERA;
		camera.orthoLeft = -10;
		camera.orthoRight = 10;
		camera.orthoTop = 7.5;
		camera.orthoBottom = -7.5;
		camera.inputs.clear();
		return camera;
	}

	private setupLights(): void {
		const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
		hemi.intensity = 0.55;
		hemi.diffuse = new Color3(1, 0.88, 0.68);
		hemi.groundColor = new Color3(0.55, 0.42, 0.3);

		const dir = new DirectionalLight('dir', new Vector3(-0.5, -1, -0.6), this.scene);
		dir.intensity = 0.7;
		dir.diffuse = new Color3(1, 0.82, 0.55);

		// Lantern glow near the serving tray.
		const point = new PointLight('lantern', new Vector3(0, 3, -2), this.scene);
		point.intensity = 0.5;
		point.diffuse = new Color3(1, 0.65, 0.25);
		point.range = 10;
	}

	private setupEnvironment(): void {
		// Woven carpet floor.
		const floor = MeshBuilder.CreateGround('floor', { width: 22, height: 18, subdivisions: 16 }, this.scene);
		floor.position.y = -0.05;
		this.flatShade(floor);
		const floorMat = new StandardMaterial('floorMat', this.scene);
		floorMat.diffuseColor = new Color3(0.78, 0.62, 0.4);
		floorMat.specularColor = new Color3(0.05, 0.05, 0.05);
		floor.material = floorMat;
		floor.isPickable = false;

		// Back wall.
		const wallMat = new StandardMaterial('wallMat', this.scene);
		wallMat.diffuseColor = new Color3(0.82, 0.72, 0.55);
		const backWall = MeshBuilder.CreatePlane('backWall', { width: 22, height: 10 }, this.scene);
		backWall.position.set(0, 5, 9);
		backWall.rotation.y = Math.PI;
		backWall.material = wallMat;
		backWall.isPickable = false;

		// Side wall.
		const sideWall = MeshBuilder.CreatePlane('sideWall', { width: 18, height: 10 }, this.scene);
		sideWall.position.set(-11, 5, 0);
		sideWall.rotation.y = Math.PI / 2;
		sideWall.material = wallMat;
		sideWall.isPickable = false;

		// Decorative rug under the table.
		const rug = MeshBuilder.CreateGround('rug', { width: 8, height: 5, subdivisions: 2 }, this.scene);
		rug.position.set(0, 0.01, -2);
		this.flatShade(rug);
		const rugMat = new StandardMaterial('rugMat', this.scene);
		rugMat.diffuseColor = new Color3(0.62, 0.28, 0.28);
		rugMat.specularColor = new Color3(0.05, 0.05, 0.05);
		rug.material = rugMat;
		rug.isPickable = false;

		// Low carved table.
		this.createTable();
	}

	private createTable(): void {
		const woodMat = new StandardMaterial('tableWoodMat', this.scene);
		woodMat.diffuseColor = new Color3(0.48, 0.3, 0.18);
		woodMat.specularColor = new Color3(0.08, 0.08, 0.08);

		const top = this.flatShade(MeshBuilder.CreateBox('tableTop', { width: 6, height: 0.15, depth: 2.8 }, this.scene));
		top.position.set(0, 0.55, -2);
		top.material = woodMat;
		top.isPickable = false;

		for (const sx of [-1, 1]) {
			for (const sz of [-1, 1]) {
				const leg = this.flatShade(
					MeshBuilder.CreateBox(`tableLeg${sx}${sz}`, { width: 0.18, height: 0.55, depth: 0.18 }, this.scene)
				);
				leg.position.set(sx * 2.7, 0.275, -2 + sz * 1.2);
				leg.material = woodMat;
				leg.isPickable = false;
			}
		}
	}

	private setupServingItems(): void {
		const positions: Record<ServingItem, Vector3> = {
			bukhoor: new Vector3(-2.2, 0.78, -2),
			qahwa: new Vector3(-0.7, 0.78, -2),
			dates: new Vector3(0.8, 0.78, -2),
			water: new Vector3(2.2, 0.78, -2),
			halwa: new Vector3(0, 0.78, -2),
			refill: new Vector3(-0.7, 0.78, -2)
		};

		for (const item of ITEM_ORDER) {
			const root = new TransformNode(`item-${item}`, this.scene);
			root.position = positions[item].clone();

			const itemRoot = this.createServingItemMesh(item);
			itemRoot.parent = root;

			// Find the invisible collider inside the item hierarchy.
			const collider = this.findCollider(itemRoot, item);

			// Invisible highlight disc shown on hover / hint.
			const highlight = MeshBuilder.CreateDisc(`itemHighlight-${item}`, { radius: 0.9 }, this.scene);
			highlight.position.y = -0.4;
			highlight.rotation.x = Math.PI / 2;
			const highlightMat = new StandardMaterial(`itemHighlightMat-${item}`, this.scene);
			highlightMat.emissiveColor = new Color3(1, 0.85, 0.3);
			highlightMat.alpha = 0;
			highlightMat.disableLighting = true;
			highlight.material = highlightMat;
			highlight.parent = root;
			highlight.isPickable = false;
			highlight.setEnabled(false);

			this.servingItems.push({ item, root, itemRoot, collider, highlight });
		}
	}

	private createServingItemMesh(item: ServingItem): TransformNode {
		switch (item) {
			case 'bukhoor':
				return this.createBukhoorBurner();
			case 'qahwa':
				return this.createDallah();
			case 'dates':
				return this.createDateBowl();
			case 'water':
				return this.createWaterPitcher();
		}
		const root = new TransformNode(`item-${item}-root`, this.scene);
		const box = MeshBuilder.CreateBox(`item-${item}`, { size: 0.5 }, this.scene);
		box.parent = root;
		box.metadata = { item };
		box.isPickable = true;
		return root;
	}

	private createBukhoorBurner(): TransformNode {
		const root = new TransformNode('bukhoorRoot', this.scene);

		const brassMat = new StandardMaterial('bukhoorBrassMat', this.scene);
		brassMat.diffuseColor = new Color3(0.8, 0.58, 0.18);
		brassMat.specularColor = new Color3(0.35, 0.28, 0.12);

		// Taller pedestal base so the burner is clearly an incense holder.
		const base = this.flatShade(
			MeshBuilder.CreateCylinder('bukhoorBase', { height: 0.25, diameterTop: 0.45, diameterBottom: 0.55, tessellation: 8 }, this.scene)
		);
		base.position.y = 0.125;
		base.material = brassMat;
		base.parent = root;

		const stem = this.flatShade(
			MeshBuilder.CreateCylinder('bukhoorStem', { height: 0.35, diameter: 0.18, tessellation: 8 }, this.scene)
		);
		stem.position.y = 0.475;
		stem.material = brassMat;
		stem.parent = root;

		const bowl = this.flatShade(
			MeshBuilder.CreateCylinder('bukhoorBowl', { height: 0.35, diameterTop: 0.75, diameterBottom: 0.55, tessellation: 8 }, this.scene)
		);
		bowl.position.y = 0.825;
		bowl.material = brassMat;
		bowl.parent = root;

		// Perforated dome lid hint.
		const dome = this.flatShade(
			MeshBuilder.CreateSphere('bukhoorDome', { diameter: 0.55, segments: 8 }, this.scene)
		);
		dome.scaling.y = 0.7;
		dome.position.y = 1.15;
		dome.material = brassMat;
		dome.parent = root;

		// Glowing coal peeking from under the dome.
		const coal = this.flatShade(MeshBuilder.CreateSphere('bukhoorCoal', { diameter: 0.28, segments: 5 }, this.scene));
		coal.position.y = 0.95;
		const coalMat = new StandardMaterial('bukhoorCoalMat', this.scene);
		coalMat.diffuseColor = new Color3(0.25, 0.2, 0.18);
		coalMat.emissiveColor = new Color3(0.55, 0.25, 0.05);
		coal.material = coalMat;
		coal.parent = root;

		const collider = MeshBuilder.CreateBox('bukhoorCollider', { size: 0.9 }, this.scene);
		collider.position.y = 0.65;
		collider.visibility = 0;
		collider.parent = root;
		collider.isPickable = true;
		collider.metadata = { item: 'bukhoor' };

		return root;
	}

	private createDallah(): TransformNode {
		const root = new TransformNode('dallahRoot', this.scene);

		const brassMat = new StandardMaterial('dallahBrassMat', this.scene);
		brassMat.diffuseColor = new Color3(0.85, 0.62, 0.16);
		brassMat.specularColor = new Color3(0.4, 0.32, 0.12);

		// Saucer.
		const saucer = this.flatShade(
			MeshBuilder.CreateCylinder('dallahSaucer', { height: 0.05, diameter: 0.65, tessellation: 12 }, this.scene)
		);
		saucer.position.y = 0.025;
		saucer.material = brassMat;
		saucer.parent = root;

		// Longer, taller finjan body.
		const body = this.flatShade(
			MeshBuilder.CreateCylinder('dallahBody', { height: 0.9, diameterTop: 0.35, diameterBottom: 0.42, tessellation: 10 }, this.scene)
		);
		body.position.y = 0.5;
		body.material = brassMat;
		body.parent = root;

		// Coffee surface inside.
		const coffee = this.flatShade(
			MeshBuilder.CreateCylinder('dallahCoffee', { height: 0.04, diameter: 0.32, tessellation: 10 }, this.scene)
		);
		coffee.position.y = 0.9;
		const coffeeMat = new StandardMaterial('dallahCoffeeMat', this.scene);
		coffeeMat.diffuseColor = new Color3(0.28, 0.16, 0.08);
		coffeeMat.specularColor = new Color3(0.05, 0.05, 0.05);
		coffee.material = coffeeMat;
		coffee.parent = root;

		const handle = this.flatShade(
			MeshBuilder.CreateTorus('dallahHandle', { diameter: 0.5, thickness: 0.05, tessellation: 8 }, this.scene)
		);
		handle.position.set(-0.32, 0.55, 0);
		handle.rotation.y = Math.PI / 2;
		handle.material = brassMat;
		handle.parent = root;

		const collider = MeshBuilder.CreateBox('dallahCollider', { size: 0.9 }, this.scene);
		collider.position.y = 0.55;
		collider.visibility = 0;
		collider.parent = root;
		collider.isPickable = true;
		collider.metadata = { item: 'qahwa' };

		return root;
	}

	private createDateBowl(): TransformNode {
		const root = new TransformNode('datesRoot', this.scene);

		const bowlMat = new StandardMaterial('datesBowlMat', this.scene);
		bowlMat.diffuseColor = new Color3(0.55, 0.35, 0.2);
		bowlMat.specularColor = new Color3(0.1, 0.1, 0.1);

		const bowl = this.flatShade(
			MeshBuilder.CreateCylinder('datesBowl', { height: 0.25, diameterTop: 0.7, diameterBottom: 0.55, tessellation: 8 }, this.scene)
		);
		bowl.position.y = 0.125;
		bowl.material = bowlMat;
		bowl.parent = root;

		const dateMat = new StandardMaterial('dateMat', this.scene);
		dateMat.diffuseColor = new Color3(0.55, 0.4, 0.15);
		for (let i = 0; i < 8; i++) {
			const date = this.flatShade(MeshBuilder.CreateSphere(`date-${i}`, { diameter: 0.14, segments: 5 }, this.scene));
			date.position.set(
				(Math.random() - 0.5) * 0.35,
				0.22 + Math.random() * 0.08,
				(Math.random() - 0.5) * 0.3
			);
			date.material = dateMat;
			date.parent = root;
		}

		const collider = MeshBuilder.CreateBox('datesCollider', { size: 0.8 }, this.scene);
		collider.position.y = 0.3;
		collider.visibility = 0;
		collider.parent = root;
		collider.isPickable = true;
		collider.metadata = { item: 'dates' };

		return root;
	}

	private createWaterPitcher(): TransformNode {
		const root = new TransformNode('waterRoot', this.scene);

		const cupMat = new StandardMaterial('waterCupMat', this.scene);
		cupMat.diffuseColor = new Color3(0.85, 0.82, 0.78);
		cupMat.specularColor = new Color3(0.15, 0.15, 0.15);
		cupMat.alpha = 0.9;

		// Normal drinking cup.
		const cup = this.flatShade(
			MeshBuilder.CreateCylinder('waterCup', { height: 0.55, diameterTop: 0.42, diameterBottom: 0.32, tessellation: 10 }, this.scene)
		);
		cup.position.y = 0.3;
		cup.material = cupMat;
		cup.parent = root;

		// Water inside.
		const water = this.flatShade(
			MeshBuilder.CreateCylinder('waterLiquid', { height: 0.4, diameterTop: 0.36, diameterBottom: 0.28, tessellation: 10 }, this.scene)
		);
		water.position.y = 0.28;
		const waterMat = new StandardMaterial('waterMat', this.scene);
		waterMat.diffuseColor = new Color3(0.55, 0.75, 0.9);
		waterMat.specularColor = new Color3(0.3, 0.3, 0.3);
		waterMat.alpha = 0.75;
		water.material = waterMat;
		water.parent = root;

		const collider = MeshBuilder.CreateBox('waterCollider', { size: 0.7 }, this.scene);
		collider.position.y = 0.3;
		collider.visibility = 0;
		collider.parent = root;
		collider.isPickable = true;
		collider.metadata = { item: 'water' };

		return root;
	}

	private findCollider(root: TransformNode, item: ServingItem): Mesh {
		const children = root.getChildMeshes(false);
		for (const child of children) {
			if (child.metadata?.item === item) {
				return child as Mesh;
			}
		}
		// Fallback: create a generic collider.
		const collider = MeshBuilder.CreateBox(`${item}-fallback-collider`, { size: 0.8 }, this.scene);
		collider.visibility = 0;
		collider.parent = root;
		collider.isPickable = true;
		collider.metadata = { item };
		return collider;
	}

	private setupGuestArea(): void {
		// Large floor cushion where the guest sits.
		const cushion = MeshBuilder.CreateCylinder('guestCushion', { height: 0.2, diameter: 2.2, tessellation: 12 }, this.scene);
		cushion.position.set(0, 0.1, 3);
		this.flatShade(cushion);
		const cushionMat = new StandardMaterial('cushionMat', this.scene);
		cushionMat.diffuseColor = new Color3(0.45, 0.25, 0.25);
		cushion.material = cushionMat;
		cushion.isPickable = false;

		// Guest mesh root, hidden until a guest arrives.
		const root = new TransformNode('guestRoot', this.scene);
		root.position.set(0, 0.35, 3);
		root.setEnabled(false);

		const body = this.flatShade(MeshBuilder.CreateSphere('guestBody', { diameter: 1.1, segments: 7 }, this.scene));
		body.scaling = new Vector3(1, 0.85, 0.9);
		const bodyMat = new StandardMaterial('guestBodyMat', this.scene);
		bodyMat.diffuseColor = new Color3(0.72, 0.55, 0.35);
		body.material = bodyMat;
		body.parent = root;

		const icon = this.createEmojiPlane('guestIcon', '🐪', 1.2);
		icon.position.set(0, 1.1, 0);
		icon.parent = root;

		// Patience bar background.
		const patienceBg = MeshBuilder.CreatePlane('patienceBg', { width: 1.4, height: 0.18 }, this.scene);
		patienceBg.position.set(0, 1.75, 0);
		patienceBg.billboardMode = Mesh.BILLBOARDMODE_ALL;
		const bgMat = new StandardMaterial('patienceBgMat', this.scene);
		bgMat.diffuseColor = new Color3(0.2, 0.2, 0.2);
		bgMat.emissiveColor = new Color3(0.1, 0.1, 0.1);
		bgMat.disableLighting = true;
		patienceBg.material = bgMat;
		patienceBg.parent = root;
		patienceBg.isPickable = false;

		const patienceBar = MeshBuilder.CreatePlane('patienceBar', { width: 1.4, height: 0.18 }, this.scene);
		patienceBar.position.set(-0.7, 1.75, -0.01);
		patienceBar.billboardMode = Mesh.BILLBOARDMODE_ALL;
		const barMat = new StandardMaterial('patienceBarMat', this.scene);
		barMat.diffuseColor = new Color3(0.2, 0.75, 0.3);
		barMat.emissiveColor = new Color3(0.1, 0.4, 0.15);
		barMat.disableLighting = true;
		patienceBar.material = barMat;
		patienceBar.parent = root;
		patienceBar.isPickable = false;

		this.guestMesh = { root, body, icon, patienceBar, patienceBg };
	}

	private setupDragAndDrop(): void {
		// Invisible horizontal plane for dragging items at a comfortable height.
		this.dragPlane = MeshBuilder.CreateGround('dragPlane', { width: 30, height: 30, subdivisions: 2 }, this.scene);
		this.dragPlane.position.y = 1.2;
		this.dragPlane.isVisible = false;
		this.dragPlane.isPickable = false;

		// Invisible cylinder above the guest cushion that accepts drops.
		this.guestDropZone = MeshBuilder.CreateCylinder('guestDropZone', { height: 3, diameter: 3.2, tessellation: 16 }, this.scene);
		this.guestDropZone.position.set(0, 1.5, 3);
		this.guestDropZone.isVisible = false;
		this.guestDropZone.isPickable = true;

		// Pulsing ring around the guest that appears while dragging.
		const ring = MeshBuilder.CreateTorus('guestHighlightRing', { diameter: 3.4, thickness: 0.12, tessellation: 32 }, this.scene);
		ring.position.set(0, 0.05, 3);
		ring.rotation.x = Math.PI / 2;
		const ringMat = new StandardMaterial('guestHighlightMat', this.scene);
		ringMat.emissiveColor = new Color3(1, 0.85, 0.25);
		ringMat.disableLighting = true;
		ringMat.alpha = 0.6;
		ring.material = ringMat;
		ring.isPickable = false;
		ring.setEnabled(false);
		this.guestHighlight = ring;
	}

	private createEmojiPlane(name: string, emoji: string, size: number): Mesh {
		const texture = new DynamicTexture(`${name}-tex`, { width: 128, height: 128 }, this.scene);
		const ctx = texture.getContext() as unknown as CanvasRenderingContext2D;
		ctx.clearRect(0, 0, 128, 128);
		ctx.font = '96px serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(emoji, 64, 68);
		texture.update();
		texture.hasAlpha = true;

		const mat = new StandardMaterial(`${name}-mat`, this.scene);
		mat.diffuseTexture = texture;
		mat.emissiveColor = new Color3(1, 1, 1);
		mat.specularColor = new Color3(0, 0, 0);
		mat.disableLighting = true;
		mat.backFaceCulling = false;
		mat.useAlphaFromDiffuseTexture = true;
		mat.transparencyMode = Material.MATERIAL_ALPHABLEND;

		const plane = MeshBuilder.CreatePlane(name, { width: size, height: size }, this.scene);
		plane.material = mat;
		plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
		return plane;
	}

	private setupInput(): void {
		this.scene.onPointerObservable.add((pointerInfo) => {
			const type = pointerInfo.type;
			const pick = pointerInfo.pickInfo;

			if (type === PointerEventTypes.POINTERDOWN && pick?.hit) {
				const mesh = pick.pickedMesh;
				const item = mesh?.metadata?.item as ServingItem | undefined;
				if (item && mesh && !this.dragState.item) {
					this.startDrag(item, pick.pickedPoint ?? mesh.getAbsolutePosition());
				}
				return;
			}

			if (type === PointerEventTypes.POINTERMOVE) {
				if (this.dragState.item) {
					this.updateDrag(pointerInfo.event.clientX, pointerInfo.event.clientY);
				} else {
					const mesh = pick?.pickedMesh;
					const item = mesh?.metadata?.item as ServingItem | undefined;
					this.hoveredItem = item ?? null;
				}
				return;
			}

			if (type === PointerEventTypes.POINTERUP && this.dragState.item) {
				this.endDrag();
			}
		});
	}

	private startDrag(item: ServingItem, worldPos: Vector3): void {
		const found = this.servingItems.find((i) => i.item === item);
		if (!found) return;

		// Create a ghost clone of the serving item for visual drag feedback.
		const ghost = this.cloneItemRoot(found.itemRoot);
		ghost.position = worldPos.clone();
		ghost.scaling.setAll(1.25);
		ghost.rotation.y = Math.PI / 8;

		this.dragState = {
			item,
			ghost,
			startRootPos: found.root.position.clone(),
			targetPos: worldPos.clone(),
			isOverGuest: false
		};

		this.guestHighlight?.setEnabled(true);
	}

	private cloneItemRoot(source: TransformNode): TransformNode {
		const clone = source.clone('dragGhost', null, true) ?? new TransformNode('dragGhost', this.scene);
		clone.scaling.setAll(1);
		// Disable the collider and make all meshes non-pickable / ghost-like.
		for (const mesh of clone.getChildMeshes(true)) {
			mesh.isPickable = false;
			if (mesh.visibility === 0 || mesh.name.includes('Collider')) {
				mesh.dispose();
				continue;
			}
			this.makeGhostMaterial(mesh as Mesh);
		}
		return clone;
	}

	private makeGhostMaterial(mesh: Mesh): void {
		if (!mesh.material) return;
		const sourceMat = mesh.material as StandardMaterial;
		const ghostMat = sourceMat.clone(`${sourceMat.name}-ghost`) ?? new StandardMaterial(`${mesh.name}-ghost-mat`, this.scene);
		ghostMat.alpha = 0.85;
		if (ghostMat.emissiveColor) {
			ghostMat.emissiveColor = ghostMat.emissiveColor.add(new Color3(0.15, 0.1, 0));
		} else {
			ghostMat.emissiveColor = new Color3(0.15, 0.1, 0);
		}
		mesh.material = ghostMat;
	}

	private updateDrag(screenX: number, screenY: number): void {
		if (!this.dragState.item || !this.dragState.ghost || !this.dragPlane) return;

		// Raycast against the invisible drag plane to get a world position.
		const ray = this.scene.createPickingRay(screenX, screenY, Matrix.Identity(), this.camera);
		const planeHit = ray.intersectsPlane(new Plane(0, 1, 0, -this.dragPlane.position.y));
		if (!planeHit) return;

		const hitPoint = ray.origin.add(ray.direction.scale(planeHit));
		// Clamp to keep the ghost within a sensible play area.
		hitPoint.x = clamp(hitPoint.x, -9, 9);
		hitPoint.z = clamp(hitPoint.z, -6, 7);

		// Smooth follow with a gentle bob.
		this.dragState.targetPos.copyFrom(hitPoint);
		const current = this.dragState.ghost.position;
		current.x += (hitPoint.x - current.x) * 0.25;
		current.z += (hitPoint.z - current.z) * 0.25;
		current.y = hitPoint.y + 0.15 + Math.sin(this.time * 8) * 0.08;

		// Subtle rotation while dragging.
		this.dragState.ghost.rotation.y = Math.PI / 8 + Math.sin(this.time * 6) * 0.1;

		// Check if pointer is over the guest drop zone.
		const guestPick = this.scene.pick(screenX, screenY, (mesh) => mesh === this.guestDropZone);
		this.dragState.isOverGuest = guestPick.hit;

		// Pulse the guest highlight ring and scale it when hovering the guest.
		if (this.guestHighlight) {
			const baseScale = this.dragState.isOverGuest ? 1.15 : 1;
			const pulse = 1 + Math.sin(this.time * 5) * 0.06;
			this.guestHighlight.scaling.setAll(baseScale * pulse);
			(this.guestHighlight.material as StandardMaterial).alpha = this.dragState.isOverGuest ? 0.9 : 0.45;
		}
	}

	private endDrag(): void {
		const { item, ghost, isOverGuest, startRootPos } = this.dragState;
		if (!item || !ghost) return;

		this.guestHighlight?.setEnabled(false);

		if (isOverGuest) {
			// Fly the item to the guest and then serve it.
			this.flyItemToGuest(item, ghost.position.clone(), () => {
				this.logic.serveItem(item);
			});
		} else {
			// Snap back to the tray.
			this.snapItemBack(item, ghost.position.clone(), startRootPos);
		}

		ghost.dispose();
		this.dragState = { item: null, ghost: null, startRootPos: Vector3.Zero(), targetPos: Vector3.Zero(), isOverGuest: false };
	}

	private flyItemToGuest(item: ServingItem, from: Vector3, onArrive: () => void): void {
		// Create a temporary flying clone that moves from the release point to the guest.
		const flyerRoot = this.createFlyingClone(item, from);
		const to = this.guestMesh?.root.position.clone() ?? new Vector3(0, 1, 3);
		to.y += 0.6;

		const anim = new Animation(
			'flyToGuest',
			'position',
			60,
			Animation.ANIMATIONTYPE_VECTOR3,
			Animation.ANIMATIONLOOPMODE_CONSTANT
		);
		const keys = [
			{ frame: 0, value: from },
			{ frame: 15, value: new Vector3((from.x + to.x) * 0.5, to.y + 1.2, (from.z + to.z) * 0.5) },
			{ frame: 30, value: to }
		];
		anim.setKeys(keys);

		const scaleAnim = new Animation(
			'flyScale',
			'scaling',
			60,
			Animation.ANIMATIONTYPE_VECTOR3,
			Animation.ANIMATIONLOOPMODE_CONSTANT
		);
		scaleAnim.setKeys([
			{ frame: 0, value: new Vector3(1.2, 1.2, 1.2) },
			{ frame: 30, value: new Vector3(0.5, 0.5, 0.5) }
		]);

		flyerRoot.animations = [anim, scaleAnim];
		this.scene.beginAnimation(flyerRoot, 0, 30, false, 1, () => {
			this.spawnSparkles(to);
			flyerRoot.dispose();
			onArrive();
		});
	}

	private createFlyingClone(item: ServingItem, position: Vector3): TransformNode {
		const found = this.servingItems.find((i) => i.item === item);
		if (found) {
			const clone = this.cloneItemRoot(found.itemRoot);
			clone.position = position.clone();
			return clone;
		}
		const fallback = new TransformNode('flyerFallback', this.scene);
		const box = MeshBuilder.CreateBox('flyerFallbackBox', { size: 0.5 }, this.scene);
		box.parent = fallback;
		fallback.position = position.clone();
		return fallback;
	}

	private snapItemBack(item: ServingItem, from: Vector3, to: Vector3): void {
		const flyerRoot = this.createFlyingClone(item, from);
		const anim = new Animation(
			'snapBack',
			'position',
			60,
			Animation.ANIMATIONTYPE_VECTOR3,
			Animation.ANIMATIONLOOPMODE_CONSTANT
		);
		anim.setKeys([
			{ frame: 0, value: from },
			{ frame: 20, value: to }
		]);
		flyerRoot.animations = [anim];
		this.scene.beginAnimation(flyerRoot, 0, 20, false, 1.5, () => {
			flyerRoot.dispose();
			// Restore the original item's position.
			const found = this.servingItems.find((i) => i.item === item);
			if (found) found.root.position.copyFrom(to);
		});
	}

	private spawnSparkles(origin: Vector3): void {
		for (let i = 0; i < 8; i++) {
			const spark = MeshBuilder.CreateSphere(`spark-${Date.now()}-${i}`, { diameter: 0.1, segments: 4 }, this.scene);
			spark.position = origin.clone();
			const mat = new StandardMaterial(`sparkMat-${Date.now()}-${i}`, this.scene);
			mat.emissiveColor = new Color3(1, 0.9, 0.4);
			mat.disableLighting = true;
			spark.material = mat;
			const angle = (i / 8) * Math.PI * 2;
			this.smokeParticles.push({
				mesh: spark,
				life: 0.5,
				vy: 1 + Math.random() * 0.5,
				vx: Math.cos(angle) * 1.5,
				vz: Math.sin(angle) * 1.5
			});
		}
	}

	startLevel(level: number): void {
		this.logic.startLevel(level);
		this.audio.playMusic();
	}

	restartLevel(): void {
		this.logic.restartLevel();
		this.cleanupParticles();
	}

	backToMenu(): void {
		this.logic.resetToMenu();
		this.cleanupParticles();
	}

	serveItem(item: ServingItem): void {
		this.logic.serveItem(item);
	}

	usePowerUp(type: PowerUpType): void {
		this.logic.usePowerUp(type);
	}

	setMuted(muted: boolean): void {
		this.audio.setMuted(muted);
	}

	getMuted(): boolean {
		return this.audio.getMuted();
	}

	private cleanupParticles(): void {
		for (const p of this.smokeParticles) p.mesh.dispose();
		this.smokeParticles = [];
		for (const l of this.floatingLabels) l.mesh.dispose();
		this.floatingLabels = [];
	}

	private animateItem(item: ServingItem): void {
		const found = this.servingItems.find((i) => i.item === item);
		if (!found) return;

		const startY = found.root.position.y;
		const anim = new Animation(
			`anim-${item}`,
			'position.y',
			60,
			Animation.ANIMATIONTYPE_FLOAT,
			Animation.ANIMATIONLOOPMODE_CYCLE
		);
		const keys = [
			{ frame: 0, value: startY },
			{ frame: 10, value: startY + 0.25 },
			{ frame: 20, value: startY }
		];
		anim.setKeys(keys);
		this.scene.beginDirectAnimation(found.root, [anim], 0, 20, false, 1, () => {
			found.root.position.y = startY;
		});

		if (item === 'bukhoor') {
			this.spawnSmoke(found.root.position.add(new Vector3(0, 0.6, 0)));
		}
	}

	private spawnSmoke(origin: Vector3): void {
		for (let i = 0; i < 6; i++) {
			const smoke = MeshBuilder.CreateSphere(`smoke-${Date.now()}-${i}`, { diameter: 0.1, segments: 4 }, this.scene);
			smoke.position = origin.clone();
			const mat = new StandardMaterial(`smokeMat-${Date.now()}-${i}`, this.scene);
			mat.emissiveColor = new Color3(0.7, 0.7, 0.7);
			mat.alpha = 0.4;
			mat.disableLighting = true;
			smoke.material = mat;
			this.smokeParticles.push({
				mesh: smoke,
				life: 1 + Math.random() * 0.8,
				vy: 0.4 + Math.random() * 0.3,
				vx: (Math.random() - 0.5) * 0.2,
				vz: (Math.random() - 0.5) * 0.2
			});
		}
	}

	private spawnFloatingLabel(emoji: string): void {
		const label = this.createEmojiPlane(`float-${Date.now()}`, emoji, 0.6);
		label.position = new Vector3((Math.random() - 0.5) * 0.5, 1.6, 3);
		this.floatingLabels.push({ mesh: label, life: 0.8, vy: 0.6 });
	}

	private updateHover(dt: number): void {
		for (const item of this.servingItems) {
			const isHovered = this.hoveredItem === item.item && !this.dragState.item;
			const targetScale = isHovered ? 1.12 : 1;
			const currentScale = item.root.scaling.x;
			const newScale = currentScale + (targetScale - currentScale) * Math.min(1, dt * 12);
			item.root.scaling.setAll(newScale);
			if (isHovered) {
				// Gentle hover bob.
				item.root.position.y = item.root.position.y + Math.sin(this.time * 6) * 0.002;
			}
		}
	}

	private updateSteam(dt: number): void {
		const qahwa = this.servingItems.find((i) => i.item === 'qahwa');
		if (!qahwa) return;

		this.steamTimer -= dt;
		if (this.steamTimer <= 0) {
			this.spawnSteam(qahwa.root.position.clone());
			this.steamTimer = 0.25 + Math.random() * 0.25;
		}

		for (let i = this.steamParticles.length - 1; i >= 0; i--) {
			const p = this.steamParticles[i];
			p.life -= dt;
			p.mesh.position.x += p.vx * dt;
			p.mesh.position.y += p.vy * dt;
			p.mesh.position.z += p.vz * dt;
			const lifeRatio = Math.max(0, p.life / p.maxLife);
			p.mesh.scaling.setAll(0.2 + (1 - lifeRatio) * 0.5);
			const mat = p.mesh.material as StandardMaterial;
			mat.alpha = lifeRatio * 0.35;
			if (p.life <= 0) {
				p.mesh.dispose();
				this.steamParticles.splice(i, 1);
			}
		}
	}

	private spawnSteam(origin: Vector3): void {
		const steam = MeshBuilder.CreateSphere(`steam-${Date.now()}`, { diameter: 0.2, segments: 4 }, this.scene);
		steam.position = origin.add(new Vector3((Math.random() - 0.5) * 0.1, 0.5, (Math.random() - 0.5) * 0.1));
		const mat = new StandardMaterial(`steamMat-${Date.now()}`, this.scene);
		mat.emissiveColor = new Color3(0.95, 0.95, 0.95);
		mat.diffuseColor = new Color3(1, 1, 1);
		mat.alpha = 0.35;
		mat.disableLighting = true;
		steam.material = mat;
		this.steamParticles.push({
			mesh: steam,
			life: 1.2,
			maxLife: 1.2,
			vy: 0.4 + Math.random() * 0.2,
			vx: (Math.random() - 0.5) * 0.1,
			vz: (Math.random() - 0.5) * 0.1
		});
	}

	private updateParticles(dt: number): void {
		for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
			const p = this.smokeParticles[i];
			p.life -= dt;
			p.mesh.position.x += p.vx * dt;
			p.mesh.position.y += p.vy * dt;
			p.mesh.position.z += p.vz * dt;
			p.mesh.scaling.setAll(Math.max(0.2, p.life));
			if (p.life <= 0) {
				p.mesh.dispose();
				this.smokeParticles.splice(i, 1);
			}
		}

		for (let i = this.floatingLabels.length - 1; i >= 0; i--) {
			const l = this.floatingLabels[i];
			l.life -= dt;
			l.mesh.position.y += l.vy * dt;
			l.mesh.scaling.setAll(Math.max(0.1, l.life));
			if (l.life <= 0) {
				l.mesh.dispose();
				this.floatingLabels.splice(i, 1);
			}
		}
	}

	private syncScene(): void {
		const state = this.logic.getState();
		this.syncGuest(state);
		this.syncHighlights(state);
	}

	private syncGuest(state: MajlisHostState): void {
		if (!this.guestMesh) return;

		if (!state.activeGuest) {
			this.guestMesh.root.setEnabled(false);
			return;
		}

		const guest = state.activeGuest;
		if (guest.id !== this.lastGuestId) {
			this.lastGuestId = guest.id;
			this.updateGuestAppearance(guest.type);
			// Pop-in entrance.
			this.guestEntranceTimer = 0.5;
			this.guestMesh.root.position.set(0, 0.35, 3);
			this.guestMesh.root.scaling.setAll(0);
			this.guestMesh.root.rotation.set(0, 0, 0);
		}

		this.guestMesh.root.setEnabled(true);

		// Entrance pop-in.
		if (this.guestEntranceTimer > 0) {
			this.guestEntranceTimer = Math.max(0, this.guestEntranceTimer - this.engine.getDeltaTime() / 1000);
			const t = 1 - this.guestEntranceTimer / 0.5;
			const elastic = t === 0 ? 0 : 1 - Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3));
			const scale = Math.max(0, elastic);
			this.guestMesh.root.scaling.setAll(scale);
			this.guestMesh.root.position.y = 0.35 + (1 - elastic) * 0.8;
			return;
		}

		// Gentle idle bounce.
		const bounce = guest.state === 'waiting' ? Math.sin(this.time * 2) * 0.03 : 0;
		this.guestMesh.root.position.y = 0.35 + bounce;

		// Scale patience bar.
		const ratio = clamp(guest.patience / guest.maxPatience, 0, 1);
		this.guestMesh.patienceBar.scaling.x = ratio;
		const barMat = this.guestMesh.patienceBar.material as StandardMaterial;
		if (ratio > 0.5) {
			barMat.diffuseColor = new Color3(0.2, 0.75, 0.3);
			barMat.emissiveColor = new Color3(0.1, 0.4, 0.15);
		} else if (ratio > 0.25) {
			barMat.diffuseColor = new Color3(0.95, 0.7, 0.1);
			barMat.emissiveColor = new Color3(0.5, 0.35, 0.05);
		} else {
			barMat.diffuseColor = new Color3(0.85, 0.2, 0.15);
			barMat.emissiveColor = new Color3(0.4, 0.1, 0.08);
		}

		this.guestMesh.root.scaling.setAll(1);
	}

	private updateGuestAppearance(type: GuestType): void {
		if (!this.guestMesh) return;
		const icon = GUEST_ICONS[type];
		this.guestMesh.icon.dispose();
		this.guestMesh.icon = this.createEmojiPlane('guestIcon', icon, 1.2);
		this.guestMesh.icon.position.set(0, 1.1, 0);
		this.guestMesh.icon.parent = this.guestMesh.root;

		const colors: Record<GuestType, Color3> = {
			camel: new Color3(0.72, 0.55, 0.35),
			falcon: new Color3(0.35, 0.32, 0.28),
			oryx: new Color3(0.85, 0.78, 0.65),
			fox: new Color3(0.8, 0.45, 0.2),
			goat: new Color3(0.55, 0.5, 0.45),
			sheep: new Color3(0.9, 0.88, 0.82)
		};
		const bodyMat = this.guestMesh.body.material as StandardMaterial;
		bodyMat.diffuseColor = colors[type];
	}

	private startGuestLeave(happy: boolean, type: GuestType): void {
		if (!this.guestMesh) return;

		// Hand the current guest mesh off to a leaving clone so the next guest can arrive immediately.
		const startPos = this.guestMesh.root.position.clone();
		const clone = this.cloneGuestRoot(this.guestMesh, happy ? '😊' : '😠');
		clone.root.position.copyFrom(startPos);
		clone.root.scaling.setAll(1);

		if (!happy) {
			// Fiery red angry body.
			const bodyMat = clone.body.material as StandardMaterial;
			bodyMat.diffuseColor = new Color3(0.85, 0.15, 0.1);
			bodyMat.emissiveColor = new Color3(0.35, 0.05, 0.02);
			this.audio.playMistake();
		} else {
			this.audio.playGuestHappy();
		}

		this.leavingGuest = {
			root: clone.root,
			body: clone.body,
			icon: clone.icon,
			type,
			happy,
			timer: happy ? 1.2 : 1.8,
			startPos: startPos.clone(),
			phase: 'react'
		};

		// Hide the active guest mesh; it will be replaced by the next guest.
		this.guestMesh.root.setEnabled(false);
	}

	private cloneGuestRoot(source: GuestMesh, iconEmoji: string): { root: TransformNode; body: Mesh; icon: Mesh } {
		const root = new TransformNode('leavingGuestRoot', this.scene);
		root.position.copyFrom(source.root.position);
		root.rotation.copyFrom(source.root.rotation);
		root.scaling.copyFrom(source.root.scaling);

		const body = source.body.clone('leavingGuestBody') ??
			MeshBuilder.CreateSphere('leavingGuestBody', { diameter: 1.1, segments: 7 }, this.scene);
		body.parent = root;
		body.scaling = new Vector3(1, 0.85, 0.9);
		const bodyMat = (source.body.material as StandardMaterial).clone('leavingGuestBodyMat') ??
			new StandardMaterial('leavingGuestBodyMat', this.scene);
		body.material = bodyMat;

		const icon = this.createEmojiPlane('leavingGuestIcon', iconEmoji, 1.2);
		icon.position.set(0, 1.1, 0);
		icon.parent = root;

		return { root, body, icon };
	}

	private updateLeavingGuest(dt: number): void {
		if (!this.leavingGuest) return;

		const g = this.leavingGuest;
		g.timer -= dt;

		if (g.happy) {
			// Happy bounce, spin and float away.
			const t = Math.max(0, Math.min(1, 1 - g.timer / 1.2));
			g.root.position.y = g.startPos.y + Math.sin(t * Math.PI * 2) * 0.6 + t * 1.5;
			g.root.position.x = Math.sin(t * Math.PI) * 0.5;
			g.root.rotation.y = t * Math.PI * 4;
			const scale = 1 + Math.sin(t * Math.PI) * 0.3;
			g.root.scaling.setAll(scale);
			// Sparkle trail.
			if (Math.random() < 0.3) {
				this.spawnSparkles(g.root.position.add(new Vector3(0, 0.4, 0)));
			}
		} else {
			// Angry reaction phase: shake, flash red, spin, jump.
			if (g.phase === 'react') {
				const reactT = Math.max(0, Math.min(1, 1 - g.timer / 1.8));
				g.root.position.x = g.startPos.x + Math.sin(this.time * 40) * 0.15;
				g.root.position.z = g.startPos.z + Math.cos(this.time * 35) * 0.1;
				g.root.position.y = g.startPos.y + Math.abs(Math.sin(this.time * 15)) * 0.4;
				g.root.rotation.z = Math.sin(this.time * 30) * 0.25;
				g.root.rotation.y += dt * 8;
				const scale = 1 + Math.sin(this.time * 20) * 0.1;
				g.root.scaling.setAll(scale);
				// Red anger puffs.
				if (Math.random() < 0.4) {
					this.spawnAngerPuff(g.root.position.add(new Vector3(0, 0.8, 0)));
				}
				if (reactT > 0.55) {
					g.phase = 'fly';
					g.timer = 0.8;
				}
			} else {
				// Fly off screen in a crazy arc.
				const flyT = Math.max(0, Math.min(1, 1 - g.timer / 0.8));
				const dir = Math.sin(g.type.length * 999) > 0 ? 1 : -1;
				g.root.position.x = g.startPos.x + dir * flyT * 12;
				g.root.position.y = g.startPos.y + Math.sin(flyT * Math.PI * 1.5) * 3;
				g.root.rotation.z = flyT * dir * Math.PI * 6;
				g.root.rotation.y += dt * 20;
				g.root.scaling.setAll(1 - flyT * 0.3);
			}
		}

		if (g.timer <= 0) {
			g.root.dispose();
			this.leavingGuest = null;
		}
	}

	private spawnAngerPuff(origin: Vector3): void {
		const puff = MeshBuilder.CreateSphere(`anger-${Date.now()}`, { diameter: 0.15, segments: 4 }, this.scene);
		puff.position = origin.clone();
		const mat = new StandardMaterial(`angerMat-${Date.now()}`, this.scene);
		mat.emissiveColor = new Color3(1, 0.2, 0.1);
		mat.diffuseColor = new Color3(0.8, 0.1, 0.05);
		mat.disableLighting = true;
		puff.material = mat;
		this.smokeParticles.push({
			mesh: puff,
			life: 0.4,
			vy: 0.8 + Math.random() * 0.5,
			vx: (Math.random() - 0.5) * 1.5,
			vz: (Math.random() - 0.5) * 1.5
		});
	}

	private syncHighlights(state: MajlisHostState): void {
		const expected = state.activeGuest?.sequence[state.activeGuest.progress];
		for (const item of this.servingItems) {
			const isHint = expected && item.item === expected;
			item.highlight.setEnabled(!!isHint);
			const mat = item.highlight.material as StandardMaterial;
			mat.alpha = isHint ? 0.25 + Math.sin(this.time * 4) * 0.1 : 0;
		}
	}

	private flatShade(mesh: Mesh): Mesh {
		return mesh;
	}

	dispose(): void {
		this.disposed = true;
		this.cleanupParticles();
		this.audio.stopMusic();
		window.removeEventListener('resize', this.handleResize);
		window.removeEventListener('keydown', this.handleKeydown);
		this.engine.dispose();
	}
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}
