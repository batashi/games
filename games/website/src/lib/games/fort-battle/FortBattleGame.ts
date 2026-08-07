/**
 * Fort Battle — Visual Upgrade Experiment
 *
 * This file applies the experimental, high-polish Babylon.js visual treatment
 * first trialed in Falcon Flight (low-poly PBR, real-time shadows, ACES tone
 * mapping, bloom/FXAA, particles, squash-and-stretch animations, Babylon.GUI
 * feedback, and an FPS watchdog) to the Fort Battle gameplay prototype.
 *
 * Gameplay logic remains in FortBattleLogic.ts; this file is responsible for
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
	UniversalCamera,
	MeshBuilder,
	PBRMaterial,
	StandardMaterial,
	Mesh,
	LinesMesh,
	TransformNode,
	KeyboardEventTypes,
	PointerEventTypes,
	VertexBuffer,
	CubeTexture,
	DynamicTexture,
	Animation,
	BackEase,
	EasingFunction,
	ParticleSystem
} from '@babylonjs/core';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { ImageProcessingConfiguration } from '@babylonjs/core/Materials/imageProcessingConfiguration';
import '@babylonjs/loaders/glTF';
import { AdvancedDynamicTexture, Button, TextBlock, Rectangle, Control } from '@babylonjs/gui';
import { FortBattleLogic, type FortBattleState, type Point2D, type FortBattleConfig, type GameDifficulty, type GiftType } from './FortBattleLogic';
import { computeAIShot, type AIDifficulty } from './FortBattleAI';
import { pickRandomTheme, type FortTheme, type RGB } from './FortBattleTheme';

export type { FortBattleState, AIDifficulty, FortTheme, GameDifficulty };

export type FortBattleMode = 'hotseat' | 'ai';

export interface FortBattleGameOptions {
	mode?: FortBattleMode;
	/** Easy/medium/hard controls gift spawn rate, wind cap, and AI level. */
	difficulty?: GameDifficulty;
	/** If omitted, a random GCC country theme is picked per match. */
	theme?: FortTheme;
	/** When true, the human player's shots are power-corrected toward a hit. */
	aimAssist?: boolean;
}

// Bright, high-contrast pastel palette tuned for children.
// Country-specific theme colors (fort body/roof/ground/sky/rock/trunk/frond/mountain)
// still come from this.theme; these are the static accent colors.
const PALETTE = {
	archerP1: '#ef476f',
	archerP2: '#118ab2',
	arrowShaft: '#8d5b4c',
	arrowHead: '#ced4da',
	fletching: '#ff595e',
	turban: '#fff3b0',
	skin: '#f4a261',
	bow: '#7f5539',
	bowString: '#e9edc9',
	quiver: '#8d5b4c',
	guideDot: '#ffd166',
	windIndicator: '#ffffff',
	giftHealth: '#06d6a0',
	giftPower: '#ff9f1c',
	windowDark: '#2b2d42',
	success: '#06d6a0',
	warning: '#ef476f',
	sun: '#ffd60a'
};

export class GameAudio {
	private ctx: AudioContext | null = null;
	private muted = false;
	private musicTimer: ReturnType<typeof setInterval> | null = null;

	constructor() {}

	setMuted(muted: boolean) {
		this.muted = muted;
		if (muted) {
			this.stopMusic();
		} else {
			this.playMusic();
		}
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

	private getCtx() {
		if (!this.ctx) {
			this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
		}
		if (this.ctx.state === 'suspended') {
			this.ctx.resume();
		}
		return this.ctx;
	}

	playMusic() {
		if (this.musicTimer) return;
		this.musicTimer = setInterval(() => {
			if (this.muted) return;
			this.playMusicBar(this.getCtx());
		}, 2200);
		// Play first bar immediately.
		if (!this.muted) this.playMusicBar(this.getCtx());
	}

	stopMusic() {
		if (this.musicTimer) {
			clearInterval(this.musicTimer);
			this.musicTimer = null;
		}
	}

	private playMusicBar(ctx: AudioContext) {
		const now = ctx.currentTime;
		const barDuration = 2.0;

		// Tense low drone.
		const drone = ctx.createOscillator();
		drone.type = 'sawtooth';
		drone.frequency.setValueAtTime(65, now);
		const droneGain = ctx.createGain();
		droneGain.gain.setValueAtTime(0.025, now);
		droneGain.gain.exponentialRampToValueAtTime(0.001, now + barDuration);
		drone.connect(droneGain);
		droneGain.connect(ctx.destination);
		drone.start(now);
		drone.stop(now + barDuration);

		// Rhythmic percussion-like accents.
		const accents = [110, 82, 98, 110];
		const times = [0, 0.55, 1.1, 1.65];
		accents.forEach((freq, i) => {
			const osc = ctx.createOscillator();
			osc.type = 'square';
			osc.frequency.setValueAtTime(freq, now + times[i]);
			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.02, now + times[i]);
			gain.gain.exponentialRampToValueAtTime(0.001, now + times[i] + 0.12);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now + times[i]);
			osc.stop(now + times[i] + 0.12);
		});
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

	playPowerup() {
		const ctx = this.ensureCtx();
		if (!ctx) return;
		[523, 659, 784, 1047].forEach((freq, i) => {
			const osc = ctx!.createOscillator();
			const gain = ctx!.createGain();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(freq, ctx!.currentTime + i * 0.06);
			gain.gain.setValueAtTime(0.0001, ctx!.currentTime + i * 0.06);
			gain.gain.exponentialRampToValueAtTime(0.2, ctx!.currentTime + i * 0.06 + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx!.currentTime + i * 0.06 + 0.25);
			osc.connect(gain);
			gain.connect(ctx!.destination);
			osc.start(ctx!.currentTime + i * 0.06);
			osc.stop(ctx!.currentTime + i * 0.06 + 0.3);
		});
	}
}

