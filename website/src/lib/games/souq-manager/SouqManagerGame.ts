/**
 * Souq Al-Fereej (Souq Manager) — Visual Upgrade Experiment
 *
 * This file applies the experimental, high-polish Babylon.js visual treatment
 * first trialed in Falcon Flight (low-poly PBR, real-time shadows, ACES tone
 * mapping, bloom/FXAA, particles, squash-and-stretch animations, Babylon.GUI
 * feedback, and an FPS watchdog) to the Souq Manager gameplay prototype.
 *
 * Gameplay logic remains in SouqManagerLogic.ts; this file is responsible for
 * presentation only. See FRAMEWORK.md §10.1.7 for the experiment record.
 */

import {
	Engine,
	Scene,
	Vector3,
	Color3,
	Color4,
	HemisphericLight,
	DirectionalLight,
	ArcRotateCamera,
	MeshBuilder,
	PBRMaterial,
	StandardMaterial,
	Mesh,
	TransformNode,
	PointerEventTypes,
	HighlightLayer,
	VertexData,
	DynamicTexture,
	VertexBuffer,
	CubeTexture,
	Animation,
	BackEase,
	EasingFunction,
	ParticleSystem,
	Scalar
} from '@babylonjs/core';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { ImageProcessingConfiguration } from '@babylonjs/core/Materials/imageProcessingConfiguration';
import '@babylonjs/loaders/glTF';
import { AdvancedDynamicTexture, Button, TextBlock, Rectangle, Control } from '@babylonjs/gui';
import {
	SouqManagerLogic,
	type SouqManagerState,
	type SouqManagerConfig,
	type GoodType,
	type StationType,
	type Item,
	type Station
} from './SouqManagerLogic';

export type { SouqManagerState, GoodType, StationType, Item };

export interface SouqManagerGameOptions {
	level?: number;
	config?: SouqManagerConfig;
}

type AnimalType = 'camel' | 'falcon' | 'oryx' | 'fox' | 'goat' | 'sheep';

// Bright, high-contrast pastel palette tuned for children.
const PALETTE = {
	ground: '#f4e4bc',
	sandLight: '#fff5d7',
	sandShadow: '#e6d2a0',
	wood: '#d4a373',
	woodDark: '#a97142',
	awning: '#f4978e',
	awningStripe: '#f8ad9d',
	lantern: '#ffd166',
	lanternGlass: '#fff3b0',
	stone: '#bcaaa4',
	fence: '#b08968',
	cashierAwning: '#ef476f',
	cashierStripe: '#ffccd5',
	palmTrunk: '#8d5b4c',
	palmLeaf: '#70e000',
	date: '#ffb703',
	coffeeBean: '#6a994e',
	coffeeRoast: '#bc4749',
	coffeeGround: '#6f4e37',
	luban: '#ffd166',
	resin: '#fff3b0',
	brass: '#ffb703',
	glass: '#caf0f8',
	charcoal: '#4a4e69',
	mortar: '#9a8c98',
	merchantRobe: '#f8f9fa',
	merchantSkin: '#fae1dd',
	camel: '#f4a261',
	falcon: '#e76f51',
	oryx: '#f8edeb',
	fox: '#f3722c',
	goat: '#e9edc9',
	sheep: '#fefae0',
	coin: '#ffd60a',
	sparkle: '#ff9f1c',
	success: '#06d6a0',
	danger: '#ef476f',
	sun: '#ffd60a',
	sky: '#a0d8ef'
};

export class SouqManagerAudio {
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

	playMusic(): void {
		if (this.musicTimer || this.muted) return;
		this.musicTimer = setInterval(() => {
			if (!this.muted) this.playMusicBar(this.getCtx());
		}, 5600);
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
		// Maqam Hijaz on D (old Arabic oud scale).
		const hijaz = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 554.37, 587.33];
		// A short, repetitive taqsim-like phrase.
		const phrase = [0, 2, 1, 3, 2, 4, 3, 2, 1, 5, 4, 3, 1, 0];
		const durations = [0.32, 0.24, 0.24, 0.32, 0.24, 0.32, 0.24, 0.24, 0.32, 0.32, 0.24, 0.32, 0.48, 0.72];
		let t = 0;
		phrase.forEach((noteIdx, i) => {
			this.playOudNote(ctx, now + t, hijaz[noteIdx], durations[i]);
			t += durations[i] + 0.05;
		});
	}

	private playOudNote(ctx: AudioContext, when: number, freq: number, duration: number): void {
		const osc = ctx.createOscillator();
		osc.type = 'sawtooth';
		// Slight initial pitch dip typical of a plucked oud string.
		osc.frequency.setValueAtTime(freq * 1.012, when);
		osc.frequency.exponentialRampToValueAtTime(freq, when + 0.06);

		const filter = ctx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.setValueAtTime(1400, when);
		filter.frequency.exponentialRampToValueAtTime(650, when + 0.25);
		filter.Q.value = 0.5;

		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0, when);
		gain.gain.linearRampToValueAtTime(0.045, when + 0.008);
		gain.gain.exponentialRampToValueAtTime(0.012, when + 0.18);
		gain.gain.exponentialRampToValueAtTime(0.001, when + duration);

		osc.connect(filter);
		filter.connect(gain);
		gain.connect(ctx.destination);
		osc.start(when);
		osc.stop(when + duration + 0.08);
	}

	playCoin(): void {
		if (this.muted) return;
		const ctx = this.getCtx();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(1200, now);
		osc.frequency.exponentialRampToValueAtTime(1800, now + 0.1);
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.05, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + 0.15);
	}

	playProcess(): void {
		if (this.muted) return;
		const ctx = this.getCtx();
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		osc.type = 'square';
		osc.frequency.setValueAtTime(400, now);
		osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.03, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + 0.1);
	}

	playWin(): void {
		if (this.muted) return;
		const ctx = this.getCtx();
		const now = ctx.currentTime;
		[523, 659, 784, 1047].forEach((freq, i) => {
			const osc = ctx.createOscillator();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(freq, now + i * 0.12);
			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.05, now + i * 0.12);
			gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now + i * 0.12);
			osc.stop(now + i * 0.12 + 0.3);
		});
	}
}

interface EntityMesh {
	root: TransformNode;
	body: TransformNode;
	parts?: (Mesh | TransformNode)[];
}

export class SouqManagerGame {
	private canvas: HTMLCanvasElement;
	private engine: Engine;
	private scene: Scene;
	private camera!: ArcRotateCamera;
	private logic: SouqManagerLogic;
	private audio: SouqManagerAudio;
	private onStateChange?: (state: SouqManagerState) => void;

	private shadowGenerator!: ShadowGenerator;
	private pipeline!: DefaultRenderingPipeline;
	private gui!: AdvancedDynamicTexture;
	private confettiTexture: DynamicTexture | null = null;

	private lowFpsAccumulator = 0;
	private performanceReduced = false;

	private playerMesh: EntityMesh | null = null;
	private customerMeshes = new Map<number, EntityMesh>();
	private workerMeshes = new Map<number, EntityMesh>();
	private stationMeshes = new Map<number, Mesh>();
	private shelfMeshes: Mesh[] = [];
	private cashierMesh: Mesh | null = null;
	private carryingMesh: Mesh | null = null;
	private stationItemMeshes = new Map<number, Mesh>();
	private stationDateMeshes = new Map<number, Mesh[]>();
	private shelfItemMeshes = new Map<number, Mesh[]>();
	private temporaryDropMat: Mesh | null = null;
	private temporaryDropItemMesh: Mesh | null = null;
	private temporaryDropRing: Mesh | null = null;
	private coinLabels: { mesh: Mesh; life: number }[] = [];
	private smokePuffs: { mesh: Mesh; life: number; maxLife: number; vy: number }[] = [];
	private stationSmokeTimers = new Map<number, number>();
	private highlight: HighlightLayer;

	private lastState: SouqManagerState | null = null;
	private handleResize: () => void;
	private handleKeydown: (e: KeyboardEvent) => void;
	private disposed = false;
	private time = 0;

	private customerAnimals = new Map<number, AnimalType>();
	private decorativeCamel: EntityMesh | null = null;
	private woodGrainTexture: DynamicTexture | null = null;

	constructor(
		canvas: HTMLCanvasElement,
		onStateChange?: (state: SouqManagerState) => void,
		options: SouqManagerGameOptions = {}
	) {
		this.canvas = canvas;
		this.onStateChange = onStateChange;
		this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
		this.scene = new Scene(this.engine);
		// Crisp, warm sky tone. Fog is disabled so the whole souq stays readable.
		this.scene.clearColor = Color4.FromHexString('#a0d8efff');
		this.scene.fogMode = Scene.FOGMODE_NONE;
		this.audio = new SouqManagerAudio();
		this.highlight = new HighlightLayer('hl', this.scene);

		this.logic = new SouqManagerLogic(
			(state) => {
				this.lastState = state;
				this.onStateChange?.(state);
			},
			options.config,
			{
				onCoinCollected: (amount) => {
					this.audio.playCoin();
					const state = this.logic.getState();
					this.spawnConfetti(state.player.position.x, 0.5, state.player.position.y, new Color3(1, 0.84, 0), 16);
					this.showFloatingText(state.player.position.x, 1.2, state.player.position.y, `+${amount}`, PALETTE.coin);
				},
				onCustomerServed: () => {
					this.audio.playProcess();
					this.spawnConfetti(0, 0.5, -4, Color3.FromHexString(PALETTE.success), 20);
				},
				onLevelComplete: () => {
					this.audio.playWin();
					this.spawnConfetti(0, 1, -4, Color3.FromHexString(PALETTE.success), 48);
				}
			}
		);

		this.setupEnvironmentTexture();
		this.setupLights();
		this.setupCamera();
		this.setupEnvironment();
		this.setupPostProcess();
		this.setupGui();
		this.setupInput();
		this.setupDecorativeCamel();

		this.handleResize = () => this.engine.resize();
		window.addEventListener('resize', this.handleResize);

		this.handleKeydown = (e: KeyboardEvent) => {
			if (e.code === 'Space') {
				e.preventDefault();
				this.unload();
			}
			if (e.code === 'KeyT') {
				e.preventDefault();
				this.dropTemporarily();
			}
		};
		window.addEventListener('keydown', this.handleKeydown);

		this.engine.runRenderLoop(() => {
			if (this.disposed) return;
			const dt = this.engine.getDeltaTime() / 1000;
			this.time += dt;
			this.logic.update(dt);
			this.syncScene();
			this.updateCoinLabels(dt);
			this.updateSmoke(dt);
			this.checkPerformance(dt);
			this.scene.render();
		});

		this.logic.startLevel(options.level ?? 1);
		this.audio.playMusic();
	}

	private setupLights(): void {
		const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
		// Strong ambient fill so shadows stay bright and shapes remain readable.
		hemi.intensity = 0.95;
		hemi.diffuse = new Color3(1, 0.96, 0.88);
		hemi.groundColor = new Color3(0.96, 0.86, 0.68);

		const dir = new DirectionalLight('dir', new Vector3(-0.5, -1, -0.7), this.scene);
		dir.intensity = 1.15;
		dir.diffuse = new Color3(1, 0.88, 0.62);
		dir.position = new Vector3(-20, 30, -10);
		dir.shadowMinZ = 1;
		dir.shadowMaxZ = 60;
		(dir as DirectionalLight & { shadowFrustumSize?: number }).shadowFrustumSize = 32;

		this.shadowGenerator = new ShadowGenerator(2048, dir);
		this.shadowGenerator.useBlurExponentialShadowMap = true;
		this.shadowGenerator.useKernelBlur = true;
		this.shadowGenerator.blurKernel = 24;
		this.shadowGenerator.bias = 0.0005;
		// Lighten shadows so nothing turns pitch-black.
		this.shadowGenerator.setDarkness(0.35);
	}

	private setupCamera(): void {
		const alpha = -Math.PI / 2;
		// Slightly angled top-down view: wide, stable, and easy to read.
		const beta = 1.1;
		const radius = 22;
		this.camera = new ArcRotateCamera('cam', alpha, beta, radius, new Vector3(0, 0, -1), this.scene);
		this.camera.fov = 0.95;
		this.camera.lowerAlphaLimit = alpha;
		this.camera.upperAlphaLimit = alpha;
		this.camera.lowerBetaLimit = 0.85;
		this.camera.upperBetaLimit = 1.35;
		this.camera.lowerRadiusLimit = 16;
		this.camera.upperRadiusLimit = 30;
		this.camera.wheelPrecision = 0;
		this.camera.minZ = 0.5;
		this.camera.maxZ = 200;
		this.camera.inputs.clear();
		this.camera.attachControl(false);
	}

	private setupEnvironmentTexture(): void {
		// Procedural environment map so the scene always has warm reflection
		// without depending on an external HDR asset.
		const faces = ['#a0d8ef', '#b8e2f2', '#c8eaf5', '#a0d8ef', '#dff4f7', '#ffffff'];
		const urls = faces.map((color) => {
			const canvas = document.createElement('canvas');
			canvas.width = 64;
			canvas.height = 64;
			const ctx = canvas.getContext('2d');
			if (ctx) {
				ctx.fillStyle = color;
				ctx.fillRect(0, 0, 64, 64);
			}
			return canvas.toDataURL('image/png');
		});
		this.scene.environmentTexture = new CubeTexture('', this.scene, null, false, urls);
	}

	private setupPostProcess(): void {
		this.pipeline = new DefaultRenderingPipeline('souqPipeline', true, this.scene, [this.camera]);
		this.pipeline.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
		this.pipeline.imageProcessing.toneMappingEnabled = true;
		this.pipeline.imageProcessing.exposure = 1.15;
		this.pipeline.imageProcessing.contrast = 1.15;
		this.pipeline.fxaaEnabled = true;
		// Very subtle bloom so the scene stays crisp and readable.
		this.pipeline.bloomEnabled = true;
		this.pipeline.bloomThreshold = 0.88;
		this.pipeline.bloomWeight = 0.06;
		this.pipeline.bloomKernel = 32;
		this.pipeline.bloomScale = 0.25;
		this.pipeline.glowLayerEnabled = true;
		if (this.pipeline.glowLayer) {
			this.pipeline.glowLayer.intensity = 0.25;
		}
	}

