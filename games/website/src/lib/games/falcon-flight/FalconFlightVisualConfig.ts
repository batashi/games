/**
 * Falcon Flight — Visual Configuration
 *
 * Single source of truth for every visual/rendering parameter in the game.
 * The Presentation layer reads this config; gameplay logic does not.
 */

import { Scene } from '@babylonjs/core';

export type QualityTierName = 'high' | 'medium' | 'low';

export interface FalconFlightPalette {
	falconBody: string;
	falconHood: string;
	falconWing: string;
	falconTail: string;
	falconBeak: string;
	falconLegBand: string;
	ground: string;
	sun: string;
	ceilingWarning: string;
	dune: string;
	rock: string;
	trunk: string;
	frond: string;
	fort: string;
	cloud: string;
	hare: string;
	houbara: string;
	quail: string;
	cliff: string;
	dustDevil: string;
	vulture: string;
	tailwind: string;
	sharperEyes: string;
	secondWind: string;
}

export interface FogBandConfig {
	/** Meshes behind this Z plane are in the mid-ground and receive light fog. */
	midGroundZ: number;
	/** Meshes behind this Z plane are background silhouettes and receive heavy fog. */
	backgroundZ: number;
}

export interface ShadowConfig {
	mapSize: number;
	blurKernel: number;
	darkness: number;
	frustumSize: number;
}

export interface BloomConfig {
	enabled: boolean;
	threshold: number;
	weight: number;
	kernel: number;
	scale: number;
	glowIntensity: number;
}

export interface CameraConfig {
	alpha: number;
	beta: number;
	radius: number;
	fov: number;
	lowerBetaLimit: number;
	upperBetaLimit: number;
	minRadius: number;
	maxRadius: number;
	minZ: number;
	maxZ: number;
	followSmoothing: number;
	minTargetYOffset: number;
	maxTargetYOffset: number;
	tiltFactor: number;
}

export interface SunConfig {
	position: { x: number; y: number; z: number };
	direction: { x: number; y: number; z: number };
	diffuse: string;
	intensity: number;
}

export interface AmbientConfig {
	intensity: number;
	diffuse: string;
	groundColor: string;
}

export interface ToneMappingConfig {
	exposure: number;
	contrast: number;
}

export interface DepthPlacement {
	zMin: number;
	zMax: number;
	fogEnabled: boolean;
	/** Tint albedo toward fog color for near-monochrome silhouette look. */
	silhouette?: boolean;
}

export interface QualityPreset {
	name: QualityTierName;
	shadows: ShadowConfig;
	bloom: BloomConfig;
	/** Whether to request MSAA from the engine (only effective on High). */
	msaa: boolean;
	/** Engine hardware scaling level. 1.0 = native, higher = lower resolution. */
	hardwareScalingLevel: number;
	/** Multiplier applied to particle emit counts. */
	particleBudget: number;
	/** If true, replace real-time shadows with a simple blob shadow under the player. */
	useBlobShadow: boolean;
	/** Label for logs. */
	label: string;
}

export interface FalconFlightVisualConfig {
	palette: FalconFlightPalette;
	skyColor: string;
	/** Babylon fog mode constant. */
	fogMode: number;
	fogDensity: number;
	/** Fog density during the high-speed "storm" phase. */
	stormFogDensity: number;
	fogColor: string;
	fogBands: FogBandConfig;
	sun: SunConfig;
	ambient: AmbientConfig;
	shadows: ShadowConfig;
	bloom: BloomConfig;
	toneMapping: ToneMappingConfig;
	camera: CameraConfig;
	quality: QualityPreset[];
	/** Visual placement per chunk type. */
	chunkDepth: Record<'dune' | 'rock' | 'palms' | 'fort' | 'cloud', DepthPlacement>;
	/** Speed threshold above which we treat the run as "storm" phase. */
	stormSpeedThreshold: number;
	/** How aggressively the camera tilts when climbing/diving. */
	cameraTiltFactor: number;
}