export class FortBattleGame {
	private engine: Engine;
	private scene: Scene;
	private camera!: UniversalCamera;
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
	private aimGuideLine!: LinesMesh;
	private aimPlane!: Mesh;
	private giftMesh: Mesh | null = null;
	private giftGlow: Mesh | null = null;

	private audio = new GameAudio();
	private logic: FortBattleLogic;
	private onChange: (state: FortBattleState) => void;

	private mode: FortBattleMode;
	private difficulty: GameDifficulty;
	private theme: FortTheme;
	private aimAssist: boolean;
	private aiTurnTimer: ReturnType<typeof setTimeout> | null = null;
	private aiTurnActive = false;
	private aiTargetPower = 0;

	private chargeStartTime = 0;
	private pendingTurnMessage = '';
	private visualReady = false;

	private shadowGenerator!: ShadowGenerator;
	private pipeline!: DefaultRenderingPipeline;
	private gui!: AdvancedDynamicTexture;
	private confettiTexture: DynamicTexture | null = null;

	private lowFpsAccumulator = 0;
	private performanceReduced = false;

	constructor(
		canvas: HTMLCanvasElement,
		onChange: (state: FortBattleState) => void,
		options: FortBattleGameOptions = {}
	) {
		this.canvas = canvas;
		this.onChange = onChange;
		this.mode = options.mode ?? 'hotseat';
		this.difficulty = options.difficulty ?? 'medium';
		this.theme = options.theme ?? pickRandomTheme();
		this.aimAssist = options.aimAssist ?? false;

		// Create the logic first so setupEnvironment() can read its config.
		// Visual callbacks are deferred until the scene is fully built.
		this.logic = new FortBattleLogic(
			(state) => {
				this.onChange(state);
				if (this.visualReady) {
					this.onStateChanged(state);
				}
			},
			{
				difficulty: this.difficulty,
				aimAssist: this.aimAssist,
				...(this.mode === 'ai' ? { playerNames: ['اللاعب', 'الكمبيوتر'] } : {})
			},
			{
				onHit: (fortIndex, position) => this.onHit(fortIndex, position),
				onMiss: (message) => this.onMiss(message),
				onWin: (winner) => this.onWin(winner),
				onGiftCollected: (type, position) => this.onGiftCollected(type, position)
			}
		);

		this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
		this.scene = this.createScene();
		this.setupLightsAndShadows();
		this.setupPostProcess();
		this.setupEnvironment();
		this.setupGui();
		this.visualReady = true;
		this.onStateChanged(this.logic.getState());

		this.setupInput();
		this.audio.playMusic();

		this.engine.runRenderLoop(() => {
			this.update(this.engine.getDeltaTime() / 1000);
			this.scene.render();
		});

		window.addEventListener('resize', this.handleResize);
	}

	private color(rgb: RGB): Color3 {
		return new Color3(rgb.r, rgb.g, rgb.b);
	}

	private toHex(c: Color3): string {
		const r = Math.round(c.r * 255)
			.toString(16)
			.padStart(2, '0');
		const g = Math.round(c.g * 255)
			.toString(16)
			.padStart(2, '0');
		const b = Math.round(c.b * 255)
			.toString(16)
			.padStart(2, '0');
		return `#${r}${g}${b}`;
	}

	private createScene(): Scene {
		const scene = new Scene(this.engine);
		scene.clearColor = this.color(this.theme.sky).toColor4(1);
		scene.fogMode = Scene.FOGMODE_NONE;

		const camera = new UniversalCamera('camera', new Vector3(0, 16, -55), scene);
		camera.setTarget(Vector3.Zero());
		camera.inputs.clear();
		this.camera = camera;

		return scene;
	}

	private setupLightsAndShadows(): void {
		const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
		// Bright but balanced ambient fill so the light sandy palette doesn't blow out.
		hemi.intensity = 0.65;
		hemi.diffuse = new Color3(1, 0.96, 0.88);
		hemi.groundColor = new Color3(0.9, 0.82, 0.72);

		const dir = new DirectionalLight('dir', new Vector3(-0.5, -1, 0.5), this.scene);
		dir.intensity = 0.75;
		dir.diffuse = new Color3(1, 0.88, 0.62);
		dir.position = new Vector3(-20, 30, -10);
		dir.shadowMinZ = 1;
		dir.shadowMaxZ = 100;
		(dir as DirectionalLight & { shadowFrustumSize?: number }).shadowFrustumSize = 55;

		this.shadowGenerator = new ShadowGenerator(2048, dir);
		this.shadowGenerator.useBlurExponentialShadowMap = true;
		this.shadowGenerator.useKernelBlur = true;
		this.shadowGenerator.blurKernel = 24;
		this.shadowGenerator.bias = 0.0005;
		// Lighten shadows so nothing turns pitch-black.
		this.shadowGenerator.setDarkness(0.35);
	}