	private createPbrMaterial(
		name: string,
		color: string,
		options: { emissive?: string; alpha?: number; unlit?: boolean; roughness?: number } = {}
	): PBRMaterial {
		const mat = new PBRMaterial(name, this.scene);
		mat.albedoColor = Color3.FromHexString(color);
		mat.metallic = 0.0;
		mat.roughness = options.roughness ?? 0.85;
		if (options.emissive) {
			mat.emissiveColor = Color3.FromHexString(options.emissive);
		}
		if (options.unlit) {
			mat.disableLighting = true;
		}
		if (options.alpha !== undefined && options.alpha < 1) {
			mat.alpha = options.alpha;
			mat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
			mat.backFaceCulling = false;
		}
		return mat;
	}

	private setupEnvironment(): void {
		// Continuous sandy ground with gentle low-poly dunes.
		const ground = MeshBuilder.CreateGround('ground', { width: 30, height: 26, subdivisions: 12 }, this.scene);
		const positions = ground.getVerticesData(VertexBuffer.PositionKind);
		if (positions) {
			for (let i = 0; i < positions.length; i += 3) {
				const x = positions[i];
				const z = positions[i + 2];
				// Keep amplitude small so stations and tables are never buried.
				const dune =
					Math.sin(x * 0.35) * 0.05 +
					Math.cos(z * 0.28) * 0.04 +
					Math.sin((x + z) * 0.15) * 0.03 +
					Math.cos((x - z) * 0.22) * 0.02;
				const ripple = Math.sin(x * 1.4 + z * 0.9) * Math.cos(z * 1.6) * 0.01;
				positions[i + 1] = dune + ripple;
			}
			ground.updateVerticesData(VertexBuffer.PositionKind, positions);
			ground.refreshBoundingInfo();
		}
		this.flatShade(ground);
		ground.material = this.createPbrMaterial('groundMat', PALETTE.ground, { roughness: 1 });
		ground.position.y = -0.08;
		ground.isPickable = false;
		ground.receiveShadows = true;
		ground.freezeWorldMatrix();

		// Invisible, low-poly pick plane for ground clicks. Raycasting the detailed terrain was slow.
		const pickPlane = MeshBuilder.CreateGround('groundPickPlane', { width: 30, height: 26, subdivisions: 1 }, this.scene);
		pickPlane.position.y = -0.02;
		const pickMat = new StandardMaterial('groundPickMat', this.scene);
		pickMat.alpha = 0;
		pickPlane.material = pickMat;
		pickPlane.isPickable = true;
		pickPlane.freezeWorldMatrix();

		// Scatter a few small stones around the edges for detail.
		const stoneMat = this.createPbrMaterial('stoneMat', PALETTE.stone, { roughness: 0.95 });
		const stonePositions = [
			{ x: -11, z: -7.5, s: 0.22 },
			{ x: -12.5, z: 5, s: 0.18 },
			{ x: 12, z: -6, s: 0.25 },
			{ x: 11.5, z: 7, s: 0.2 },
			{ x: -9, z: 9, s: 0.16 },
			{ x: 9, z: -9, s: 0.19 },
			{ x: -13, z: -2, s: 0.15 },
			{ x: 13.5, z: 2.5, s: 0.21 }
		];
		for (let i = 0; i < stonePositions.length; i++) {
			const p = stonePositions[i];
			const stone = this.flatShade(
				MeshBuilder.CreateSphere(`stone-${i}`, { diameter: p.s, segments: 4 }, this.scene)
			);
			stone.position.set(p.x, p.s * 0.25, p.z);
			stone.scaling.set(1 + Math.sin(i) * 0.3, 0.6 + Math.cos(i * 1.3) * 0.2, 1 + Math.cos(i * 0.7) * 0.3);
			stone.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
			stone.material = stoneMat;
			stone.isPickable = false;
			this.freezeAndShadow(stone);
		}

		// Stall awning over the front selling area.
		const woodMat = this.createPbrMaterial('woodMat', PALETTE.wood, { roughness: 0.9 });
		const awningMat = this.createPbrMaterial('awningMat', PALETTE.awning);

		// Two support posts.
		for (const x of [-5, 5]) {
			const post = this.flatShade(MeshBuilder.CreateCylinder(`post-${x}`, { height: 4, diameter: 0.25, tessellation: 8 }, this.scene));
			post.position.set(x, 2, -5.5);
			post.material = woodMat;
			post.isPickable = false;
			this.freezeAndShadow(post);
		}

		// Awning roof with bright pastel awning fabric.
		const awning = this.flatShade(MeshBuilder.CreateBox('awning', { width: 11, height: 0.15, depth: 3 }, this.scene));
		awning.position = new Vector3(0, 4, -5.2);
		awning.material = awningMat;
		awning.isPickable = false;
		this.freezeAndShadow(awning);

		// Hanging brass lantern under the awning.
		const lanternRoot = new TransformNode('lanternRoot', this.scene);
		lanternRoot.position.set(0, 3.6, -5.2);
		const chain = this.flatShade(MeshBuilder.CreateCylinder('lantern-chain', { height: 0.4, diameter: 0.03, tessellation: 8 }, this.scene));
		chain.position.y = 0.2;
		chain.material = woodMat;
		chain.parent = lanternRoot;
		const lanternBody = this.flatShade(MeshBuilder.CreateCylinder('lantern-body', { height: 0.6, diameter: 0.28, tessellation: 8 }, this.scene));
		lanternBody.material = this.createPbrMaterial('lanternMat', PALETTE.lantern, {
			emissive: PALETTE.lantern
		});
		lanternBody.parent = lanternRoot;
		const lanternGlass = this.flatShade(MeshBuilder.CreateCylinder('lantern-glass', { height: 0.4, diameter: 0.2, tessellation: 8 }, this.scene));
		lanternGlass.material = this.createPbrMaterial('lanternGlassMat', PALETTE.lanternGlass, {
			emissive: PALETTE.lanternGlass,
			alpha: 0.7
		});
		lanternGlass.parent = lanternRoot;

		this.setupStations();
		this.setupShelves();

		this.cashierMesh = this.createFeaturedCashierTable('cashier');
		// Center the tabletop so the table legs rest on the sand.
		this.cashierMesh.position = new Vector3(8, 0.325, -4);

		this.temporaryDropMat = this.flatShade(MeshBuilder.CreateGround('temporaryDropMat', { width: 1.6, height: 1.2 }, this.scene));
		this.temporaryDropMat.position = new Vector3(0, 0.08, -5);
		this.temporaryDropMat.material = this.createPbrMaterial('temporaryDropMatMat', PALETTE.wood, { roughness: 0.95 });
		this.temporaryDropMat.isPickable = false;
		this.temporaryDropMat.receiveShadows = true;
		this.temporaryDropMat.freezeWorldMatrix();

		this.createShopSign();
		this.createBoundaryFence();
	}

	private createShopSign(): void {
		const root = new TransformNode('shopSignRoot', this.scene);
		root.position.set(0, 5.8, -5.5);
		root.billboardMode = Mesh.BILLBOARDMODE_ALL;

		// Carved wooden board backing.
		const board = this.flatShade(MeshBuilder.CreateBox('shopSignBoard', { width: 4.4, height: 1.3, depth: 0.15 }, this.scene));
		board.material = this.createPbrMaterial('shopSignBoardMat', PALETTE.woodDark, { roughness: 0.95 });
		board.parent = root;
		board.isPickable = false;
		this.freezeAndShadow(board);

		// Decorative border frame.
		const frameMat = this.createPbrMaterial('shopSignFrameMat', PALETTE.wood, { roughness: 0.95 });
		const frameTop = this.flatShade(MeshBuilder.CreateBox('shopSignFrameTop', { width: 4.6, height: 0.12, depth: 0.18 }, this.scene));
		frameTop.position.y = 0.65;
		frameTop.material = frameMat;
		frameTop.parent = root;
		frameTop.isPickable = false;
		this.freezeAndShadow(frameTop);
		const frameBottom = this.flatShade(MeshBuilder.CreateBox('shopSignFrameBottom', { width: 4.6, height: 0.12, depth: 0.18 }, this.scene));
		frameBottom.position.y = -0.65;
		frameBottom.material = frameMat;
		frameBottom.parent = root;
		frameBottom.isPickable = false;
		this.freezeAndShadow(frameBottom);

		// Arabic name texture.
		const texture = new DynamicTexture('shopSignTex', { width: 512, height: 128 }, this.scene);
		const ctx = texture.getContext() as unknown as CanvasRenderingContext2D;
		ctx.fillStyle = '#5a3a20';
		ctx.fillRect(0, 0, 512, 128);
		ctx.fillStyle = '#fff8e7';
		ctx.font = "bold 72px 'Segoe UI', Tahoma, Arial, sans-serif";
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.direction = 'rtl';
		ctx.fillText('سوق الفريج', 256, 64);
		texture.update();

		const textMat = new StandardMaterial('shopSignTextMat', this.scene);
		textMat.diffuseTexture = texture;
		textMat.emissiveColor = new Color3(0.9, 0.85, 0.7);
		textMat.specularColor = new Color3(0, 0, 0);
		textMat.backFaceCulling = false;

		const textPlane = MeshBuilder.CreatePlane('shopSignText', { width: 4.0, height: 1.0 }, this.scene);
		textPlane.position.z = -0.09;
		textPlane.parent = root;
		textPlane.material = textMat;
		textPlane.isPickable = false;
	}

	private createBoundaryFence(): void {
		const postMat = this.createPbrMaterial('fencePostMat', PALETTE.fence, { roughness: 0.95 });
		const railMat = this.createPbrMaterial('fenceRailMat', PALETTE.wood, { roughness: 0.95 });

		// Deterministic "random" offsets so the fence looks hand-built and aged
		// but stays the same every play session.
		const jitter = (i: number, scale: number) => {
			const sin = Math.sin(i * 1.618 + 0.7) * 0.5 + 0.5;
			const cos = Math.cos(i * 2.414 + 0.3) * 0.5 + 0.5;
			return (sin * cos - 0.25) * scale;
		};

		// Pull the fence inward slightly so it has clear margin from the screen edge
		// and leave an entrance on the front-right side where customers arrive and leave.
		const halfW = 10.5;
		const halfD = 8.5;
		const gateLeft = 3.5;
		const gateRight = 8.5;
		const postBaseH = 1.05;

		interface PostPoint {
			x: number;
			z: number;
			idx: number;
		}

		const posts: PostPoint[] = [];
		let idx = 0;

		// Front-left segment (closed up to the entrance).
		for (let t = 0; t <= 1; t += 0.34) {
			const x = -halfW + t * (gateLeft - -halfW);
			const z = -halfD + jitter(idx, 0.45);
			posts.push({ x, z, idx: idx++ });
		}
		// Front-right segment (short closed section after the entrance).
		for (let t = 0; t <= 1; t += 0.34) {
			const x = gateRight + t * (halfW - gateRight);
			const z = -halfD + jitter(idx, 0.45);
			posts.push({ x, z, idx: idx++ });
		}
		// Right side.
		for (let t = 0; t <= 1; t += 0.28) {
			const z = -halfD + t * (halfD * 2);
			const x = halfW + jitter(idx, 0.5);
			posts.push({ x, z, idx: idx++ });
		}
		// Back side.
		for (let t = 0; t <= 1; t += 0.3) {
			const x = halfW - t * (halfW * 2);
			const z = halfD + jitter(idx, 0.5);
			posts.push({ x, z, idx: idx++ });
		}
		// Left side.
		for (let t = 0; t <= 1; t += 0.28) {
			const z = halfD - t * (halfD * 2);
			const x = -halfW + jitter(idx, 0.5);
			posts.push({ x, z, idx: idx++ });
		}

		// Place posts with varied height, thickness, and slight lean.
		for (const p of posts) {
			const h = postBaseH + jitter(p.idx, 0.35);
			const d = 0.18 + jitter(p.idx, 0.06);
			const post = this.flatShade(
				MeshBuilder.CreateCylinder(`fencePost-${p.idx}`, { height: h, diameter: d, tessellation: 7 }, this.scene)
			);
			post.position.set(p.x, h / 2, p.z);
			post.rotation.z = jitter(p.idx, 0.12);
			post.rotation.x = jitter(p.idx + 3, 0.1);
			post.material = postMat;
			post.isPickable = false;
			this.freezeAndShadow(post);
		}

		// Connect consecutive posts with uneven double rails.
		for (let i = 0; i < posts.length - 1; i++) {
			const a = posts[i];
			const b = posts[i + 1];
			// Skip rails across the entrance gap on the front side.
			if (a.z < -halfD + 0.5 && b.z < -halfD + 0.5 && a.x <= gateLeft + 0.2 && b.x >= gateRight - 0.2) continue;

			const dx = b.x - a.x;
			const dz = b.z - a.z;
			const len = Math.sqrt(dx * dx + dz * dz);
			const midX = (a.x + b.x) / 2;
			const midZ = (a.z + b.z) / 2;
			const angle = -Math.atan2(dz, dx);

			const railH = 0.08 + jitter(i, 0.03);
			const railD = 0.055 + jitter(i, 0.015);
			const y1 = 0.72 + jitter(i, 0.1);
			const y2 = 0.4 + jitter(i + 7, 0.1);

			for (const y of [y1, y2]) {
				const rail = this.flatShade(
					MeshBuilder.CreateBox(`fenceRail-${i}-${y}`, { width: len, height: railH, depth: railD }, this.scene)
				);
				rail.position.set(midX, y, midZ);
				rail.rotation.y = angle;
				rail.rotation.z = jitter(i, 0.04);
				rail.material = railMat;
				rail.isPickable = false;
				this.freezeAndShadow(rail);
			}
		}

		// Add a small gateway over the front-right entrance.
		const gateMat = this.createPbrMaterial('gateMat', PALETTE.woodDark, { roughness: 0.95 });
		const leftPost = posts.find((p) => p.x <= gateLeft + 0.2 && p.z < -halfD + 0.5);
		const rightPost = posts.find((p) => p.x >= gateRight - 0.2 && p.z < -halfD + 0.5);
		if (leftPost && rightPost) {
			const gx = (leftPost.x + rightPost.x) / 2;
			const gz = -halfD;
			const gw = rightPost.x - leftPost.x;
			const lintel = this.flatShade(MeshBuilder.CreateBox('gateLintel', { width: gw + 0.6, height: 0.18, depth: 0.28 }, this.scene));
			lintel.position.set(gx, 1.25, gz);
			lintel.material = gateMat;
			lintel.isPickable = false;
			this.freezeAndShadow(lintel);

			const leftBrace = this.flatShade(MeshBuilder.CreateBox('gateBraceL', { width: 0.18, height: 0.75, depth: 0.18 }, this.scene));
			leftBrace.position.set(leftPost.x, 0.85, gz);
			leftBrace.rotation.z = -0.15;
			leftBrace.material = gateMat;
			leftBrace.isPickable = false;
			this.freezeAndShadow(leftBrace);

			const rightBrace = this.flatShade(MeshBuilder.CreateBox('gateBraceR', { width: 0.18, height: 0.75, depth: 0.18 }, this.scene));
			rightBrace.position.set(rightPost.x, 0.85, gz);
			rightBrace.rotation.z = 0.15;
			rightBrace.material = gateMat;
			rightBrace.isPickable = false;
			this.freezeAndShadow(rightBrace);
		}
	}

