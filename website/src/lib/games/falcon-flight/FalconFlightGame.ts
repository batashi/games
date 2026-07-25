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
	StandardMaterial,
	Mesh,
	TransformNode,
	PointerEventTypes,
	VertexBuffer
} from '@babylonjs/core';
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
	private camera: UniversalCamera;
	private logic: FalconFlightLogic;
	private audio: FalconFlightAudio;
	private onChange: (state: FalconFlightState) => void;

	private falconRoot!: TransformNode;
	private falconBody!: Mesh;
	private falconWings: Mesh[] = [];
	private falconTail!: Mesh;
	private falconHood!: Mesh;
	private falconLegBand!: Mesh;

	private ground!: Mesh;
	private sun!: Mesh;
	private chunkMeshes: ChunkMesh[] = [];
	private objectMeshes: ObjectMesh[] = [];
	private particles: { mesh: Mesh; life: number; vy: number; vx: number }[] = [];

	private inputActive = false;
	private flapTimer = 0;
	private disposed = false;
	private handleResize: () => void;
	private handleKeydown: (e: KeyboardEvent) => void;
	private handleKeyup: (e: KeyboardEvent) => void;

	constructor(
		canvas: HTMLCanvasElement,
		onChange: (state: FalconFlightState) => void,
		options: FalconFlightGameOptions = {}
	) {
		this.canvas = canvas;
		this.onChange = onChange;
		this.audio = new FalconFlightAudio();

		this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
		this.scene = this.createScene();
		this.camera = this.createCamera();
		this.setupLights();
		this.setupEnvironment();
		this.createFalcon();
		this.setupInput();

		this.logic = new FalconFlightLogic(
			(state) => {
				this.onChange(state);
			},
			options.config,
			{
				onPreyCollected: () => this.audio.playPreyCatch(),
				onPowerUpCollected: () => this.audio.playPowerUp(),
				onHazardHit: () => this.audio.playCollision(),
				onGameOver: () => this.audio.playFanfare()
			}
		);

		this.handleResize = () => this.engine.resize();
		window.addEventListener('resize', this.handleResize);

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
		// Warm sunset sky: soft orange/purple gradient simulated by a clear color.
		scene.clearColor = new Color4(0.91, 0.62, 0.42, 1);
		return scene;
	}

	private createCamera(): UniversalCamera {
		const camera = new UniversalCamera('camera', new Vector3(0, 7, -18), this.scene);
		camera.setTarget(new Vector3(0, 6, 0));
		camera.mode = UniversalCamera.ORTHOGRAPHIC_CAMERA;
		camera.orthoLeft = -12;
		camera.orthoRight = 12;
		camera.orthoTop = 10;
		camera.orthoBottom = -6;
		camera.inputs.clear();
		return camera;
	}

	private setupLights(): void {
		const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
		hemi.intensity = 0.6;
		hemi.diffuse = new Color3(1, 0.85, 0.65);
		hemi.groundColor = new Color3(0.55, 0.4, 0.32);

		const dir = new DirectionalLight('dir', new Vector3(-0.6, -1, 0.4), this.scene);
		dir.intensity = 0.75;
		dir.diffuse = new Color3(1, 0.78, 0.5);
	}

	private setupEnvironment(): void {
		// Ground plane.
		this.ground = MeshBuilder.CreateGround(
			'ground',
			{ width: 80, height: 30, subdivisions: 24 },
			this.scene
		);
		this.ground.position.z = 4;
		const positions = this.ground.getVerticesData(VertexBuffer.PositionKind);
		if (positions) {
			for (let i = 0; i < positions.length; i += 3) {
				const x = positions[i];
				const z = positions[i + 2];
				positions[i + 1] =
					Math.sin(x * 0.25) * 0.35 +
					Math.cos(z * 0.2) * 0.25 +
					Math.sin((x + z) * 0.1) * 0.15;
			}
			this.ground.updateVerticesData(VertexBuffer.PositionKind, positions);
			this.ground.refreshBoundingInfo();
		}
		this.flatShade(this.ground);
		const groundMat = new StandardMaterial('groundMat', this.scene);
		groundMat.diffuseColor = new Color3(0.86, 0.6, 0.3);
		groundMat.specularColor = new Color3(0.05, 0.05, 0.05);
		this.ground.material = groundMat;
		this.ground.isPickable = false;

		// Warm sun disk low on the horizon.
		this.sun = MeshBuilder.CreateDisc('sun', { radius: 2.5 }, this.scene);
		this.sun.position = new Vector3(8, 5.5, 12);
		const sunMat = new StandardMaterial('sunMat', this.scene);
		sunMat.emissiveColor = new Color3(1, 0.75, 0.35);
		sunMat.diffuseColor = new Color3(1, 0.75, 0.35);
		sunMat.disableLighting = true;
		this.sun.material = sunMat;
		this.sun.isPickable = false;
	}

	private flatShade(mesh: Mesh): Mesh {
		// Flat shading is achieved with low segment counts and no smoothing.
		return mesh;
	}

	private createFalcon(): void {
		this.falconRoot = new TransformNode('falconRoot', this.scene);
		this.falconRoot.position.x = FALCON_WORLD_X;
		this.falconRoot.position.y = 5;

		const bodyMat = new StandardMaterial('bodyMat', this.scene);
		bodyMat.diffuseColor = new Color3(0.62, 0.42, 0.22);
		bodyMat.specularColor = new Color3(0.1, 0.1, 0.1);

		const wingMat = new StandardMaterial('wingMat', this.scene);
		wingMat.diffuseColor = new Color3(0.55, 0.38, 0.2);

		const tailMat = new StandardMaterial('tailMat', this.scene);
		tailMat.diffuseColor = new Color3(0.5, 0.35, 0.18);

		const hoodMat = new StandardMaterial('hoodMat', this.scene);
		hoodMat.diffuseColor = new Color3(0.35, 0.22, 0.12);

		const bandMat = new StandardMaterial('bandMat', this.scene);
		bandMat.diffuseColor = new Color3(0.2, 0.55, 0.45);
		bandMat.emissiveColor = new Color3(0.1, 0.25, 0.2);

		// Body.
		this.falconBody = this.flatShade(
			MeshBuilder.CreateSphere('falconBody', { diameter: 0.9, segments: 6 }, this.scene)
		);
		this.falconBody.scaling = new Vector3(1.3, 0.85, 0.85);
		this.falconBody.material = bodyMat;
		this.falconBody.parent = this.falconRoot;

		// Head.
		const head = this.flatShade(MeshBuilder.CreateSphere('falconHead', { diameter: 0.5, segments: 6 }, this.scene));
		head.position = new Vector3(0.55, 0.15, 0);
		head.material = bodyMat;
		head.parent = this.falconRoot;

		// Beak.
		const beak = this.flatShade(
			MeshBuilder.CreateCylinder('falconBeak', { height: 0.28, diameterTop: 0, diameterBottom: 0.16, tessellation: 6 }, this.scene)
		);
		beak.rotation.z = -Math.PI / 2;
		beak.position = new Vector3(0.85, 0.1, 0);
		const beakMat = new StandardMaterial('beakMat', this.scene);
		beakMat.diffuseColor = new Color3(0.2, 0.15, 0.1);
		beak.material = beakMat;
		beak.parent = this.falconRoot;

		// Hood hint over the head.
		this.falconHood = this.flatShade(
			MeshBuilder.CreateSphere('falconHood', { diameter: 0.52, segments: 6 }, this.scene)
		);
		this.falconHood.position = new Vector3(0.55, 0.18, 0);
		this.falconHood.scaling = new Vector3(1, 0.85, 0.95);
		this.falconHood.material = hoodMat;
		this.falconHood.parent = this.falconRoot;

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
		}

		// Fan tail.
		this.falconTail = this.flatShade(MeshBuilder.CreateBox('falconTail', { width: 0.7, height: 0.06, depth: 0.7 }, this.scene));
		this.falconTail.position = new Vector3(-0.7, 0, 0);
		this.falconTail.rotation.y = 0.15;
		this.falconTail.material = tailMat;
		this.falconTail.parent = this.falconRoot;

		// Leg band.
		this.falconLegBand = this.flatShade(
			MeshBuilder.CreateTorus('falconLegBand', { diameter: 0.18, thickness: 0.04, tessellation: 8 }, this.scene)
		);
		this.falconLegBand.position = new Vector3(0.05, -0.35, 0.15);
		this.falconLegBand.rotation.y = Math.PI / 2;
		this.falconLegBand.material = bandMat;
		this.falconLegBand.parent = this.falconRoot;
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
		const targetY = state.falcon.y * 0.55 + 4;
		this.camera.position.y += (targetY - this.camera.position.y) * Math.min(1, dt * 3);
		this.camera.setTarget(new Vector3(0, this.camera.position.y - 1, 0));
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
		const sandMat = new StandardMaterial('sandMat', this.scene);
		sandMat.diffuseColor = new Color3(0.88, 0.58, 0.28);
		sandMat.specularColor = new Color3(0.05, 0.05, 0.05);

		const rockMat = new StandardMaterial('rockMat', this.scene);
		rockMat.diffuseColor = new Color3(0.55, 0.35, 0.25);

		const trunkMat = new StandardMaterial('trunkMat', this.scene);
		trunkMat.diffuseColor = new Color3(0.45, 0.3, 0.18);

		const frondMat = new StandardMaterial('frondMat', this.scene);
		frondMat.diffuseColor = new Color3(0.28, 0.5, 0.18);
		frondMat.backFaceCulling = false;

		const fortMat = new StandardMaterial('fortMat', this.scene);
		fortMat.diffuseColor = new Color3(0.42, 0.28, 0.22);

		const cloudMat = new StandardMaterial('cloudMat', this.scene);
		cloudMat.diffuseColor = new Color3(0.95, 0.82, 0.72);
		cloudMat.alpha = 0.8;

		switch (chunk.type) {
			case 'dune': {
				const dune = this.flatShade(
					MeshBuilder.CreateSphere(`dune-${chunk.id}`, { diameter: chunk.width, segments: 5 }, this.scene)
				);
				dune.scaling.y = chunk.height / (chunk.width * 0.5);
				dune.position.y = -chunk.height * 0.25;
				dune.material = sandMat;
				dune.parent = root;
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
				meshes.push(rock);
				break;
			}
			case 'palms': {
				for (let i = 0; i < 3; i++) {
					const palm = new TransformNode(`palm-${chunk.id}-${i}`, this.scene);
					palm.position.x = (i - 1) * 1.2;
					palm.parent = root;

					const trunk = this.flatShade(
						MeshBuilder.CreateCylinder(`palmTrunk-${chunk.id}-${i}`, { height: chunk.height, diameterTop: 0.12, diameterBottom: 0.18, tessellation: 6 }, this.scene)
					);
					trunk.position.y = chunk.height / 2;
					trunk.material = trunkMat;
					trunk.parent = palm;

					for (let f = 0; f < 6; f++) {
						const frond = this.flatShade(
							MeshBuilder.CreatePlane(`palmFrond-${chunk.id}-${i}-${f}`, { width: 0.35, height: 1.6 }, this.scene)
						);
						frond.position.y = chunk.height;
						frond.rotation.y = (f / 6) * Math.PI * 2;
						frond.rotation.x = -0.4;
						frond.material = frondMat;
						frond.parent = palm;
					}
				}
				break;
			}
			case 'fort': {
				const body = this.flatShade(
					MeshBuilder.CreateBox(`fort-${chunk.id}`, { width: chunk.width * 0.5, height: chunk.height, depth: chunk.width * 0.35 }, this.scene)
				);
				body.position.y = chunk.height / 2;
				body.material = fortMat;
				body.parent = root;
				meshes.push(body);

				const tower = this.flatShade(
					MeshBuilder.CreateCylinder(`fortTower-${chunk.id}`, { height: chunk.height * 1.2, diameter: chunk.width * 0.25, tessellation: 6 }, this.scene)
				);
				tower.position = new Vector3(chunk.width * 0.15, chunk.height * 0.6, 0);
				tower.material = fortMat;
				tower.parent = root;
				meshes.push(tower);
				break;
			}
			case 'cloud': {
				for (let i = 0; i < 3; i++) {
					const puff = this.flatShade(
						MeshBuilder.CreateSphere(`cloud-${chunk.id}-${i}`, { diameter: 1 + Math.random(), segments: 5 }, this.scene)
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

		if (object.category === 'prey') {
			const kind = object.kind as PreyType;
			const color =
				kind === 'hare'
					? new Color3(0.7, 0.55, 0.35)
					: kind === 'houbara'
						? new Color3(0.65, 0.5, 0.3)
						: new Color3(0.55, 0.45, 0.25);
			const mat = new StandardMaterial(`preyMat-${object.id}`, this.scene);
			mat.diffuseColor = color;

			const body = this.flatShade(MeshBuilder.CreateSphere(`preyBody-${object.id}`, { diameter: 0.7, segments: 5 }, this.scene));
			body.scaling = new Vector3(1.1, 0.75, 0.8);
			body.material = mat;
			body.parent = root;
			meshes.push(body);

			// Glow ring for Sharper Eyes.
			const glow = MeshBuilder.CreateSphere(`preyGlow-${object.id}`, { diameter: 1.3, segments: 8 }, this.scene);
			const glowMat = new StandardMaterial(`preyGlowMat-${object.id}`, this.scene);
			glowMat.emissiveColor = new Color3(1, 0.9, 0.4);
			glowMat.alpha = 0.25;
			glowMat.disableLighting = true;
			glow.material = glowMat;
			glow.parent = root;
			glow.setEnabled(false);

			this.objectMeshes.push({ object, root, meshes, glow });
			return;
		}

		if (object.category === 'hazard') {
			const kind = object.kind as HazardType;
			const mat = new StandardMaterial(`hazardMat-${object.id}`, this.scene);
			if (kind === 'cliff') {
				mat.diffuseColor = new Color3(0.45, 0.3, 0.22);
				const cliff = this.flatShade(MeshBuilder.CreateBox(`hazard-${object.id}`, { width: 1.2, height: 2.4, depth: 0.8 }, this.scene));
				cliff.material = mat;
				cliff.parent = root;
				meshes.push(cliff);
			} else if (kind === 'dustDevil') {
				mat.diffuseColor = new Color3(0.75, 0.6, 0.35);
				mat.alpha = 0.7;
				const swirl = this.flatShade(MeshBuilder.CreateCylinder(`hazard-${object.id}`, { height: 2.2, diameterTop: 0.3, diameterBottom: 1.2, tessellation: 8 }, this.scene));
				swirl.material = mat;
				swirl.parent = root;
				meshes.push(swirl);
			} else if (kind === 'vulture') {
				mat.diffuseColor = new Color3(0.25, 0.2, 0.15);
				const body = this.flatShade(MeshBuilder.CreateSphere(`hazard-${object.id}`, { diameter: 0.6, segments: 5 }, this.scene));
				body.scaling = new Vector3(1.2, 0.7, 0.6);
				body.material = mat;
				body.parent = root;
				meshes.push(body);
				for (let s = -1; s <= 1; s += 2) {
					const wing = this.flatShade(MeshBuilder.CreateBox(`vultureWing-${object.id}-${s}`, { width: 0.8, height: 0.04, depth: 0.35 }, this.scene));
					wing.position.z = s * 0.5;
					wing.rotation.x = s * 0.3;
					wing.material = mat;
					wing.parent = root;
					meshes.push(wing);
				}
			} else {
				mat.diffuseColor = new Color3(0.65, 0.75, 0.85);
				mat.alpha = 0.6;
				const draft = this.flatShade(MeshBuilder.CreateCylinder(`hazard-${object.id}`, { height: 2.4, diameterTop: 1.2, diameterBottom: 0.3, tessellation: 8 }, this.scene));
				draft.material = mat;
				draft.parent = root;
				meshes.push(draft);
			}
			this.objectMeshes.push({ object, root, meshes });
			return;
		}

		if (object.category === 'powerup') {
			const kind = object.kind as PowerUpType;
			const color =
				kind === 'tailwind'
					? new Color3(0.9, 0.95, 0.4)
					: kind === 'sharperEyes'
						? new Color3(0.4, 0.9, 0.95)
						: new Color3(0.5, 0.95, 0.4);
			const mat = new StandardMaterial(`powerupMat-${object.id}`, this.scene);
			mat.diffuseColor = color;
			mat.emissiveColor = color.scale(0.5);
			const orb = this.flatShade(MeshBuilder.CreateSphere(`powerup-${object.id}`, { diameter: 0.8, segments: 6 }, this.scene));
			orb.material = mat;
			orb.parent = root;
			meshes.push(orb);
			this.objectMeshes.push({ object, root, meshes });
		}
	}

	private spawnSparkles(x: number, y: number): void {
		for (let i = 0; i < 6; i++) {
			const spark = MeshBuilder.CreateSphere(`spark-${Date.now()}-${i}`, { diameter: 0.12, segments: 4 }, this.scene);
			spark.position = new Vector3(FALCON_WORLD_X + x, y, 0);
			const mat = new StandardMaterial(`sparkMat-${Date.now()}-${i}`, this.scene);
			mat.emissiveColor = new Color3(1, 0.85, 0.3);
			mat.disableLighting = true;
			spark.material = mat;
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

	dispose(): void {
		this.disposed = true;
		this.cleanupMeshes();
		this.audio.stopMusic();
		window.removeEventListener('resize', this.handleResize);
		window.removeEventListener('keydown', this.handleKeydown);
		window.removeEventListener('keyup', this.handleKeyup);
		this.engine.dispose();
	}
}
