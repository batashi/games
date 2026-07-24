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
	PointerEventTypes,
	HighlightLayer
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
	private shelfItemMeshes = new Map<number, Mesh[]>();
	private temporaryDropMat: Mesh | null = null;
	private temporaryDropItemMesh: Mesh | null = null;
	private temporaryDropRing: Mesh | null = null;
	private coinLabels: { mesh: Mesh; life: number }[] = [];
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
			this.scene.render();
		});

		this.logic.startLevel(options.level ?? 1);
		this.audio.playMusic();
	}

	private setupLights(): void {
		const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
		hemi.intensity = 0.6;
		hemi.groundColor = new Color3(0.55, 0.45, 0.35);

		const dir = new DirectionalLight('dir', new Vector3(-0.5, -1, -0.7), this.scene);
		dir.intensity = 0.8;
		dir.diffuse = new Color3(1, 0.92, 0.75);
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
		const root = MeshBuilder.CreateCylinder(`${name}-soil`, { height: 0.05, diameter: 2.2 }, this.scene);
		const soilMat = new StandardMaterial(`${name}-soilMat`, this.scene);
		soilMat.diffuseColor = new Color3(0.4, 0.3, 0.2);
		root.material = soilMat;

		const trunk = MeshBuilder.CreateCylinder(`${name}-trunk`, { height: 1.6, diameterTop: 0.12, diameterBottom: 0.22 }, this.scene);
		trunk.position.y = 0.8;
		const trunkMat = new StandardMaterial(`${name}-trunkMat`, this.scene);
		trunkMat.diffuseColor = new Color3(0.55, 0.4, 0.25);
		trunk.material = trunkMat;
		trunk.parent = root;

		const leafMat = new StandardMaterial(`${name}-leafMat`, this.scene);
		leafMat.diffuseColor = new Color3(0.3, 0.55, 0.2);
		for (let i = 0; i < 7; i++) {
			const frond = MeshBuilder.CreateBox(`${name}-frond${i}`, { width: 0.12, height: 0.04, depth: 1.3 }, this.scene);
			frond.position.y = 1.55;
			frond.rotation.x = Math.PI / 3.5;
			frond.rotation.y = (i / 7) * Math.PI * 2;
			frond.position.x = Math.cos(frond.rotation.y) * 0.45;
			frond.position.z = Math.sin(frond.rotation.y) * 0.45;
			frond.material = leafMat;
			frond.parent = root;
		}

		const dates = MeshBuilder.CreateSphere(`${name}-dates`, { diameter: 0.32 }, this.scene);
		dates.position.y = 1.35;
		dates.position.z = 0.35;
		const datesMat = new StandardMaterial(`${name}-datesMat`, this.scene);
		datesMat.diffuseColor = new Color3(0.75, 0.6, 0.15);
		dates.material = datesMat;
		dates.parent = root;

		return root;
	}

	private createFrankincenseTree(name: string): Mesh {
		const root = MeshBuilder.CreateCylinder(`${name}-trunk`, { height: 1.1, diameterTop: 0.1, diameterBottom: 0.18 }, this.scene);
		root.position.y = 0.55;
		const trunkMat = new StandardMaterial(`${name}-trunkMat`, this.scene);
		trunkMat.diffuseColor = new Color3(0.45, 0.35, 0.25);
		root.material = trunkMat;

		const leafMat = new StandardMaterial(`${name}-leafMat`, this.scene);
		leafMat.diffuseColor = new Color3(0.35, 0.5, 0.25);
		for (let i = 0; i < 5; i++) {
			const branch = MeshBuilder.CreateSphere(`${name}-leaf${i}`, { diameter: 0.55 }, this.scene);
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
			const lump = MeshBuilder.CreateSphere(`${name}-resin${i}`, { diameter: 0.14 }, this.scene);
			lump.position.y = 0.08;
			lump.position.x = 0.25 + (i % 2) * 0.2;
			lump.position.z = (i < 2 ? -0.15 : 0.15);
			lump.material = resinMat;
			lump.parent = root;
		}

		return root;
	}

	private createCoffeeSack(name: string): Mesh {
		const root = MeshBuilder.CreateSphere(`${name}-sack`, { diameter: 0.8 }, this.scene);
		root.position.y = 0.35;
		root.scaling.y = 0.85;
		const sackMat = new StandardMaterial(`${name}-sackMat`, this.scene);
		sackMat.diffuseColor = new Color3(0.65, 0.55, 0.35);
		root.material = sackMat;

		const top = MeshBuilder.CreateCylinder(`${name}-top`, { height: 0.08, diameterTop: 0.35, diameterBottom: 0.5 }, this.scene);
		top.position.y = 0.55;
		const topMat = new StandardMaterial(`${name}-topMat`, this.scene);
		topMat.diffuseColor = new Color3(0.55, 0.45, 0.3);
		top.material = topMat;
		top.parent = root;

		const beanMat = new StandardMaterial(`${name}-beanMat`, this.scene);
		beanMat.diffuseColor = new Color3(0.4, 0.6, 0.3);
		for (let i = 0; i < 5; i++) {
			const bean = MeshBuilder.CreateSphere(`${name}-bean${i}`, { diameter: 0.1 }, this.scene);
			bean.position.y = 0.5;
			bean.position.x = (Math.random() - 0.5) * 0.25;
			bean.position.z = (Math.random() - 0.5) * 0.25;
			bean.material = beanMat;
			bean.parent = root;
		}

		return root;
	}

	private createBrazier(name: string): Mesh {
		const root = MeshBuilder.CreateCylinder(`${name}-bowl`, { height: 0.35, diameter: 0.85, tessellation: 16 }, this.scene);
		root.position.y = 0.2;
		const bowlMat = new StandardMaterial(`${name}-bowlMat`, this.scene);
		bowlMat.diffuseColor = new Color3(0.25, 0.2, 0.2);
		root.material = bowlMat;

		const coal = MeshBuilder.CreateSphere(`${name}-coal`, { diameter: 0.5 }, this.scene);
		coal.position.y = 0.18;
		coal.scaling.y = 0.4;
		const coalMat = new StandardMaterial(`${name}-coalMat`, this.scene);
		coalMat.diffuseColor = new Color3(0.15, 0.12, 0.1);
		coal.material = coalMat;
		coal.parent = root;

		return root;
	}

	private createMortar(name: string): Mesh {
		const root = MeshBuilder.CreateSphere(`${name}-bowl`, { diameter: 0.6 }, this.scene);
		root.position.y = 0.3;
		root.scaling.y = 0.65;
		const bowlMat = new StandardMaterial(`${name}-bowlMat`, this.scene);
		bowlMat.diffuseColor = new Color3(0.5, 0.5, 0.5);
		root.material = bowlMat;

		const pestle = MeshBuilder.CreateCylinder(`${name}-pestle`, { height: 0.5, diameter: 0.1 }, this.scene);
		pestle.position.y = 0.55;
		pestle.rotation.z = 0.3;
		const pestleMat = new StandardMaterial(`${name}-pestleMat`, this.scene);
		pestleMat.diffuseColor = new Color3(0.4, 0.35, 0.3);
		pestle.material = pestleMat;
		pestle.parent = root;

		return root;
	}

	private createDallah(name: string): Mesh {
		const root = MeshBuilder.CreateSphere(`${name}-body`, { diameter: 0.65 }, this.scene);
		root.position.y = 0.45;
		root.scaling.y = 1.1;
		const bodyMat = new StandardMaterial(`${name}-bodyMat`, this.scene);
		bodyMat.diffuseColor = new Color3(0.85, 0.7, 0.2);
		root.material = bodyMat;

		const neck = MeshBuilder.CreateCylinder(`${name}-neck`, { height: 0.45, diameter: 0.22 }, this.scene);
		neck.position.y = 0.95;
		neck.material = bodyMat;
		neck.parent = root;

		const spout = MeshBuilder.CreateCylinder(`${name}-spout`, { height: 0.45, diameterTop: 0.08, diameterBottom: 0.16 }, this.scene);
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
		}
	}

	private createItemMesh(item: Item): Mesh {
		const color = this.itemColor(item);
		const mesh = MeshBuilder.CreateSphere(`item-${item.type}-${item.stage}`, { diameter: 0.35 }, this.scene);
		const mat = new StandardMaterial(`itemMat-${item.type}-${item.stage}`, this.scene);
		mat.diffuseColor = color;
		mesh.material = mat;
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
		const body = MeshBuilder.CreateSphere('body', { diameter: scale * 1.1, segments: 16 }, this.scene);
		body.position.y = 0.42;
		body.scaling.set(1, 1.15, 0.9);
		const robeMat = new StandardMaterial('robeMat', this.scene);
		robeMat.diffuseColor = robeColor;
		body.material = robeMat;
		body.parent = root;

		// Cream cat head.
		const head = MeshBuilder.CreateSphere('head', { diameter: scale * 0.72, segments: 16 }, this.scene);
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
		const cover = MeshBuilder.CreateSphere('cover', { diameter: scale * 0.78, segments: 16 }, this.scene);
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
			const eye = MeshBuilder.CreateSphere(`eye${side}`, { diameter: 0.12 }, this.scene);
			eye.position.set(side * 0.14, 0.98, 0.3);
			eye.material = eyeWhiteMat;
			eye.parent = root;

			const pupil = MeshBuilder.CreateSphere(`pupil${side}`, { diameter: 0.06 }, this.scene);
			pupil.position.set(side * 0.14, 0.98, 0.35);
			pupil.material = pupilMat;
			pupil.parent = root;
		}

		// Tiny cat tail.
		const tail = MeshBuilder.CreateCylinder('tail', { height: 0.36, diameterTop: 0.04, diameterBottom: 0.08, tessellation: 8 }, this.scene);
		tail.position.set(0, 0.35, -0.38);
		tail.rotation.x = -0.5;
		tail.material = furMat;
		tail.parent = root;

		// Small paws peeking from robe.
		const pawMat = new StandardMaterial('pawMat', this.scene);
		pawMat.diffuseColor = new Color3(0.98, 0.88, 0.72);
		for (const side of [-1, 1]) {
			const paw = MeshBuilder.CreateSphere(`paw${side}`, { diameter: 0.12 }, this.scene);
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
				const eye = MeshBuilder.CreateSphere(`${type}-eye${side}`, { diameter: size * 2 }, this.scene);
				eye.position.set(side * x, y, z);
				eye.material = eyeWhiteMat;
				eye.parent = root;

				const pupil = MeshBuilder.CreateSphere(`${type}-pupil${side}`, { diameter: size }, this.scene);
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
					const foot = MeshBuilder.CreateSphere(`${type}-foot${side}-${z}`, { diameter: size * 2 }, this.scene);
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
				body = MeshBuilder.CreateSphere('camel-body', { diameter: scale * 1.25, segments: 16 }, this.scene);
				body.scaling.set(1, 0.75, 1.35);
				body.position.set(0, 0.62, -0.05);
				body.material = mat;
				body.parent = root;

				// Hump.
				const hump = MeshBuilder.CreateSphere('camel-hump', { diameter: scale * 0.55, segments: 16 }, this.scene);
				hump.position.set(0, 1.02, -0.22);
				hump.scaling.set(0.85, 1, 0.85);
				hump.material = mat;
				hump.parent = root;

				// Neck: curved cylinder.
				const neck = MeshBuilder.CreateCylinder('camel-neck', { height: 0.62, diameterTop: 0.14, diameterBottom: 0.22, tessellation: 12 }, this.scene);
				neck.position.set(0, 1.0, 0.42);
				neck.rotation.x = -0.55;
				neck.material = mat;
				neck.parent = root;

				// Head group for animation.
				const headGroup = new TransformNode('camel-headGroup', this.scene);
				headGroup.position.set(0, 1.28, 0.72);
				headGroup.parent = root;

				const head = MeshBuilder.CreateSphere('camel-head', { diameter: scale * 0.52, segments: 16 }, this.scene);
				head.scaling.set(0.9, 0.95, 1.15);
				head.material = mat;
				head.parent = headGroup;

				// Snout.
				const snout = MeshBuilder.CreateSphere('camel-snout', { diameter: 0.24, segments: 12 }, this.scene);
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
				const tail = MeshBuilder.CreateCylinder('camel-tail', { height: 0.36, diameterTop: 0.04, diameterBottom: 0.07, tessellation: 8 }, this.scene);
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
					const upper = MeshBuilder.CreateCylinder(`camel-legUpper${i}`, { height: 0.35, diameter: 0.14, tessellation: 10 }, this.scene);
					upper.position.set(pos.x, 0.38, pos.z);
					upper.material = legMat;
					upper.parent = root;

					const lower = MeshBuilder.CreateCylinder(`camel-legLower${i}`, { height: 0.32, diameter: 0.11, tessellation: 10 }, this.scene);
					lower.position.set(pos.x, 0.12, pos.z + 0.02);
					lower.material = legMat;
					lower.parent = root;

					const foot = MeshBuilder.CreateBox(`camel-foot${i}`, { width: 0.13, height: 0.06, depth: 0.18 }, this.scene);
					foot.position.set(pos.x, 0.03, pos.z + 0.04);
					foot.material = legMat;
					foot.parent = root;
				}
				break;
			}
			case 'falcon': {
				mat.diffuseColor = new Color3(0.76, 0.53, 0.3);
				body = MeshBuilder.CreateSphere('falcon-body', { diameter: scale * 1.05 }, this.scene);
				body.scaling.z = 1.2;
				body.position.y = 0.55;
				body.material = mat;
				body.parent = root;

				const head = MeshBuilder.CreateSphere('falcon-head', { diameter: scale * 0.5 }, this.scene);
				head.position.set(0, 0.82, 0.48);
				head.material = mat;
				head.parent = root;

				const wingL = MeshBuilder.CreateBox('falcon-wingL', { width: 0.45, height: 0.04, depth: 0.28 }, this.scene);
				wingL.position.set(-0.32, 0.62, -0.05);
				wingL.rotation.z = 0.2;
				wingL.material = mat;
				wingL.parent = root;

				const wingR = MeshBuilder.CreateBox('falcon-wingR', { width: 0.45, height: 0.04, depth: 0.28 }, this.scene);
				wingR.position.set(0.32, 0.62, -0.05);
				wingR.rotation.z = -0.2;
				wingR.material = mat;
				wingR.parent = root;

				const beak = MeshBuilder.CreateCylinder('falcon-beak', { height: 0.2, diameterTop: 0, diameterBottom: 0.1 }, this.scene);
				beak.position.set(0, 0.82, 0.72);
				beak.rotation.x = Math.PI / 2;
				const beakMat = new StandardMaterial('beakMat', this.scene);
				beakMat.diffuseColor = new Color3(0.95, 0.75, 0.2);
				beak.material = beakMat;
				beak.parent = root;

				addEyes(0.1, 0.86, 0.6);
				addFeet(0.15, 0.12, 0.12, new Color3(0.9, 0.7, 0.25));
				break;
			}
			case 'oryx': {
				mat.diffuseColor = new Color3(0.96, 0.91, 0.82);
				body = MeshBuilder.CreateSphere('oryx-body', { diameter: scale * 1.2 }, this.scene);
				body.scaling.z = 1.3;
				body.position.y = 0.52;
				body.material = mat;
				body.parent = root;

				const neck = MeshBuilder.CreateCylinder('oryx-neck', { height: 0.4, diameterTop: 0.12, diameterBottom: 0.16 }, this.scene);
				neck.position.set(0, 0.85, 0.42);
				neck.rotation.x = -0.4;
				neck.material = mat;
				neck.parent = root;

				const head = MeshBuilder.CreateSphere('oryx-head', { diameter: scale * 0.5 }, this.scene);
				head.position.set(0, 1.05, 0.58);
				head.material = mat;
				head.parent = root;

				const hornMat = new StandardMaterial('oryxHornMat', this.scene);
				hornMat.diffuseColor = new Color3(0.92, 0.86, 0.72);
				for (const side of [-1, 1]) {
					const horn = MeshBuilder.CreateCylinder(`oryx-horn${side}`, { height: 0.7, diameter: 0.04 }, this.scene);
					horn.position.set(side * 0.16, 1.42, 0.52);
					horn.rotation.x = -0.55;
					horn.rotation.z = side * 0.3;
					horn.material = hornMat;
					horn.parent = root;
				}

				addEyes(0.11, 1.08, 0.68);
				addFeet(0.18, -0.18, 0.2, new Color3(0.9, 0.85, 0.75));
				break;
			}
			case 'fox': {
				mat.diffuseColor = new Color3(0.95, 0.55, 0.25);
				body = MeshBuilder.CreateSphere('fox-body', { diameter: scale }, this.scene);
				body.scaling.z = 1.3;
				body.position.y = 0.48;
				body.material = mat;
				body.parent = root;

				const head = MeshBuilder.CreateSphere('fox-head', { diameter: scale * 0.55 }, this.scene);
				head.position.set(0, 0.78, 0.55);
				head.material = mat;
				head.parent = root;

				const snout = MeshBuilder.CreateSphere('fox-snout', { diameter: 0.18 }, this.scene);
				snout.position.set(0, 0.75, 0.78);
				snout.scaling.z = 1.5;
				snout.material = mat;
				snout.parent = root;

				const tail = MeshBuilder.CreateCylinder('fox-tail', { height: 0.5, diameterTop: 0.06, diameterBottom: 0.2 }, this.scene);
				tail.position.set(0, 0.55, -0.55);
				tail.rotation.x = -0.6;
				tail.material = mat;
				tail.parent = root;

				const earMat = new StandardMaterial('foxEarMat', this.scene);
				earMat.diffuseColor = new Color3(0.9, 0.5, 0.22);
				for (const side of [-1, 1]) {
					const ear = MeshBuilder.CreateCylinder(`fox-ear${side}`, { height: 0.2, diameterTop: 0, diameterBottom: 0.12 }, this.scene);
					ear.position.set(side * 0.16, 0.98, 0.55);
					ear.rotation.x = -0.2;
					ear.material = earMat;
					ear.parent = root;
				}

				addEyes(0.1, 0.82, 0.68);
				addFeet(0.15, -0.15, 0.18, new Color3(0.85, 0.42, 0.18));
				break;
			}
			case 'goat': {
				mat.diffuseColor = new Color3(0.9, 0.9, 0.88);
				body = MeshBuilder.CreateSphere('goat-body', { diameter: scale * 1.1 }, this.scene);
				body.scaling.z = 1.25;
				body.position.y = 0.5;
				body.material = mat;
				body.parent = root;

				const head = MeshBuilder.CreateSphere('goat-head', { diameter: scale * 0.5 }, this.scene);
				head.position.set(0, 0.88, 0.48);
				head.material = mat;
				head.parent = root;

				const hornMat = new StandardMaterial('goatHornMat', this.scene);
				hornMat.diffuseColor = new Color3(0.52, 0.46, 0.42);
				for (const side of [-1, 1]) {
					const horn = MeshBuilder.CreateCylinder(`goat-horn${side}`, { height: 0.32, diameterTop: 0.03, diameterBottom: 0.08 }, this.scene);
					horn.position.set(side * 0.18, 1.12, 0.48);
					horn.rotation.z = side * 0.6;
					horn.rotation.x = -0.35;
					horn.material = hornMat;
					horn.parent = root;
				}

				const beardMat = new StandardMaterial('goatBeardMat', this.scene);
				beardMat.diffuseColor = new Color3(0.7, 0.7, 0.68);
				const beard = MeshBuilder.CreateSphere('goat-beard', { diameter: 0.12 }, this.scene);
				beard.position.set(0, 0.72, 0.6);
				beard.material = beardMat;
				beard.parent = root;

				addEyes(0.1, 0.9, 0.6);
				addFeet(0.15, -0.15, 0.18, new Color3(0.55, 0.5, 0.45));
				break;
			}
			case 'sheep': {
				mat.diffuseColor = new Color3(0.96, 0.95, 0.92);
				body = MeshBuilder.CreateSphere('sheep-body', { diameter: scale * 1.25 }, this.scene);
				body.position.y = 0.5;
				body.material = mat;
				body.parent = root;

				const head = MeshBuilder.CreateSphere('sheep-head', { diameter: scale * 0.5 }, this.scene);
				head.position.set(0, 0.86, 0.45);
				head.material = mat;
				head.parent = root;

				for (const side of [-1, 1]) {
					const puff = MeshBuilder.CreateSphere(`sheep-puff${side}`, { diameter: scale * 0.45 }, this.scene);
					puff.position.set(side * 0.35, 0.55, 0);
					puff.material = mat;
					puff.parent = root;
				}

				addEyes(0.1, 0.89, 0.58);
				addFeet(0.15, -0.15, 0.18, new Color3(0.62, 0.57, 0.52));
				break;
			}
			default: {
				body = MeshBuilder.CreateSphere('fallback-body', { diameter: scale }, this.scene);
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
