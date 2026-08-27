import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FalconFlightPresentation } from './FalconFlightPresentation';
import { DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG } from './FalconFlightVisualConfig';
import { Scene } from '@babylonjs/core';

const hasDom = typeof document !== 'undefined' && typeof window !== 'undefined';

function createMockCanvas(): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	canvas.width = 640;
	canvas.height = 360;
	// Babylon.js needs a WebGL context; in a headless environment this will throw.
	return canvas;
}

describe.skipIf(!hasDom)('FalconFlightPresentation', () => {
	let presentation: FalconFlightPresentation | null = null;

	beforeEach(() => {
		const canvas = createMockCanvas();
		presentation = new FalconFlightPresentation(canvas);
	});

	afterEach(() => {
		presentation?.dispose();
		presentation = null;
	});

	it('creates a scene with EXP2 fog enabled', () => {
		expect(presentation!.scene.fogMode).toBe(Scene.FOGMODE_EXP2);
		expect(presentation!.scene.fogDensity).toBe(DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG.fogDensity);
	});

	it('sets fog color to the configured warm peach', () => {
		const color = presentation!.scene.fogColor;
		const expected = DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG.fogColor;
		expect(color.toHexString().toLowerCase()).toBe(expected.toLowerCase());
	});

	it('starts at the high quality tier', () => {
		expect(presentation!.getQualityTier()).toBe('high');
	});

	it('steps quality down to medium and low', () => {
		presentation!.setQualityTier('medium');
		expect(presentation!.getQualityTier()).toBe('medium');
		presentation!.setQualityTier('low');
		expect(presentation!.getQualityTier()).toBe('low');
	});

	it('applies tuned fog values without recreating the scene', () => {
		presentation!.applyTuning({ fogDensity: 0.03, fogColor: '#ff0000' });
		expect(presentation!.scene.fogDensity).toBe(0.03);
		expect(presentation!.scene.fogColor.toHexString().toLowerCase()).toBe('#ff0000');
	});
});

describe('FalconFlightPresentation (node)', () => {
	it('can be imported without a DOM', () => {
		expect(FalconFlightPresentation).toBeDefined();
	});
});