export const DEFAULT_FALCON_FLIGHT_PALETTE: FalconFlightPalette = {
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

const BASE_SHADOWS: ShadowConfig = {
	mapSize: 2048,
	blurKernel: 24,
	darkness: 0.35,
	frustumSize: 42
};

const BASE_BLOOM: BloomConfig = {
	enabled: true,
	threshold: 0.88,
	weight: 0.06,
	kernel: 32,
	scale: 0.25,
	glowIntensity: 0.25
};

export const DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG: FalconFlightVisualConfig = {
	palette: DEFAULT_FALCON_FLIGHT_PALETTE,
	skyColor: '#a0d8ef',
	fogMode: Scene.FOGMODE_EXP2,
	fogDensity: 0.012,
	stormFogDensity: 0.024,
	fogColor: '#f5d0a9',
	fogBands: {
		midGroundZ: -12,
		backgroundZ: -40
	},
	sun: {
		position: { x: 10, y: 6, z: 16 },
		direction: { x: -0.5, y: -1, z: 0.35 },
		diffuse: '#ffe0a3',
		intensity: 1.25
	},
	ambient: {
		intensity: 0.95,
		diffuse: '#fff5e0',
		groundColor: '#e6cfba'
	},
	shadows: BASE_SHADOWS,
	bloom: BASE_BLOOM,
	toneMapping: {
		exposure: 1.15,
		contrast: 1.15
	},
	camera: {
		alpha: -Math.PI / 2,
		beta: 1.05,
		radius: 26,
		fov: 0.9,
		lowerBetaLimit: 0.85,
		upperBetaLimit: 1.35,
		minRadius: 18,
		maxRadius: 34,
		minZ: 0.5,
		maxZ: 200,
		followSmoothing: 4,
		minTargetYOffset: 1.5,
		maxTargetYOffset: -0.5,
		tiltFactor: 0.08
	},
	quality: [
		{
			name: 'high',
			label: 'High',
			shadows: { ...BASE_SHADOWS },
			bloom: { ...BASE_BLOOM },
			msaa: true,
			hardwareScalingLevel: 1,
			particleBudget: 1,
			useBlobShadow: false
		},
		{
			name: 'medium',
			label: 'Medium',
			shadows: { ...BASE_SHADOWS, mapSize: 1024, blurKernel: 16 },
			bloom: { ...BASE_BLOOM, threshold: 0.92, weight: 0.04 },
			msaa: false,
			hardwareScalingLevel: 1.25,
			particleBudget: 0.5,
			useBlobShadow: false
		},
		{
			name: 'low',
			label: 'Low',
			shadows: { ...BASE_SHADOWS, mapSize: 0, blurKernel: 0 },
			bloom: { ...BASE_BLOOM, enabled: false },
			msaa: false,
			hardwareScalingLevel: 1.5,
			particleBudget: 0.25,
			useBlobShadow: true
		}
	],
	chunkDepth: {
		dune: { zMin: -18, zMax: -28, fogEnabled: true },
		rock: { zMin: -10, zMax: -18, fogEnabled: true },
		palms: { zMin: -8, zMax: -14, fogEnabled: true },
		fort: { zMin: -48, zMax: -68, fogEnabled: true, silhouette: true },
		cloud: { zMin: -36, zMax: -56, fogEnabled: true, silhouette: true }
	},
	stormSpeedThreshold: 11,
	cameraTiltFactor: 0.08
};

export function getQualityPreset(
	config: FalconFlightVisualConfig,
	name: QualityTierName
): QualityPreset {
	const preset = config.quality.find((q) => q.name === name);
	if (!preset) throw new Error(`Unknown quality tier: ${name}`);
	return preset;
}

export function qualityTierNames(config: FalconFlightVisualConfig): QualityTierName[] {
	return config.quality.map((q) => q.name);
}