	private setupStations(): void {
		const state = this.logic.getState();
		for (const station of state.stations) {
			const mesh = this.createStationMesh(station.type);
			mesh.position.x = station.position.x;
			mesh.position.z = station.position.y;
			// Lift packaging tables so their legs sit on the sand; other stations sit just above the dunes.
			mesh.position.y = station.type === 'packagingTable' ? 0.275 : 0.05;
			mesh.metadata = { stationId: station.id };
			this.stationMeshes.set(station.id, mesh);
			if (mesh.metadata?.dates) {
				this.stationDateMeshes.set(station.id, mesh.metadata.dates as Mesh[]);
			}
		}
	}

	private createStationMesh(type: StationType): Mesh {
		let mesh: Mesh;
		switch (type) {
			case 'palmPlot':
				mesh = this.createPalmTree(`station-${type}`);
				break;
			case 'dryingMat':
				mesh = this.createWovenMat(`station-${type}`, 1.6, 1.2, PALETTE.sandLight);
				break;
			case 'packagingTable':
				mesh = this.createPackagingTable(`station-${type}`);
				break;
			case 'brazier':
				mesh = this.createBrazier(`station-${type}`);
				break;
			case 'mortar':
				mesh = this.createMortar(`station-${type}`);
				break;
			case 'dallah':
				mesh = this.createDallah(`station-${type}`);
				break;
			case 'sortingMat':
				mesh = this.createWovenMat(`station-${type}`, 1.4, 1, PALETTE.sandShadow);
				break;
			case 'greenBeans':
				mesh = this.createCoffeeSack(`station-${type}`);
				break;
			case 'rawResin':
				mesh = this.createFrankincenseTree(`station-${type}`);
				break;
		}
		return mesh;
	}

	private createPalmTree(name: string): Mesh {
		const trunkMat = this.createPbrMaterial(`${name}-trunkMat`, PALETTE.palmTrunk, { roughness: 0.95 });

		// Faceted, smoothly bent trunk built from stacked hexagonal segments.
		// The bottom segment is returned as the root mesh.
		const trunkSegments = [
			{ y: 0.15, h: 0.35, bottom: 0.26, top: 0.22, x: 0, z: 0 },
			{ y: 0.5, h: 0.4, bottom: 0.22, top: 0.18, x: 0.02, z: 0.01 },
			{ y: 0.9, h: 0.45, bottom: 0.18, top: 0.15, x: 0.04, z: 0.02 },
			{ y: 1.3, h: 0.45, bottom: 0.15, top: 0.12, x: 0.02, z: 0.01 },
			{ y: 1.65, h: 0.25, bottom: 0.12, top: 0.1, x: 0, z: 0 }
		];
		const root = this.flatShade(MeshBuilder.CreateCylinder(`${name}-trunk0`, { height: trunkSegments[0].h, diameterTop: trunkSegments[0].top, diameterBottom: trunkSegments[0].bottom, tessellation: 6 }, this.scene));
		root.position.set(trunkSegments[0].x, trunkSegments[0].y, trunkSegments[0].z);
		root.material = trunkMat;

		for (let i = 1; i < trunkSegments.length; i++) {
			const seg = trunkSegments[i];
			const trunk = this.flatShade(MeshBuilder.CreateCylinder(`${name}-trunk${i}`, { height: seg.h, diameterTop: seg.top, diameterBottom: seg.bottom, tessellation: 6 }, this.scene));
			trunk.position.set(seg.x, seg.y, seg.z);
			trunk.material = trunkMat;
			trunk.parent = root;
		}

		// Diamond low-poly fronds radiating from the crown.
		const leafMat = this.createPbrMaterial(`${name}-leafMat`, PALETTE.palmLeaf, { roughness: 0.8 });
		leafMat.backFaceCulling = false;
		const frondCount = 8;
		for (let i = 0; i < frondCount; i++) {
			const angle = (i / frondCount) * Math.PI * 2;
			const frond = this.createDiamondFrond(`${name}-frond${i}`, 1.1, 0.42, leafMat);
			frond.position.y = 1.78;
			frond.position.x = Math.cos(angle) * 0.06;
			frond.position.z = Math.sin(angle) * 0.06;
			frond.rotation.y = angle;
			frond.rotation.x = -Math.PI / 5;
			frond.parent = root;
		}

		// Hanging date clusters near the crown (hidden until harvest-ready).
		const datesMat = this.createPbrMaterial(`${name}-datesMat`, PALETTE.date, { emissive: PALETTE.date });
		const dateMeshes: Mesh[] = [];
		const clusterPositions = [
			{ x: 0.18, y: 1.5, z: 0.18 },
			{ x: -0.18, y: 1.45, z: 0.1 },
			{ x: 0.05, y: 1.4, z: -0.2 }
		];
		for (let c = 0; c < clusterPositions.length; c++) {
			const pos = clusterPositions[c];
			for (let i = 0; i < 6; i++) {
				const date = this.flatShade(MeshBuilder.CreateSphere(`${name}-date${c}-${i}`, { diameter: 0.1, segments: 6 }, this.scene));
				date.position.set(
					pos.x + (Math.random() - 0.5) * 0.1,
					pos.y - (i * 0.08),
					pos.z + (Math.random() - 0.5) * 0.08
				);
				date.material = datesMat;
				date.setEnabled(false);
				date.parent = root;
				dateMeshes.push(date);
			}
		}

		root.metadata = { dates: dateMeshes };
		return root;
	}

