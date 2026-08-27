import { describe, it, expect } from 'vitest';
import {
	DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG,
	DEFAULT_FALCON_FLIGHT_PALETTE,
	getQualityPreset,
	qualityTierNames,
	type QualityTierName
} from './FalconFlightVisualConfig';
import { Scene } from '@babylonjs/core';

describe('FalconFlightVisualConfig', () => {
	it('uses EXP2 fog mode by default', () => {
		expect(DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG.fogMode).toBe(Scene.FOGMODE_EXP2);
	});

	it('uses a warm sandy peach fog color', () => {
		expect(DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG.fogColor).toMatch(/^#[0-9a-f]{6}$/i);
		// Should not be neutral grey/white.
		expect(DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG.fogColor.toLowerCase()).not.toBe('#ffffff');
		expect(DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG.fogColor.toLowerCase()).not.toBe('#cccccc');
	});

	it('keeps fog density low and storm density higher', () => {
		const cfg = DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG;
		expect(cfg.fogDensity).toBeGreaterThan(0);
		expect(cfg.stormFogDensity).toBeGreaterThan(cfg.fogDensity);
		expect(cfg.stormFogDensity).toBeLessThan(0.1);
	});

	it('defines gameplay-clear fog bands', () => {
		const bands = DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG.fogBands;
		expect(bands.midGroundZ).toBeLessThan(0);
		expect(bands.backgroundZ).toBeLessThan(bands.midGroundZ);
	});

	it('places background chunk types further back than gameplay', () => {
		const depths = DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG.chunkDepth;
		expect(depths.fort.zMax).toBeLessThan(-30);
		expect(depths.cloud.zMax).toBeLessThan(-30);
		expect(depths.dune.zMax).toBeLessThan(-10);
	});

	it('silhouettes only the deepest scenery', () => {
		const depths = DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG.chunkDepth;
		expect(depths.fort.silhouette).toBe(true);
		expect(depths.cloud.silhouette).toBe(true);
		expect(depths.dune.silhouette).toBeUndefined();
		expect(depths.rock.silhouette).toBeUndefined();
		expect(depths.palms.silhouette).toBeUndefined();
	});

	it('exposes high/medium/low quality tiers', () => {
		expect(qualityTierNames(DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG)).toEqual([
			'high',
			'medium',
			'low'
		]);
	});

	it('each quality tier preserves art-direction invariants', () => {
		for (const name of qualityTierNames(DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG)) {
			const preset = getQualityPreset(DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG, name as QualityTierName);
			expect(preset.name).toBe(name);
			expect(preset.hardwareScalingLevel).toBeGreaterThanOrEqual(1);
			expect(preset.particleBudget).toBeGreaterThan(0);
			expect(preset.particleBudget).toBeLessThanOrEqual(1);
		}
	});

	it('low tier replaces real-time shadows with blob shadow', () => {
		const low = getQualityPreset(DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG, 'low');
		expect(low.useBlobShadow).toBe(true);
		expect(low.bloom.enabled).toBe(false);
		expect(low.shadows.mapSize).toBe(0);
	});

	it('high tier enables full shadows, bloom, and native resolution', () => {
		const high = getQualityPreset(DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG, 'high');
		expect(high.useBlobShadow).toBe(false);
		expect(high.bloom.enabled).toBe(true);
		expect(high.hardwareScalingLevel).toBe(1);
		expect(high.shadows.mapSize).toBeGreaterThan(1024);
	});

	it('palette contains only valid hex colors', () => {
		for (const [key, value] of Object.entries(DEFAULT_FALCON_FLIGHT_PALETTE)) {
			expect(value).toMatch(/^#[0-9a-f]{6}$/i);
		}
	});

	it('palette gives the player the highest saturation accents', () => {
		const palette = DEFAULT_FALCON_FLIGHT_PALETTE;
		// Player falcon body/wing are warm oranges; hazards are purples/dark browns.
		expect(palette.falconBody).toBe('#f3722c');
		expect(palette.falconWing).toBe('#f8961e');
		expect(palette.cliff).toBe('#9d4edd');
		expect(palette.vulture).toBe('#5c4d3c');
	});
});