	private setupPostProcess(): void {
		this.pipeline = new DefaultRenderingPipeline('fortPipeline', true, this.scene, [this.camera]);
		this.pipeline.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
		this.pipeline.imageProcessing.toneMappingEnabled = true;
		this.pipeline.imageProcessing.exposure = 0.95;
		this.pipeline.imageProcessing.contrast = 1.05;
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

	private createProceduralEnvTexture(scene: Scene): CubeTexture {
		// Soft warm gray environment so albedo colors read clearly without sky tint.
		const base = '#c8c0b0';
		const faces = [base, base, base, base, base, '#e8e0d0'];
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

	private setupEnvironment(): void {
		const config = this.logic.getConfig();
		const theme = this.theme;

		// Procedural environment map so the scene always has warm reflection
		// without depending on an external HDR asset.
		this.scene.environmentTexture = this.createProceduralEnvTexture(this.scene);

		// Ground
		this.ground = MeshBuilder.CreateGround('ground', { width: 180, height: 90 }, this.scene);
		this.ground.position.y = config.GROUND_Y;
		this.flatShade(this.ground);
		this.ground.material = this.createPbrMaterial('groundMat', this.toHex(this.color(theme.ground)), {
			roughness: 1
		});
		this.ground.receiveShadows = true;
		this.ground.freezeWorldMatrix();

		// Invisible aiming plane at z=0 for mouse-to-world conversion
		this.aimPlane = MeshBuilder.CreatePlane('aimPlane', { width: 220, height: 120 }, this.scene);
		this.aimPlane.position.z = 0;
		this.aimPlane.rotation.y = Math.PI; // face camera
		this.aimPlane.isVisible = false;
		this.aimPlane.isPickable = true;

		// Forts
		for (let i = 0; i < 2; i++) {
			const x = config.FORT_X[i];
			const bodyColor = this.color(theme.fortBody);
			const roofColor = this.color(theme.fortRoof);
			const darker = bodyColor.scale(0.75);

			const root = new TransformNode(`fortRoot${i}`, this.scene);
			root.position.x = x;
			this.fortRoots.push(root);

			// Tower body
			const body = this.flatShade(
				MeshBuilder.CreateCylinder(
					`fortBody${i}`,
					{
						height: config.FORT_HEIGHT,
						diameter: config.FORT_RADIUS * 2,
						tessellation: 32
					},
					this.scene
				)
			);
			body.position.y = config.FORT_HEIGHT / 2;
			body.parent = root;
			body.material = this.createPbrMaterial(`fortMat${i}`, this.toHex(bodyColor), { roughness: 0.95 });
			body.receiveShadows = true;
			this.shadowGenerator.addShadowCaster(body);
			body.freezeWorldMatrix();

			// Country-specific roof
			this.createFortRoof(root, roofColor, config);

			// Recessed arched window near bottom
			const archFrame = this.flatShade(
				MeshBuilder.CreateTorus(
					`fortWindow${i}`,
					{
						diameter: 1.7,
						thickness: 0.22,
						tessellation: 24
					},
					this.scene
				)
			);
			archFrame.scaling.y = 1.35;
			archFrame.position = new Vector3(0, 2.3, config.FORT_RADIUS + 0.04);
			archFrame.rotation.x = Math.PI / 2;
			archFrame.parent = root;
			archFrame.material = this.createPbrMaterial(`windowFrameMat${i}`, this.toHex(darker), { roughness: 0.95 });
			archFrame.freezeWorldMatrix();
			this.shadowGenerator.addShadowCaster(archFrame);

			const archDark = this.flatShade(
				MeshBuilder.CreateSphere(`fortWindowDark${i}`, { diameter: 1.25 }, this.scene)
			);
			archDark.scaling.y = 1.3;
			archDark.position = new Vector3(0, 2.3, config.FORT_RADIUS + 0.08);
			archDark.parent = root;
			archDark.material = this.createPbrMaterial(`windowDarkMat${i}`, PALETTE.windowDark, { roughness: 1 });
			archDark.freezeWorldMatrix();

			// Invisible hit box aligned with the round body
			const hitBox = MeshBuilder.CreateCylinder(
				`fortHit${i}`,
				{
					height: config.FORT_HEIGHT,
					diameter: config.FORT_RADIUS * 2,
					tessellation: 16
				},
				this.scene
			);
			hitBox.position.y = config.FORT_HEIGHT / 2;
			hitBox.parent = root;
			hitBox.isVisible = false;
			hitBox.isPickable = false;
			this.fortHitBoxes.push(hitBox);

			// Archer on top
			this.archers.push(this.createArcher(root, i, config.FORT_HEIGHT));
		}

		// Arrow with fletching
		this.arrowRoot = new TransformNode('arrowRoot', this.scene);
		this.arrowShaft = this.flatShade(
			MeshBuilder.CreateCylinder('arrowShaft', { height: 1.8, diameter: 0.14 }, this.scene)
		);
		this.arrowShaft.rotation.z = -Math.PI / 2;
		this.arrowShaft.position.x = 0.45;
		this.arrowShaft.parent = this.arrowRoot;
		this.arrowShaft.material = this.createPbrMaterial('shaftMat', PALETTE.arrowShaft, { roughness: 0.9 });
		this.shadowGenerator.addShadowCaster(this.arrowShaft);

		this.arrowHead = this.flatShade(
			MeshBuilder.CreateCylinder(
				'arrowHead',
				{ height: 0.55, diameterTop: 0, diameterBottom: 0.32, tessellation: 5 },
				this.scene
			)
		);
		this.arrowHead.rotation.z = -Math.PI / 2;
		this.arrowHead.position.x = 1.5;
		this.arrowHead.parent = this.arrowRoot;
		this.arrowHead.material = this.createPbrMaterial('headMat', PALETTE.arrowHead, { roughness: 0.3 });
		this.shadowGenerator.addShadowCaster(this.arrowHead);

		for (let k = 0; k < 3; k++) {
			const fletch = this.flatShade(MeshBuilder.CreatePlane(`fletch${k}`, { width: 0.35, height: 0.45 }, this.scene));
			fletch.position.x = -0.55;
			fletch.rotation.x = (k * Math.PI * 2) / 3;
			fletch.rotation.y = Math.PI / 2;
			fletch.parent = this.arrowRoot;
			const fletchMat = this.createPbrMaterial(`fletchMat${k}`, PALETTE.fletching, { emissive: PALETTE.fletching });
			fletchMat.backFaceCulling = false;
			fletch.material = fletchMat;
			this.fletching.push(fletch);
		}

		this.arrowRoot.setEnabled(false);

		// Aim guide (dotted trajectory + line)
		this.aimGuideRoot = new TransformNode('aimGuideRoot', this.scene);
		const guideMat = this.createPbrMaterial('guideMat', PALETTE.guideDot, {
			emissive: PALETTE.guideDot,
			alpha: 0.85,
			unlit: true
		});

		this.aimGuideLine = MeshBuilder.CreateLines(
			'aimGuideLine',
			{
				points: [Vector3.Zero(), Vector3.Zero()],
				updatable: true
			},
			this.scene
		) as LinesMesh;
		this.aimGuideLine.color = new Color3(1, 0.95, 0.7);
		this.aimGuideLine.parent = this.aimGuideRoot;

		for (let k = 0; k < 18; k++) {
			const dot = this.flatShade(MeshBuilder.CreateSphere(`guideDot${k}`, { diameter: 0.32 }, this.scene));
			dot.material = guideMat;
			dot.parent = this.aimGuideRoot;
			this.aimGuideDots.push(dot);
		}
		this.aimGuideRoot.setEnabled(false);

		// Wind indicator (simple arrow in the sky)
		this.windIndicator = this.flatShade(
			MeshBuilder.CreateCylinder(
				'windInd',
				{ height: 2.2, diameterTop: 0, diameterBottom: 0.22, tessellation: 8 },
				this.scene
			)
		);
		this.windIndicator.rotation.z = -Math.PI / 2;
		this.windIndicator.position = new Vector3(0, 22, -10);
		this.windIndicator.material = this.createPbrMaterial('windMat', PALETTE.windIndicator, {
			emissive: PALETTE.windIndicator,
			unlit: true
		});

		// Scenery
		this.createMountains();
		this.createPalmTrees();
		this.createRocks();
	}

	private createFortRoof(parent: TransformNode, roofColor: Color3, config: FortBattleConfig): void {
		const roofMat = this.createPbrMaterial(`roofMat${parent.name}`, this.toHex(roofColor), { roughness: 0.95 });
		const radius = config.FORT_RADIUS;
		const y = config.FORT_HEIGHT;

		switch (this.theme.roofStyle) {
			case 'cone': {
				const roof = this.flatShade(
					MeshBuilder.CreateCylinder(
						`roof${parent.name}`,
						{
							height: 4,
							diameterTop: 0,
							diameterBottom: radius * 2.1,
							tessellation: 32
						},
						this.scene
					)
				);
				roof.position.y = y + 2;
				roof.parent = parent;
				roof.material = roofMat;
				roof.receiveShadows = true;
				this.shadowGenerator.addShadowCaster(roof);
				roof.freezeWorldMatrix();
				break;
			}
			case 'crenellated': {
				const parapet = this.flatShade(
					MeshBuilder.CreateCylinder(
						`roof${parent.name}`,
						{
							height: 1.2,
							diameter: radius * 2.2,
							tessellation: 32
						},
						this.scene
					)
				);
				parapet.position.y = y + 0.6;
				parapet.parent = parent;
				parapet.material = roofMat;
				parapet.receiveShadows = true;
				this.shadowGenerator.addShadowCaster(parapet);
				parapet.freezeWorldMatrix();
				for (let i = 0; i < 8; i++) {
					const angle = (i / 8) * Math.PI * 2;
					const cren = this.flatShade(
						MeshBuilder.CreateBox(`cren${parent.name}_${i}`, { size: 0.8 }, this.scene)
					);
					cren.position = new Vector3(
						Math.cos(angle) * (radius + 0.2),
						y + 1.4,
						Math.sin(angle) * (radius + 0.2)
					);
					cren.parent = parent;
					cren.material = roofMat;
					this.shadowGenerator.addShadowCaster(cren);
					cren.freezeWorldMatrix();
				}
				break;
			}
			case 'dome': {
				const dome = this.flatShade(
					MeshBuilder.CreateSphere(`roof${parent.name}`, { diameter: radius * 2.3, slice: 0.5 }, this.scene)
				);
				dome.position.y = y + radius * 0.6;
				dome.parent = parent;
				dome.material = roofMat;
				dome.receiveShadows = true;
				this.shadowGenerator.addShadowCaster(dome);
				dome.freezeWorldMatrix();
				break;
			}
			case 'flat': {
				const flat = this.flatShade(
					MeshBuilder.CreateCylinder(
						`roof${parent.name}`,
						{
							height: 0.6,
							diameter: radius * 2.4,
							tessellation: 32
						},
						this.scene
					)
				);
				flat.position.y = y + 0.3;
				flat.parent = parent;
				flat.material = roofMat;
				flat.receiveShadows = true;
				this.shadowGenerator.addShadowCaster(flat);
				flat.freezeWorldMatrix();
				break;
			}
			case 'stepped': {
				for (let step = 0; step < 3; step++) {
					const stepRoof = this.flatShade(
						MeshBuilder.CreateCylinder(
							`roof${parent.name}_${step}`,
							{
								height: 1.1,
								diameter: radius * (2.2 - step * 0.5),
								tessellation: 32
							},
							this.scene
						)
					);
					stepRoof.position.y = y + 0.55 + step * 0.9;
					stepRoof.parent = parent;
					stepRoof.material = roofMat;
					stepRoof.receiveShadows = true;
					this.shadowGenerator.addShadowCaster(stepRoof);
					stepRoof.freezeWorldMatrix();
				}
				break;
			}
		}
	}

	private createMountains(): void {
		const mountainMat = this.createPbrMaterial('mountainMat', this.toHex(this.color(this.theme.mountain)), {
			roughness: 1
		});

		const positions = [
			{ x: -60, z: 45, h: 28, w: 28 },
			{ x: -25, z: 55, h: 18, w: 22 },
			{ x: 20, z: 50, h: 24, w: 26 },
			{ x: 60, z: 42, h: 20, w: 24 },
			{ x: 85, z: 55, h: 15, w: 20 }
		];

		positions.forEach((p, i) => {
			const mtn = this.flatShade(
				MeshBuilder.CreateCylinder(
					`mountain${i}`,
					{
						height: p.h,
						diameterTop: 0,
						diameterBottom: p.w,
						tessellation: 7
					},
					this.scene
				)
			);
			mtn.position = new Vector3(p.x, p.h / 2, p.z);
			mtn.material = mountainMat;
			mtn.receiveShadows = true;
			mtn.freezeWorldMatrix();
		});
	}

	private createPalmTrees(): void {
		const trunkMat = this.createPbrMaterial('trunkMat', this.toHex(this.color(this.theme.trunk)), {
			roughness: 0.95
		});
		const frondMat = this.createPbrMaterial('frondMat', this.toHex(this.color(this.theme.frond)));
		frondMat.backFaceCulling = false;

		const positions = [
			{ x: -42, z: -18 },
			{ x: -55, z: -14 },
			{ x: 42, z: -18 },
			{ x: 58, z: -16 },
			{ x: -48, z: -22 }
		];

		positions.forEach((p, i) => {
			const tree = new TransformNode(`palm${i}`, this.scene);
			tree.position = new Vector3(p.x, 0, p.z);

			const trunk = this.flatShade(
				MeshBuilder.CreateCylinder(
					`palmTrunk${i}`,
					{ height: 6, diameterTop: 0.28, diameterBottom: 0.42, tessellation: 8 },
					this.scene
				)
			);
			trunk.position.y = 3;
			trunk.parent = tree;
			trunk.material = trunkMat;
			trunk.receiveShadows = true;
			this.shadowGenerator.addShadowCaster(trunk);
			trunk.freezeWorldMatrix();

			for (let f = 0; f < 7; f++) {
				const frond = this.flatShade(
					MeshBuilder.CreatePlane(`palmFrond${i}_${f}`, { width: 0.5, height: 3.2 }, this.scene)
				);
				frond.position.y = 6;
				frond.rotation.x = -0.5;
				frond.rotation.y = (f / 7) * Math.PI * 2;
				frond.rotation.z = 0.4;
				frond.parent = tree;
				frond.material = frondMat;
				frond.receiveShadows = true;
				frond.freezeWorldMatrix();
			}
		});
	}

	private createRocks(): void {
		const rockMat = this.createPbrMaterial('rockMat', this.toHex(this.color(this.theme.rock)), { roughness: 1 });

		const positions = [
			{ x: -35, z: -12, s: 1.6 },
			{ x: -62, z: -10, s: 2.2 },
			{ x: 36, z: -11, s: 1.8 },
			{ x: 66, z: -13, s: 2.0 },
			{ x: -72, z: -8, s: 1.4 },
			{ x: 74, z: -9, s: 1.5 }
		];

		positions.forEach((p, i) => {
			const rock = this.flatShade(
				MeshBuilder.CreateSphere(`rock${i}`, { diameter: p.s, segments: 3 }, this.scene)
			);
			rock.position = new Vector3(p.x, p.s * 0.25, p.z);
			rock.scaling = new Vector3(
				1 + Math.random() * 0.4,
				0.6 + Math.random() * 0.3,
				1 + Math.random() * 0.4
			);
			rock.material = rockMat;
			rock.receiveShadows = true;
			this.shadowGenerator.addShadowCaster(rock);
			rock.freezeWorldMatrix();
		});
	}

	private createArcher(parent: TransformNode, index: number, fortHeight: number): TransformNode {
		const archer = new TransformNode(`archer${index}`, this.scene);
		archer.parent = parent;
		archer.position = new Vector3(0, fortHeight + 0.1, 0);
		archer.scaling.setAll(1.35);

		const skinMat = this.createPbrMaterial(`skinMat${index}`, PALETTE.skin);
		const clothesMat = this.createPbrMaterial(
			`clothesMat${index}`,
			index === 0 ? PALETTE.archerP1 : PALETTE.archerP2
		);

		// Robe / body
		const body = this.flatShade(
			MeshBuilder.CreateCylinder(`archerBody${index}`, { height: 1.2, diameter: 0.55 }, this.scene)
		);
		body.position.y = 0.6;
		body.parent = archer;
		body.material = clothesMat;
		this.shadowGenerator.addShadowCaster(body);

		// Head
		const head = this.flatShade(MeshBuilder.CreateSphere(`archerHead${index}`, { diameter: 0.48 }, this.scene));
		head.position.y = 1.35;
		head.parent = archer;
		head.material = skinMat;
		this.shadowGenerator.addShadowCaster(head);

		// Keffiyeh / headscarf
		const turban = this.flatShade(
			MeshBuilder.CreateTorus(`archerTurban${index}`, { diameter: 0.54, thickness: 0.14 }, this.scene)
		);
		turban.position.y = 1.42;
		turban.rotation.x = Math.PI / 2;
		turban.parent = archer;
		turban.material = this.createPbrMaterial(`turbanMat${index}`, PALETTE.turban);
		this.shadowGenerator.addShadowCaster(turban);

		// Legs
		for (let s = -1; s <= 1; s += 2) {
			const leg = this.flatShade(
				MeshBuilder.CreateCylinder(`archerLeg${index}_${s}`, { height: 0.75, diameter: 0.2 }, this.scene)
			);
			leg.position = new Vector3(s * 0.18, -0.38, 0);
			leg.parent = archer;
			leg.material = clothesMat;
			this.shadowGenerator.addShadowCaster(leg);
		}

		// Arms (one forward holding bow, one back drawing string)
		const armL = this.flatShade(
			MeshBuilder.CreateCylinder(`archerArmL${index}`, { height: 0.7, diameter: 0.16 }, this.scene)
		);
		armL.position = new Vector3(-0.35, 0.95, 0.28);
		armL.rotation.z = -0.5;
		armL.rotation.x = 0.8;
		armL.parent = archer;
		armL.material = skinMat;
		this.shadowGenerator.addShadowCaster(armL);

		const armR = this.flatShade(
			MeshBuilder.CreateCylinder(`archerArmR${index}`, { height: 0.7, diameter: 0.16 }, this.scene)
		);
		armR.position = new Vector3(0.35, 0.95, -0.18);
		armR.rotation.z = 0.5;
		armR.rotation.x = -0.6;
		armR.parent = archer;
		armR.material = skinMat;
		this.shadowGenerator.addShadowCaster(armR);

		// Bow (curved tube-like torus segment)
		const bow = this.flatShade(
			MeshBuilder.CreateTorus(`archerBow${index}`, { diameter: 1.2, thickness: 0.07, tessellation: 24 }, this.scene)
		);
		bow.position = new Vector3(-0.6, 0.95, 0.38);
		bow.rotation.y = Math.PI / 2;
		bow.rotation.x = 0.4;
		bow.scaling.z = 1.6;
		bow.parent = archer;
		bow.material = this.createPbrMaterial(`bowMat${index}`, PALETTE.bow, { roughness: 0.9 });
		this.shadowGenerator.addShadowCaster(bow);

		// Bowstring
		const bowString = MeshBuilder.CreateLines(
			`archerBowString${index}`,
			{
				points: [new Vector3(-0.25, 1.55, 0.38), new Vector3(-0.95, 0.35, 0.38)]
			},
			this.scene
		);
		bowString.color = Color3.FromHexString(PALETTE.bowString);
		bowString.parent = archer;

		// Quiver on back
		const quiver = this.flatShade(
			MeshBuilder.CreateCylinder(`archerQuiver${index}`, { height: 0.9, diameter: 0.22 }, this.scene)
		);
		quiver.position = new Vector3(0.3, 0.8, -0.35);
		quiver.rotation.x = -0.5;
		quiver.rotation.z = -0.2;
		quiver.parent = archer;
		quiver.material = this.createPbrMaterial(`quiverMat${index}`, PALETTE.quiver, { roughness: 0.9 });
		this.shadowGenerator.addShadowCaster(quiver);

		return archer;
	}

	private setupGui(): void {
		this.gui = AdvancedDynamicTexture.CreateFullscreenUI('fortUI');

		// The GUI is intentionally minimal here; it exists so showFloatingText
		// and future overlay buttons can attach to it.
		const watermark = new TextBlock();
		watermark.text = '';
		watermark.color = 'white';
		watermark.fontSize = 18;
		watermark.alpha = 0;
		watermark.top = '-12px';
		watermark.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
		watermark.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
		this.gui.addControl(watermark);
	}

	private setupInput(): void {
		this.scene.onKeyboardObservable.add((kbInfo) => {
			const state = this.logic.getState();
			if (state.gameState === 'gameover' || this.isAITurn()) return;

			if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
				switch (kbInfo.event.key) {
					case 'ArrowUp':
						kbInfo.event.preventDefault();
						this.logic.adjustAngle(2);
						break;
					case 'ArrowDown':
						kbInfo.event.preventDefault();
						this.logic.adjustAngle(-2);
						break;
					case ' ':
					case 'Spacebar':
						kbInfo.event.preventDefault();
						if (state.gameState === 'aiming' && !this.logic.isCharging()) {
							this.beginCharge();
						}
						break;
				}
			} else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
				if ((kbInfo.event.key === ' ' || kbInfo.event.key === 'Spacebar') && this.logic.isCharging()) {
					kbInfo.event.preventDefault();
					this.logic.releaseCharge();
				}
			}
		});

		// Mouse / touch: move to aim, press to charge, release to fire
		let pointerDown = false;
		this.scene.onPointerObservable.add((pointerInfo) => {
			const state = this.logic.getState();
			if (state.gameState === 'gameover' || this.isAITurn()) return;

			if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
				if (state.gameState === 'aiming' && !this.logic.isCharging()) {
					this.aimFromPointer();
				}
			} else if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
				if (state.gameState === 'aiming' && !this.logic.isCharging()) {
					pointerDown = true;
					this.beginCharge();
				}
			} else if (pointerInfo.type === PointerEventTypes.POINTERUP && pointerDown) {
				pointerDown = false;
				this.logic.releaseCharge();
			}
		});
	}

	private aimFromPointer(): void {
		const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => mesh === this.aimPlane);
		if (!pickResult.hit || !pickResult.pickedPoint) return;

		const start = this.logic.getArrowStartPosition();
		const target = pickResult.pickedPoint;
		const dx = target.x - start.x;
		const dy = target.y - start.y;
		let newAngle = (Math.atan2(dy, dx) * 180) / Math.PI;

		const config = this.logic.getConfig();
		const currentPlayer = this.logic.getCurrentPlayer();
		if (currentPlayer === 0) {
			newAngle = Math.max(config.MIN_ANGLE, Math.min(90, newAngle));
		} else {
			newAngle = Math.max(90, Math.min(config.MAX_ANGLE, newAngle));
		}

		this.logic.setAngle(Math.round(newAngle));
	}

	private beginCharge(): void {
		this.logic.startCharge();
		this.chargeStartTime = performance.now();
	}

	// --- Public controls (blocked while the AI is taking its turn) ----------

	isAITurn(): boolean {
		return this.mode === 'ai' && this.logic.getCurrentPlayer() === 1;
	}

	getMode(): FortBattleMode {
		return this.mode;
	}

	getTheme(): FortTheme {
		return this.theme;
	}

	adjustAngle(delta: number): void {
		if (this.isAITurn()) return;
		this.logic.adjustAngle(delta);
	}

	startCharge(): void {
		if (this.isAITurn()) return;
		this.beginCharge();
	}

	releaseCharge(): void {
		if (this.isAITurn()) return;
		this.logic.releaseCharge();
	}

	// --- AI turn driver ------------------------------------------------------

	private scheduleAITurn(): void {
		this.aiTurnActive = true;
		this.aiTurnTimer = setTimeout(() => {
			this.aiTurnTimer = null;
			if (!this.isAITurn() || this.logic.getState().gameState !== 'aiming') {
				this.aiTurnActive = false;
				return;
			}
			const state = this.logic.getState();
			const shot = computeAIShot(this.logic.getConfig(), 1, 0, state.wind, this.difficulty as AIDifficulty);
			this.logic.setAngle(shot.angle);
			this.aiTargetPower = shot.power;
			this.beginCharge();
		}, 1000);
	}

	private clearAITurn(): void {
		if (this.aiTurnTimer !== null) {
			clearTimeout(this.aiTurnTimer);
			this.aiTurnTimer = null;
		}
		this.aiTurnActive = false;
	}

	private handleResize = (): void => {
		this.engine.resize();
	};

	setMuted(muted: boolean): void {
		this.audio.setMuted(muted);
	}

	getMuted(): boolean {
		return this.audio.getMuted();
	}

	private updateAimVisuals(): void {
		const state = this.logic.getState();
		if (state.gameState !== 'aiming') return;

		const start = this.toVector3(this.logic.getArrowStartPosition());
		this.arrowRoot.position.copyFrom(start);
		this.arrowRoot.setEnabled(true);
		this.updateArrowRotation();
		this.updateAimGuide();
	}

	private updateAimGuide(): void {
		const state = this.logic.getState();
		if (state.gameState !== 'aiming') {
			this.aimGuideRoot.setEnabled(false);
			return;
		}

		const trajectory = this.logic.computeTrajectory(this.aimGuideDots.length);
		this.aimGuideRoot.setEnabled(true);

		const linePoints: Vector3[] = [];
		for (let i = 0; i < trajectory.length; i++) {
			const pos = this.toVector3(trajectory[i]);
			if (i > 0) {
				this.aimGuideDots[i - 1].position.copyFrom(pos);
				const scale = 1 - ((i - 1) / this.aimGuideDots.length) * 0.45;
				this.aimGuideDots[i - 1].scaling.setAll(scale);
			}
			linePoints.push(pos);
		}

		this.aimGuideLine = MeshBuilder.CreateLines(this.aimGuideLine.name, {
			points: linePoints,
			instance: this.aimGuideLine as any
		});
	}

	private updateArrowRotation(): void {
		const angleRad = this.logic.getArrowAngleRad();
		this.arrowRoot.rotation.z = angleRad;

		const archer = this.archers[this.logic.getCurrentPlayer()];
		if (archer) {
			archer.rotation.z = angleRad;
		}
	}

	private update(dt: number): void {
		const state = this.logic.getState();
		if (state.gameState === 'gameover') {
			this.disposeGiftMesh();
			this.checkPerformance(dt);
			return;
		}

		this.logic.updateGift(dt);
		this.updateGiftVisual(dt);

		if (this.logic.isCharging()) {
			const elapsed = (performance.now() - this.chargeStartTime) / 1000;
			this.logic.updateCharge(elapsed);

			// The AI releases as soon as the charged power reaches its target.
			if (this.aiTurnActive && this.isAITurn() && this.logic.getState().power >= this.aiTargetPower) {
				this.aiTurnActive = false;
				this.logic.releaseCharge();
			}
		}

		if (this.logic.isArrowFlying()) {
			this.logic.updateFlight(dt);

			const pos = this.logic.getArrowPosition();
			this.arrowRoot.position.x = pos.x;
			this.arrowRoot.position.y = pos.y;
			this.updateArrowRotation();
		}

		this.checkPerformance(dt);
	}

	private updateGiftVisual(dt: number): void {
		const gift = this.logic.getGift();
		if (!gift?.active) {
			this.disposeGiftMesh();
			return;
		}

		if (!this.giftMesh) {
			this.createGiftMesh(gift.type);
		}

		const pos = this.toVector3(gift.position);
		this.giftMesh!.position.copyFrom(pos);
		this.giftGlow!.position.copyFrom(pos);
		this.giftMesh!.rotation.y += dt * 1.5;
		this.giftMesh!.rotation.z += dt * 0.5;
	}

	private createGiftMesh(type: GiftType): void {
		const color = type === 'health' ? PALETTE.giftHealth : PALETTE.giftPower;

		this.giftMesh = this.flatShade(MeshBuilder.CreateBox('giftBox', { size: 1.4 }, this.scene));
		this.giftMesh.material = this.createPbrMaterial('giftMat', color, { emissive: color });

		this.giftGlow = this.flatShade(MeshBuilder.CreateSphere('giftGlow', { diameter: 2.2 }, this.scene));
		this.giftGlow.material = this.createPbrMaterial('giftGlowMat', color, {
			emissive: color,
			alpha: 0.35,
			unlit: true
		});
	}

	private disposeGiftMesh(): void {
		if (this.giftMesh) {
			this.giftMesh.dispose();
			this.giftMesh = null;
		}
		if (this.giftGlow) {
			this.giftGlow.dispose();
			this.giftGlow = null;
		}
	}

	private onStateChanged(state: FortBattleState): void {
		if (this.aimAssist) {
			this.logic.setAimAssist(!this.isAITurn());
		}

		this.updateWindVisual(state.wind);

		if (state.gameState === 'aiming') {
			this.arrowRoot.setEnabled(true);
			this.updateAimVisuals();
		} else if (state.gameState === 'flying') {
			this.aimGuideRoot.setEnabled(false);
		}

		if (this.pendingTurnMessage && state.gameState === 'aiming') {
			this.pendingTurnMessage = '';
		}

		if (state.gameState === 'aiming' && this.isAITurn() && !this.aiTurnActive) {
			this.scheduleAITurn();
		}
	}

	private onHit(fortIndex: number, position: Point2D): void {
		this.arrowRoot.setEnabled(false);
		this.audio.playHit();
		const pos = this.toVector3(position);
		this.spawnConfetti(pos.x, pos.y, Color3.FromHexString(PALETTE.success), 24);
		this.showFloatingText(pos.x, pos.y, '+10', PALETTE.success);
		const fort = this.fortRoots[fortIndex];
		if (fort) {
			this.squishStretchBounce(fort, 0.25);
		}
	}

	private onMiss(message: string): void {
		this.arrowRoot.setEnabled(false);
		this.audio.playMiss();
		this.pendingTurnMessage = message;
	}

	private onWin(winner: number): void {
		this.audio.playWin();
		const fort = this.fortRoots[winner];
		const x = fort ? fort.position.x : 0;
		this.spawnConfetti(x, 10, Color3.FromHexString(PALETTE.giftHealth), 48);
		this.showFloatingText(x, 14, 'فوز!', PALETTE.giftHealth);
	}

	private onGiftCollected(type: GiftType, position: Point2D): void {
		const color = type === 'health' ? PALETTE.giftHealth : PALETTE.giftPower;
		const pos = this.toVector3(position);
		this.spawnConfetti(pos.x, pos.y, Color3.FromHexString(color), 20);
		this.showFloatingText(pos.x, pos.y, type === 'health' ? 'صحة!' : 'قوة!', color);
		this.audio.playPowerup();
	}

	private updateWindVisual(wind: number): void {
		const scale = Math.abs(wind) * 0.3 + 0.3;
		this.windIndicator.scaling = new Vector3(scale, 1, 1);
		this.windIndicator.rotation.z = wind >= 0 ? -Math.PI / 2 : Math.PI / 2;
	}

	private toVector3(p: Point2D): Vector3 {
		return new Vector3(p.x, p.y, 0);
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
		ps.emitter = new Vector3(x, y, 0);
		ps.minEmitBox = new Vector3(-0.2, -0.2, -0.2);
		ps.maxEmitBox = new Vector3(0.2, 0.2, 0.2);
		ps.color1 = new Color4(color.r, color.g, color.b, 1);
		ps.color2 = new Color4(Math.min(1, color.r * 1.2), Math.min(1, color.g * 1.2), Math.min(1, color.b * 1.2), 1);
		ps.colorDead = darker ? new Color4(0.25, 0.05, 0.05, 0) : new Color4(0.8, 0.65, 0.3, 0);
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
		anchor.position = new Vector3(x, y, 0);

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
		console.warn('FortBattle: reduced visual quality for performance.');
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
			console.warn('FortBattle: failed to load model', path, err);
			return null;
		}
	}

	resetGame(): void {
		this.clearAITurn();
		this.logic.resetGame();
	}

	dispose(): void {
		this.clearAITurn();
		this.disposeGiftMesh();
		this.audio.stopMusic();
		this.confettiTexture?.dispose();
		this.gui?.dispose();
		this.pipeline?.dispose();
		window.removeEventListener('resize', this.handleResize);
		this.engine.dispose();
	}
}
