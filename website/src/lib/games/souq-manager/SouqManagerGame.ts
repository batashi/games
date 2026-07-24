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
	Animation,
	HighlightLayer
} from '@babylonjs/core';
import {
	SouqManagerLogic,
	type SouqManagerState,
	type SouqManagerConfig,
	type SouqGood,
	SOUQ_GOODS
} from './SouqManagerLogic';

export type { SouqManagerState, SouqGood };

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

	playRestock(): void {
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
	private workerMeshes = new Map<number, EntityMesh>();
	private customerMeshes = new Map<number, EntityMesh>();
	private shelfMeshes: Mesh[] = [];
	private crateMesh: Mesh | null = null;
	private cashierMesh: Mesh | null = null;
	private goodMeshes = new Map<number, Mesh[]>();
	private carryingMesh: Mesh | null = null;
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
				onCustomerServed: () => this.audio.playRestock(),
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

	// --- Setup --------------------------------------------------------------

	private setupLights(): void {
		const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
		hemi.intensity = 0.6;
		hemi.groundColor = new Color3(0.55, 0.45, 0.35);

		const dir = new DirectionalLight('dir', new Vector3(-0.5, -1, -0.7), this.scene);
		dir.intensity = 0.8;
		dir.diffuse = new Color3(1, 0.92, 0.75);
	}

	private setupCamera(): void {
		this.camera = new UniversalCamera('cam', new Vector3(0, 12, 14), this.scene);
		this.camera.setTarget(new Vector3(0, 0, -1));
		this.camera.mode = UniversalCamera.ORTHOGRAPHIC_CAMERA;
		this.camera.orthoLeft = -10;
		this.camera.orthoRight = 10;
		this.camera.orthoTop = 8;
		this.camera.orthoBottom = -8;
		this.camera.inputs.clear();
	}

	private setupEnvironment(): void {
		// Ground
		const ground = MeshBuilder.CreateGround('ground', { width: 24, height: 20 }, this.scene);
		const groundMat = new StandardMaterial('groundMat', this.scene);
		groundMat.diffuseColor = new Color3(0.83, 0.73, 0.58);
		ground.material = groundMat;
		ground.position.y = -0.05;

		// Stall counter
		const counter = MeshBuilder.CreateBox('counter', { width: 8, height: 1.2, depth: 1.5 }, this.scene);
		counter.position = new Vector3(2, 0.6, -3.5);
		const woodMat = new StandardMaterial('woodMat', this.scene);
		woodMat.diffuseColor = new Color3(0.6, 0.4, 0.25);
		counter.material = woodMat;

		// Awning
		const awning = MeshBuilder.CreateBox('awning', { width: 8.5, height: 0.2, depth: 2.5 }, this.scene);
		awning.position = new Vector3(2, 3.2, -3.2);
		const awningMat = new StandardMaterial('awningMat', this.scene);
		awningMat.diffuseColor = new Color3(0.85, 0.25, 0.25);
		awning.material = awningMat;

		// Stock crate
		this.crateMesh = MeshBuilder.CreateBox('crate', { width: 1.4, height: 1, depth: 1.4 }, this.scene);
		this.crateMesh.position = new Vector3(-6, 0.5, -4);
		const crateMat = new StandardMaterial('crateMat', this.scene);
		crateMat.diffuseColor = new Color3(0.5, 0.35, 0.2);
		this.crateMesh.material = crateMat;

		// Cashier mat
		this.cashierMesh = MeshBuilder.CreateGround('cashier', { width: 2, height: 2 }, this.scene);
		this.cashierMesh.position = new Vector3(5, 0.01, -3);
		const cashierMat = new StandardMaterial('cashierMat', this.scene);
		cashierMat.diffuseColor = new Color3(0.2, 0.6, 0.4);
		this.cashierMesh.material = cashierMat;
	}

	private setupInput(): void {
		this.scene.onPointerObservable.add((info) => {
			if (info.type !== PointerEventTypes.POINTERDOWN) return;
			const pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
			if (!pick.hit || !pick.pickedPoint) return;

			const point = { x: pick.pickedPoint.x, y: pick.pickedPoint.z };

			// Tap on crate, shelf, or cashier to move there.
			if (pick.pickedMesh === this.crateMesh) {
				this.logic.movePlayerToCrate();
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

			this.logic.movePlayerToPoint(point);
		});
	}

	// --- Scene sync ---------------------------------------------------------

	private syncScene(): void {
		const state = this.lastState;
		if (!state) return;

		this.ensureShelves(state.shelves.length);
		this.syncShelves(state.shelves);
		this.syncCrate(state.crate.nextGood);
		this.syncPlayer(state.player.position, state.player.carrying);
		this.syncWorkers(state.workers);
		this.syncCustomers(state.customers);
		this.syncCashier(state.cashierMat.queue.length);
	}

	private ensureShelves(count: number): void {
		while (this.shelfMeshes.length < count) {
			const shelf = MeshBuilder.CreateBox(`shelf${this.shelfMeshes.length}`, { width: 1.8, height: 1.2, depth: 0.8 }, this.scene);
			const mat = new StandardMaterial(`shelfMat${this.shelfMeshes.length}`, this.scene);
			mat.diffuseColor = new Color3(0.65, 0.45, 0.3);
			shelf.material = mat;
			this.shelfMeshes.push(shelf);
		}
	}

	private syncShelves(shelves: { id: number; position: { x: number; y: number }; goods: SouqGood[] }[]): void {
		for (let i = 0; i < shelves.length; i++) {
			const shelf = shelves[i];
			const mesh = this.shelfMeshes[i];
			mesh.position.x = shelf.position.x;
			mesh.position.z = shelf.position.y;
			mesh.position.y = 0.6;

			let goodMeshes = this.goodMeshes.get(i) ?? [];
			while (goodMeshes.length < shelf.goods.length) {
				const goodMesh = this.createGoodMesh(shelf.goods[goodMeshes.length]);
				goodMeshes.push(goodMesh);
			}
			while (goodMeshes.length > shelf.goods.length) {
				const removed = goodMeshes.pop();
				removed?.dispose();
			}
			for (let j = 0; j < goodMeshes.length; j++) {
				goodMeshes[j].position.x = mesh.position.x + (j % 2 === 0 ? -0.35 : 0.35);
				goodMeshes[j].position.z = mesh.position.z + (j < 2 ? -0.15 : 0.15);
				goodMeshes[j].position.y = 1.35;
				goodMeshes[j].setEnabled(true);
			}
			this.goodMeshes.set(i, goodMeshes);
		}
	}

	private createGoodMesh(good: SouqGood): Mesh {
		const color = this.goodColor(good);
		const mesh = MeshBuilder.CreateSphere(`good-${good}`, { diameter: 0.35 }, this.scene);
		const mat = new StandardMaterial(`goodMat-${good}`, this.scene);
		mat.diffuseColor = color;
		mesh.material = mat;
		return mesh;
	}

	private goodColor(good: SouqGood): Color3 {
		switch (good) {
			case 'dates':
				return new Color3(0.5, 0.3, 0.15);
			case 'qahwa':
				return new Color3(0.25, 0.15, 0.1);
			case 'luban':
				return new Color3(0.95, 0.9, 0.7);
			case 'oud':
				return new Color3(0.4, 0.25, 0.1);
			case 'saffron':
				return new Color3(0.9, 0.2, 0.2);
			case 'halwa':
				return new Color3(0.95, 0.7, 0.4);
			case 'pearls':
				return new Color3(0.95, 0.95, 0.95);
		}
	}

	private syncCrate(nextGood: SouqGood | null): void {
		if (!this.crateMesh) return;
		if (nextGood) {
			this.highlight.addMesh(this.crateMesh, new Color3(1, 0.9, 0.3));
		} else {
			this.highlight.removeMesh(this.crateMesh);
		}
	}

	private syncPlayer(position: { x: number; y: number }, carrying: SouqGood | null): void {
		if (!this.playerMesh) {
			this.playerMesh = this.createCharacterMesh(new Color3(0.2, 0.5, 0.9), 0.5);
		}
		this.playerMesh.root.position.x = position.x;
		this.playerMesh.root.position.z = position.y;
		this.playerMesh.root.position.y = 0;

		if (carrying) {
			if (!this.carryingMesh) {
				this.carryingMesh = this.createGoodMesh(carrying);
			}
			this.carryingMesh.setEnabled(true);
			this.carryingMesh.position.x = this.playerMesh.root.position.x;
			this.carryingMesh.position.z = this.playerMesh.root.position.z;
			this.carryingMesh.position.y = 1.2;
		} else if (this.carryingMesh) {
			this.carryingMesh.setEnabled(false);
		}
	}

	private syncWorkers(workers: { id: number; position: { x: number; y: number }; role: 'restocker' | 'cashier' }[]): void {
		// Remove stale meshes.
		for (const [id, mesh] of this.workerMeshes) {
			if (!workers.find((w) => w.id === id)) {
				mesh.root.dispose();
				this.workerMeshes.delete(id);
			}
		}
		// Add/update.
		for (const worker of workers) {
			let entity = this.workerMeshes.get(worker.id);
			if (!entity) {
				const color = worker.role === 'restocker' ? new Color3(0.2, 0.7, 0.3) : new Color3(0.9, 0.6, 0.1);
				entity = this.createCharacterMesh(color, 0.42);
				this.workerMeshes.set(worker.id, entity);
			}
			entity.root.position.x = worker.position.x;
			entity.root.position.z = worker.position.y;
			entity.root.position.y = 0;
		}
	}

	private syncCustomers(customers: { id: number; position: { x: number; y: number }; state: string }[]): void {
		for (const [id, mesh] of this.customerMeshes) {
			if (!customers.find((c) => c.id === id)) {
				mesh.root.dispose();
				this.customerMeshes.delete(id);
			}
		}
		for (const customer of customers) {
			let entity = this.customerMeshes.get(customer.id);
			if (!entity) {
				entity = this.createCharacterMesh(new Color3(0.9, 0.4, 0.4), 0.45);
				this.customerMeshes.set(customer.id, entity);
			}
			entity.root.position.x = customer.position.x;
			entity.root.position.z = customer.position.y;
			entity.root.position.y = 0;
			entity.body.scaling.y = customer.state === 'paying' ? 0.8 : 1;
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

	// --- Public API ---------------------------------------------------------

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

	hireWorker(role: 'restocker' | 'cashier'): boolean {
		return this.logic.hireWorker(role);
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
