/**
 * Falcon Flight — Visual Upgrade Experiment
 *
 * This file contains an experimental, high-polish Babylon.js visual treatment
 * (low-poly PBR, real-time shadows, ACES tone mapping, bloom/FXAA, particles,
 * squash-and-stretch animations, Babylon.GUI touch overlay, FPS watchdog).
 *
 * It is intentionally limited to Falcon Flight while we tune performance,
 * readability, and child-friendly feel. Do NOT copy this approach to other
 * games until the experiment is approved and documented as the platform-wide
 * visual standard. See FRAMEWORK.md §10.1.7 for the experiment record.
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
	Mesh,
	TransformNode,
	PointerEventTypes,
	VertexBuffer,
	CubeTexture,
	DynamicTexture,
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
	FalconFlightLogic,
	DEFAULT_FALCON_FLIGHT_CONFIG,
	type FalconFlightState,
	type FalconFlightConfig,
	type WorldChunk,
	type WorldObject,
	type PreyType,
	type HazardType,
	type PowerUpType
} from './FalconFlightLogic';

export type { FalconFlightState };

export interface FalconFlightGameOptions {
	config?: Partial<FalconFlightConfig>;
}

const FALCON_WORLD_X = -6;

// Bright, high-contrast pastel palette tuned for children.
const PALETTE = {
	falconBody: '#f3722c',
	falconHood: '#9d4edd',
	falconWing: '#f8961e',
	falconTail: '#f8961e',
	falconBeak: '#ffd166',
	falconLegBand: '#06d6a0',
	ground: '#ffe5b4',
	sun: '#ffd60a',
	ceilingWarning: '#ff595e',
	dune: '#f4a261',
	rock: '#bc8a5f',
	trunk: '#8d5b4c',
	frond: '#70e000',
	fort: '#f9c74f',
	cloud: '#ffffff',
	hare: '#ff9f1c',
	houbara: '#f7b267',
	quail: '#a67c52',
	cliff: '#9d4edd',
	dustDevil: '#ffd166',
	vulture: '#5c4d3c',
	tailwind: '#ffd60a',
	sharperEyes: '#4cc9f0',
	secondWind: '#80ed99'
};

class FalconFlightAudio {
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
		}, 4800);
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
		// Maqam Bayati-ish phrase on D.
		const scale = [293.66, 311.13, 349.23, 392.0, 440.0, 466.16, 523.25];
		const phrase = [0, 2, 3, 2, 1, 3, 4, 3, 2, 0, 2, 3];
		const durations = [0.36, 0.28, 0.4, 0.24, 0.28, 0.36, 0.28, 0.24, 0.32, 0.28, 0.36, 0.6];
		let t = 0;
		phrase.forEach((noteIdx, i) => {
			this.playOudNote(ctx, now + t, scale[noteIdx], durations[i]);
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
		filter.frequency.setValueAtTime(1200, when);
		filter.frequency.exponentialRampToValueAtTime(550, when + 0.3);
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

	playFlap(): void {
		const ctx = this.ensureCtx();
		if (!ctx) return;
		const now = ctx.currentTime;
		const noise = ctx.createBufferSource();
		const bufferSize = ctx.sampleRate * 0.08;
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) {
			data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
		}
		noise.buffer = buffer;
		const filter = ctx.createBiquadFilter();
		filter.type = 'bandpass';
		filter.frequency.value = 300;
		filter.Q.value = 1.2;
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.04, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
		noise.connect(filter);
		filter.connect(gain);
		gain.connect(ctx.destination);
		noise.start(now);
	}

	playPreyCatch(): void {
		const ctx = this.ensureCtx();
		if (!ctx) return;
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(880, now);
		osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.05, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + 0.12);
	}

	playPowerUp(): void {
		const ctx = this.ensureCtx();
		if (!ctx) return;
		const now = ctx.currentTime;
		[523, 659, 784, 1047].forEach((freq, i) => {
			const osc = ctx.createOscillator();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(freq, now + i * 0.05);
			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.0001, now + i * 0.05);
			gain.gain.exponentialRampToValueAtTime(0.12, now + i * 0.05 + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.25);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now + i * 0.05);
			osc.stop(now + i * 0.05 + 0.3);
		});
	}

	playCollision(): void {
		const ctx = this.ensureCtx();
		if (!ctx) return;
		const now = ctx.currentTime;
		const bufferSize = ctx.sampleRate * 0.25;
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) {
			data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
		}
		const noise = ctx.createBufferSource();
		noise.buffer = buffer;
		const filter = ctx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value = 600;
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.35, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
		noise.connect(filter);
		filter.connect(gain);
		gain.connect(ctx.destination);
		noise.start(now);

		const osc = ctx.createOscillator();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(80, now);
		osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
		const oscGain = ctx.createGain();
		oscGain.gain.setValueAtTime(0.35, now);
		oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
		osc.connect(oscGain);
		oscGain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + 0.22);
	}

	playFanfare(): void {
		const ctx = this.ensureCtx();
		if (!ctx) return;
		const now = ctx.currentTime;
		[392, 523, 659, 784, 1047].forEach((freq, i) => {
			const osc = ctx.createOscillator();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(freq, now + i * 0.1);
			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.0001, now + i * 0.1);
			gain.gain.exponentialRampToValueAtTime(0.15, now + i * 0.1 + 0.03);
			gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now + i * 0.1);
			osc.stop(now + i * 0.1 + 0.55);
		});
	}
}

interface ChunkMesh {
	chunk: WorldChunk;
	root: TransformNode;
	meshes: Mesh[];
}

interface ObjectMesh {
	object: WorldObject;
	root: TransformNode;
	meshes: Mesh[];
	glow?: Mesh;
}

export class FalconFlightGame {
	private canvas: HTMLCanvasElement;
	private engine: Engine;
	private scene: Scene;
	private camera: ArcRotateCamera;
	private logic: FalconFlightLogic;
	private audio: FalconFlightAudio;
	private onChange: (state: FalconFlightState) => void;
	private config: FalconFlightConfig;

	private falconRoot!: TransformNode;
	private falconBody!: Mesh;
	private falconWings: Mesh[] = [];
	private falconTail!: Mesh;
	private falconHood!: Mesh;
	private falconLegBand!: Mesh;

	private ground!: Mesh;
	private sun!: Mesh;
	private ceilingWarning!: Mesh;
	private ceilingLine!: Mesh;
	private chunkMeshes: ChunkMesh[] = [];
	private objectMeshes: ObjectMesh[] = [];
	private particles: { mesh: Mesh; life: number; vy: number; vx: number }[] = [];

	private shadowGenerator!: ShadowGenerator;
	private pipeline!: DefaultRenderingPipeline;
	private gui!: AdvancedDynamicTexture;
	private confettiTexture: DynamicTexture | null = null;

	private inputActive = false;
	private flapTimer = 0;
	private disposed = false;
	private handleResize: () => void;
	private handleKeydown: (e: KeyboardEvent) => void;
	private handleKeyup: (e: KeyboardEvent) => void;

	private displayedScore = 0;
	private displayedEnergy = 100;

	private lowFpsAccumulator = 0;
	private performanceReduced = false;

	constructor(
		canvas: HTMLCanvasElement,
		onChange: (state: FalconFlightState) => void,
		options: FalconFlightGameOptions = {}
	) {
		this.canvas = canvas;
		this.onChange = onChange;
		this.config = { ...DEFAULT_FALCON_FLIGHT_CONFIG, ...options.config };
		this.audio = new FalconFlightAudio();

		this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
		this.scene = this.createScene();
		this.camera = this.createCamera();
		this.setupLightsAndShadows();
		this.setupEnvironment();
		this.setupPostProcess();
		this.createFalcon();
		this.setupGui();
		this.setupInput();

		this.logic = new FalconFlightLogic(
			(state) => {
				this.displayedScore = state.score;
				this.displayedEnergy = state.energy;
				this.onChange(state);
			},
			options.config,
			{
				onPreyCollected: (kind, _pos) => {
					this.audio.playPreyCatch();
					this.squishStretchBounce(this.falconRoot, 0.3);
					const state = this.logic.getState();
					const delta = state.score - this.displayedScore;
					this.spawnConfetti(0, state.falcon.y, this.preyColor(kind));
					this.showFloatingText(0, state.falcon.y + 0.5, `+${delta}`, '#ffd54f');
				},
				onPowerUpCollected: (kind, _pos) => {
					this.audio.playPowerUp();
					this.squishStretchBounce(this.falconRoot, 0.3);
					const state = this.logic.getState();
					this.spawnConfetti(0, state.falcon.y, this.powerupColor(kind));
					this.showFloatingText(0, state.falcon.y + 0.5, this.powerupLabel(kind), this.powerupHex(kind));
				},
				onHazardHit: (kind, pos) => {
					this.audio.playCollision();
					this.spawnConfetti(pos.x, pos.y, new Color3(0.7, 0.1, 0.1), 32, true);
				},
				onGameOver: () => this.audio.playFanfare()
			}
		);

		this.handleResize = () => this.engine.resize();
		window.addEventListener('resize', this.handleResize);
		this.engine.resize();

		this.handleKeydown = (e: KeyboardEvent) => {
			if (e.code === 'Space') {
				e.preventDefault();
				this.inputActive = true;
			}
		};
		this.handleKeyup = (e: KeyboardEvent) => {
			if (e.code === 'Space') {
				e.preventDefault();
				this.inputActive = false;
			}
		};
		window.addEventListener('keydown', this.handleKeydown);
		window.addEventListener('keyup', this.handleKeyup);

		this.engine.runRenderLoop(() => {
			if (this.disposed) return;
			const dt = this.engine.getDeltaTime() / 1000;
			this.update(dt);
			this.scene.render();
		});
	}

	private createScene(): Scene {
		const scene = new Scene(this.engine);
		// Crisp, kid-friendly sky tone. Fog is disabled so the whole play area stays readable.
		scene.clearColor = Color4.FromHexString('#a0d8efff');
		scene.fogMode = Scene.FOGMODE_NONE;
		return scene;
	}

	private createCamera(): ArcRotateCamera {
		const alpha = -Math.PI / 2;
		// Slightly angled top-down view: wide, stable, and easy to read.
		const beta = 1.05;
		const radius = 26;
		const camera = new ArcRotateCamera('camera', alpha, beta, radius, new Vector3(0, 5, 0), this.scene);
		camera.fov = 0.9;
		camera.lowerAlphaLimit = alpha;
		camera.upperAlphaLimit = alpha;
		camera.lowerBetaLimit = 0.85;
		camera.upperBetaLimit = 1.35;
		camera.lowerRadiusLimit = 18;
		camera.upperRadiusLimit = 34;
		camera.wheelPrecision = 0;
		camera.minZ = 0.5;
		camera.maxZ = 200;
		camera.inputs.clear();
		camera.attachControl(false);
		return camera;
	}

	private setupLightsAndShadows(): void {
		const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
		// Strong ambient fill so shadows stay bright and shapes remain readable.
		hemi.intensity = 0.95;
		hemi.diffuse = new Color3(1, 0.96, 0.88);
		hemi.groundColor = new Color3(0.9, 0.82, 0.72);

		const dir = new DirectionalLight('dir', new Vector3(-0.5, -1, 0.35), this.scene);
		dir.intensity = 1.25;
		dir.diffuse = new Color3(1, 0.88, 0.62);
		dir.position = new Vector3(-20, 30, -10);
		dir.shadowMinZ = 1;
		dir.shadowMaxZ = 80;
		(dir as DirectionalLight & { shadowFrustumSize?: number }).shadowFrustumSize = 42;

		this.shadowGenerator = new ShadowGenerator(2048, dir);
		this.shadowGenerator.useBlurExponentialShadowMap = true;
		this.shadowGenerator.useKernelBlur = true;
		this.shadowGenerator.blurKernel = 24;
		this.shadowGenerator.bias = 0.0005;
		// Lighten shadows so nothing turns pitch-black.
		this.shadowGenerator.setDarkness(0.35);
	}

	private setupEnvironment(): void {
		// Procedural environment map so the scene always has warm reflections
		// without depending on an external HDR asset.
		this.scene.environmentTexture = this.createProceduralEnvTexture(this.scene);

		// Ground plane.
		this.ground = MeshBuilder.CreateGround(
			'ground',
			{ width: 120, height: 40, subdivisions: 32 },
			this.scene
		);
		this.ground.position.z = 4;
		const positions = this.ground.getVerticesData(VertexBuffer.PositionKind);
		if (positions) {
			for (let i = 0; i < positions.length; i += 3) {
				const x = positions[i];
				const z = positions[i + 2];
				positions[i + 1] =
					Math.sin(x * 0.18) * 0.55 +
					Math.cos(z * 0.15) * 0.35 +
					Math.sin((x + z) * 0.08) * 0.2;
			}
			this.ground.updateVerticesData(VertexBuffer.PositionKind, positions);
			this.ground.refreshBoundingInfo();
		}
		this.flatShade(this.ground);
		this.ground.material = this.createPbrMaterial('groundMat', PALETTE.ground, { roughness: 1 });
		this.ground.isPickable = false;
		this.ground.receiveShadows = true;
		this.ground.freezeWorldMatrix();

		// Warm sun disc low on the horizon.
		this.sun = MeshBuilder.CreateDisc('sun', { radius: 3.2 }, this.scene);
		this.sun.position = new Vector3(10, 6, 16);
		this.flatShade(this.sun);
		this.sun.material = this.createPbrMaterial('sunMat', PALETTE.sun, {
			emissive: PALETTE.sun,
			unlit: true
		});
		this.sun.isPickable = false;
		this.sun.freezeWorldMatrix();

		// Ceiling warning zone.
		const ceilingY = this.config.ceilingY;
		this.ceilingWarning = MeshBuilder.CreateBox(
			'ceilingWarning',
			{ width: 120, height: 2.5, depth: 4 },
			this.scene
		);
		this.ceilingWarning.position = new Vector3(0, ceilingY - 1.25, 0);
		this.flatShade(this.ceilingWarning);
		this.ceilingWarning.material = this.createPbrMaterial('ceilingWarningMat', PALETTE.ceilingWarning, {
			emissive: PALETTE.ceilingWarning,
			alpha: 0.18,
			unlit: true
		});
		this.ceilingWarning.isPickable = false;
		this.ceilingWarning.freezeWorldMatrix();

		// Solid ceiling line at the very top.
		this.ceilingLine = MeshBuilder.CreateBox(
			'ceilingLine',
			{ width: 120, height: 0.25, depth: 0.5 },
			this.scene
		);
		this.ceilingLine.position = new Vector3(0, ceilingY - 0.15, 0);
		this.flatShade(this.ceilingLine);
		this.ceilingLine.material = this.createPbrMaterial('ceilingLineMat', PALETTE.ceilingWarning, {
			emissive: PALETTE.ceilingWarning,
			unlit: true
		});
		this.ceilingLine.isPickable = false;
		this.ceilingLine.freezeWorldMatrix();
	}

	private createProceduralEnvTexture(scene: Scene): CubeTexture {
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
		return new CubeTexture('', scene, null, false, urls);
	}

	private setupPostProcess(): void {
		this.pipeline = new DefaultRenderingPipeline('falconPipeline', true, this.scene, [this.camera]);
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

	private flatShade(mesh: Mesh): Mesh {
		mesh.convertToFlatShadedMesh();
		return mesh;
	}

	private createFalcon(): void {
		this.falconRoot = new TransformNode('falconRoot', this.scene);
		this.falconRoot.position.x = FALCON_WORLD_X;
		this.falconRoot.position.y = 5;

		const bodyMat = this.createPbrMaterial('bodyMat', PALETTE.falconBody, { roughness: 0.75 });
		const wingMat = this.createPbrMaterial('wingMat', PALETTE.falconWing);
		const tailMat = this.createPbrMaterial('tailMat', PALETTE.falconTail);
		const hoodMat = this.createPbrMaterial('hoodMat', PALETTE.falconHood);
		const bandMat = this.createPbrMaterial('bandMat', PALETTE.falconLegBand);
		const beakMat = this.createPbrMaterial('beakMat', PALETTE.falconBeak);

		// Body.
		this.falconBody = this.flatShade(
			MeshBuilder.CreateSphere('falconBody', { diameter: 0.9, segments: 6 }, this.scene)
		);
		this.falconBody.scaling = new Vector3(1.3, 0.85, 0.85);
		this.falconBody.material = bodyMat;
		this.falconBody.parent = this.falconRoot;
		this.shadowGenerator.addShadowCaster(this.falconBody);

		// Head.
		const head = this.flatShade(
			MeshBuilder.CreateSphere('falconHead', { diameter: 0.5, segments: 6 }, this.scene)
		);
		head.position = new Vector3(0.55, 0.15, 0);
		head.material = bodyMat;
		head.parent = this.falconRoot;
		this.shadowGenerator.addShadowCaster(head);

		// Beak.
		const beak = this.flatShade(
			MeshBuilder.CreateCylinder(
				'falconBeak',
				{ height: 0.28, diameterTop: 0, diameterBottom: 0.16, tessellation: 6 },
				this.scene
			)
		);
		beak.rotation.z = -Math.PI / 2;
		beak.position = new Vector3(0.85, 0.1, 0);
		beak.material = beakMat;
		beak.parent = this.falconRoot;
		this.shadowGenerator.addShadowCaster(beak);

		// Hood hint over the head.
		this.falconHood = this.flatShade(
			MeshBuilder.CreateSphere('falconHood', { diameter: 0.52, segments: 6 }, this.scene)
		);
		this.falconHood.position = new Vector3(0.55, 0.18, 0);
		this.falconHood.scaling = new Vector3(1, 0.85, 0.95);
		this.falconHood.material = hoodMat;
		this.falconHood.parent = this.falconRoot;
		this.shadowGenerator.addShadowCaster(this.falconHood);

		// Wings.
		for (let side = -1; side <= 1; side += 2) {
			const wing = this.flatShade(
				MeshBuilder.CreateBox(`falconWing${side}`, { width: 1.1, height: 0.08, depth: 0.55 }, this.scene)
			);
			wing.position = new Vector3(-0.05, 0.05, side * 0.55);
			wing.rotation.x = side * 0.2;
			wing.material = wingMat;
			wing.parent = this.falconRoot;
			this.falconWings.push(wing);
			this.shadowGenerator.addShadowCaster(wing);
		}

		// Fan tail.
		this.falconTail = this.flatShade(
			MeshBuilder.CreateBox('falconTail', { width: 0.7, height: 0.06, depth: 0.7 }, this.scene)
		);
		this.falconTail.position = new Vector3(-0.7, 0, 0);
		this.falconTail.rotation.y = 0.15;
		this.falconTail.material = tailMat;
		this.falconTail.parent = this.falconRoot;
		this.shadowGenerator.addShadowCaster(this.falconTail);

		// Leg band.
		this.falconLegBand = this.flatShade(
			MeshBuilder.CreateTorus('falconLegBand', { diameter: 0.18, thickness: 0.04, tessellation: 8 }, this.scene)
		);
		this.falconLegBand.position = new Vector3(0.05, -0.35, 0.15);
		this.falconLegBand.rotation.y = Math.PI / 2;
		this.falconLegBand.material = bandMat;
		this.falconLegBand.parent = this.falconRoot;
		this.shadowGenerator.addShadowCaster(this.falconLegBand);
	}

	private setupGui(): void {
		this.gui = AdvancedDynamicTexture.CreateFullscreenUI('falconUI');

		// Large, high-contrast, rounded touch button for flap/action.
		const flapButton = Button.CreateSimpleButton('flapBtn', 'رفرف');
		flapButton.width = '128px';
		flapButton.height = '128px';
		flapButton.cornerRadius = 64;
		flapButton.background = PALETTE.tailwind;
		flapButton.fontSize = 28;
		flapButton.fontWeight = 'bold';
		flapButton.thickness = 0;
		flapButton.color = '#2b2d42';
		flapButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
		flapButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
		flapButton.top = '-24px';
		flapButton.alpha = 0.95;
		flapButton.shadowColor = '#2b2d42';
		flapButton.shadowBlur = 12;
		flapButton.shadowOffsetY = 4;
		flapButton.onPointerDownObservable.add(() => {
			this.inputActive = true;
		});
		flapButton.onPointerUpObservable.add(() => {
			this.inputActive = false;
		});
		flapButton.onPointerOutObservable.add(() => {
			this.inputActive = false;
		});
		this.gui.addControl(flapButton);
	}

	private setupInput(): void {
		let pointerDown = false;
		this.scene.onPointerObservable.add((pointerInfo) => {
			if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
				pointerDown = true;
				this.inputActive = true;
			} else if (pointerInfo.type === PointerEventTypes.POINTERUP && pointerDown) {
				pointerDown = false;
				this.inputActive = false;
			} else if (pointerInfo.type === PointerEventTypes.POINTERUP) {
				this.inputActive = false;
			}
		});
	}

	startRun(): void {
		this.logic.startRun();
		this.audio.playMusic();
	}

	restart(): void {
		this.cleanupMeshes();
		this.logic.restart();
	}

	backToMenu(): void {
		this.cleanupMeshes();
		this.logic.resetToMenu();
	}

	setMuted(muted: boolean): void {
		this.audio.setMuted(muted);
	}

	getMuted(): boolean {
		return this.audio.getMuted();
	}

	private cleanupMeshes(): void {
		for (const cm of this.chunkMeshes) {
			cm.root.dispose();
		}
		this.chunkMeshes = [];
		for (const om of this.objectMeshes) {
			om.root.dispose();
		}
		this.objectMeshes = [];
		for (const p of this.particles) {
			p.mesh.dispose();
		}
		this.particles = [];
	}

	private update(dt: number): void {
		const state = this.logic.getState();

		this.logic.update(dt, { active: this.inputActive });

		this.syncFalcon(state, dt);
		this.syncChunks(state);
		this.syncObjects(state);
		this.updateCamera(state, dt);
		this.updateParticles(dt);
		this.checkPerformance(dt);
	}

	private syncFalcon(state: FalconFlightState, dt: number): void {
		this.falconRoot.position.y = state.falcon.y;

		// Tilt into dives and climbs.
		const targetRotationZ = -state.falcon.vy * 0.08;
		this.falconRoot.rotation.z = targetRotationZ;

		// Flap animation when climbing or holding input.
		if (this.inputActive && state.phase === 'playing') {
			this.flapTimer += dt * 18;
			const flap = Math.sin(this.flapTimer);
			this.falconWings[0].rotation.z = flap * 0.45;
			this.falconWings[1].rotation.z = -flap * 0.45;
			if (Math.sin(this.flapTimer) > 0.85 && Math.random() < 0.15) {
				this.audio.playFlap();
			}
		} else {
			this.flapTimer = 0;
			this.falconWings[0].rotation.z = 0.15;
			this.falconWings[1].rotation.z = -0.15;
		}
	}

	private updateCamera(state: FalconFlightState, dt: number): void {
		// Clamp the target so the falcon stays clearly visible at both the
		// ground and the ceiling without the camera ever clipping the world.
		const minTargetY = this.config.groundY + 1.5;
		const maxTargetY = this.config.ceilingY - 0.5;
		const targetY = Scalar.Clamp(state.falcon.y, minTargetY, maxTargetY);
		const target = new Vector3(0, targetY, 0);
		this.camera.target = Vector3.Lerp(this.camera.target, target, Math.min(1, dt * 4));
	}

	private syncChunks(state: FalconFlightState): void {
		// Build a lookup by id for current state chunks.
		const stateChunkIds = new Set(state.chunks.map((c) => c.id));

		// Remove meshes for chunks no longer present.
		for (let i = this.chunkMeshes.length - 1; i >= 0; i--) {
			const cm = this.chunkMeshes[i];
			if (!stateChunkIds.has(cm.chunk.id)) {
				cm.root.dispose();
				this.chunkMeshes.splice(i, 1);
			}
		}

		const existingIds = new Set(this.chunkMeshes.map((cm) => cm.chunk.id));
		for (const chunk of state.chunks) {
			if (!existingIds.has(chunk.id)) {
				this.createChunkMesh(chunk);
			}
		}

		for (const cm of this.chunkMeshes) {
			const updated = state.chunks.find((c) => c.id === cm.chunk.id);
			if (updated) {
				cm.chunk = updated;
				cm.root.position.x = FALCON_WORLD_X + updated.x;
				cm.root.position.y = updated.y;
			}
		}
	}

	private createChunkMesh(chunk: WorldChunk): void {
		const root = new TransformNode(`chunk-${chunk.id}`, this.scene);
		root.position.x = FALCON_WORLD_X + chunk.x;
		root.position.y = chunk.y;

		const meshes: Mesh[] = [];

		const sandMat = this.createPbrMaterial('sandMat', PALETTE.dune, { roughness: 1 });
		const rockMat = this.createPbrMaterial('rockMat', PALETTE.rock);
		const trunkMat = this.createPbrMaterial('trunkMat', PALETTE.trunk);
		const frondMat = this.createPbrMaterial('frondMat', PALETTE.frond);
		const fortMat = this.createPbrMaterial('fortMat', PALETTE.fort);
		const cloudMat = this.createPbrMaterial('cloudMat', PALETTE.cloud, { alpha: 0.8 });

		// Optional GLB hook: load a model for this chunk type and parent it to root.
		// const model = await FalconFlightGame.loadModel(`/models/${chunk.type}.glb`, this.scene);
		// if (model) { model.parent = root; return; }

		switch (chunk.type) {
			case 'dune': {
				const dune = this.flatShade(
					MeshBuilder.CreateSphere(`dune-${chunk.id}`, { diameter: chunk.width, segments: 5 }, this.scene)
				);
				dune.scaling.y = chunk.height / (chunk.width * 0.5);
				dune.position.y = -chunk.height * 0.25;
				dune.material = sandMat;
				dune.parent = root;
				dune.receiveShadows = true;
				meshes.push(dune);
				break;
			}
			case 'rock': {
				const rock = this.flatShade(
					MeshBuilder.CreateSphere(`rock-${chunk.id}`, { diameter: chunk.width * 0.7, segments: 4 }, this.scene)
				);
				rock.scaling = new Vector3(1, chunk.height / (chunk.width * 0.35), 0.8);
				rock.position.y = chunk.height * 0.25;
				rock.material = rockMat;
				rock.parent = root;
				rock.receiveShadows = true;
				this.shadowGenerator.addShadowCaster(rock);
				meshes.push(rock);
				break;
			}
			case 'palms': {
				for (let i = 0; i < 3; i++) {
					const palm = new TransformNode(`palm-${chunk.id}-${i}`, this.scene);
					palm.position.x = (i - 1) * 1.2;
					palm.parent = root;

					const trunk = this.flatShade(
						MeshBuilder.CreateCylinder(
							`palmTrunk-${chunk.id}-${i}`,
							{ height: chunk.height, diameterTop: 0.12, diameterBottom: 0.18, tessellation: 6 },
							this.scene
						)
					);
					trunk.position.y = chunk.height / 2;
					trunk.material = trunkMat;
					trunk.parent = palm;
					trunk.receiveShadows = true;
					this.shadowGenerator.addShadowCaster(trunk);

					for (let f = 0; f < 6; f++) {
						const frond = this.flatShade(
							MeshBuilder.CreatePlane(
								`palmFrond-${chunk.id}-${i}-${f}`,
								{ width: 0.35, height: 1.6 },
								this.scene
							)
						);
						frond.position.y = chunk.height;
						frond.rotation.y = (f / 6) * Math.PI * 2;
						frond.rotation.x = -0.4;
						frond.material = frondMat;
						frond.parent = palm;
						frond.receiveShadows = true;
					}
				}
				break;
			}
			case 'fort': {
				const body = this.flatShade(
					MeshBuilder.CreateBox(
						`fort-${chunk.id}`,
						{ width: chunk.width * 0.5, height: chunk.height, depth: chunk.width * 0.35 },
						this.scene
					)
				);
				body.position.y = chunk.height / 2;
				body.material = fortMat;
				body.parent = root;
				body.receiveShadows = true;
				this.shadowGenerator.addShadowCaster(body);
				meshes.push(body);

				const tower = this.flatShade(
					MeshBuilder.CreateCylinder(
						`fortTower-${chunk.id}`,
						{ height: chunk.height * 1.2, diameter: chunk.width * 0.25, tessellation: 6 },
						this.scene
					)
				);
				tower.position = new Vector3(chunk.width * 0.15, chunk.height * 0.6, 0);
				tower.material = fortMat;
				tower.parent = root;
				tower.receiveShadows = true;
				this.shadowGenerator.addShadowCaster(tower);
				meshes.push(tower);
				break;
			}
			case 'cloud': {
				for (let i = 0; i < 3; i++) {
					const puff = this.flatShade(
						MeshBuilder.CreateSphere(
							`cloud-${chunk.id}-${i}`,
							{ diameter: 1 + Math.random(), segments: 5 },
							this.scene
						)
					);
					puff.position = new Vector3((i - 1) * 1.2, (Math.random() - 0.5) * 0.5, 0);
					puff.material = cloudMat;
					puff.parent = root;
					meshes.push(puff);
				}
				break;
			}
		}

		this.chunkMeshes.push({ chunk, root, meshes });
	}

	private syncObjects(state: FalconFlightState): void {
		const stateObjectIds = new Set(state.objects.map((o) => o.id));

		for (let i = this.objectMeshes.length - 1; i >= 0; i--) {
			const om = this.objectMeshes[i];
			if (!stateObjectIds.has(om.object.id)) {
				om.root.dispose();
				this.objectMeshes.splice(i, 1);
			}
		}

		const existingIds = new Set(this.objectMeshes.map((om) => om.object.id));
		for (const object of state.objects) {
			if (!existingIds.has(object.id)) {
				this.createObjectMesh(object);
			}
		}

		for (const om of this.objectMeshes) {
			const updated = state.objects.find((o) => o.id === om.object.id);
			if (updated) {
				const wasActive = om.object.active;
				om.object = updated;
				om.root.position.x = FALCON_WORLD_X + updated.x;
				om.root.position.y = updated.y;

				// Pulsing glow for prey when Sharper Eyes is active.
				if (om.glow) {
					const visible = state.sharperEyesTimer > 0 && updated.category === 'prey';
					om.glow.setEnabled(visible);
					if (visible) {
						const s = 1 + Math.sin(performance.now() * 0.008) * 0.15;
						om.glow.scaling.setAll(s);
					}
				}

				// Spawn sparkle on collection.
				if (wasActive && !updated.active) {
					this.spawnSparkles(updated.x, updated.y);
				}
			}
		}
	}

	private createObjectMesh(object: WorldObject): void {
		const root = new TransformNode(`object-${object.id}`, this.scene);
		root.position.x = FALCON_WORLD_X + object.x;
		root.position.y = object.y;

		const meshes: Mesh[] = [];

		// Optional GLB hook: load a model for this object kind and parent it to root.
		// const model = await FalconFlightGame.loadModel(`/models/${object.kind}.glb`, this.scene);
		// if (model) { model.parent = root; return; }

		if (object.category === 'prey') {
			const kind = object.kind as PreyType;
			const mat = this.createPbrMaterial(`preyMat-${object.id}`, PALETTE[kind]);

			const body = this.flatShade(
				MeshBuilder.CreateSphere(`preyBody-${object.id}`, { diameter: 0.7, segments: 5 }, this.scene)
			);
			body.scaling = new Vector3(1.1, 0.75, 0.8);
			body.material = mat;
			body.parent = root;
			body.receiveShadows = true;
			this.shadowGenerator.addShadowCaster(body);
			meshes.push(body);

			// Glow ring for Sharper Eyes.
			const glow = MeshBuilder.CreateSphere(`preyGlow-${object.id}`, { diameter: 1.3, segments: 8 }, this.scene);
			glow.material = this.createPbrMaterial(`preyGlowMat-${object.id}`, PALETTE.sun, {
				emissive: PALETTE.sun,
				alpha: 0.25,
				unlit: true
			});
			glow.parent = root;
			glow.setEnabled(false);

			this.objectMeshes.push({ object, root, meshes, glow });
			this.squishStretchBounce(root, 0.35);
			return;
		}

		if (object.category === 'hazard') {
			const kind = object.kind as HazardType;
			if (kind === 'cliff') {
				const cliff = this.flatShade(
					MeshBuilder.CreateBox(`hazard-${object.id}`, { width: 1.2, height: 2.4, depth: 0.8 }, this.scene)
				);
				cliff.material = this.createPbrMaterial(`hazardMat-${object.id}`, PALETTE.cliff);
				cliff.parent = root;
				cliff.receiveShadows = true;
				this.shadowGenerator.addShadowCaster(cliff);
				meshes.push(cliff);
			} else if (kind === 'dustDevil') {
				const swirl = this.flatShade(
					MeshBuilder.CreateCylinder(
						`hazard-${object.id}`,
						{ height: 2.2, diameterTop: 0.3, diameterBottom: 1.2, tessellation: 8 },
						this.scene
					)
				);
				swirl.material = this.createPbrMaterial(`hazardMat-${object.id}`, PALETTE.dustDevil, { alpha: 0.55 });
				swirl.parent = root;
				meshes.push(swirl);
			} else if (kind === 'vulture') {
				const body = this.flatShade(
					MeshBuilder.CreateSphere(`hazard-${object.id}`, { diameter: 0.6, segments: 5 }, this.scene)
				);
				body.scaling = new Vector3(1.2, 0.7, 0.6);
				body.material = this.createPbrMaterial(`hazardMat-${object.id}`, PALETTE.vulture);
				body.parent = root;
				body.receiveShadows = true;
				this.shadowGenerator.addShadowCaster(body);
				meshes.push(body);
				for (let s = -1; s <= 1; s += 2) {
					const wing = this.flatShade(
						MeshBuilder.CreateBox(`vultureWing-${object.id}-${s}`, { width: 0.8, height: 0.04, depth: 0.35 }, this.scene)
					);
					wing.position.z = s * 0.5;
					wing.rotation.x = s * 0.3;
					wing.material = this.createPbrMaterial(`vultureWingMat-${object.id}-${s}`, PALETTE.vulture);
					wing.parent = root;
					meshes.push(wing);
				}
			} else {
				const draft = this.flatShade(
					MeshBuilder.CreateCylinder(
						`hazard-${object.id}`,
						{ height: 2.4, diameterTop: 1.2, diameterBottom: 0.3, tessellation: 8 },
						this.scene
					)
				);
				draft.material = this.createPbrMaterial(`hazardMat-${object.id}`, PALETTE.dustDevil, { alpha: 0.55 });
				draft.parent = root;
				meshes.push(draft);
			}
			this.objectMeshes.push({ object, root, meshes });
			this.squishStretchBounce(root, 0.3);
			return;
		}

		if (object.category === 'powerup') {
			const kind = object.kind as PowerUpType;
			const color = PALETTE[kind];
			const mat = this.createPbrMaterial(`powerupMat-${object.id}`, color, {
				emissive: color
			});
			const orb = this.flatShade(
				MeshBuilder.CreateSphere(`powerup-${object.id}`, { diameter: 0.8, segments: 6 }, this.scene)
			);
			orb.material = mat;
			orb.parent = root;
			meshes.push(orb);
			this.objectMeshes.push({ object, root, meshes });
			this.squishStretchBounce(root, 0.4);
		}
	}

	private spawnSparkles(x: number, y: number): void {
		for (let i = 0; i < 6; i++) {
			const spark = MeshBuilder.CreateSphere(`spark-${Date.now()}-${i}`, { diameter: 0.12, segments: 4 }, this.scene);
			spark.position = new Vector3(FALCON_WORLD_X + x, y, 0);
			spark.material = this.createPbrMaterial(`sparkMat-${Date.now()}-${i}`, PALETTE.sun, {
				emissive: PALETTE.sun,
				unlit: true
			});
			const angle = (i / 6) * Math.PI * 2;
			this.particles.push({
				mesh: spark,
				life: 0.4,
				vy: Math.sin(angle) * 2,
				vx: Math.cos(angle) * 2
			});
		}
	}

	private updateParticles(dt: number): void {
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.life -= dt;
			p.mesh.position.x += p.vx * dt;
			p.mesh.position.y += p.vy * dt;
			p.mesh.scaling.setAll(Math.max(0.1, p.life * 2));
			if (p.life <= 0) {
				p.mesh.dispose();
				this.particles.splice(i, 1);
			}
		}
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

	private spawnConfetti(x: number, y: number, color: Color3, count = 24, darker = false): void {
		if (!this.confettiTexture) {
			this.confettiTexture = this.createConfettiTexture();
		}
		const ps = new ParticleSystem('confetti', count, this.scene);
		ps.particleTexture = this.confettiTexture;
		ps.emitter = new Vector3(FALCON_WORLD_X + x, y, 0);
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

	private showFloatingText(x: number, y: number, text: string, color: string): void {
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
		anchor.position = new Vector3(FALCON_WORLD_X + x, y, 0);

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
			{ frame: 60, value: y + 2 }
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

	private preyColor(kind: PreyType): Color3 {
		return Color3.FromHexString(PALETTE[kind]);
	}

	private powerupColor(kind: PowerUpType): Color3 {
		return Color3.FromHexString(PALETTE[kind]);
	}

	private powerupHex(kind: PowerUpType): string {
		return PALETTE[kind];
	}

	private powerupLabel(kind: PowerUpType): string {
		switch (kind) {
			case 'tailwind':
				return 'رياح مواتية';
			case 'sharperEyes':
				return 'عين حادة';
			case 'secondWind':
				return 'نسيم ثانٍ';
		}
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
		console.warn('FalconFlight: reduced visual quality for performance.');
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
			console.warn('FalconFlight: failed to load model', path, err);
			return null;
		}
	}

	dispose(): void {
		this.disposed = true;
		this.cleanupMeshes();
		this.audio.stopMusic();
		this.confettiTexture?.dispose();
		this.gui?.dispose();
		this.pipeline?.dispose();
		this.falconRoot?.dispose();
		window.removeEventListener('resize', this.handleResize);
		window.removeEventListener('keydown', this.handleKeydown);
		window.removeEventListener('keyup', this.handleKeyup);
		this.engine.dispose();
	}
}
