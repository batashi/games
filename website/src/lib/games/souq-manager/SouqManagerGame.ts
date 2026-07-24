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
	body: Mesh;
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
	private coinLabels: { mesh: Mesh; life: number }[] = [];
	private highlight: HighlightLayer;

	private lastState: SouqManagerState | null = null;
	private handleResize: () => void;
	private disposed = false;

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

		this.handleResize = () => this.engine.resize();
		window.addEventListener('resize', this.handleResize);

		this.engine.runRenderLoop(() => {
			if (this.disposed) return;
			const dt = this.engine.getDeltaTime() / 1000;
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
		const ground = MeshBuilder.CreateGround('ground', { width: 28, height: 24 }, this.scene);
		const groundMat = new StandardMaterial('groundMat', this.scene);
		groundMat.diffuseColor = new Color3(0.83, 0.73, 0.58);
		ground.material = groundMat;
		ground.position.y = -0.05;

		const counter = MeshBuilder.CreateBox('counter', { width: 10, height: 1.2, depth: 1.5 }, this.scene);
		counter.position = new Vector3(3, 0.6, -4.5);
		const woodMat = new StandardMaterial('woodMat', this.scene);
		woodMat.diffuseColor = new Color3(0.6, 0.4, 0.25);
		counter.material = woodMat;

		const awning = MeshBuilder.CreateBox('awning', { width: 10.5, height: 0.2, depth: 2.5 }, this.scene);
		awning.position = new Vector3(3, 3.2, -4.2);
		const awningMat = new StandardMaterial('awningMat', this.scene);
		awningMat.diffuseColor = new Color3(0.85, 0.25, 0.25);
		awning.material = awningMat;

		this.setupStations();
		this.setupShelves();

		this.cashierMesh = MeshBuilder.CreateGround('cashier', { width: 2, height: 2 }, this.scene);
		this.cashierMesh.position = new Vector3(6, 0.01, -4);
		const cashierMat = new StandardMaterial('cashierMat', this.scene);
		cashierMat.diffuseColor = new Color3(0.2, 0.6, 0.4);
		this.cashierMesh.material = cashierMat;
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
				mesh = MeshBuilder.CreateCylinder(`station-${type}`, { height: 0.2, diameter: 2.5 }, this.scene);
				mat.diffuseColor = new Color3(0.4, 0.3, 0.2);
				break;
			case 'dryingMat':
				mesh = MeshBuilder.CreateGround(`station-${type}`, { width: 1.6, height: 1.2 }, this.scene);
				mat.diffuseColor = new Color3(0.75, 0.65, 0.45);
				break;
			case 'packagingTable':
				mesh = MeshBuilder.CreateBox(`station-${type}`, { width: 1.6, height: 0.8, depth: 1 }, this.scene);
				mat.diffuseColor = new Color3(0.6, 0.4, 0.25);
				break;
			case 'brazier':
				mesh = MeshBuilder.CreateCylinder(`station-${type}`, { height: 0.5, diameter: 0.8 }, this.scene);
				mat.diffuseColor = new Color3(0.25, 0.2, 0.2);
				break;
			case 'mortar':
				mesh = MeshBuilder.CreateCylinder(`station-${type}`, { height: 0.6, diameter: 0.6 }, this.scene);
				mat.diffuseColor = new Color3(0.55, 0.55, 0.55);
				break;
			case 'dallah':
				mesh = MeshBuilder.CreateCylinder(`station-${type}`, { height: 1, diameter: 0.6 }, this.scene);
				mat.diffuseColor = new Color3(0.85, 0.7, 0.2);
				break;
			case 'sortingMat':
				mesh = MeshBuilder.CreateGround(`station-${type}`, { width: 1.4, height: 1 }, this.scene);
				mat.diffuseColor = new Color3(0.8, 0.7, 0.5);
				break;
			case 'greenBeans':
				mesh = MeshBuilder.CreateBox(`station-${type}`, { width: 0.8, height: 0.8, depth: 0.6 }, this.scene);
				mat.diffuseColor = new Color3(0.4, 0.6, 0.3);
				break;
			case 'rawResin':
				mesh = MeshBuilder.CreateBox(`station-${type}`, { width: 0.8, height: 0.5, depth: 0.8 }, this.scene);
				mat.diffuseColor = new Color3(0.9, 0.8, 0.5);
				break;
		}
		mesh.material = mat;
		return mesh;
	}

	private setupShelves(): void {
		const state = this.logic.getState();
		for (const shelf of state.shelves) {
			const mesh = MeshBuilder.CreateBox(`shelf${shelf.id}`, { width: 1.8, height: 1, depth: 0.8 }, this.scene);
			const mat = new StandardMaterial(`shelfMat${shelf.id}`, this.scene);
			mat.diffuseColor = new Color3(0.65, 0.45, 0.3);
			mesh.material = mat;
			mesh.position.x = shelf.position.x;
			mesh.position.z = shelf.position.y;
			mesh.position.y = 0.5;
			this.shelfMeshes.push(mesh);
		}
	}

	private setupInput(): void {
		this.scene.onPointerObservable.add((info) => {
			if (info.type !== PointerEventTypes.POINTERDOWN) return;
			const pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
			if (!pick.hit || !pick.pickedPoint) return;

			const point = { x: pick.pickedPoint.x, y: pick.pickedPoint.z };

			if (pick.pickedMesh && pick.pickedMesh.metadata && typeof pick.pickedMesh.metadata.stationId === 'number') {
				this.logic.movePlayerToStation(pick.pickedMesh.metadata.stationId);
				return;
			}

			if (pick.pickedMesh === this.cashierMesh) {
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

	private syncScene(): void {
		const state = this.lastState;
		if (!state) return;

		this.syncStations(state.stations);
		this.syncShelves(state.shelves);
		this.syncPlayer(state.player.position, state.player.carrying);
		this.syncWorkers(state.workers);
		this.syncCustomers(state.customers);
		this.syncCashier(state.cashierMat.queue.length);
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
				itemMesh.position.y = 1.2;
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
				goodMeshes[j].position.y = 1.25;
				goodMeshes[j].setEnabled(true);
			}
			this.shelfItemMeshes.set(i, goodMeshes);
		}
	}

	private syncPlayer(position: { x: number; y: number }, carrying: Item | null): void {
		if (!this.playerMesh) {
			this.playerMesh = this.createCharacterMesh(new Color3(0.95, 0.95, 0.95), 0.5);
		}
		this.playerMesh.root.position.x = position.x;
		this.playerMesh.root.position.z = position.y;
		this.playerMesh.root.position.y = 0;

		if (carrying) {
			if (!this.carryingMesh) {
				this.carryingMesh = this.createItemMesh(carrying);
			}
			this.carryingMesh.setEnabled(true);
			this.carryingMesh.position.x = this.playerMesh.root.position.x;
			this.carryingMesh.position.z = this.playerMesh.root.position.z;
			this.carryingMesh.position.y = 1.3;
		} else if (this.carryingMesh) {
			this.carryingMesh.setEnabled(false);
		}
	}

	private syncWorkers(workers: { id: number; position: { x: number; y: number } }[]): void {
		for (const [id, mesh] of this.workerMeshes) {
			if (!workers.find((w) => w.id === id)) {
				mesh.root.dispose();
				this.workerMeshes.delete(id);
			}
		}
		for (const worker of workers) {
			let entity = this.workerMeshes.get(worker.id);
			if (!entity) {
				entity = this.createCharacterMesh(new Color3(0.6, 0.8, 0.6), 0.42);
				this.workerMeshes.set(worker.id, entity);
			}
			entity.root.position.x = worker.position.x;
			entity.root.position.z = worker.position.y;
			entity.root.position.y = 0;
		}
	}

	private syncCustomers(customers: { id: number; position: { x: number; y: number }; desiredGood: GoodType; state: string }[]): void {
		for (const [id, mesh] of this.customerMeshes) {
			if (!customers.find((c) => c.id === id)) {
				mesh.root.dispose();
				this.customerMeshes.delete(id);
			}
		}
		for (const customer of customers) {
			let entity = this.customerMeshes.get(customer.id);
			if (!entity) {
				const color = this.customerColor(customer.desiredGood);
				entity = this.createCharacterMesh(color, 0.48);
				this.customerMeshes.set(customer.id, entity);
			}
			entity.root.position.x = customer.position.x;
			entity.root.position.z = customer.position.y;
			entity.root.position.y = 0;
			entity.body.scaling.y = customer.state === 'paying' ? 0.85 : 1;
		}
	}

	private customerColor(desiredGood: GoodType): Color3 {
		switch (desiredGood) {
			case 'dates':
				return new Color3(0.75, 0.55, 0.35); // camel tan
			case 'qahwa':
				return new Color3(0.4, 0.25, 0.15); // falcon brown
			case 'luban':
				return new Color3(0.95, 0.9, 0.75); // oryx cream
		}
	}

	private syncCashier(queueLength: number): void {
		if (!this.cashierMesh) return;
		if (queueLength > 0) {
			this.highlight.addMesh(this.cashierMesh, new Color3(1, 0.85, 0.2));
		} else {
			this.highlight.removeMesh(this.cashierMesh);
		}
	}

	private createCharacterMesh(color: Color3, scale: number): EntityMesh {
		const root = new TransformNode('char', this.scene);
		const body = MeshBuilder.CreateCylinder('body', { height: 0.9, diameter: scale * 1.2 }, this.scene);
		body.position.y = 0.45;
		const mat = new StandardMaterial('bodyMat', this.scene);
		mat.diffuseColor = color;
		body.material = mat;
		body.parent = root;

		const head = MeshBuilder.CreateSphere('head', { diameter: scale * 0.8 }, this.scene);
		head.position.y = 1.05;
		head.material = mat;
		head.parent = root;

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
		this.engine.dispose();
	}
}
