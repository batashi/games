/**
 * Falcon Flight — Presentation Layer
 *
 * Owns every visual/rendering concern:
 * - scene, camera, lights, fog, post-processing
 * - materials, environment meshes, falcon mesh, chunk/object meshes
 * - particles, squash-and-stretch, floating text
 * - quality tiers and performance-related visual scaling
 *
 * It contains no game rules. All visual values come from FalconFlightVisualConfig.
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
import { ImageProcessingConfiguration } from '@babylonjs/core/Materials/imageProcessingConfiguration';
import { AdvancedDynamicTexture, Button, TextBlock, Rectangle, Control } from '@babylonjs/gui';
import {
	DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG,
	getQualityPreset,
	qualityTierNames,
	type FalconFlightVisualConfig,
	type QualityPreset,
	type QualityTierName,
	type DepthPlacement
} from './FalconFlightVisualConfig';
import {
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

const FALCON_WORLD_X = -6;

interface ChunkMesh {
	chunk: WorldChunk;
	root: TransformNode;
	meshes: Mesh[];
	zDepth: number;
}

interface ObjectMesh {
	object: WorldObject;
	root: TransformNode;
	meshes: Mesh[];
	glow?: Mesh;
}

export class FalconFlightPresentation {
	private canvas: HTMLCanvasElement;
	private config: FalconFlightVisualConfig;
	private gameConfig: FalconFlightConfig;

	readonly engine: Engine;
	readonly scene: Scene;
	private camera: ArcRotateCamera;

	private hemi!: HemisphericLight;
	private dir!: DirectionalLight;
	private shadowGenerator!: ShadowGenerator;
	private pipeline!: DefaultRenderingPipeline;

	private falconRoot!: TransformNode;
	private falconBody!: Mesh;
	private falconWings: Mesh[] = [];
	private falconTail!: Mesh;
	private falconHood!: Mesh;
	private falconLegBand!: Mesh;
	private blobShadow: Mesh | null = null;

	private ground!: Mesh;
	private sun!: Mesh;
	private ceilingWarning!: Mesh;
	private ceilingLine!: Mesh;

	private chunkMeshes: ChunkMesh[] = [];
	private objectMeshes: ObjectMesh[] = [];
	private particles: { mesh: Mesh; life: number; vy: number; vx: number }[] = [];
	private confettiTexture: DynamicTexture | null = null;

	private gui!: AdvancedDynamicTexture;
	private qualityTier: QualityTierName = 'high';
	private currentQuality: QualityPreset;
	private disposed = false;

	private flapTimer = 0;
	private inputActive = false;
	private stormIntensity = 0;

	private materialCache = new Map<string, PBRMaterial>();

	constructor(
		canvas: HTMLCanvasElement,
		gameConfig?: Partial<FalconFlightConfig>,
		visualConfig?: Partial<FalconFlightVisualConfig>
	) {
		this.canvas = canvas;
		this.gameConfig = { ...DEFAULT_FALCON_FLIGHT_CONFIG, ...gameConfig };
		this.config = this.mergeVisualConfig(
			DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG,
			visualConfig ?? {}
		);
		this.currentQuality = getQualityPreset(this.config, this.qualityTier);

		this.engine = new Engine(canvas, this.currentQuality.msaa, {
			preserveDrawingBuffer: true,
			stencil: true
		});
		this.scene = this.createScene();
		this.camera = this.createCamera();
		this.setupLightsAndShadows();
		this.setupPostProcess();
		this.setupEnvironment();
		this.createFalcon();
		this.setupGui();
	}

	private mergeVisualConfig(
		base: FalconFlightVisualConfig,
		partial: Partial<FalconFlightVisualConfig>
	): FalconFlightVisualConfig {
		return {
			...base,
			...partial,
			palette: { ...base.palette, ...partial.palette },
			fogBands: { ...base.fogBands, ...partial.fogBands },
			sun: { ...base.sun, ...partial.sun },
			ambient: { ...base.ambient, ...partial.ambient },
			shadows: { ...base.shadows, ...partial.shadows },
			bloom: { ...base.bloom, ...partial.bloom },
			toneMapping: { ...base.toneMapping, ...partial.toneMapping },
			camera: { ...base.camera, ...partial.camera },
			chunkDepth: partial.chunkDepth
				? { ...base.chunkDepth, ...partial.chunkDepth }
				: base.chunkDepth,
			quality: partial.quality ?? base.quality
		};
	}

	// ------------------------------------------------------------------
	// Scene / Camera / Lights
	// ------------------------------------------------------------------

	private createScene(): Scene {
		const scene = new Scene(this.engine);
		scene.clearColor = Color4.FromHexString(`${this.config.skyColor}ff`);
		scene.fogMode = this.config.fogMode;
		scene.fogColor = Color3.FromHexString(this.config.fogColor);
		scene.fogDensity = this.config.fogDensity;
		return scene;
	}

	private createCamera(): ArcRotateCamera {
		const c = this.config.camera;
		const camera = new ArcRotateCamera(
			'camera',
			c.alpha,
			c.beta,
			c.radius,
			new Vector3(0, 5, 0),
			this.scene
		);
		camera.fov = c.fov;
		camera.lowerAlphaLimit = c.alpha;
		camera.upperAlphaLimit = c.alpha;
		camera.lowerBetaLimit = c.lowerBetaLimit;
		camera.upperBetaLimit = c.upperBetaLimit;
		camera.lowerRadiusLimit = c.minRadius;
		camera.upperRadiusLimit = c.maxRadius;
		camera.wheelPrecision = 0;
		camera.minZ = c.minZ;
		camera.maxZ = c.maxZ;
		camera.inputs.clear();
		camera.attachControl(false);
		return camera;
	}

	private setupLightsAndShadows(): void {
		const ambient = this.config.ambient;
		this.hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
		this.hemi.intensity = ambient.intensity;
		this.hemi.diffuse = Color3.FromHexString(ambient.diffuse);
		this.hemi.groundColor = Color3.FromHexString(ambient.groundColor);

		const sun = this.config.sun;
		this.dir = new DirectionalLight('dir', new Vector3(sun.direction.x, sun.direction.y, sun.direction.z), this.scene);
		this.dir.intensity = sun.intensity;
		this.dir.diffuse = Color3.FromHexString(sun.diffuse);
		this.dir.position = new Vector3(sun.position.x, sun.position.y, sun.position.z);
		this.dir.shadowMinZ = 1;
		this.dir.shadowMaxZ = 80;
		(this.dir as DirectionalLight & { shadowFrustumSize?: number }).shadowFrustumSize =
			this.config.shadows.frustumSize;

		this.shadowGenerator = new ShadowGenerator(this.config.shadows.mapSize, this.dir);
		this.shadowGenerator.useBlurExponentialShadowMap = true;
		this.shadowGenerator.useKernelBlur = true;
		this.shadowGenerator.blurKernel = this.config.shadows.blurKernel;
		this.shadowGenerator.bias = 0.0005;
		this.shadowGenerator.setDarkness(this.config.shadows.darkness);

		if (this.currentQuality.useBlobShadow) {
			this.disableRealTimeShadows();
		}
	}

	private setupPostProcess(): void {
		this.pipeline = new DefaultRenderingPipeline('falconPipeline', true, this.scene, [this.camera]);
		this.pipeline.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
		this.pipeline.imageProcessing.toneMappingEnabled = true;
		this.pipeline.imageProcessing.exposure = this.config.toneMapping.exposure;
		this.pipeline.imageProcessing.contrast = this.config.toneMapping.contrast;
		this.pipeline.fxaaEnabled = true;

		const bloom = this.currentQuality.bloom;
		this.pipeline.bloomEnabled = bloom.enabled;
		this.pipeline.bloomThreshold = bloom.threshold;
		this.pipeline.bloomWeight = bloom.weight;
		this.pipeline.bloomKernel = bloom.kernel;
		this.pipeline.bloomScale = bloom.scale;
		this.pipeline.glowLayerEnabled = bloom.enabled;
		if (this.pipeline.glowLayer) {
			this.pipeline.glowLayer.intensity = bloom.glowIntensity;
		}
	}

	// ------------------------------------------------------------------
	// Environment
	// ------------------------------------------------------------------

	private setupEnvironment(): void {
		this.scene.environmentTexture = this.createProceduralEnvTexture(this.scene);

		// Ground — gameplay floor, never affected by fog.
		this.ground = MeshBuilder.CreateGround(
			'ground',
			{ width: 120, height: 40, subdivisions: 32 },
			this.scene
		);
		this.ground.position.z = 4;
		this.displaceGround(this.ground);
		this.flatShade(this.ground);
		this.ground.material = this.createPbrMaterial('groundMat', this.config.palette.ground, {
			roughness: 1,
			fogEnabled: false
		});
		this.ground.isPickable = false;
		this.ground.receiveShadows = true;
		this.ground.freezeWorldMatrix();

		// Sun disc.
		this.sun = MeshBuilder.CreateDisc('sun', { radius: 3.2 }, this.scene);
		this.sun.position = new Vector3(
			this.config.sun.position.x,
			this.config.sun.position.y,
			this.config.sun.position.z
		);
		this.flatShade(this.sun);
		this.sun.material = this.createPbrMaterial('sunMat', this.config.palette.sun, {
			emissive: this.config.palette.sun,
			unlit: true,
			fogEnabled: false
		});
		this.sun.isPickable = false;
		this.sun.freezeWorldMatrix();

		// Ceiling warning zone.
		const ceilingY = this.gameConfig.ceilingY;
		this.ceilingWarning = MeshBuilder.CreateBox(
			'ceilingWarning',
			{ width: 120, height: 2.5, depth: 4 },
			this.scene
		);
		this.ceilingWarning.position = new Vector3(0, ceilingY - 1.25, 0);
		this.flatShade(this.ceilingWarning);
		this.ceilingWarning.material = this.createPbrMaterial(
			'ceilingWarningMat',
			this.config.palette.ceilingWarning,
			{
				emissive: this.config.palette.ceilingWarning,
				alpha: 0.18,
				unlit: true,
				fogEnabled: false
			}
		);
		this.ceilingWarning.isPickable = false;
		this.ceilingWarning.freezeWorldMatrix();

		// Solid ceiling line.
		this.ceilingLine = MeshBuilder.CreateBox(
			'ceilingLine',
			{ width: 120, height: 0.25, depth: 0.5 },
			this.scene
		);
		this.ceilingLine.position = new Vector3(0, ceilingY - 0.15, 0);
		this.flatShade(this.ceilingLine);
		this.ceilingLine.material = this.createPbrMaterial(
			'ceilingLineMat',
			this.config.palette.ceilingWarning,
			{
				emissive: this.config.palette.ceilingWarning,
				unlit: true,
				fogEnabled: false
			}
		);
		this.ceilingLine.isPickable = false;
		this.ceilingLine.freezeWorldMatrix();
	}

	private displaceGround(ground: Mesh): void {
		const positions = ground.getVerticesData(VertexBuffer.PositionKind);
		if (!positions) return;
		for (let i = 0; i < positions.length; i += 3) {
			const x = positions[i];
			const z = positions[i + 2];
			positions[i + 1] =
				Math.sin(x * 0.18) * 0.55 +
				Math.cos(z * 0.15) * 0.35 +
				Math.sin((x + z) * 0.08) * 0.2;
		}
		ground.updateVerticesData(VertexBuffer.PositionKind, positions);
		ground.refreshBoundingInfo();
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

	// ------------------------------------------------------------------
	// Materials
	// ------------------------------------------------------------------

	private createPbrMaterial(
		name: string,
		color: string,
		options: {
			emissive?: string;
			alpha?: number;
			unlit?: boolean;
			roughness?: number;
			fogEnabled?: boolean;
			metallic?: number;
		} = {}
	): PBRMaterial {
		const cacheKey = `${name}|${color}|${options.emissive ?? ''}|${options.alpha ?? 1}|${options.unlit ?? false}|${options.roughness ?? 0.85}|${options.fogEnabled ?? true}|${options.metallic ?? 0}`;
		if (this.materialCache.has(cacheKey)) {
			return this.materialCache.get(cacheKey)!;
		}

		const mat = new PBRMaterial(name, this.scene);
		mat.albedoColor = Color3.FromHexString(color);
		mat.metallic = options.metallic ?? 0.0;
		mat.roughness = options.roughness ?? 0.85;
		mat.fogEnabled = options.fogEnabled ?? true;
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
		this.materialCache.set(cacheKey, mat);
		return mat;
	}

	private flatShade(mesh: Mesh): Mesh {
		mesh.convertToFlatShadedMesh();
		return mesh;
	}

	// ------------------------------------------------------------------
	// Falcon
	// ------------------------------------------------------------------

	private createFalcon(): void {
		this.falconRoot = new TransformNode('falconRoot', this.scene);
		this.falconRoot.position.x = FALCON_WORLD_X;
		this.falconRoot.position.y = 5;

		const palette = this.config.palette;
		const bodyMat = this.createPbrMaterial('bodyMat', palette.falconBody, {
			roughness: 0.75,
			fogEnabled: false
		});
		const wingMat = this.createPbrMaterial('wingMat', palette.falconWing, { fogEnabled: false });
		const tailMat = this.createPbrMaterial('tailMat', palette.falconTail, { fogEnabled: false });
		const hoodMat = this.createPbrMaterial('hoodMat', palette.falconHood, { fogEnabled: false });
		const bandMat = this.createPbrMaterial('bandMat', palette.falconLegBand, { fogEnabled: false });
		const beakMat = this.createPbrMaterial('beakMat', palette.falconBeak, { fogEnabled: false });

		// Body.
		this.falconBody = this.flatShade(
			MeshBuilder.CreateSphere('falconBody', { diameter: 0.9, segments: 6 }, this.scene)
		);
		this.falconBody.scaling = new Vector3(1.3, 0.85, 0.85);
		this.falconBody.material = bodyMat;
		this.falconBody.parent = this.falconRoot;
		this.addShadowCaster(this.falconBody);

		// Head.
		const head = this.flatShade(
			MeshBuilder.CreateSphere('falconHead', { diameter: 0.5, segments: 6 }, this.scene)
		);
		head.position = new Vector3(0.55, 0.15, 0);
		head.material = bodyMat;
		head.parent = this.falconRoot;
		this.addShadowCaster(head);

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
		this.addShadowCaster(beak);

		// Hood hint.
		this.falconHood = this.flatShade(
			MeshBuilder.CreateSphere('falconHood', { diameter: 0.52, segments: 6 }, this.scene)
		);
		this.falconHood.position = new Vector3(0.55, 0.18, 0);
		this.falconHood.scaling = new Vector3(1, 0.85, 0.95);
		this.falconHood.material = hoodMat;
		this.falconHood.parent = this.falconRoot;
		this.addShadowCaster(this.falconHood);

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
			this.addShadowCaster(wing);
		}

		// Tail.
		this.falconTail = this.flatShade(
			MeshBuilder.CreateBox('falconTail', { width: 0.7, height: 0.06, depth: 0.7 }, this.scene)
		);
		this.falconTail.position = new Vector3(-0.7, 0, 0);
		this.falconTail.rotation.y = 0.15;
		this.falconTail.material = tailMat;
		this.falconTail.parent = this.falconRoot;
		this.addShadowCaster(this.falconTail);

		// Leg band.
		this.falconLegBand = this.flatShade(
			MeshBuilder.CreateTorus('falconLegBand', { diameter: 0.18, thickness: 0.04, tessellation: 8 }, this.scene)
		);
		this.falconLegBand.position = new Vector3(0.05, -0.35, 0.15);
		this.falconLegBand.rotation.y = Math.PI / 2;
		this.falconLegBand.material = bandMat;
		this.falconLegBand.parent = this.falconRoot;
		this.addShadowCaster(this.falconLegBand);

		// Blob shadow for low quality tier.
		this.createBlobShadow();
	}

	private createBlobShadow(): void {
		this.blobShadow = MeshBuilder.CreateDisc('blobShadow', { radius: 0.55 }, this.scene);
		this.blobShadow.rotation.x = Math.PI / 2;
		this.blobShadow.position = new Vector3(0, 0.02, 0);
		this.blobShadow.material = this.createPbrMaterial('blobShadowMat', '#2b2d42', {
			alpha: 0.35,
			unlit: true,
			fogEnabled: false
		});
		this.blobShadow.parent = this.falconRoot;
		this.blobShadow.isPickable = false;
		this.blobShadow.setEnabled(this.currentQuality.useBlobShadow);
	}

	private addShadowCaster(mesh: Mesh): void {
		if (!this.currentQuality.useBlobShadow) {
			this.shadowGenerator.addShadowCaster(mesh);
		}
	}

	// ------------------------------------------------------------------
	// GUI
	// ------------------------------------------------------------------

	private setupGui(): void {
		this.gui = AdvancedDynamicTexture.CreateFullscreenUI('falconUI');

		const flapButton = Button.CreateSimpleButton('flapBtn', 'رفرف');
		flapButton.width = '128px';
		flapButton.height = '128px';
		flapButton.cornerRadius = 64;
		flapButton.background = this.config.palette.tailwind;
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

	// ------------------------------------------------------------------
	// Sync methods called by FalconFlightGame
	// ------------------------------------------------------------------

	get inputIsActive(): boolean {
		return this.inputActive;
	}

	setInputActive(active: boolean): void {
		this.inputActive = active;
	}

	resize(): void {
		this.engine.resize();
	}

	syncFalcon(state: FalconFlightState, dt: number): void {
		this.falconRoot.position.y = state.falcon.y;

		// Tilt into dives and climbs.
		this.falconRoot.rotation.z = -state.falcon.vy * this.config.cameraTiltFactor;

		// Flap animation.
		if (this.inputActive && state.phase === 'playing') {
			this.flapTimer += dt * 18;
			const flap = Math.sin(this.flapTimer);
			this.falconWings[0].rotation.z = flap * 0.45;
			this.falconWings[1].rotation.z = -flap * 0.45;
		} else {
			this.flapTimer = 0;
			this.falconWings[0].rotation.z = 0.15;
			this.falconWings[1].rotation.z = -0.15;
		}

		// Update storm intensity from speed.
		const targetStorm = state.speed >= this.config.stormSpeedThreshold ? 1 : 0;
		this.stormIntensity += (targetStorm - this.stormIntensity) * Math.min(1, dt * 2);
		const density =
			this.config.fogDensity +
			(this.config.stormFogDensity - this.config.fogDensity) * this.stormIntensity;
		this.scene.fogDensity = density;
	}

	updateCamera(state: FalconFlightState, dt: number): void {
		const c = this.config.camera;
		const minTargetY = this.gameConfig.groundY + c.minTargetYOffset;
		const maxTargetY = this.gameConfig.ceilingY + c.maxTargetYOffset;
		const targetY = Scalar.Clamp(state.falcon.y, minTargetY, maxTargetY);
		const target = new Vector3(0, targetY, 0);
		this.camera.target = Vector3.Lerp(this.camera.target, target, Math.min(1, dt * c.followSmoothing));
	}

	syncChunks(state: FalconFlightState): void {
		const stateChunkIds = new Set(state.chunks.map((c) => c.id));

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

		const placement = this.config.chunkDepth[chunk.type];
		const zDepth = placement.zMin + Math.random() * (placement.zMax - placement.zMin);
		root.position.z = zDepth;

		const meshes: Mesh[] = [];
		const palette = this.config.palette;
		const fogColor = Color3.FromHexString(this.config.fogColor);

		const sandMat = this.createPbrMaterial('sandMat', palette.dune, {
			roughness: 1,
			fogEnabled: placement.fogEnabled
		});
		const rockMat = this.createPbrMaterial('rockMat', palette.rock, {
			fogEnabled: placement.fogEnabled
		});
		const trunkMat = this.createPbrMaterial('trunkMat', palette.trunk, {
			fogEnabled: placement.fogEnabled
		});
		const frondMat = this.createPbrMaterial('frondMat', palette.frond, {
			fogEnabled: placement.fogEnabled
		});
		const fortMat = this.createPbrMaterial('fortMat', palette.fort, {
			fogEnabled: placement.fogEnabled
		});
		const cloudMat = this.createPbrMaterial('cloudMat', palette.cloud, {
			alpha: 0.8,
			fogEnabled: placement.fogEnabled
		});

		// Optional silhouette tint toward fog color.
		const applySilhouette = (mat: PBRMaterial) => {
			if (placement.silhouette) {
				mat.albedoColor = Color3.Lerp(mat.albedoColor, fogColor, 0.55);
				mat.roughness = 1;
			}
		};

		switch (chunk.type) {
			case 'dune': {
				const dune = this.flatShade(
					MeshBuilder.CreateSphere(`dune-${chunk.id}`, { diameter: chunk.width, segments: 5 }, this.scene)
				);
				dune.scaling.y = chunk.height / (chunk.width * 0.5);
				dune.position.y = -chunk.height * 0.25;
				dune.material = sandMat;
				dune.parent = root;
				dune.receiveShadows = !this.currentQuality.useBlobShadow;
				applySilhouette(sandMat);
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
				rock.receiveShadows = !this.currentQuality.useBlobShadow;
				this.addShadowCaster(rock);
				applySilhouette(rockMat);
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
					trunk.receiveShadows = !this.currentQuality.useBlobShadow;
					this.addShadowCaster(trunk);

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
						frond.receiveShadows = !this.currentQuality.useBlobShadow;
					}
				}
				applySilhouette(trunkMat);
				applySilhouette(frondMat);
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
				body.receiveShadows = !this.currentQuality.useBlobShadow;
				this.addShadowCaster(body);
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
				tower.receiveShadows = !this.currentQuality.useBlobShadow;
				this.addShadowCaster(tower);
				meshes.push(tower);
				applySilhouette(fortMat);
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
				applySilhouette(cloudMat);
				break;
			}
		}

		this.chunkMeshes.push({ chunk, root, meshes, zDepth });
	}


	// ------------------------------------------------------------------
	// Objects (prey / hazards / power-ups)
	// ------------------------------------------------------------------

	syncObjects(state: FalconFlightState): void {
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

				if (om.glow) {
					const visible = state.sharperEyesTimer > 0 && updated.category === 'prey';
					om.glow.setEnabled(visible);
					if (visible) {
						const s = 1 + Math.sin(performance.now() * 0.008) * 0.15;
						om.glow.scaling.setAll(s);
					}
				}

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
		root.position.z = 0;

		const meshes: Mesh[] = [];
		const palette = this.config.palette;

		if (object.category === 'prey') {
			const kind = object.kind as PreyType;
			const mat = this.createPbrMaterial(`preyMat-${object.id}`, palette[kind], { fogEnabled: false });

			const body = this.flatShade(
				MeshBuilder.CreateSphere(`preyBody-${object.id}`, { diameter: 0.7, segments: 5 }, this.scene)
			);
			body.scaling = new Vector3(1.1, 0.75, 0.8);
			body.material = mat;
			body.parent = root;
			body.receiveShadows = !this.currentQuality.useBlobShadow;
			this.addShadowCaster(body);
			meshes.push(body);

			const glow = MeshBuilder.CreateSphere(`preyGlow-${object.id}`, { diameter: 1.3, segments: 8 }, this.scene);
			glow.material = this.createPbrMaterial(`preyGlowMat-${object.id}`, palette.sun, {
				emissive: palette.sun,
				alpha: 0.25,
				unlit: true,
				fogEnabled: false
			});
			glow.parent = root;
			glow.setEnabled(false);

			this.objectMeshes.push({ object, root, meshes, glow });
			this.squishStretchBounce(root, 0.35);
			return;
		}

		if (object.category === 'hazard') {
			const kind = object.kind as HazardType;
			const hazardPalette = palette;
			const edgeEmissive = 0.18;

			if (kind === 'cliff') {
				const cliff = this.flatShade(
					MeshBuilder.CreateBox(`hazard-${object.id}`, { width: 1.2, height: 2.4, depth: 0.8 }, this.scene)
				);
				const cliffMat = this.createPbrMaterial(`hazardMat-${object.id}`, hazardPalette.cliff, {
					emissive: hazardPalette.cliff,
					fogEnabled: false
				});
				cliffMat.emissiveColor = cliffMat.emissiveColor.scale(edgeEmissive);
				cliff.material = cliffMat;
				cliff.parent = root;
				cliff.receiveShadows = !this.currentQuality.useBlobShadow;
				this.addShadowCaster(cliff);
				meshes.push(cliff);
			} else if (kind === 'dustDevil') {
				const swirl = this.flatShade(
					MeshBuilder.CreateCylinder(
						`hazard-${object.id}`,
						{ height: 2.2, diameterTop: 0.3, diameterBottom: 1.2, tessellation: 8 },
						this.scene
					)
				);
				swirl.material = this.createPbrMaterial(`hazardMat-${object.id}`, hazardPalette.dustDevil, {
					alpha: 0.55,
					fogEnabled: false
				});
				swirl.parent = root;
				meshes.push(swirl);
			} else if (kind === 'vulture') {
				const body = this.flatShade(
					MeshBuilder.CreateSphere(`hazard-${object.id}`, { diameter: 0.6, segments: 5 }, this.scene)
				);
				body.scaling = new Vector3(1.2, 0.7, 0.6);
				const bodyMat = this.createPbrMaterial(`hazardMat-${object.id}`, hazardPalette.vulture, {
					emissive: hazardPalette.vulture,
					fogEnabled: false
				});
				bodyMat.emissiveColor = bodyMat.emissiveColor.scale(edgeEmissive);
				body.material = bodyMat;
				body.parent = root;
				body.receiveShadows = !this.currentQuality.useBlobShadow;
				this.addShadowCaster(body);
				meshes.push(body);
				for (let s = -1; s <= 1; s += 2) {
					const wing = this.flatShade(
						MeshBuilder.CreateBox(
							`vultureWing-${object.id}-${s}`,
							{ width: 0.8, height: 0.04, depth: 0.35 },
							this.scene
						)
					);
					wing.position.z = s * 0.5;
					wing.rotation.x = s * 0.3;
					wing.material = this.createPbrMaterial(
						`vultureWingMat-${object.id}-${s}`,
						hazardPalette.vulture,
						{ fogEnabled: false }
					);
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
				draft.material = this.createPbrMaterial(`hazardMat-${object.id}`, hazardPalette.dustDevil, {
					alpha: 0.55,
					fogEnabled: false
				});
				draft.parent = root;
				meshes.push(draft);
			}
			this.objectMeshes.push({ object, root, meshes });
			this.squishStretchBounce(root, 0.3);
			return;
		}

		if (object.category === 'powerup') {
			const kind = object.kind as PowerUpType;
			const color = palette[kind];
			const mat = this.createPbrMaterial(`powerupMat-${object.id}`, color, {
				emissive: color,
				fogEnabled: false
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

	// ------------------------------------------------------------------
	// Particles & FX
	// ------------------------------------------------------------------

	spawnSparkles(x: number, y: number): void {
		const budget = this.currentQuality.particleBudget;
		const count = Math.floor(6 * budget);
		if (count <= 0) return;
		for (let i = 0; i < count; i++) {
			const spark = MeshBuilder.CreateSphere(
				`spark-${Date.now()}-${i}`,
				{ diameter: 0.12, segments: 4 },
				this.scene
			);
			spark.position = new Vector3(FALCON_WORLD_X + x, y, 0);
			spark.material = this.createPbrMaterial(`sparkMat-${Date.now()}-${i}`, this.config.palette.sun, {
				emissive: this.config.palette.sun,
				unlit: true,
				fogEnabled: false
			});
			const angle = (i / count) * Math.PI * 2;
			this.particles.push({
				mesh: spark,
				life: 0.4,
				vy: Math.sin(angle) * 2,
				vx: Math.cos(angle) * 2
			});
		}
	}

	private createConfettiTexture(): DynamicTexture {
		if (this.confettiTexture) return this.confettiTexture;
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
		this.confettiTexture = tex;
		return tex;
	}

	spawnConfetti(x: number, y: number, color: Color3, count = 24, darker = false): void {
		const budget = this.currentQuality.particleBudget;
		const finalCount = Math.floor(count * budget);
		if (finalCount <= 0) return;
		const ps = new ParticleSystem('confetti', finalCount, this.scene);
		ps.particleTexture = this.createConfettiTexture();
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
		ps.manualEmitCount = finalCount;
		ps.minEmitPower = 1.6;
		ps.maxEmitPower = 4;
		ps.direction1 = new Vector3(-0.6, 0.4, -0.6);
		ps.direction2 = new Vector3(0.6, 1.2, 0.6);
		ps.gravity = new Vector3(0, -3.5, 0);
		ps.targetStopDuration = 0.9;
		ps.disposeOnStop = true;
		ps.start();
	}

	spawnWindStreaks(): void {
		const budget = this.currentQuality.particleBudget;
		const count = Math.floor(12 * budget);
		if (count <= 0) return;
		for (let i = 0; i < count; i++) {
			const streak = MeshBuilder.CreateBox(
				`windStreak-${Date.now()}-${i}`,
				{ width: 0.8 + Math.random() * 1.2, height: 0.04, depth: 0.04 },
				this.scene
			);
			streak.position = new Vector3(
				FALCON_WORLD_X + 8 + Math.random() * 18,
				2 + Math.random() * 12,
				-2
			);
			streak.material = this.createPbrMaterial(`windMat-${Date.now()}-${i}`, '#ffffff', {
				alpha: 0.35,
				unlit: true,
				fogEnabled: false
			});
			this.particles.push({
				mesh: streak,
				life: 0.25 + Math.random() * 0.25,
				vx: -(8 + Math.random() * 6),
				vy: (Math.random() - 0.5) * 1
			});
		}
	}

	spawnSandParticles(intensity: number): void {
		const budget = this.currentQuality.particleBudget;
		const count = Math.floor(4 * intensity * budget);
		if (count <= 0) return;
		for (let i = 0; i < count; i++) {
			const p = MeshBuilder.CreateSphere(
				`sand-${Date.now()}-${i}`,
				{ diameter: 0.06 + Math.random() * 0.08, segments: 3 },
				this.scene
			);
			p.position = new Vector3(
				FALCON_WORLD_X + 6 + Math.random() * 20,
				Math.random() * 10,
				-1 + Math.random() * 2
			);
			p.material = this.createPbrMaterial(`sandMat-${Date.now()}-${i}`, this.config.palette.dune, {
				unlit: true,
				fogEnabled: true
			});
			this.particles.push({
				mesh: p,
				life: 0.5 + Math.random() * 0.5,
				vx: -(10 + Math.random() * 8),
				vy: (Math.random() - 0.5) * 2
			});
		}
	}

	updateParticles(dt: number): void {
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

	showFloatingText(x: number, y: number, text: string, color: string): void {
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

	squishStretchFalcon(intensity = 0.3): void {
		this.squishStretchBounce(this.falconRoot, intensity);
	}

	squishStretchBounce(target: TransformNode | Mesh, intensity = 0.4, frames = 20): void {
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

	// ------------------------------------------------------------------
	// Quality tiers
	// ------------------------------------------------------------------

	setQualityTier(name: QualityTierName): void {
		if (this.qualityTier === name) return;
		this.qualityTier = name;
		this.currentQuality = getQualityPreset(this.config, name);
		// eslint-disable-next-line no-console
		console.info('[FalconFlight] quality tier:', name);

		// Engine scaling.
		this.engine.setHardwareScalingLevel(this.currentQuality.hardwareScalingLevel);

		// Shadows.
		if (this.currentQuality.useBlobShadow) {
			this.disableRealTimeShadows();
			this.blobShadow?.setEnabled(true);
		} else {
			this.blobShadow?.setEnabled(false);
			const size = this.currentQuality.shadows.mapSize;
			if (size > 0 && this.shadowGenerator.getShadowMap()) {
				this.shadowGenerator.getShadowMap()!.resize(size);
				this.shadowGenerator.useBlurExponentialShadowMap = true;
				this.shadowGenerator.useKernelBlur = true;
				this.shadowGenerator.blurKernel = this.currentQuality.shadows.blurKernel;
			}
			// Re-register shadow casters.
			this.addAllShadowCasters();
		}

		// Bloom.
		const bloom = this.currentQuality.bloom;
		this.pipeline.bloomEnabled = bloom.enabled;
		this.pipeline.bloomThreshold = bloom.threshold;
		this.pipeline.bloomWeight = bloom.weight;
		this.pipeline.bloomKernel = bloom.kernel;
		this.pipeline.bloomScale = bloom.scale;
		this.pipeline.glowLayerEnabled = bloom.enabled;
		if (this.pipeline.glowLayer) {
			this.pipeline.glowLayer.intensity = bloom.glowIntensity;
		}
	}

	getQualityTier(): QualityTierName {
		return this.qualityTier;
	}

	private disableRealTimeShadows(): void {
		this.shadowGenerator.getShadowMap()?.resize(0);
		// Remove all casters.
		const casters = this.shadowGenerator.getShadowMap()?.renderList ?? [];
		for (let i = casters.length - 1; i >= 0; i--) {
			this.shadowGenerator.removeShadowCaster(casters[i]);
		}
	}

	private addAllShadowCasters(): void {
		this.addShadowCaster(this.falconBody);
		// Head, beak, hood, wings, tail, leg band are in falconRoot hierarchy.
		// Adding the root's children recursively would be cleaner, but the original
		// code added meshes individually. We re-add the known meshes.
		const falconMeshes = [
			this.falconBody,
			...this.falconWings,
			this.falconTail,
			this.falconHood,
			this.falconLegBand
		];
		for (const mesh of falconMeshes) {
			if (mesh) this.shadowGenerator.addShadowCaster(mesh);
		}
		for (const cm of this.chunkMeshes) {
			for (const mesh of cm.meshes) {
				if (mesh) this.shadowGenerator.addShadowCaster(mesh);
			}
		}
		for (const om of this.objectMeshes) {
			for (const mesh of om.meshes) {
				if (mesh) this.shadowGenerator.addShadowCaster(mesh);
			}
		}
	}

	// ------------------------------------------------------------------
	// Live tuning
	// ------------------------------------------------------------------

	applyTuning(partial: Partial<FalconFlightVisualConfig>): void {
		this.config = this.mergeVisualConfig(this.config, partial);
		this.applyFogFromConfig();
		this.applyLightingFromConfig();
		this.applyBloomFromConfig();
		this.applySkyFromConfig();
	}

	private applyFogFromConfig(): void {
		this.scene.fogMode = this.config.fogMode;
		this.scene.fogColor = Color3.FromHexString(this.config.fogColor);
		// Keep current density (it may be mid-storm); only reset base.
		this.scene.fogDensity = this.config.fogDensity;
	}

	private applyLightingFromConfig(): void {
		this.hemi.intensity = this.config.ambient.intensity;
		this.hemi.diffuse = Color3.FromHexString(this.config.ambient.diffuse);
		this.hemi.groundColor = Color3.FromHexString(this.config.ambient.groundColor);

		this.dir.intensity = this.config.sun.intensity;
		this.dir.diffuse = Color3.FromHexString(this.config.sun.diffuse);
		this.dir.direction = new Vector3(
			this.config.sun.direction.x,
			this.config.sun.direction.y,
			this.config.sun.direction.z
		);
		this.dir.position = new Vector3(
			this.config.sun.position.x,
			this.config.sun.position.y,
			this.config.sun.position.z
		);
	}

	private applyBloomFromConfig(): void {
		const bloom = this.currentQuality.bloom.enabled ? this.config.bloom : this.currentQuality.bloom;
		this.pipeline.bloomEnabled = bloom.enabled;
		this.pipeline.bloomThreshold = bloom.threshold;
		this.pipeline.bloomWeight = bloom.weight;
		this.pipeline.bloomKernel = bloom.kernel;
		this.pipeline.bloomScale = bloom.scale;
		if (this.pipeline.glowLayer) {
			this.pipeline.glowLayer.intensity = bloom.glowIntensity;
		}
	}

	private applySkyFromConfig(): void {
		this.scene.clearColor = Color4.FromHexString(`${this.config.skyColor}ff`);
		this.scene.environmentTexture = this.createProceduralEnvTexture(this.scene);
	}

	getConfig(): Readonly<FalconFlightVisualConfig> {
		return this.config;
	}

	getQualityTierNames(): QualityTierName[] {
		return qualityTierNames(this.config);
	}

	// ------------------------------------------------------------------
	// Cleanup
	// ------------------------------------------------------------------

	cleanupDynamicMeshes(): void {
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

	dispose(): void {
		if (this.disposed) return;
		this.disposed = true;
		this.cleanupDynamicMeshes();
		this.confettiTexture?.dispose();
		this.gui?.dispose();
		this.pipeline?.dispose();
		this.falconRoot?.dispose();
		this.sun?.dispose();
		this.ground?.dispose();
		this.ceilingWarning?.dispose();
		this.ceilingLine?.dispose();
		this.materialCache.forEach((mat) => mat.dispose());
		this.materialCache.clear();
		this.scene.dispose();
		this.engine.dispose();
	}
}
