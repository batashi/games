import {
	Engine,
	Scene,
	Vector3,
	Color3,
	HemisphericLight,
	DirectionalLight,
	PointLight,
	UniversalCamera,
	MeshBuilder,
	StandardMaterial,
	Mesh,
	TransformNode,
	PointerEventTypes,
	HighlightLayer,
	VertexData
} from '@babylonjs/core';
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
		}, 2000);
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
		const notes = [220, 247, 262, 294, 330, 349, 392];
		notes.forEach((freq, i) => {
			const osc = ctx.createOscillator();
			osc.type = i % 2 === 0 ? 'sine' : 'triangle';
			osc.frequency.setValueAtTime(freq, now + i * 0.15);
			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0, now + i * 0.15);
			gain.gain.linearRampToValueAtTime(0.02, now + i * 0.15 + 0.05);
			gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.35);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now + i * 0.15);
			osc.stop(now + i * 0.15 + 0.4);
		});
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
	private camera!: UniversalCamera;
	private logic: SouqManagerLogic;
	private audio: SouqManagerAudio;
	private onStateChange?: (state: SouqManagerState) => void;

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

	constructor(
		canvas: HTMLCanvasElement,
		onStateChange?: (state: SouqManagerState) => void,
		options: SouqManagerGameOptions = {}
	) {
		this.canvas = canvas;
		this.onStateChange = onStateChange;
		this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
		this.scene = new Scene(this.engine);
		this.scene.clearColor = new Color3(0.96, 0.88, 0.72).toColor4(1);
		this.audio = new SouqManagerAudio();
		this.highlight = new HighlightLayer('hl', this.scene);

		this.logic = new SouqManagerLogic(
			(state) => {
				this.lastState = state;
				this.onStateChange?.(state);
			},
			options.config,
			{
				onCoinCollected: () => this.audio.playCoin(),
				onCustomerServed: () => this.audio.playProcess(),
				onLevelComplete: () => this.audio.playWin()
			}
		);

		this.setupLights();
		this.setupCamera();
		this.setupEnvironment();
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
			this.scene.render();
		});

		this.logic.startLevel(options.level ?? 1);
		this.audio.playMusic();
	}

	private setupLights(): void {
		const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
		hemi.intensity = 0.45;
		hemi.groundColor = new Color3(0.65, 0.5, 0.38);
		hemi.diffuse = new Color3(1, 0.9, 0.78);

		const dir = new DirectionalLight('dir', new Vector3(-0.5, -1, -0.7), this.scene);
		dir.intensity = 0.9;
		dir.diffuse = new Color3(1, 0.82, 0.6);

		// Warm lantern glow near the front selling area.
		const point = new PointLight('lantern', new Vector3(0, 3.5, -4), this.scene);
		point.intensity = 0.5;
		point.diffuse = new Color3(1, 0.7, 0.35);
		point.range = 12;
	}

	private setupCamera(): void {
		this.camera = new UniversalCamera('cam', new Vector3(0, 14, 16), this.scene);
		this.camera.setTarget(new Vector3(0, 0, -1));
		this.camera.mode = UniversalCamera.ORTHOGRAPHIC_CAMERA;
		this.camera.orthoLeft = -12;
		this.camera.orthoRight = 12;
		this.camera.orthoTop = 10;
		this.camera.orthoBottom = -10;
		this.camera.inputs.clear();
	}

	private setupEnvironment(): void {
		// Sand ground with subtle warm tone.
		const ground = MeshBuilder.CreateGround('ground', { width: 28, height: 24 }, this.scene);
		const groundMat = new StandardMaterial('groundMat', this.scene);
		groundMat.diffuseColor = new Color3(0.84, 0.74, 0.58);
		ground.material = groundMat;
		ground.position.y = -0.05;

		// Decorative ground tiles / mats to break up the flat sand.
		const tileMat = new StandardMaterial('tileMat', this.scene);
		tileMat.diffuseColor = new Color3(0.78, 0.68, 0.52);
		for (let x = -10; x <= 10; x += 5) {
			for (let z = -7; z <= 7; z += 5) {
				const tile = MeshBuilder.CreateGround(`tile-${x}-${z}`, { width: 4.2, height: 4.2 }, this.scene);
				tile.position.set(x, -0.04, z);
				tile.material = tileMat;
			}
		}

		// Stall awning over the front selling area.
		const woodMat = new StandardMaterial('woodMat', this.scene);
		woodMat.diffuseColor = new Color3(0.58, 0.38, 0.22);
		const awningMat = new StandardMaterial('awningMat', this.scene);
		awningMat.diffuseColor = new Color3(0.82, 0.28, 0.28);

		// Two support posts.
		for (const x of [-5, 5]) {
			const post = MeshBuilder.CreateCylinder(`post-${x}`, { height: 4, diameter: 0.25 }, this.scene);
			post.position.set(x, 2, -5.5);
			post.material = woodMat;
		}

		// Awning roof with striped feel (one box for now).
		const awning = MeshBuilder.CreateBox('awning', { width: 11, height: 0.15, depth: 3 }, this.scene);
		awning.position = new Vector3(0, 4, -5.2);
		awning.material = awningMat;

		// Hanging brass lantern under the awning.
		const lanternRoot = new TransformNode('lanternRoot', this.scene);
		lanternRoot.position.set(0, 3.6, -5.2);
		const chain = this.flatShade(MeshBuilder.CreateCylinder('lantern-chain', { height: 0.4, diameter: 0.03, tessellation: 8 }, this.scene));
		chain.position.y = 0.2;
		chain.material = woodMat;
		chain.parent = lanternRoot;
		const lanternBody = this.flatShade(MeshBuilder.CreateCylinder('lantern-body', { height: 0.6, diameter: 0.28, tessellation: 8 }, this.scene));
		const lanternMat = new StandardMaterial('lanternMat', this.scene);
		lanternMat.diffuseColor = new Color3(0.75, 0.55, 0.15);
		lanternMat.emissiveColor = new Color3(0.4, 0.25, 0.05);
		lanternBody.material = lanternMat;
		lanternBody.parent = lanternRoot;
		const lanternGlass = this.flatShade(MeshBuilder.CreateCylinder('lantern-glass', { height: 0.4, diameter: 0.2, tessellation: 8 }, this.scene));
		const glassMat = new StandardMaterial('lanternGlassMat', this.scene);
		glassMat.diffuseColor = new Color3(1, 0.9, 0.5);
		glassMat.emissiveColor = new Color3(1, 0.7, 0.2);
		glassMat.alpha = 0.7;
		lanternGlass.material = glassMat;
		lanternGlass.parent = lanternRoot;

		this.setupStations();
		this.setupShelves();

		this.cashierMesh = MeshBuilder.CreateGround('cashier', { width: 2, height: 2 }, this.scene);
		this.cashierMesh.position = new Vector3(8, 0.01, -4);
		const cashierMat = new StandardMaterial('cashierMat', this.scene);
		cashierMat.diffuseColor = new Color3(0.2, 0.6, 0.4);
		this.cashierMesh.material = cashierMat;

		this.temporaryDropMat = MeshBuilder.CreateGround('temporaryDropMat', { width: 1.6, height: 1.2 }, this.scene);
		this.temporaryDropMat.position = new Vector3(0, 0.01, -5);
		const tempMatMat = new StandardMaterial('temporaryDropMatMat', this.scene);
		tempMatMat.diffuseColor = new Color3(0.72, 0.52, 0.38);
		this.temporaryDropMat.material = tempMatMat;
	}

	private setupStations(): void {
		const state = this.logic.getState();
		for (const station of state.stations) {
			const mesh = this.createStationMesh(station.type);
			mesh.position.x = station.position.x;
			mesh.position.z = station.position.y;
			mesh.position.y = 0;
			mesh.metadata = { stationId: station.id };
			this.stationMeshes.set(station.id, mesh);
			if (mesh.metadata?.dates) {
				this.stationDateMeshes.set(station.id, mesh.metadata.dates as Mesh[]);
			}
		}
	}

	private createStationMesh(type: StationType): Mesh {
		let mesh: Mesh;
		const mat = new StandardMaterial(`stationMat-${type}`, this.scene);
		switch (type) {
			case 'palmPlot':
				mesh = this.createPalmTree(`station-${type}`);
				break;
			case 'dryingMat':
				mesh = MeshBuilder.CreateGround(`station-${type}`, { width: 1.6, height: 1.2 }, this.scene);
				mat.diffuseColor = new Color3(0.75, 0.65, 0.45);
				mesh.material = mat;
				break;
			case 'packagingTable':
				mesh = MeshBuilder.CreateBox(`station-${type}`, { width: 1.6, height: 0.8, depth: 1 }, this.scene);
				mat.diffuseColor = new Color3(0.6, 0.4, 0.25);
				mesh.material = mat;
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
				mesh = MeshBuilder.CreateGround(`station-${type}`, { width: 1.4, height: 1 }, this.scene);
				mat.diffuseColor = new Color3(0.8, 0.7, 0.5);
				mesh.material = mat;
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
		const trunkMat = new StandardMaterial(`${name}-trunkMat`, this.scene);
		trunkMat.diffuseColor = new Color3(0.55, 0.38, 0.24);

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
		const leafMat = new StandardMaterial(`${name}-leafMat`, this.scene);
		leafMat.diffuseColor = new Color3(0.32, 0.58, 0.22);
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
		const datesMat = new StandardMaterial(`${name}-datesMat`, this.scene);
		datesMat.diffuseColor = new Color3(0.75, 0.6, 0.15);
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

	private createDiamondFrond(name: string, length: number, width: number, material: StandardMaterial): Mesh {
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
		const trunkMat = new StandardMaterial(`${name}-trunkMat`, this.scene);
		trunkMat.diffuseColor = new Color3(0.45, 0.35, 0.25);
		root.material = trunkMat;

		const leafMat = new StandardMaterial(`${name}-leafMat`, this.scene);
		leafMat.diffuseColor = new Color3(0.35, 0.5, 0.25);
		for (let i = 0; i < 5; i++) {
			const branch = this.flatShade(MeshBuilder.CreateSphere(`${name}-leaf${i}`, { diameter: 0.55, segments: 8 }, this.scene));
			branch.position.y = 1.05 + Math.random() * 0.25;
			branch.position.x = (Math.random() - 0.5) * 0.5;
			branch.position.z = (Math.random() - 0.5) * 0.5;
			branch.scaling.y = 0.6;
			branch.material = leafMat;
			branch.parent = root;
		}

		const resinMat = new StandardMaterial(`${name}-resinMat`, this.scene);
		resinMat.diffuseColor = new Color3(0.95, 0.85, 0.45);
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
		const sackMat = new StandardMaterial(`${name}-sackMat`, this.scene);
		sackMat.diffuseColor = new Color3(0.65, 0.55, 0.35);
		root.material = sackMat;

		const top = this.flatShade(MeshBuilder.CreateCylinder(`${name}-top`, { height: 0.08, diameterTop: 0.35, diameterBottom: 0.5, tessellation: 8 }, this.scene));
		top.position.y = 0.55;
		const topMat = new StandardMaterial(`${name}-topMat`, this.scene);
		topMat.diffuseColor = new Color3(0.55, 0.45, 0.3);
		top.material = topMat;
		top.parent = root;

		const beanMat = new StandardMaterial(`${name}-beanMat`, this.scene);
		beanMat.diffuseColor = new Color3(0.4, 0.6, 0.3);
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
		const bowlMat = new StandardMaterial(`${name}-bowlMat`, this.scene);
		bowlMat.diffuseColor = new Color3(0.25, 0.2, 0.2);
		root.material = bowlMat;

		const coal = this.flatShade(MeshBuilder.CreateSphere(`${name}-coal`, { diameter: 0.5, segments: 8 }, this.scene));
		coal.position.y = 0.18;
		coal.scaling.y = 0.4;
		const coalMat = new StandardMaterial(`${name}-coalMat`, this.scene);
		coalMat.diffuseColor = new Color3(0.15, 0.12, 0.1);
		coal.material = coalMat;
		coal.parent = root;

		return root;
	}

	private createMortar(name: string): Mesh {
		const root = this.flatShade(MeshBuilder.CreateSphere(`${name}-bowl`, { diameter: 0.6, segments: 8 }, this.scene));
		root.position.y = 0.3;
		root.scaling.y = 0.65;
		const bowlMat = new StandardMaterial(`${name}-bowlMat`, this.scene);
		bowlMat.diffuseColor = new Color3(0.5, 0.5, 0.5);
		root.material = bowlMat;

		const pestle = this.flatShade(MeshBuilder.CreateCylinder(`${name}-pestle`, { height: 0.5, diameter: 0.1, tessellation: 8 }, this.scene));
		pestle.position.y = 0.55;
		pestle.rotation.z = 0.3;
		const pestleMat = new StandardMaterial(`${name}-pestleMat`, this.scene);
		pestleMat.diffuseColor = new Color3(0.4, 0.35, 0.3);
		pestle.material = pestleMat;
		pestle.parent = root;

		return root;
	}

	private createDallah(name: string): Mesh {
		const root = this.flatShade(MeshBuilder.CreateSphere(`${name}-body`, { diameter: 0.65, segments: 8 }, this.scene));
		root.position.y = 0.45;
		root.scaling.y = 1.1;
		const bodyMat = new StandardMaterial(`${name}-bodyMat`, this.scene);
		bodyMat.diffuseColor = new Color3(0.85, 0.7, 0.2);
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
			const mesh = MeshBuilder.CreateGround(`shelf${shelf.id}`, { width: 1.6, height: 1 }, this.scene);
			const mat = new StandardMaterial(`shelfMat${shelf.id}`, this.scene);
			mat.diffuseColor = new Color3(0.72, 0.6, 0.42);
			mat.alpha = 0.95;
			mesh.material = mat;
			mesh.position.x = shelf.position.x;
			mesh.position.z = shelf.position.y;
			mesh.position.y = 0.02;
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
		const color = this.itemColor(item);
		const mesh = MeshBuilder.CreateSphere(`item-${item.type}-${item.stage}`, { diameter: 0.35, segments: 8 }, this.scene);
		const mat = new StandardMaterial(`itemMat-${item.type}-${item.stage}`, this.scene);
		mat.diffuseColor = color;
		mesh.material = mat;
		return this.flatShade(mesh);
	}

	private flatShade(mesh: Mesh): Mesh {
		mesh.convertToFlatShadedMesh();
		return mesh;
	}

	private itemColor(item: Item): Color3 {
		if (item.type === 'dates') {
			if (item.stage === 'sapling') return new Color3(0.2, 0.6, 0.2);
			if (item.stage === 'fresh') return new Color3(0.7, 0.6, 0.2);
			if (item.stage === 'drying' || item.stage === 'dried') return new Color3(0.5, 0.35, 0.15);
			return new Color3(0.45, 0.3, 0.15);
		}
		if (item.type === 'qahwa') {
			if (item.stage === 'beans') return new Color3(0.4, 0.6, 0.3);
			if (item.stage === 'roasting' || item.stage === 'roasted') return new Color3(0.35, 0.2, 0.1);
			if (item.stage === 'ground') return new Color3(0.25, 0.15, 0.1);
			return new Color3(0.2, 0.1, 0.05);
		}
		if (item.type === 'luban') {
			if (item.stage === 'rawResin') return new Color3(0.95, 0.85, 0.5);
			if (item.stage === 'sorted') return new Color3(0.9, 0.8, 0.45);
			return new Color3(0.85, 0.75, 0.4);
		}
		return new Color3(0.8, 0.8, 0.8);
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
				this.temporaryDropRing = MeshBuilder.CreateCylinder('temporaryDropRing', { height: 0.02, diameter: 1 }, this.scene);
				const ringMat = new StandardMaterial('temporaryDropRingMat', this.scene);
				ringMat.diffuseColor = new Color3(1, 0.85, 0.2);
				this.temporaryDropRing.material = ringMat;
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
		const robeMat = new StandardMaterial('robeMat', this.scene);
		robeMat.diffuseColor = robeColor;
		body.material = robeMat;
		body.parent = root;

		// Cream cat head.
		const head = this.flatShade(MeshBuilder.CreateSphere('head', { diameter: scale * 0.72, segments: 8 }, this.scene));
		head.position.y = 0.95;
		const furMat = new StandardMaterial('furMat', this.scene);
		furMat.diffuseColor = new Color3(0.98, 0.88, 0.72);
		head.material = furMat;
		head.parent = root;

		// Cat ears.
		const earMat = new StandardMaterial('earMat', this.scene);
		earMat.diffuseColor = new Color3(0.92, 0.78, 0.62);
		for (const side of [-1, 1]) {
			const ear = MeshBuilder.CreateBox(`ear${side}`, { width: 0.1, height: 0.14, depth: 0.1 }, this.scene);
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
		const coverMat = new StandardMaterial('coverMat', this.scene);
		coverMat.diffuseColor = new Color3(0.96, 0.96, 0.94);
		cover.material = coverMat;
		cover.parent = root;

		// Eyes.
		const eyeWhiteMat = new StandardMaterial('eyeWhiteMat', this.scene);
		eyeWhiteMat.diffuseColor = new Color3(1, 1, 1);
		const pupilMat = new StandardMaterial('pupilMat', this.scene);
		pupilMat.diffuseColor = new Color3(0.1, 0.1, 0.1);
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
		const pawMat = new StandardMaterial('pawMat', this.scene);
		pawMat.diffuseColor = new Color3(0.98, 0.88, 0.72);
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
		const mat = new StandardMaterial(`${type}Mat`, this.scene);

		const eyeWhiteMat = new StandardMaterial('eyeWhiteMat', this.scene);
		eyeWhiteMat.diffuseColor = new Color3(1, 1, 1);
		const pupilMat = new StandardMaterial('pupilMat', this.scene);
		pupilMat.diffuseColor = new Color3(0.1, 0.1, 0.1);

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
				const camelColor = new Color3(0.9, 0.68, 0.42);
				const darkCamelColor = new Color3(0.82, 0.58, 0.34);
				mat.diffuseColor = camelColor;

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
				const falconBrown = new Color3(0.72, 0.48, 0.26);
				const falconCream = new Color3(0.95, 0.86, 0.68);

				// Sleek teardrop body.
				body = this.flatShade(MeshBuilder.CreateSphere('falcon-body', { diameter: scale * 1.1, segments: 8 }, this.scene));
				body.scaling.set(0.85, 0.9, 1.35);
				body.position.set(0, 0.58, 0);
				mat.diffuseColor = falconBrown;
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
				const oryxWhite = new Color3(0.97, 0.94, 0.86);
				const oryxDark = new Color3(0.3, 0.22, 0.18);

				// Elegant slender body.
				body = this.flatShade(MeshBuilder.CreateSphere('oryx-body', { diameter: scale * 1.15, segments: 8 }, this.scene));
				body.scaling.set(0.85, 0.9, 1.45);
				body.position.set(0, 0.62, 0);
				mat.diffuseColor = oryxWhite;
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
				const legMat = new StandardMaterial('oryxLegMat', this.scene);
				legMat.diffuseColor = oryxWhite;
				const lowerLegMat = new StandardMaterial('oryxLowerLegMat', this.scene);
				lowerLegMat.diffuseColor = oryxDark;
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
				const foxOrange = new Color3(0.95, 0.52, 0.18);
				const foxWhite = new Color3(0.98, 0.94, 0.88);
				const foxBlack = new Color3(0.15, 0.12, 0.1);

				// Compact body.
				body = this.flatShade(MeshBuilder.CreateSphere('fox-body', { diameter: scale, segments: 8 }, this.scene));
				body.scaling.set(0.95, 0.9, 1.35);
				body.position.set(0, 0.48, 0);
				mat.diffuseColor = foxOrange;
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
				nose.material = new StandardMaterial('foxNoseMat', this.scene);
				(nose.material as StandardMaterial).diffuseColor = foxBlack;
				nose.parent = headGroup;

				addEyes(0.12, 0.06, 0.22, 0.05);

				// Big triangular ears with black tips.
				const earMat = new StandardMaterial('foxEarMat', this.scene);
				earMat.diffuseColor = foxOrange;
				const earTipMat = new StandardMaterial('foxEarTipMat', this.scene);
				earTipMat.diffuseColor = foxBlack;
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
				tailTip.material = new StandardMaterial('foxTailTipMat', this.scene);
				(tailTip.material as StandardMaterial).diffuseColor = foxWhite;
				tailTip.parent = root;

				addFeet(0.14, -0.14, 0.16, new Color3(0.85, 0.42, 0.18), 0.07);
				return { root, body, parts };
			}
			case 'goat': {
				const parts: (Mesh | TransformNode)[] = [];
				const goatCream = new Color3(0.93, 0.9, 0.82);
				const goatHorn = new Color3(0.45, 0.4, 0.36);

				// Sturdy compact body.
				body = this.flatShade(MeshBuilder.CreateSphere('goat-body', { diameter: scale * 1.1, segments: 8 }, this.scene));
				body.scaling.set(0.95, 0.95, 1.25);
				body.position.set(0, 0.5, 0);
				mat.diffuseColor = goatCream;
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
				const sheepWool = new Color3(0.98, 0.97, 0.94);
				const sheepSkin = new Color3(0.25, 0.2, 0.18);

				// Fluffy wool body built from overlapping spheres.
				body = this.flatShade(MeshBuilder.CreateSphere('sheep-body', { diameter: scale * 1.15, segments: 8 }, this.scene));
				body.position.set(0, 0.55, 0);
				mat.diffuseColor = sheepWool;
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
		const mat = new StandardMaterial(`smokeMat-${this.smokePuffs.length}`, this.scene);
		mat.diffuseColor = color;
		mat.alpha = 0.5;
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
		const mat = new StandardMaterial('coinMat', this.scene);
		mat.diffuseColor = new Color3(1, 0.85, 0);
		mat.backFaceCulling = false;
		mat.alpha = 1;
		mesh.material = mat;
		this.coinLabels.push({ mesh, life: 1.2 });
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
		this.engine.dispose();
	}
}