	private getWoodGrainTexture(): DynamicTexture {
		if (this.woodGrainTexture) return this.woodGrainTexture;
		const size = 256;
		const tex = new DynamicTexture('woodGrainTex', { width: size, height: size }, this.scene);
		tex.wrapU = 1;
		tex.wrapV = 1;
		const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
		ctx.fillStyle = '#c4a47c';
		ctx.fillRect(0, 0, size, size);
		// Vertical grain stripes.
		for (let i = 0; i < 48; i++) {
			const x = Math.random() * size;
			const w = 1 + Math.random() * 3;
			const alpha = 0.08 + Math.random() * 0.18;
			ctx.fillStyle = `rgba(90, 65, 40, ${alpha})`;
			ctx.fillRect(x, 0, w, size);
		}
		// Occasional wavy darker grain lines.
		for (let i = 0; i < 8; i++) {
			ctx.beginPath();
			const x = Math.random() * size;
			ctx.moveTo(x, 0);
			for (let y = 0; y <= size; y += 8) {
				ctx.lineTo(x + Math.sin(y * 0.05 + i) * 4, y);
			}
			ctx.strokeStyle = `rgba(75, 52, 32, ${0.1 + Math.random() * 0.12})`;
			ctx.lineWidth = 1 + Math.random() * 2;
			ctx.stroke();
		}
		// Subtle knots.
		for (let i = 0; i < 4; i++) {
			const x = Math.random() * size;
			const y = Math.random() * size;
			const r = 3 + Math.random() * 7;
			ctx.beginPath();
			ctx.ellipse(x, y, r, r * 0.45, Math.random() * Math.PI, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(65, 45, 28, ${0.12 + Math.random() * 0.1})`;
			ctx.fill();
		}
		tex.update();
		this.woodGrainTexture = tex;
		return tex;
	}

	private createWoodMaterial(name: string, tint: Color3): PBRMaterial {
		const mat = new PBRMaterial(name, this.scene);
		mat.albedoTexture = this.getWoodGrainTexture();
		mat.albedoColor = tint;
		mat.metallic = 0;
		mat.roughness = 0.9;
		return mat;
	}

	private createTraditionalTable(
		name: string,
		width: number,
		depth: number,
		height: number,
		withBowl = true
	): Mesh {
		const tint = Color3.FromHexString(PALETTE.woodDark);
		const woodMat = this.createWoodMaterial(`${name}-woodMat`, tint);

		const root = this.flatShade(MeshBuilder.CreateBox(`${name}-top`, { width, height: 0.12, depth }, this.scene));
		root.material = woodMat;

		const legW = 0.14;
		const legH = height - 0.06;
		const legInset = legW * 0.7;
		for (const sx of [-1, 1]) {
			for (const sz of [-1, 1]) {
				const leg = this.flatShade(
					MeshBuilder.CreateBox(`${name}-leg${sx}${sz}`, { width: legW, height: legH, depth: legW }, this.scene)
				);
				leg.position.set(sx * (width / 2 - legInset), -height / 2, sz * (depth / 2 - legInset));
				leg.material = woodMat;
				leg.parent = root;
			}
		}

		// Wooden apron joining the tabletop to the legs.
		const apronH = 0.1;
		const apron = this.flatShade(
			MeshBuilder.CreateBox(`${name}-apron`, { width: width - 0.04, height: apronH, depth: depth - 0.04 }, this.scene)
		);
		apron.position.y = -0.06 - apronH / 2;
		apron.material = woodMat;
		apron.parent = root;

		// Crossed braces on the long sides for a carved, hand-built look.
		const braceThick = 0.05;
		const braceSpan = Math.sqrt(depth * depth + legH * legH);
		const braceAngle = Math.atan(depth / legH);
		for (const sx of [-1, 1]) {
			for (const dir of [-1, 1]) {
				const brace = this.flatShade(
					MeshBuilder.CreateBox(`${name}-brace${sx}${dir}`, { width: braceThick, height: braceSpan, depth: braceThick }, this.scene)
				);
				brace.position.set(sx * (width / 2 - legInset), -height / 2, 0);
				brace.rotation.z = dir * braceAngle;
				brace.material = woodMat;
				brace.parent = root;
			}
		}

		if (withBowl) {
			// Small brass coin bowl on top.
			const bowl = this.flatShade(MeshBuilder.CreateCylinder(`${name}-bowl`, { height: 0.08, diameter: 0.35, tessellation: 8 }, this.scene));
			bowl.position.y = 0.1;
			bowl.material = this.createPbrMaterial(`${name}-bowlMat`, PALETTE.brass, { roughness: 0.4 });
			bowl.parent = root;
		}

		return root;
	}

	private createPackagingTable(name: string): Mesh {
		const root = this.createTraditionalTable(name, 1.6, 1, 0.55);

		// Palm-leaf strips / cloth on top for packing.
		const cloth = this.flatShade(MeshBuilder.CreateBox(`${name}-cloth`, { width: 1.2, height: 0.04, depth: 0.7 }, this.scene));
		cloth.position.y = 0.08;
		cloth.material = this.createPbrMaterial(`${name}-clothMat`, PALETTE.sandShadow, { roughness: 0.95 });
		cloth.parent = root;

		// Small rope coil resting on one corner of the cloth.
		const coil = this.flatShade(MeshBuilder.CreateTorus(`${name}-coil`, { diameter: 0.28, thickness: 0.045, tessellation: 10 }, this.scene));
		coil.position.set(0.45, 0.12, 0.22);
		coil.rotation.x = Math.PI / 2;
		coil.scaling.set(1, 0.85, 1);
		coil.material = this.createPbrMaterial(`${name}-ropeMat`, PALETTE.sandLight, { roughness: 0.95 });
		coil.parent = root;

		// A couple of empty woven sacks behind the table.
		const sackMat = this.createPbrMaterial(`${name}-sackMat`, PALETTE.sandLight, { roughness: 0.95 });
		for (let i = 0; i < 2; i++) {
			const sack = this.flatShade(MeshBuilder.CreateSphere(`${name}-sack${i}`, { diameter: 0.32, segments: 6 }, this.scene));
			sack.position.set(-0.35 + i * 0.3, 0.18, -0.55 - i * 0.12);
			sack.scaling.set(0.8, 1.1, 0.65);
			sack.material = sackMat;
			sack.parent = root;
		}

		return root;
	}

	private createFeaturedCashierTable(name: string): Mesh {
		const root = this.createTraditionalTable(name, 2.2, 1.4, 0.65, false);

		// Brass balance scale on the counter.
		const brassMat = this.createPbrMaterial(`${name}-brassMat`, PALETTE.brass, { roughness: 0.4 });
		const scalePillar = this.flatShade(MeshBuilder.CreateCylinder(`${name}-scalePillar`, { height: 0.35, diameter: 0.05, tessellation: 8 }, this.scene));
		scalePillar.position.set(-0.55, 0.22, -0.25);
		scalePillar.material = brassMat;
		scalePillar.parent = root;
		const scaleBeam = this.flatShade(MeshBuilder.CreateBox(`${name}-scaleBeam`, { width: 0.7, height: 0.03, depth: 0.03 }, this.scene));
		scaleBeam.position.set(-0.55, 0.42, -0.25);
		scaleBeam.material = brassMat;
		scaleBeam.parent = root;
		for (const sx of [-1, 1]) {
			const chain = this.flatShade(MeshBuilder.CreateCylinder(`${name}-scaleChain${sx}`, { height: 0.12, diameter: 0.015, tessellation: 6 }, this.scene));
			chain.position.set(-0.55 + sx * 0.32, 0.34, -0.25);
			chain.material = brassMat;
			chain.parent = root;
			const pan = this.flatShade(MeshBuilder.CreateCylinder(`${name}-scalePan${sx}`, { height: 0.03, diameter: 0.2, tessellation: 8 }, this.scene));
			pan.position.set(-0.55 + sx * 0.32, 0.25, -0.25);
			pan.material = brassMat;
			pan.parent = root;
		}

		// Small pile of gold coins.
		const coinMat = this.createPbrMaterial(`${name}-coinMat`, PALETTE.coin, { roughness: 0.35 });
		for (let i = 0; i < 8; i++) {
			const coin = this.flatShade(MeshBuilder.CreateCylinder(`${name}-coin${i}`, { height: 0.015, diameter: 0.06, tessellation: 8 }, this.scene));
			coin.position.set(
				0.1 + (i % 3) * 0.05 + Math.sin(i * 2.3) * 0.02,
				0.07 + Math.floor(i / 3) * 0.015,
				0.1 + Math.cos(i * 1.7) * 0.03
			);
			coin.rotation.z = Math.random() * 0.3;
			coin.material = coinMat;
			coin.parent = root;
		}

		// Tiny ledger/scroll.
		const paperMat = this.createPbrMaterial(`${name}-paperMat`, PALETTE.sandLight, { roughness: 0.95 });
		const ledger = this.flatShade(MeshBuilder.CreateBox(`${name}-ledger`, { width: 0.3, height: 0.03, depth: 0.22 }, this.scene));
		ledger.position.set(0.55, 0.08, 0.2);
		ledger.material = paperMat;
		ledger.parent = root;
		const scroll = this.flatShade(MeshBuilder.CreateCylinder(`${name}-scroll`, { height: 0.24, diameter: 0.04, tessellation: 8 }, this.scene));
		scroll.position.set(0.55, 0.1, 0.35);
		scroll.rotation.x = Math.PI / 2;
		scroll.material = paperMat;
		scroll.parent = root;

		// Small striped awning/sign above the cashier to make it stand out.
		const postMat = this.createPbrMaterial(`${name}-postMat`, PALETTE.woodDark, { roughness: 0.95 });
		for (const sx of [-1, 1]) {
			const post = this.flatShade(MeshBuilder.CreateCylinder(`${name}-post${sx}`, { height: 1.4, diameter: 0.08, tessellation: 6 }, this.scene));
			post.position.set(sx * 0.9, 0.9, -0.5);
			post.material = postMat;
			post.parent = root;
		}

		const awningMat = this.createPbrMaterial(`${name}-awningMat`, PALETTE.cashierAwning);
		const awning = this.flatShade(MeshBuilder.CreateBox(`${name}-awning`, { width: 2.4, height: 0.1, depth: 0.9 }, this.scene));
		awning.position.set(0, 1.55, -0.25);
		awning.material = awningMat;
		awning.parent = root;

		const stripeMat = this.createPbrMaterial(`${name}-stripeMat`, PALETTE.cashierStripe);
		const stripeCount = 6;
		const stripeSpacing = 2.5 / stripeCount;
		for (let i = 0; i < stripeCount; i++) {
			const stripe = this.flatShade(MeshBuilder.CreateBox(`${name}-stripe${i}`, { width: 0.1, height: 0.12, depth: 0.92 }, this.scene));
			stripe.position.set(-1.2 + (i + 0.5) * stripeSpacing, 1.55, -0.25);
			stripe.material = stripeMat;
			stripe.parent = root;
		}

		return root;
	}

	private createWovenMat(name: string, width: number, depth: number, color: string): Mesh {
		const root = this.flatShade(MeshBuilder.CreateBox(`${name}-base`, { width, height: 0.04, depth }, this.scene));
		const mat = this.createPbrMaterial(`${name}-mat`, color, { roughness: 0.95 });
		root.material = mat;

		// Woven border strips.
		const borderColor = Color3.FromHexString(color).scale(0.85);
		const borderMat = this.createPbrMaterial(`${name}-borderMat`, borderColor.toHexString(), { roughness: 0.95 });
		const stripW = 0.08;
		const longStrip = this.flatShade(MeshBuilder.CreateBox(`${name}-borderLong`, { width, height: 0.05, depth: stripW }, this.scene));
		longStrip.position.z = -depth / 2 + stripW / 2;
		longStrip.material = borderMat;
		longStrip.parent = root;
		const longStrip2 = this.flatShade(MeshBuilder.CreateBox(`${name}-borderLong2`, { width, height: 0.05, depth: stripW }, this.scene));
		longStrip2.position.z = depth / 2 - stripW / 2;
		longStrip2.material = borderMat;
		longStrip2.parent = root;
		const shortStrip = this.flatShade(MeshBuilder.CreateBox(`${name}-borderShort`, { width: stripW, height: 0.05, depth: depth - stripW * 2 }, this.scene));
		shortStrip.position.x = -width / 2 + stripW / 2;
		shortStrip.material = borderMat;
		shortStrip.parent = root;
		const shortStrip2 = this.flatShade(MeshBuilder.CreateBox(`${name}-borderShort2`, { width: stripW, height: 0.05, depth: depth - stripW * 2 }, this.scene));
		shortStrip2.position.x = width / 2 - stripW / 2;
		shortStrip2.material = borderMat;
		shortStrip2.parent = root;

		return root;
	}

	private createDisplayTray(name: string, width: number, depth: number, color: string): Mesh {
		const root = this.flatShade(MeshBuilder.CreateBox(`${name}-base`, { width, height: 0.03, depth }, this.scene));
		const mat = this.createPbrMaterial(`${name}-mat`, color, { roughness: 0.95 });
		root.material = mat;

		// Low basket-like rim around the display area.
		const rimH = 0.08;
		const rimThick = 0.06;
		const rimColor = Color3.FromHexString(color).scale(0.8);
		const rimMat = this.createPbrMaterial(`${name}-rimMat`, rimColor.toHexString(), { roughness: 0.95 });

		for (const z of [-1, 1]) {
			const rim = this.flatShade(
				MeshBuilder.CreateBox(`${name}-rimLong${z}`, { width, height: rimH, depth: rimThick }, this.scene)
			);
			rim.position.set(0, rimH / 2, z * (depth / 2 - rimThick / 2));
			rim.material = rimMat;
			rim.parent = root;
		}
		for (const x of [-1, 1]) {
			const rim = this.flatShade(
				MeshBuilder.CreateBox(`${name}-rimShort${x}`, { width: rimThick, height: rimH, depth: depth - rimThick * 2 }, this.scene)
			);
			rim.position.set(x * (width / 2 - rimThick / 2), rimH / 2, 0);
			rim.material = rimMat;
			rim.parent = root;
		}

		return root;
	}

	private createDiamondFrond(name: string, length: number, width: number, material: import('@babylonjs/core').Material): Mesh {
		const mesh = new Mesh(name, this.scene);
		const halfBack = length * 0.25;
		const positions = [
			0, 0, 0,
			-width, 0, halfBack,
			0, 0, length,
			width, 0, halfBack,
			0, 0, -halfBack
		];
		// Counter-clockwise when viewed from +Y so the top face renders.
		const indices = [
			0, 2, 1,
			0, 3, 2,
			0, 4, 3,
			0, 1, 4
		];
		const normals: number[] = [];
		VertexData.ComputeNormals(positions, indices, normals);
		const vertexData = new VertexData();
		vertexData.positions = positions;
		vertexData.indices = indices;
		vertexData.normals = normals;
		vertexData.applyToMesh(mesh);
		mesh.material = material;
		return mesh;
	}

	private createFrankincenseTree(name: string): Mesh {
		const root = this.flatShade(MeshBuilder.CreateCylinder(`${name}-trunk`, { height: 1.1, diameterTop: 0.1, diameterBottom: 0.18, tessellation: 8 }, this.scene));
		root.position.y = 0.55;
		root.material = this.createPbrMaterial(`${name}-trunkMat`, PALETTE.palmTrunk, { roughness: 0.95 });

		const leafMat = this.createPbrMaterial(`${name}-leafMat`, PALETTE.palmLeaf, { roughness: 0.8 });
		for (let i = 0; i < 5; i++) {
			const branch = this.flatShade(MeshBuilder.CreateSphere(`${name}-leaf${i}`, { diameter: 0.55, segments: 8 }, this.scene));
			branch.position.y = 1.05 + Math.random() * 0.25;
			branch.position.x = (Math.random() - 0.5) * 0.5;
			branch.position.z = (Math.random() - 0.5) * 0.5;
			branch.scaling.y = 0.6;
			branch.material = leafMat;
			branch.parent = root;
		}

		const resinMat = this.createPbrMaterial(`${name}-resinMat`, PALETTE.resin, { emissive: PALETTE.resin });
		for (let i = 0; i < 4; i++) {
			const lump = this.flatShade(MeshBuilder.CreateSphere(`${name}-resin${i}`, { diameter: 0.14, segments: 8 }, this.scene));
			lump.position.y = 0.08;
			lump.position.x = 0.25 + (i % 2) * 0.2;
			lump.position.z = (i < 2 ? -0.15 : 0.15);
			lump.material = resinMat;
			lump.parent = root;
		}

		return root;
	}

	private createCoffeeSack(name: string): Mesh {
		const root = this.flatShade(MeshBuilder.CreateSphere(`${name}-sack`, { diameter: 0.8, segments: 8 }, this.scene));
		root.position.y = 0.35;
		root.scaling.y = 0.85;
		root.material = this.createPbrMaterial(`${name}-sackMat`, PALETTE.sandLight, { roughness: 0.95 });

		const top = this.flatShade(MeshBuilder.CreateCylinder(`${name}-top`, { height: 0.08, diameterTop: 0.35, diameterBottom: 0.5, tessellation: 8 }, this.scene));
		top.position.y = 0.55;
		top.material = this.createPbrMaterial(`${name}-topMat`, PALETTE.wood, { roughness: 0.95 });
		top.parent = root;

		const beanMat = this.createPbrMaterial(`${name}-beanMat`, PALETTE.coffeeBean, { roughness: 0.8 });
		for (let i = 0; i < 5; i++) {
			const bean = this.flatShade(MeshBuilder.CreateSphere(`${name}-bean${i}`, { diameter: 0.1, segments: 8 }, this.scene));
			bean.position.y = 0.5;
			bean.position.x = (Math.random() - 0.5) * 0.25;
			bean.position.z = (Math.random() - 0.5) * 0.25;
			bean.material = beanMat;
			bean.parent = root;
		}

		return root;
	}

	private createBrazier(name: string): Mesh {
		const root = this.flatShade(MeshBuilder.CreateCylinder(`${name}-bowl`, { height: 0.35, diameter: 0.85, tessellation: 8 }, this.scene));
		root.position.y = 0.2;
		root.material = this.createPbrMaterial(`${name}-bowlMat`, PALETTE.charcoal, { roughness: 0.7 });

		const coal = this.flatShade(MeshBuilder.CreateSphere(`${name}-coal`, { diameter: 0.5, segments: 8 }, this.scene));
		coal.position.y = 0.18;
		coal.scaling.y = 0.4;
		coal.material = this.createPbrMaterial(`${name}-coalMat`, '#2a2d3e', { emissive: '#3d3142' });
		coal.parent = root;

		return root;
	}

	private createMortar(name: string): Mesh {
		const root = this.flatShade(MeshBuilder.CreateSphere(`${name}-bowl`, { diameter: 0.6, segments: 8 }, this.scene));
		root.position.y = 0.3;
		root.scaling.y = 0.65;
		root.material = this.createPbrMaterial(`${name}-bowlMat`, PALETTE.mortar, { roughness: 0.85 });

		const pestle = this.flatShade(MeshBuilder.CreateCylinder(`${name}-pestle`, { height: 0.5, diameter: 0.1, tessellation: 8 }, this.scene));
		pestle.position.y = 0.55;
		pestle.rotation.z = 0.3;
		pestle.material = this.createPbrMaterial(`${name}-pestleMat`, PALETTE.woodDark, { roughness: 0.95 });
		pestle.parent = root;

		return root;
	}

	private createDallah(name: string): Mesh {
		const root = this.flatShade(MeshBuilder.CreateSphere(`${name}-body`, { diameter: 0.65, segments: 8 }, this.scene));
		root.position.y = 0.45;
		root.scaling.y = 1.1;
		const bodyMat = this.createPbrMaterial(`${name}-bodyMat`, PALETTE.brass, { roughness: 0.4 });
		root.material = bodyMat;

		const neck = this.flatShade(MeshBuilder.CreateCylinder(`${name}-neck`, { height: 0.45, diameter: 0.22, tessellation: 8 }, this.scene));
		neck.position.y = 0.95;
		neck.material = bodyMat;
		neck.parent = root;

		const spout = this.flatShade(MeshBuilder.CreateCylinder(`${name}-spout`, { height: 0.45, diameterTop: 0.08, diameterBottom: 0.16, tessellation: 8 }, this.scene));
		spout.position.y = 0.75;
		spout.position.x = 0.35;
		spout.rotation.z = -Math.PI / 3;
		spout.material = bodyMat;
		spout.parent = root;

		return root;
	}

	private setupShelves(): void {
		const state = this.logic.getState();
		for (const shelf of state.shelves) {
			const mesh = this.createDisplayTray(`shelf${shelf.id}`, 1.6, 1, PALETTE.wood);
			mesh.position.x = shelf.position.x;
			mesh.position.z = shelf.position.y;
			mesh.position.y = 0.08;
			this.shelfMeshes.push(mesh);
		}
	}

	private setupInput(): void {
		this.scene.onPointerObservable.add((info) => {
			if (info.type !== PointerEventTypes.POINTERDOWN) return;
			const pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
			if (!pick.hit || !pick.pickedPoint) return;

			const point = { x: pick.pickedPoint.x, y: pick.pickedPoint.z };

			const stationId = this.findStationId(pick.pickedMesh);
			if (stationId !== null) {
				this.logic.movePlayerToStation(stationId);
				return;
			}

			if (pick.pickedMesh === this.cashierMesh || this.isChildOf(pick.pickedMesh, this.cashierMesh)) {
				this.logic.movePlayerToCashier();
				return;
			}

			const shelfIndex = this.shelfMeshes.indexOf(pick.pickedMesh as Mesh);
			if (shelfIndex !== -1) {
				this.logic.movePlayerToShelf(shelfIndex);
				return;
			}

			this.logic.setPlayerTarget(point);
		});
	}

	private findStationId(mesh: import('@babylonjs/core').AbstractMesh | null): number | null {
		let current: import('@babylonjs/core').Node | null = mesh;
		while (current) {
			if (current.metadata && typeof current.metadata.stationId === 'number') {
				return current.metadata.stationId;
			}
			current = current.parent;
		}
		return null;
	}

	private isChildOf(mesh: import('@babylonjs/core').AbstractMesh | null, parent: Mesh | null): boolean {
		if (!mesh || !parent) return false;
		let current: import('@babylonjs/core').Node | null = mesh.parent;
		while (current) {
			if (current === parent) return true;
			current = current.parent;
		}
		return false;
	}

	private setupDecorativeCamel(): void {
		this.decorativeCamel = this.createAnimalMesh('camel', 0.7);
		this.decorativeCamel.root.position.set(-8, 0, 5);
		this.decorativeCamel.root.rotation.y = Math.PI / 4;
		for (const m of this.decorativeCamel.root.getChildMeshes()) {
			m.isPickable = false;
		}
	}

	private syncScene(): void {
		const state = this.lastState;
		if (!state) return;

		this.syncStations(state.stations);
		this.syncShelves(state.shelves);
		this.syncPlayer(state.player);
		this.syncWorkers(state.workers);
		this.syncCustomers(state.customers);
		this.syncCashier(state.cashierMat.queue.length);
		this.syncTemporaryDrop(state.temporaryDrop);
	}

	private syncStations(stations: Station[]): void {
		for (const station of stations) {
			const mesh = this.stationMeshes.get(station.id);
			if (!mesh) continue;

			// Show input/output item.
			let itemMesh = this.stationItemMeshes.get(station.id);
			const displayedItem = station.output || station.input;
			if (displayedItem) {
				if (!itemMesh) {
					itemMesh = this.createItemMesh(displayedItem);
					this.stationItemMeshes.set(station.id, itemMesh);
				}
				itemMesh.position.x = mesh.position.x;
				itemMesh.position.z = mesh.position.z;
				itemMesh.position.y = station.type === 'palmPlot' || station.type === 'rawResin' ? 0.35 : 0.7;
				itemMesh.setEnabled(true);
			} else if (itemMesh) {
				itemMesh.setEnabled(false);
			}

			// Highlight ready stations.
			if (station.status === 'ready') {
				this.highlight.addMesh(mesh, new Color3(1, 0.9, 0.3));
			} else {
				this.highlight.removeMesh(mesh);
			}

			// Show/hide palm date clusters based on harvest readiness.
			if (station.type === 'palmPlot') {
				const dateMeshes = this.stationDateMeshes.get(station.id);
				if (dateMeshes) {
					const showDates = station.status === 'ready' && station.output !== null;
					for (const date of dateMeshes) {
						date.setEnabled(showDates);
					}
				}
			}

			// Emit smoke/steam from active braziers and dallahs.
			if (station.type === 'brazier' || station.type === 'dallah') {
				const isWorking = station.status === 'processing' || station.output !== null;
				if (isWorking) {
					let timer = this.stationSmokeTimers.get(station.id) ?? 0;
					timer += this.engine.getDeltaTime() / 1000;
					if (timer > 0.25) {
						const color = station.type === 'brazier'
							? new Color3(0.35, 0.3, 0.28)
							: new Color3(0.9, 0.9, 0.95);
						this.spawnSmokePuff(new Vector3(mesh.position.x, 0.5, mesh.position.z), color, station.type === 'brazier' ? 1 : 0.7);
						timer = 0;
					}
					this.stationSmokeTimers.set(station.id, timer);
				}
			}
		}
	}

	private createItemMesh(item: Item): Mesh {
		if (item.type === 'dates' && (item.stage === 'dried' || item.stage === 'packed')) {
			return this.createDateBag(`item-${item.type}-${item.stage}`);
		}
		const color = this.itemColor(item);
		const mesh = this.flatShade(
			MeshBuilder.CreateSphere(`item-${item.type}-${item.stage}`, { diameter: 0.35, segments: 8 }, this.scene)
		);
		mesh.material = this.createPbrMaterial(
			`itemMat-${item.type}-${item.stage}`,
			color.toHexString(),
			{ roughness: 0.75 }
		);
		return mesh;
	}

	private createDateBag(name: string): Mesh {
		const root = this.flatShade(MeshBuilder.CreateSphere(`${name}-body`, { diameter: 0.32, segments: 8 }, this.scene));
		root.scaling.set(0.9, 1.1, 0.75);
		root.material = this.createPbrMaterial(`${name}-bagMat`, PALETTE.sandLight, { roughness: 0.95 });

		// Neck cinched at the top.
		const neck = this.flatShade(MeshBuilder.CreateCylinder(`${name}-neck`, { height: 0.12, diameterTop: 0.14, diameterBottom: 0.2, tessellation: 8 }, this.scene));
		neck.position.y = 0.16;
		neck.material = this.createPbrMaterial(`${name}-neckMat`, PALETTE.wood, { roughness: 0.95 });
		neck.parent = root;

		// Rope tie.
		const rope = this.flatShade(MeshBuilder.CreateTorus(`${name}-rope`, { diameter: 0.18, thickness: 0.025, tessellation: 8 }, this.scene));
		rope.position.y = 0.12;
		rope.rotation.x = Math.PI / 2;
		rope.material = this.createPbrMaterial(`${name}-ropeMat`, PALETTE.sandShadow, { roughness: 0.95 });
		rope.parent = root;

		return root;
	}

	private flatShade(mesh: Mesh): Mesh {
		mesh.convertToFlatShadedMesh();
		return mesh;
	}

	private addShadow(mesh: Mesh, cast = true, receive = true): Mesh {
		if (cast) this.shadowGenerator.addShadowCaster(mesh);
		if (receive) mesh.receiveShadows = true;
		return mesh;
	}

	private freezeAndShadow(mesh: Mesh): Mesh {
		mesh.freezeWorldMatrix();
		this.addShadow(mesh);
		return mesh;
	}

	private itemColor(item: Item): Color3 {
		if (item.type === 'dates') {
			if (item.stage === 'sapling') return Color3.FromHexString('#80b918');
			if (item.stage === 'fresh') return Color3.FromHexString('#ffb703');
			if (item.stage === 'drying' || item.stage === 'dried') return Color3.FromHexString('#d4a373');
			return Color3.FromHexString('#bc8a5f');
		}
		if (item.type === 'qahwa') {
			if (item.stage === 'beans') return Color3.FromHexString('#70e000');
			if (item.stage === 'roasting' || item.stage === 'roasted') return Color3.FromHexString('#bc4749');
			if (item.stage === 'ground') return Color3.FromHexString('#6f4e37');
			return Color3.FromHexString('#3d2b1f');
		}
		if (item.type === 'luban') {
			if (item.stage === 'rawResin') return Color3.FromHexString('#fff3b0');
			if (item.stage === 'sorted') return Color3.FromHexString('#ffd166');
			return Color3.FromHexString('#ffb703');
		}
		return new Color3(0.85, 0.85, 0.85);
	}

	private syncShelves(shelves: { id: number; position: { x: number; y: number }; items: Item[] }[]): void {
		for (let i = 0; i < shelves.length; i++) {
			const shelf = shelves[i];
			const mesh = this.shelfMeshes[i];
			mesh.position.x = shelf.position.x;
			mesh.position.z = shelf.position.y;

			let goodMeshes = this.shelfItemMeshes.get(i) ?? [];
			while (goodMeshes.length < shelf.items.length) {
				const goodMesh = this.createItemMesh(shelf.items[goodMeshes.length]);
				goodMeshes.push(goodMesh);
			}
			while (goodMeshes.length > shelf.items.length) {
				const removed = goodMeshes.pop();
				removed?.dispose();
			}
			for (let j = 0; j < goodMeshes.length; j++) {
				goodMeshes[j].position.x = mesh.position.x + (j % 2 === 0 ? -0.35 : 0.35);
				goodMeshes[j].position.z = mesh.position.z + (j < 2 ? -0.15 : 0.15);
				goodMeshes[j].position.y = 0.15;
				goodMeshes[j].setEnabled(true);
			}
			this.shelfItemMeshes.set(i, goodMeshes);
		}
	}

	private syncTemporaryDrop(drop: { item: Item; position: { x: number; y: number }; life: number; maxLife: number } | null): void {
		if (drop) {
			if (!this.temporaryDropItemMesh) {
				this.temporaryDropItemMesh = this.createItemMesh(drop.item);
			}
			this.temporaryDropItemMesh.setEnabled(true);
			this.temporaryDropItemMesh.position.x = drop.position.x;
			this.temporaryDropItemMesh.position.z = drop.position.y;
			this.temporaryDropItemMesh.position.y = 0.5 + Math.abs(Math.sin(this.time * 4)) * 0.1;
			this.temporaryDropItemMesh.rotation.y = this.time;

			if (!this.temporaryDropRing) {
				this.temporaryDropRing = this.flatShade(MeshBuilder.CreateCylinder('temporaryDropRing', { height: 0.02, diameter: 1, tessellation: 24 }, this.scene));
				this.temporaryDropRing.material = this.createPbrMaterial('temporaryDropRingMat', PALETTE.coin, {
					emissive: PALETTE.coin,
					unlit: true
				});
			}
			this.temporaryDropRing.setEnabled(true);
			this.temporaryDropRing.position.x = drop.position.x;
			this.temporaryDropRing.position.z = drop.position.y;
			this.temporaryDropRing.position.y = 0.05;
			const ratio = Math.max(0, drop.life / drop.maxLife);
			const scale = 0.25 + 0.75 * ratio;
			this.temporaryDropRing.scaling.x = scale;
			this.temporaryDropRing.scaling.z = scale;
			this.temporaryDropRing.scaling.y = 1;
		} else {
			this.temporaryDropItemMesh?.setEnabled(false);
			this.temporaryDropRing?.setEnabled(false);
		}
	}

	private syncPlayer(player: { position: { x: number; y: number }; target: { x: number; y: number } | null; carrying: Item | null }): void {
		if (!this.playerMesh) {
			this.playerMesh = this.createChildMesh(0.5);
		}
		this.playerMesh.root.position.x = player.position.x;
		this.playerMesh.root.position.z = player.position.y;
		this.playerMesh.root.position.y = this.walkBob(player.target !== null);

		if (player.carrying) {
			if (!this.carryingMesh) {
				this.carryingMesh = this.createItemMesh(player.carrying);
			}
			this.carryingMesh.setEnabled(true);
			this.carryingMesh.position.x = this.playerMesh.root.position.x;
			this.carryingMesh.position.z = this.playerMesh.root.position.z;
			this.carryingMesh.position.y = this.playerMesh.root.position.y + 1.1;
		} else if (this.carryingMesh) {
			this.carryingMesh.setEnabled(false);
		}
	}

	private walkBob(moving: boolean): number {
		if (!moving) return 0;
		return Math.abs(Math.sin(this.time * 10)) * 0.12;
	}

	private syncWorkers(workers: { id: number; position: { x: number; y: number }; target: { x: number; y: number } | null }[]): void {
		for (const [id, mesh] of this.workerMeshes) {
			if (!workers.find((w) => w.id === id)) {
				mesh.root.dispose();
				this.workerMeshes.delete(id);
			}
		}
		for (const worker of workers) {
			let entity = this.workerMeshes.get(worker.id);
			if (!entity) {
				entity = this.createChildMesh(0.42, new Color3(0.6, 0.8, 0.6));
				this.workerMeshes.set(worker.id, entity);
			}
			entity.root.position.x = worker.position.x;
			entity.root.position.z = worker.position.y;
			entity.root.position.y = this.walkBob(worker.target !== null);
		}
	}

	private syncCustomers(customers: { id: number; position: { x: number; y: number }; desiredGood: GoodType; state: string; target: { x: number; y: number } | null }[]): void {
		for (const [id, mesh] of this.customerMeshes) {
			if (!customers.find((c) => c.id === id)) {
				mesh.root.dispose();
				this.customerMeshes.delete(id);
				this.customerAnimals.delete(id);
			}
		}
		for (const customer of customers) {
			let entity = this.customerMeshes.get(customer.id);
			if (!entity) {
				const animal = this.pickAnimalType();
				this.customerAnimals.set(customer.id, animal);
				entity = this.createAnimalMesh(animal, 0.48);
				this.customerMeshes.set(customer.id, entity);
			}
			entity.root.position.x = customer.position.x;
			entity.root.position.z = customer.position.y;
			const moving = customer.target !== null;
			entity.root.position.y = this.walkBob(moving) + (moving ? 0 : Math.abs(Math.sin(this.time * 2)) * 0.03);
			entity.body.scaling.y = customer.state === 'paying' ? 0.9 : 1;

			// Idle part animations by animal type.
			const animal = this.customerAnimals.get(customer.id);
			const parts = entity.parts;
			if (animal && parts) {
				const t = this.time;
				const head = parts[0] as TransformNode;
				const tail = parts[1];
				switch (animal) {
					case 'camel': {
						if (head) head.rotation.x = Math.sin(t * 1.5) * 0.08;
						if (tail) tail.rotation.z = Math.sin(t * 2) * 0.12;
						break;
					}
					case 'falcon': {
						if (head) head.rotation.x = Math.sin(t * 2) * 0.06;
						const flap = moving ? Math.sin(t * 18) * 0.35 : Math.sin(t * 3) * 0.08;
						if (parts[1]) parts[1].rotation.z = 0.15 + flap;
						if (parts[2]) parts[2].rotation.z = -0.15 - flap;
						break;
					}
					case 'oryx': {
						if (head) head.rotation.x = Math.sin(t * 1.2) * 0.05;
						if (tail) tail.rotation.z = Math.sin(t * 2.5) * 0.1;
						break;
					}
					case 'fox': {
						if (head) head.rotation.y = Math.sin(t * 1.5) * 0.08;
						if (tail) tail.rotation.y = Math.sin(t * 5) * 0.25;
						break;
					}
					case 'goat': {
						if (head) head.rotation.x = Math.sin(t * 1.8) * 0.06;
						if (tail) tail.rotation.z = Math.sin(t * 4) * 0.15;
						break;
					}
					case 'sheep': {
						if (head) head.rotation.x = Math.sin(t * 1.4) * 0.05;
						if (tail) tail.rotation.z = Math.sin(t * 3) * 0.12;
						break;
					}
				}
			}
		}
	}

	private pickAnimalType(): AnimalType {
		const animals: AnimalType[] = ['camel', 'falcon', 'oryx', 'fox', 'goat', 'sheep'];
		return animals[Math.floor(Math.random() * animals.length)];
	}

	private syncCashier(queueLength: number): void {
		if (!this.cashierMesh) return;
		if (queueLength > 0) {
			this.highlight.addMesh(this.cashierMesh, new Color3(1, 0.85, 0.2));
		} else {
			this.highlight.removeMesh(this.cashierMesh);
		}
	}

	private createChildMesh(scale: number, robeColor: Color3 = new Color3(0.95, 0.95, 0.95)): EntityMesh {
		const root = new TransformNode('cat-merchant', this.scene);

		// Robe / thobe body.
		const body = this.flatShade(MeshBuilder.CreateSphere('body', { diameter: scale * 1.1, segments: 8 }, this.scene));
		body.position.y = 0.42;
		body.scaling.set(1, 1.15, 0.9);
		body.material = this.createPbrMaterial('robeMat', robeColor.toHexString(), { roughness: 0.9 });
		body.parent = root;

		// Cream cat head.
		const head = this.flatShade(MeshBuilder.CreateSphere('head', { diameter: scale * 0.72, segments: 8 }, this.scene));
		head.position.y = 0.95;
		const furMat = this.createPbrMaterial('furMat', PALETTE.merchantSkin, { roughness: 0.9 });
		head.material = furMat;
		head.parent = root;

		// Cat ears.
		const earColor = Color3.FromHexString(PALETTE.merchantSkin).scale(0.92);
		const earMat = this.createPbrMaterial('earMat', earColor.toHexString(), { roughness: 0.9 });
		for (const side of [-1, 1]) {
			const ear = this.flatShade(MeshBuilder.CreateBox(`ear${side}`, { width: 0.1, height: 0.14, depth: 0.1 }, this.scene));
			ear.position.set(side * 0.2, 1.22, 0);
			ear.rotation.z = side * -0.25;
			ear.material = earMat;
			ear.parent = root;
		}

		// Small white head cover / ghutra hint.
		const cover = this.flatShade(MeshBuilder.CreateSphere('cover', { diameter: scale * 0.78, segments: 8 }, this.scene));
		cover.position.y = 1.02;
		cover.position.z = -0.04;
		cover.scaling.set(1, 0.45, 0.95);
		cover.material = this.createPbrMaterial('coverMat', PALETTE.merchantRobe, { roughness: 0.95 });
		cover.parent = root;

		// Eyes.
		const eyeWhiteMat = this.createPbrMaterial('eyeWhiteMat', '#ffffff');
		const pupilMat = this.createPbrMaterial('pupilMat', '#2b2d42');
		for (const side of [-1, 1]) {
			const eye = this.flatShade(MeshBuilder.CreateSphere(`eye${side}`, { diameter: 0.12, segments: 6 }, this.scene));
			eye.position.set(side * 0.14, 0.98, 0.3);
			eye.material = eyeWhiteMat;
			eye.parent = root;

			const pupil = this.flatShade(MeshBuilder.CreateSphere(`pupil${side}`, { diameter: 0.06, segments: 6 }, this.scene));
			pupil.position.set(side * 0.14, 0.98, 0.35);
			pupil.material = pupilMat;
			pupil.parent = root;
		}

		// Tiny cat tail.
		const tail = this.flatShade(MeshBuilder.CreateCylinder('tail', { height: 0.36, diameterTop: 0.04, diameterBottom: 0.08, tessellation: 6 }, this.scene));
		tail.position.set(0, 0.35, -0.38);
		tail.rotation.x = -0.5;
		tail.material = furMat;
		tail.parent = root;

		// Small paws peeking from robe.
		const pawMat = this.createPbrMaterial('pawMat', PALETTE.merchantSkin, { roughness: 0.9 });
		for (const side of [-1, 1]) {
			const paw = this.flatShade(MeshBuilder.CreateSphere(`paw${side}`, { diameter: 0.12, segments: 6 }, this.scene));
			paw.position.set(side * 0.22, 0.06, 0.18);
			paw.scaling.y = 0.7;
			paw.material = pawMat;
			paw.parent = root;
		}

		return { root, body };
	}

	private createAnimalMesh(type: AnimalType, scale: number): EntityMesh {
		const root = new TransformNode(`${type}-customer`, this.scene);
		let body: Mesh;
		const mat = this.createPbrMaterial(`${type}Mat`, PALETTE[type], { roughness: 0.85 });

		const eyeWhiteMat = this.createPbrMaterial('eyeWhiteMat', '#ffffff');
		const pupilMat = this.createPbrMaterial('pupilMat', '#2b2d42');

		const addEyes = (x: number, y: number, z: number, size = 0.045) => {
			for (const side of [-1, 1]) {
				const eye = this.flatShade(MeshBuilder.CreateSphere(`${type}-eye${side}`, { diameter: size * 2, segments: 6 }, this.scene));
				eye.position.set(side * x, y, z);
				eye.material = eyeWhiteMat;
				eye.parent = root;

				const pupil = this.flatShade(MeshBuilder.CreateSphere(`${type}-pupil${side}`, { diameter: size, segments: 6 }, this.scene));
				pupil.position.set(side * x, y, z + size * 0.9);
				pupil.material = pupilMat;
				pupil.parent = root;
			}
		};

		const addFeet = (zFront: number, zBack: number, x: number, color: Color3, size = 0.07) => {
			const footMat = new StandardMaterial(`${type}-footMat`, this.scene);
			footMat.diffuseColor = color;
			for (const side of [-1, 1]) {
				for (const z of [zFront, zBack]) {
					const foot = this.flatShade(MeshBuilder.CreateSphere(`${type}-foot${side}-${z}`, { diameter: size * 2, segments: 6 }, this.scene));
					foot.position.set(side * x, size, z);
					foot.scaling.y = 0.7;
					foot.material = footMat;
					foot.parent = root;
				}
			}
		};

		switch (type) {
			case 'camel': {
				const darkCamelColor = new Color3(0.82, 0.58, 0.34);

				// Body: rounded, slightly elongated.
				body = this.flatShade(MeshBuilder.CreateSphere('camel-body', { diameter: scale * 1.25, segments: 8 }, this.scene));
				body.scaling.set(1, 0.75, 1.35);
				body.position.set(0, 0.62, -0.05);
				body.material = mat;
				body.parent = root;

				// Hump.
				const hump = this.flatShade(MeshBuilder.CreateSphere('camel-hump', { diameter: scale * 0.55, segments: 8 }, this.scene));
				hump.position.set(0, 1.02, -0.22);
				hump.scaling.set(0.85, 1, 0.85);
				hump.material = mat;
				hump.parent = root;

				// Neck: curved cylinder.
				const neck = this.flatShade(MeshBuilder.CreateCylinder('camel-neck', { height: 0.62, diameterTop: 0.14, diameterBottom: 0.22, tessellation: 7 }, this.scene));
				neck.position.set(0, 1.0, 0.42);
				neck.rotation.x = -0.55;
				neck.material = mat;
				neck.parent = root;

				// Head group for animation.
				const headGroup = new TransformNode('camel-headGroup', this.scene);
				headGroup.position.set(0, 1.28, 0.72);
				headGroup.parent = root;

				const head = this.flatShade(MeshBuilder.CreateSphere('camel-head', { diameter: scale * 0.52, segments: 8 }, this.scene));
				head.scaling.set(0.9, 0.95, 1.15);
				head.material = mat;
				head.parent = headGroup;

				// Snout.
				const snout = this.flatShade(MeshBuilder.CreateSphere('camel-snout', { diameter: 0.24, segments: 8 }, this.scene));
				snout.position.set(0, -0.05, 0.24);
				snout.scaling.set(1, 0.8, 1.1);
				const snoutMat = new StandardMaterial('camelSnoutMat', this.scene);
				snoutMat.diffuseColor = darkCamelColor;
				snout.material = snoutMat;
				snout.parent = headGroup;

				// Ears.
				const earMat = new StandardMaterial('camelEarMat', this.scene);
				earMat.diffuseColor = darkCamelColor;
				for (const side of [-1, 1]) {
					const ear = MeshBuilder.CreateBox(`camel-ear${side}`, { width: 0.08, height: 0.14, depth: 0.08 }, this.scene);
					ear.position.set(side * 0.18, 0.2, -0.05);
					ear.rotation.z = side * -0.25;
					ear.material = earMat;
					ear.parent = headGroup;
				}

				addEyes(0.12, 1.34, 0.82);

				// Tail.
				const tail = this.flatShade(MeshBuilder.CreateCylinder('camel-tail', { height: 0.36, diameterTop: 0.04, diameterBottom: 0.07, tessellation: 6 }, this.scene));
				tail.position.set(0, 0.55, -0.55);
				tail.rotation.x = 0.6;
				tail.material = mat;
				tail.parent = root;

				// Four legs with knees.
				const legMat = new StandardMaterial('camelLegMat', this.scene);
				legMat.diffuseColor = darkCamelColor;
				const legPositions = [
					{ x: -0.28, z: 0.32 },
					{ x: 0.28, z: 0.32 },
					{ x: -0.28, z: -0.35 },
					{ x: 0.28, z: -0.35 }
				];
				for (let i = 0; i < legPositions.length; i++) {
					const pos = legPositions[i];
					const upper = this.flatShade(MeshBuilder.CreateCylinder(`camel-legUpper${i}`, { height: 0.35, diameter: 0.14, tessellation: 6 }, this.scene));
					upper.position.set(pos.x, 0.38, pos.z);
					upper.material = legMat;
					upper.parent = root;

					const lower = this.flatShade(MeshBuilder.CreateCylinder(`camel-legLower${i}`, { height: 0.32, diameter: 0.11, tessellation: 6 }, this.scene));
					lower.position.set(pos.x, 0.12, pos.z + 0.02);
					lower.material = legMat;
					lower.parent = root;

					const foot = MeshBuilder.CreateBox(`camel-foot${i}`, { width: 0.13, height: 0.06, depth: 0.18 }, this.scene);
					foot.position.set(pos.x, 0.03, pos.z + 0.04);
					foot.material = legMat;
					foot.parent = root;
				}

				return { root, body, parts: [headGroup, tail] };
			}
			case 'falcon': {
				const parts: (Mesh | TransformNode)[] = [];
				const falconCream = new Color3(0.95, 0.86, 0.68);

				// Sleek teardrop body.
				body = this.flatShade(MeshBuilder.CreateSphere('falcon-body', { diameter: scale * 1.1, segments: 8 }, this.scene));
				body.scaling.set(0.85, 0.9, 1.35);
				body.position.set(0, 0.58, 0);
				body.material = mat;
				body.parent = root;

				// Cream belly patch.
				const belly = this.flatShade(MeshBuilder.CreateSphere('falcon-belly', { diameter: scale * 0.85, segments: 8 }, this.scene));
				belly.scaling.set(0.7, 0.75, 1.2);
				belly.position.set(0, 0.52, 0.04);
				const bellyMat = new StandardMaterial('falconBellyMat', this.scene);
				bellyMat.diffuseColor = falconCream;
				belly.material = bellyMat;
				belly.parent = root;

				// Head group for subtle bob.
				const headGroup = new TransformNode('falcon-headGroup', this.scene);
				headGroup.position.set(0, 0.82, 0.52);
				headGroup.parent = root;
				parts.push(headGroup);

				const head = this.flatShade(MeshBuilder.CreateSphere('falcon-head', { diameter: scale * 0.55, segments: 8 }, this.scene));
				head.scaling.set(0.85, 0.9, 1.1);
				head.material = mat;
				head.parent = headGroup;

				// Small falconry-style leather cap as cultural accessory.
				const cap = this.flatShade(MeshBuilder.CreateSphere('falcon-cap', { diameter: scale * 0.48, segments: 8 }, this.scene));
				cap.position.set(0, 0.08, -0.02);
				cap.scaling.set(0.92, 0.35, 0.95);
				const capMat = new StandardMaterial('falconCapMat', this.scene);
				capMat.diffuseColor = new Color3(0.55, 0.35, 0.2);
				cap.material = capMat;
				cap.parent = headGroup;

				// Hooked beak.
				const beakMat = new StandardMaterial('falconBeakMat', this.scene);
				beakMat.diffuseColor = new Color3(0.95, 0.75, 0.15);
				const beak = this.flatShade(MeshBuilder.CreateCylinder('falcon-beak', { height: 0.22, diameterTop: 0, diameterBottom: 0.12, tessellation: 7 }, this.scene));
				beak.position.set(0, -0.02, 0.32);
				beak.rotation.x = Math.PI / 2;
				beak.material = beakMat;
				beak.parent = headGroup;

				const beakHook = MeshBuilder.CreateBox('falcon-beakHook', { width: 0.06, height: 0.08, depth: 0.08 }, this.scene);
				beakHook.position.set(0, -0.08, 0.42);
				beakHook.material = beakMat;
				beakHook.parent = headGroup;

				addEyes(0.11, 0.06, 0.22, 0.05);

				// Wing planes with feather panels.
				const wingMat = new StandardMaterial('falconWingMat', this.scene);
				wingMat.diffuseColor = new Color3(0.62, 0.4, 0.22);
				for (const side of [-1, 1]) {
					const wing = MeshBuilder.CreateBox(`falcon-wing${side}`, { width: 0.52, height: 0.05, depth: 0.34 }, this.scene);
					wing.position.set(side * 0.4, 0.62, -0.05);
					wing.rotation.z = side * 0.15;
					wing.material = wingMat;
					wing.parent = root;
					parts.push(wing);

					for (let i = 0; i < 3; i++) {
						const feather = MeshBuilder.CreateBox(`falcon-feather${side}-${i}`, { width: 0.1, height: 0.04, depth: 0.18 }, this.scene);
						feather.position.set(side * (0.55 + i * 0.08), 0.62, -0.2 - i * 0.05);
						feather.rotation.z = side * (0.25 + i * 0.05);
						feather.material = wingMat;
						feather.parent = root;
					}
				}

				// Fan tail.
				const tailMat = new StandardMaterial('falconTailMat', this.scene);
				tailMat.diffuseColor = falconCream;
				for (let i = 0; i < 3; i++) {
					const tailFeather = MeshBuilder.CreateBox(`falcon-tail${i}`, { width: 0.08, height: 0.04, depth: 0.28 }, this.scene);
					tailFeather.position.set((i - 1) * 0.08, 0.55, -0.55);
					tailFeather.rotation.x = 0.25;
					tailFeather.material = tailMat;
					tailFeather.parent = root;
				}

				addFeet(0.18, 0.1, 0.14, new Color3(0.9, 0.7, 0.25), 0.07);
				return { root, body, parts };
			}
			case 'oryx': {
				const parts: (Mesh | TransformNode)[] = [];
				const oryxDark = new Color3(0.3, 0.22, 0.18);

				// Elegant slender body.
				body = this.flatShade(MeshBuilder.CreateSphere('oryx-body', { diameter: scale * 1.15, segments: 8 }, this.scene));
				body.scaling.set(0.85, 0.9, 1.45);
				body.position.set(0, 0.62, 0);
				body.material = mat;
				body.parent = root;

				// Dark chest band.
				const chest = MeshBuilder.CreateBox('oryx-chest', { width: 0.55, height: 0.06, depth: 0.35 }, this.scene);
				chest.position.set(0, 0.58, 0.42);
				const chestMat = new StandardMaterial('oryxChestMat', this.scene);
				chestMat.diffuseColor = oryxDark;
				chest.material = chestMat;
				chest.parent = root;

				// Long neck and head group.
				const neck = this.flatShade(MeshBuilder.CreateCylinder('oryx-neck', { height: 0.55, diameterTop: 0.1, diameterBottom: 0.16, tessellation: 8 }, this.scene));
				neck.position.set(0, 0.92, 0.45);
				neck.rotation.x = -0.35;
				neck.material = mat;
				neck.parent = root;

				const headGroup = new TransformNode('oryx-headGroup', this.scene);
				headGroup.position.set(0, 1.18, 0.62);
				headGroup.parent = root;
				parts.push(headGroup);

				const head = this.flatShade(MeshBuilder.CreateSphere('oryx-head', { diameter: scale * 0.48, segments: 8 }, this.scene));
				head.scaling.set(0.8, 0.9, 1.15);
				head.material = mat;
				head.parent = headGroup;

				// Dark face mask.
				const mask = this.flatShade(MeshBuilder.CreateSphere('oryx-mask', { diameter: scale * 0.38, segments: 8 }, this.scene));
				mask.position.set(0, -0.05, 0.18);
				mask.scaling.set(0.75, 0.7, 0.55);
				const maskMat = new StandardMaterial('oryxMaskMat', this.scene);
				maskMat.diffuseColor = oryxDark;
				mask.material = maskMat;
				mask.parent = headGroup;

				addEyes(0.1, 0.04, 0.22, 0.045);

				// Long straight black horns.
				const hornMat = new StandardMaterial('oryxHornMat', this.scene);
				hornMat.diffuseColor = new Color3(0.15, 0.12, 0.1);
				for (const side of [-1, 1]) {
					const horn = this.flatShade(MeshBuilder.CreateCylinder(`oryx-horn${side}`, { height: 0.8, diameterTop: 0.03, diameterBottom: 0.06, tessellation: 8 }, this.scene));
					horn.position.set(side * 0.14, 0.36, -0.05);
					horn.rotation.x = -0.45;
					horn.rotation.z = side * 0.25;
					horn.material = hornMat;
					horn.parent = headGroup;
				}

				// Slender legs with dark lower legs.
				const legMat = this.createPbrMaterial('oryxLegMat', PALETTE.oryx);
				const lowerLegMat = this.createPbrMaterial('oryxLowerLegMat', oryxDark.toHexString());
				const legPositions = [
					{ x: -0.24, z: 0.3 },
					{ x: 0.24, z: 0.3 },
					{ x: -0.24, z: -0.35 },
					{ x: 0.24, z: -0.35 }
				];
				for (let i = 0; i < legPositions.length; i++) {
					const pos = legPositions[i];
					const upper = this.flatShade(MeshBuilder.CreateCylinder(`oryx-legUpper${i}`, { height: 0.38, diameter: 0.1, tessellation: 8 }, this.scene));
					upper.position.set(pos.x, 0.4, pos.z);
					upper.material = legMat;
					upper.parent = root;

					const lower = this.flatShade(MeshBuilder.CreateCylinder(`oryx-legLower${i}`, { height: 0.32, diameter: 0.08, tessellation: 8 }, this.scene));
					lower.position.set(pos.x, 0.16, pos.z);
					lower.material = lowerLegMat;
					lower.parent = root;
				}

				// Small tail.
				const tail = this.flatShade(MeshBuilder.CreateCylinder('oryx-tail', { height: 0.25, diameterTop: 0.04, diameterBottom: 0.08, tessellation: 8 }, this.scene));
				tail.position.set(0, 0.55, -0.58);
				tail.rotation.x = 0.5;
				tail.material = mat;
				tail.parent = root;
				parts.push(tail);

				addFeet(0.15, -0.18, 0.16, new Color3(0.2, 0.15, 0.12), 0.06);
				return { root, body, parts };
			}
			case 'fox': {
				const parts: (Mesh | TransformNode)[] = [];
				const foxWhite = new Color3(0.98, 0.94, 0.88);
				const foxBlack = new Color3(0.15, 0.12, 0.1);

				// Compact body.
				body = this.flatShade(MeshBuilder.CreateSphere('fox-body', { diameter: scale, segments: 8 }, this.scene));
				body.scaling.set(0.95, 0.9, 1.35);
				body.position.set(0, 0.48, 0);
				body.material = mat;
				body.parent = root;

				// White chest.
				const chest = this.flatShade(MeshBuilder.CreateSphere('fox-chest', { diameter: scale * 0.65, segments: 8 }, this.scene));
				chest.scaling.set(0.8, 0.8, 1.1);
				chest.position.set(0, 0.42, 0.28);
				const chestMat = new StandardMaterial('foxChestMat', this.scene);
				chestMat.diffuseColor = foxWhite;
				chest.material = chestMat;
				chest.parent = root;

				// Head group.
				const headGroup = new TransformNode('fox-headGroup', this.scene);
				headGroup.position.set(0, 0.78, 0.52);
				headGroup.parent = root;
				parts.push(headGroup);

				const head = this.flatShade(MeshBuilder.CreateSphere('fox-head', { diameter: scale * 0.55, segments: 8 }, this.scene));
				head.scaling.set(0.85, 0.85, 1.05);
				head.material = mat;
				head.parent = headGroup;

				// Pointy snout.
				const snout = this.flatShade(MeshBuilder.CreateCylinder('fox-snout', { height: 0.22, diameterTop: 0.08, diameterBottom: 0.16, tessellation: 8 }, this.scene));
				snout.position.set(0, -0.05, 0.32);
				snout.rotation.x = Math.PI / 2;
				const snoutMat = new StandardMaterial('foxSnoutMat', this.scene);
				snoutMat.diffuseColor = foxWhite;
				snout.material = snoutMat;
				snout.parent = headGroup;

				const nose = this.flatShade(MeshBuilder.CreateSphere('fox-nose', { diameter: 0.08, segments: 8 }, this.scene));
				nose.position.set(0, -0.05, 0.44);
				nose.material = this.createPbrMaterial('foxNoseMat', foxBlack.toHexString());
				nose.parent = headGroup;

				addEyes(0.12, 0.06, 0.22, 0.05);

				// Big triangular ears with black tips.
				const earMat = this.createPbrMaterial('foxEarMat', PALETTE.fox);
				const earTipMat = this.createPbrMaterial('foxEarTipMat', foxBlack.toHexString());
				for (const side of [-1, 1]) {
					const ear = this.flatShade(MeshBuilder.CreateCylinder(`fox-ear${side}`, { height: 0.28, diameterTop: 0, diameterBottom: 0.16, tessellation: 8 }, this.scene));
					ear.position.set(side * 0.18, 0.28, 0.05);
					ear.rotation.x = -0.15;
					ear.rotation.z = side * 0.2;
					ear.material = earMat;
					ear.parent = headGroup;

					const tip = this.flatShade(MeshBuilder.CreateCylinder(`fox-earTip${side}`, { height: 0.1, diameterTop: 0, diameterBottom: 0.09, tessellation: 8 }, this.scene));
					tip.position.set(side * 0.18, 0.42, 0.02);
					tip.rotation.x = -0.15;
					tip.rotation.z = side * 0.2;
					tip.material = earTipMat;
					tip.parent = headGroup;
				}

				// Bushy tail with white tip.
				const tail = this.flatShade(MeshBuilder.CreateCylinder('fox-tail', { height: 0.55, diameterTop: 0.08, diameterBottom: 0.24, tessellation: 8 }, this.scene));
				tail.position.set(0, 0.5, -0.55);
				tail.rotation.x = -0.7;
				tail.material = mat;
				tail.parent = root;
				parts.push(tail);

				const tailTip = this.flatShade(MeshBuilder.CreateSphere('fox-tailTip', { diameter: 0.16, segments: 8 }, this.scene));
				tailTip.position.set(0, 0.78, -0.78);
				tailTip.material = this.createPbrMaterial('foxTailTipMat', foxWhite.toHexString());
				tailTip.parent = root;

				addFeet(0.14, -0.14, 0.16, new Color3(0.85, 0.42, 0.18), 0.07);
				return { root, body, parts };
			}
			case 'goat': {
				const parts: (Mesh | TransformNode)[] = [];
				const goatHorn = new Color3(0.45, 0.4, 0.36);

				// Sturdy compact body.
				body = this.flatShade(MeshBuilder.CreateSphere('goat-body', { diameter: scale * 1.1, segments: 8 }, this.scene));
				body.scaling.set(0.95, 0.95, 1.25);
				body.position.set(0, 0.5, 0);
				body.material = mat;
				body.parent = root;

				// Head group.
				const headGroup = new TransformNode('goat-headGroup', this.scene);
				headGroup.position.set(0, 0.86, 0.46);
				headGroup.parent = root;
				parts.push(headGroup);

				const head = this.flatShade(MeshBuilder.CreateSphere('goat-head', { diameter: scale * 0.52, segments: 8 }, this.scene));
				head.scaling.set(0.85, 0.95, 1);
				head.material = mat;
				head.parent = headGroup;

				// Snout.
				const snout = this.flatShade(MeshBuilder.CreateSphere('goat-snout', { diameter: 0.2, segments: 8 }, this.scene));
				snout.position.set(0, -0.08, 0.24);
				snout.scaling.set(0.9, 0.8, 1.3);
				const snoutMat = new StandardMaterial('goatSnoutMat', this.scene);
				snoutMat.diffuseColor = new Color3(0.8, 0.75, 0.65);
				snout.material = snoutMat;
				snout.parent = headGroup;

				addEyes(0.11, 0.04, 0.18, 0.045);

				// Curved horns.
				const hornMat = new StandardMaterial('goatHornMat', this.scene);
				hornMat.diffuseColor = goatHorn;
				for (const side of [-1, 1]) {
					const horn = this.flatShade(MeshBuilder.CreateTorus(`goat-horn${side}`, { diameter: 0.35, thickness: 0.05, tessellation: 8 }, this.scene));
					horn.position.set(side * 0.16, 0.26, 0.02);
					horn.rotation.y = side * 0.4;
					horn.rotation.x = 0.4;
					horn.material = hornMat;
					horn.parent = headGroup;
				}

				// Bell around neck.
				const bell = this.flatShade(MeshBuilder.CreateSphere('goat-bell', { diameter: 0.14, segments: 8 }, this.scene));
				bell.position.set(0, -0.32, 0.1);
				const bellMat = new StandardMaterial('goatBellMat', this.scene);
				bellMat.diffuseColor = new Color3(0.95, 0.8, 0.1);
				bell.material = bellMat;
				bell.parent = headGroup;

				// Small beard.
				const beard = this.flatShade(MeshBuilder.CreateSphere('goat-beard', { diameter: 0.12, segments: 8 }, this.scene));
				beard.position.set(0, -0.28, 0.22);
				const beardMat = new StandardMaterial('goatBeardMat', this.scene);
				beardMat.diffuseColor = new Color3(0.98, 0.98, 0.96);
				beard.material = beardMat;
				beard.parent = headGroup;

				// Short tail.
				const tail = this.flatShade(MeshBuilder.CreateCylinder('goat-tail', { height: 0.18, diameter: 0.08, tessellation: 8 }, this.scene));
				tail.position.set(0, 0.55, -0.48);
				tail.rotation.x = 0.5;
				tail.material = mat;
				tail.parent = root;
				parts.push(tail);

				addFeet(0.15, -0.15, 0.17, new Color3(0.5, 0.45, 0.4), 0.07);
				return { root, body, parts };
			}
			case 'sheep': {
				const parts: (Mesh | TransformNode)[] = [];
				const sheepSkin = new Color3(0.25, 0.2, 0.18);

				// Fluffy wool body built from overlapping spheres.
				body = this.flatShade(MeshBuilder.CreateSphere('sheep-body', { diameter: scale * 1.15, segments: 8 }, this.scene));
				body.position.set(0, 0.55, 0);
				body.material = mat;
				body.parent = root;

				const woolPositions = [
					{ x: 0, y: 0.55, z: 0 },
					{ x: -0.28, y: 0.55, z: 0 },
					{ x: 0.28, y: 0.55, z: 0 },
					{ x: 0, y: 0.78, z: 0 },
					{ x: 0, y: 0.55, z: -0.32 },
					{ x: 0, y: 0.55, z: 0.28 }
				];
				for (let i = 0; i < woolPositions.length; i++) {
					const puff = this.flatShade(MeshBuilder.CreateSphere(`sheep-puff${i}`, { diameter: scale * 0.55, segments: 8 }, this.scene));
					puff.position.set(woolPositions[i].x, woolPositions[i].y, woolPositions[i].z);
					puff.material = mat;
					puff.parent = root;
				}

				// Black face.
				const headGroup = new TransformNode('sheep-headGroup', this.scene);
				headGroup.position.set(0, 0.78, 0.46);
				headGroup.parent = root;
				parts.push(headGroup);

				const head = this.flatShade(MeshBuilder.CreateSphere('sheep-head', { diameter: scale * 0.42, segments: 8 }, this.scene));
				head.material = new StandardMaterial('sheepHeadMat', this.scene);
				(head.material as StandardMaterial).diffuseColor = sheepSkin;
				head.parent = headGroup;

				// Wool cap on head.
				const headWool = this.flatShade(MeshBuilder.CreateSphere('sheep-headWool', { diameter: scale * 0.38, segments: 8 }, this.scene));
				headWool.position.set(0, 0.18, -0.05);
				headWool.scaling.set(1, 0.6, 1);
				headWool.material = mat;
				headWool.parent = headGroup;

				addEyes(0.1, 0.04, 0.18, 0.04);

				// Small black legs.
				const legMat = new StandardMaterial('sheepLegMat', this.scene);
				legMat.diffuseColor = sheepSkin;
				const legPositions = [
					{ x: -0.22, z: 0.22 },
					{ x: 0.22, z: 0.22 },
					{ x: -0.22, z: -0.22 },
					{ x: 0.22, z: -0.22 }
				];
				for (let i = 0; i < legPositions.length; i++) {
					const pos = legPositions[i];
					const leg = this.flatShade(MeshBuilder.CreateCylinder(`sheep-leg${i}`, { height: 0.45, diameter: 0.1, tessellation: 8 }, this.scene));
					leg.position.set(pos.x, 0.25, pos.z);
					leg.material = legMat;
					leg.parent = root;
				}

				// Tiny tail.
				const tail = this.flatShade(MeshBuilder.CreateSphere('sheep-tail', { diameter: 0.14, segments: 8 }, this.scene));
				tail.position.set(0, 0.55, -0.48);
				tail.material = mat;
				tail.parent = root;
				parts.push(tail);

				addFeet(0.12, -0.12, 0.14, sheepSkin, 0.06);
				return { root, body, parts };
			}
			default: {
				body = MeshBuilder.CreateSphere('fallback-body', { diameter: scale, segments: 16 }, this.scene);
				body.position.y = 0.5;
				body.material = mat;
				body.parent = root;
			}
		}

		return { root, body };
	}

	private updateCoinLabels(dt: number): void {
		for (let i = this.coinLabels.length - 1; i >= 0; i--) {
			const label = this.coinLabels[i];
			label.life -= dt;
			label.mesh.position.y += dt * 0.8;
			label.mesh.material!.alpha = Math.max(0, label.life / 1.2);
			if (label.life <= 0) {
				label.mesh.dispose();
				label.mesh.material?.dispose();
				this.coinLabels.splice(i, 1);
			}
		}
	}

	private spawnSmokePuff(position: Vector3, color: Color3, scale: number): void {
		const mesh = this.flatShade(MeshBuilder.CreateSphere(`smoke-${this.smokePuffs.length}`, { diameter: 0.18 * scale, segments: 8 }, this.scene));
		mesh.position = position.clone();
		mesh.position.x += (Math.random() - 0.5) * 0.15;
		mesh.position.z += (Math.random() - 0.5) * 0.15;
		const mat = this.createPbrMaterial(`smokeMat-${this.smokePuffs.length}`, color.toHexString(), {
			alpha: 0.5,
			roughness: 1
		});
		mesh.material = mat;
		this.smokePuffs.push({ mesh, life: 1.2, maxLife: 1.2, vy: 0.25 + Math.random() * 0.15 });
	}

	private updateSmoke(dt: number): void {
		for (let i = this.smokePuffs.length - 1; i >= 0; i--) {
			const puff = this.smokePuffs[i];
			puff.life -= dt;
			puff.mesh.position.y += puff.vy * dt;
			puff.mesh.position.x += Math.sin(this.time * 2 + i) * 0.02 * dt;
			const ratio = Math.max(0, puff.life / puff.maxLife);
			puff.mesh.scaling.setAll(1 + (1 - ratio) * 2);
			puff.mesh.material!.alpha = ratio * 0.5;
			if (puff.life <= 0) {
				puff.mesh.dispose();
				puff.mesh.material?.dispose();
				this.smokePuffs.splice(i, 1);
			}
		}
	}

	getState(): SouqManagerState | null {
		return this.lastState;
	}

	setMuted(muted: boolean): void {
		this.audio.setMuted(muted);
	}

	getMuted(): boolean {
		return this.audio.getMuted();
	}

	startLevel(level: number): void {
		this.logic.startLevel(level);
	}

	unload(): void {
		this.logic.unloadAtContext();
	}

	dropTemporarily(): void {
		this.logic.dropItemTemporarily();
	}

	restartLevel(): void {
		this.logic.restartLevel();
	}

	hireWorker(stationId: number): boolean {
		return this.logic.hireWorker(stationId);
	}

	upgradePlayerSpeed(): boolean {
		return this.logic.upgradePlayerSpeed();
	}

	upgradePlayerCapacity(): boolean {
		return this.logic.upgradePlayerCapacity();
	}

	spawnCoinPopup(position: Vector3, amount: number): void {
		const mesh = MeshBuilder.CreatePlane('coin', { size: 0.8 }, this.scene);
		mesh.billboardMode = Mesh.BILLBOARDMODE_ALL;
		mesh.position = position.clone();
		const mat = this.createPbrMaterial('coinMat', PALETTE.coin, { emissive: PALETTE.coin, unlit: true });
		mat.backFaceCulling = false;
		mesh.material = mat;
		this.coinLabels.push({ mesh, life: 1.2 });
	}

	private setupGui(): void {
		this.gui = AdvancedDynamicTexture.CreateFullscreenUI('souqUI');

		// Large, high-contrast, rounded touch button for unload/temporary-drop.
		const actionButton = Button.CreateSimpleButton('actionBtn', 'تفاعل');
		actionButton.width = '112px';
		actionButton.height = '112px';
		actionButton.cornerRadius = 56;
		actionButton.background = PALETTE.success;
		actionButton.fontSize = 24;
		actionButton.fontWeight = 'bold';
		actionButton.thickness = 0;
		actionButton.color = '#2b2d42';
		actionButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
		actionButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
		actionButton.left = '-24px';
		actionButton.top = '-24px';
		actionButton.alpha = 0.95;
		actionButton.shadowColor = '#2b2d42';
		actionButton.shadowBlur = 12;
		actionButton.shadowOffsetY = 4;
		actionButton.onPointerDownObservable.add(() => {
			const state = this.logic.getState();
			if (state.canUnloadHere) this.unload();
			else if (state.canTemporaryDrop) this.dropTemporarily();
		});
		this.gui.addControl(actionButton);
	}

	/**
	 * Reusable squish-and-stretch bounce for collectibles and interactive objects.
	 * Scales in/out horizontally while stretching vertically, then settles back.
	 */
	private squishStretchBounce(target: TransformNode | Mesh, intensity = 0.4, frames = 20): void {
		const ease = new BackEase();
		ease.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);

		const squash = Math.max(0.4, 1 - intensity * 0.55);
		const stretch = 1 + intensity;
		const mid = Math.floor(frames * 0.35);

		const createAnim = (property: string) => {
			const anim = new Animation(
				`squish-${property}`,
				property,
				60,
				Animation.ANIMATIONTYPE_FLOAT,
				Animation.ANIMATIONLOOPMODE_CONSTANT
			);
			const isY = property.endsWith('y');
			anim.setKeys([
				{ frame: 0, value: 1 },
				{ frame: mid, value: isY ? stretch : squash },
				{ frame: frames, value: 1 }
			]);
			anim.setEasingFunction(ease);
			return anim;
		};

		target.animations = [createAnim('scaling.x'), createAnim('scaling.y'), createAnim('scaling.z')];
		this.scene.beginAnimation(target, 0, frames, false);
	}

	private createConfettiTexture(): DynamicTexture {
		const tex = new DynamicTexture('confettiTex', 64, this.scene);
		const ctx = tex.getContext();
		ctx.clearRect(0, 0, 64, 64);
		ctx.fillStyle = 'white';
		ctx.beginPath();
		ctx.moveTo(32, 8);
		ctx.lineTo(56, 32);
		ctx.lineTo(32, 56);
		ctx.lineTo(8, 32);
		ctx.closePath();
		ctx.fill();
		tex.update();
		return tex;
	}

	private spawnConfetti(x: number, y: number, z: number, color: Color3, count = 24, darker = false): void {
		if (!this.confettiTexture) {
			this.confettiTexture = this.createConfettiTexture();
		}
		const ps = new ParticleSystem('confetti', count, this.scene);
		ps.particleTexture = this.confettiTexture;
		ps.emitter = new Vector3(x, y, z);
		ps.minEmitBox = new Vector3(-0.2, -0.2, -0.2);
		ps.maxEmitBox = new Vector3(0.2, 0.2, 0.2);
		ps.color1 = new Color4(color.r, color.g, color.b, 1);
		ps.color2 = new Color4(Math.min(1, color.r * 1.2), Math.min(1, color.g * 1.2), Math.min(1, color.b * 1.2), 1);
		ps.colorDead = darker
			? new Color4(0.25, 0.05, 0.05, 0)
			: new Color4(0.8, 0.65, 0.3, 0);
		ps.minSize = 0.08;
		ps.maxSize = 0.18;
		ps.minLifeTime = 0.4;
		ps.maxLifeTime = 0.9;
		ps.emitRate = 0;
		ps.manualEmitCount = count;
		ps.minEmitPower = 1.6;
		ps.maxEmitPower = 4;
		ps.direction1 = new Vector3(-0.6, 0.4, -0.6);
		ps.direction2 = new Vector3(0.6, 1.2, 0.6);
		ps.gravity = new Vector3(0, -3.5, 0);
		ps.targetStopDuration = 0.9;
		ps.disposeOnStop = true;
		ps.start();
	}

	private showFloatingText(x: number, y: number, z: number, text: string, color: string): void {
		const rect = new Rectangle();
		rect.width = '140px';
		rect.height = '46px';
		rect.thickness = 0;
		rect.linkOffsetY = -60;
		rect.alpha = 1;

		const tb = new TextBlock();
		tb.text = text;
		tb.color = color;
		tb.fontSize = 26;
		tb.fontWeight = 'bold';
		tb.outlineWidth = 3;
		tb.outlineColor = 'black';
		rect.addControl(tb);

		this.gui.addControl(rect);

		const anchor = new TransformNode('floatAnchor', this.scene);
		anchor.position = new Vector3(x, y, z);

		const dummy = MeshBuilder.CreateBox('floatDummy', { size: 0.01 }, this.scene);
		dummy.position = anchor.position.clone();
		dummy.isVisible = false;
		dummy.parent = anchor;
		rect.linkWithMesh(dummy);

		const animY = new Animation(
			'floatY',
			'position.y',
			60,
			Animation.ANIMATIONTYPE_FLOAT,
			Animation.ANIMATIONLOOPMODE_CONSTANT
		);
		animY.setKeys([
			{ frame: 0, value: y },
			{ frame: 60, value: y + 1.2 }
		]);

		const animA = new Animation(
			'floatA',
			'alpha',
			60,
			Animation.ANIMATIONTYPE_FLOAT,
			Animation.ANIMATIONLOOPMODE_CONSTANT
		);
		animA.setKeys([
			{ frame: 0, value: 1 },
			{ frame: 60, value: 0 }
		]);

		anchor.animations = [animY];
		rect.animations = [animA];
		this.scene.beginAnimation(anchor, 0, 60, false);
		this.scene.beginAnimation(rect, 0, 60, false, 1, () => {
			rect.dispose();
			anchor.dispose();
			dummy.dispose();
		});
	}

	private checkPerformance(dt: number): void {
		if (this.performanceReduced) return;
		const fps = this.engine.getFps();
		if (fps < 30) {
			this.lowFpsAccumulator += dt;
			if (this.lowFpsAccumulator > 3) {
				this.reducePerformance();
			}
		} else {
			this.lowFpsAccumulator = Math.max(0, this.lowFpsAccumulator - dt);
		}
	}

	private reducePerformance(): void {
		this.performanceReduced = true;
		this.shadowGenerator?.getShadowMap()?.resize(1024);
		this.pipeline.bloomEnabled = false;
		this.engine.setHardwareScalingLevel(1.25);
		// eslint-disable-next-line no-console
		console.warn('SouqManager: reduced visual quality for performance.');
	}

	static async loadModel(path: string, scene: Scene): Promise<TransformNode | null> {
		try {
			const result = await SceneLoader.ImportMeshAsync('', path, '', scene);
			if (!result.meshes.length) return null;
			const root = new TransformNode('model-root', scene);
			for (const mesh of result.meshes) {
				if (mesh.parent) continue;
				mesh.parent = root;
				if (mesh instanceof Mesh) {
					mesh.convertToFlatShadedMesh();
					mesh.freezeWorldMatrix();
				}
			}
			return root;
		} catch (err) {
			// eslint-disable-next-line no-console
			console.warn('SouqManager: failed to load model', path, err);
			return null;
		}
	}

	dispose(): void {
		if (this.disposed) return;
		this.disposed = true;
		this.audio.stopMusic();
		window.removeEventListener('resize', this.handleResize);
		window.removeEventListener('keydown', this.handleKeydown);
		this.decorativeCamel?.root.dispose();
		this.temporaryDropMat?.dispose();
		this.temporaryDropItemMesh?.dispose();
		this.temporaryDropRing?.dispose();
		this.confettiTexture?.dispose();
		this.gui?.dispose();
		this.pipeline?.dispose();
		this.engine.dispose();
	}
}
