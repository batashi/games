/**
 * Falcon Flight — Live Visual Tuning Overlay
 *
 * Dev-only UI for iterating visual parameters. Mounts only when:
 *   import.meta.env.DEV is true AND window.location.search includes 'tune=1'
 *
 * Changes flow through FalconFlightPresentation.applyTuning() and can be copied
 * back into FalconFlightVisualConfig.ts as tuned defaults.
 */

import { FalconFlightPresentation } from './FalconFlightPresentation';
import { DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG, type FalconFlightVisualConfig } from './FalconFlightVisualConfig';

export class FalconFlightTuningOverlay {
	private presentation: FalconFlightPresentation;
	private container: HTMLDivElement | null = null;
	private disposed = false;

	constructor(presentation: FalconFlightPresentation) {
		this.presentation = presentation;
		if (this.shouldMount()) {
			this.mount();
		}
	}

	private shouldMount(): boolean {
		return (
			typeof import.meta !== 'undefined' &&
			import.meta.env?.DEV === true &&
			typeof window !== 'undefined' &&
			window.location.search.includes('tune=1')
		);
	}

	private mount(): void {
		if (typeof document === 'undefined') return;
		const base = DEFAULT_FALCON_FLIGHT_VISUAL_CONFIG;
		const config = this.presentation.getConfig();

		this.container = document.createElement('div');
		this.container.className = 'falcon-tuning-overlay';
		this.applyStyles(this.container, {
			position: 'fixed',
			top: '12px',
			right: '12px',
			width: '280px',
			maxHeight: '90vh',
			overflowY: 'auto',
			background: 'rgba(20, 20, 30, 0.92)',
			color: '#fff',
			borderRadius: '12px',
			padding: '16px',
			fontFamily: 'system-ui, sans-serif',
			fontSize: '12px',
			zIndex: '9999',
			boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
			backdropFilter: 'blur(6px)'
		});

		const title = document.createElement('h3');
		title.textContent = '🎨 Falcon Flight Visual Tuning';
		this.applyStyles(title, { margin: '0 0 12px 0', fontSize: '14px' });
		this.container.appendChild(title);

		// Fog group
		this.container.appendChild(this.groupTitle('Fog'));
		this.addSlider('Fog density', 0, 0.08, config.fogDensity, 0.001, (v) =>
			this.presentation.applyTuning({ fogDensity: v })
		);
		this.addSlider('Storm density', 0, 0.12, config.stormFogDensity, 0.001, (v) =>
			this.presentation.applyTuning({ stormFogDensity: v })
		);
		this.addColor('Fog color', config.fogColor, (v) =>
			this.presentation.applyTuning({ fogColor: v })
		);

		// Bloom group
		this.container.appendChild(this.groupTitle('Bloom'));
		this.addSlider('Threshold', 0.5, 1.0, config.bloom.threshold, 0.01, (v) =>
			this.presentation.applyTuning({ bloom: { ...config.bloom, threshold: v } })
		);
		this.addSlider('Weight', 0, 0.25, config.bloom.weight, 0.005, (v) =>
			this.presentation.applyTuning({ bloom: { ...config.bloom, weight: v } })
		);
		this.addSlider('Scale', 0.1, 1.0, config.bloom.scale, 0.05, (v) =>
			this.presentation.applyTuning({ bloom: { ...config.bloom, scale: v } })
		);

		// Lighting group
		this.container.appendChild(this.groupTitle('Lighting'));
		this.addSlider('Sun intensity', 0, 3, config.sun.intensity, 0.05, (v) =>
			this.presentation.applyTuning({ sun: { ...config.sun, intensity: v } })
		);
		this.addSlider('Sun angle', -1.5, 1.5, Math.atan2(config.sun.direction.z, -config.sun.direction.y), 0.05, (v) => {
			const y = -Math.cos(v);
			const z = Math.sin(v);
			this.presentation.applyTuning({ sun: { ...config.sun, direction: { ...config.sun.direction, y, z } } });
		});
		this.addSlider('Ambient intensity', 0, 2, config.ambient.intensity, 0.05, (v) =>
			this.presentation.applyTuning({ ambient: { ...config.ambient, intensity: v } })
		);

		// Palette swatches
		this.container.appendChild(this.groupTitle('Palette (click to copy hex)'));
		this.addPaletteSwatches(config.palette);

		// Quality buttons
		this.container.appendChild(this.groupTitle('Quality Tier'));
		const tierRow = document.createElement('div');
		this.applyStyles(tierRow, { display: 'flex', gap: '6px', marginBottom: '12px' });
		for (const name of this.presentation.getQualityTierNames()) {
			const btn = document.createElement('button');
			btn.textContent = name;
			this.applyStyles(btn, {
				flex: '1',
				padding: '6px',
				borderRadius: '6px',
				border: 'none',
				background: '#3b3b4f',
				color: '#fff',
				cursor: 'pointer'
			});
			btn.addEventListener('click', () => this.presentation.setQualityTier(name));
			tierRow.appendChild(btn);
		}
		this.container.appendChild(tierRow);

		// Copy config button
		const copyBtn = document.createElement('button');
		copyBtn.textContent = '📋 Copy VisualConfig diff';
		this.applyStyles(copyBtn, {
			width: '100%',
			padding: '10px',
			borderRadius: '8px',
			border: 'none',
			background: '#06d6a0',
			color: '#1a1a2e',
			fontWeight: 'bold',
			cursor: 'pointer',
			marginTop: '4px'
		});
		copyBtn.addEventListener('click', () => this.copyConfigDiff(base, config));
		this.container.appendChild(copyBtn);

		document.body.appendChild(this.container);
	}

	private groupTitle(text: string): HTMLDivElement {
		const el = document.createElement('div');
		el.textContent = text;
		this.applyStyles(el, {
			fontWeight: 'bold',
			textTransform: 'uppercase',
			letterSpacing: '0.05em',
			color: '#a0a0b0',
			marginTop: '12px',
			marginBottom: '6px',
			fontSize: '10px'
		});
		return el;
	}

	private addSlider(
		label: string,
		min: number,
		max: number,
		value: number,
		step: number,
		onChange: (value: number) => void
	): void {
		const row = document.createElement('div');
		this.applyStyles(row, { marginBottom: '8px' });

		const header = document.createElement('div');
		header.textContent = `${label}: ${value.toFixed(step < 0.01 ? 3 : 2)}`;
		this.applyStyles(header, { display: 'flex', justifyContent: 'space-between', marginBottom: '2px' });
		row.appendChild(header);

		const input = document.createElement('input');
		input.type = 'range';
		input.min = String(min);
		input.max = String(max);
		input.step = String(step);
		input.value = String(value);
		input.style.width = '100%';
		input.addEventListener('input', () => {
			const v = parseFloat(input.value);
			header.textContent = `${label}: ${v.toFixed(step < 0.01 ? 3 : 2)}`;
			onChange(v);
		});
		row.appendChild(input);

		this.container!.appendChild(row);
	}

	private addColor(label: string, value: string, onChange: (value: string) => void): void {
		const row = document.createElement('div');
		this.applyStyles(row, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' });

		const text = document.createElement('span');
		text.textContent = label;
		row.appendChild(text);

		const input = document.createElement('input');
		input.type = 'color';
		input.value = value;
		this.applyStyles(input, { border: 'none', width: '32px', height: '24px', cursor: 'pointer', background: 'transparent' });
		input.addEventListener('input', () => onChange(input.value));
		row.appendChild(input);

		this.container!.appendChild(row);
	}

	private addPaletteSwatches(palette: FalconFlightVisualConfig['palette']): void {
		const grid = document.createElement('div');
		this.applyStyles(grid, { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '12px' });

		for (const [name, hex] of Object.entries(palette)) {
			const swatch = document.createElement('div');
			this.applyStyles(swatch, {
				width: '100%',
				aspectRatio: '1',
				background: hex,
				borderRadius: '4px',
				cursor: 'pointer',
				border: '1px solid rgba(255,255,255,0.2)'
			});
			swatch.title = `${name}: ${hex}`;
			swatch.addEventListener('click', async () => {
				try {
					await navigator.clipboard.writeText(hex);
				} catch {
					/* ignore */
				}
			});
			grid.appendChild(swatch);
		}

		this.container!.appendChild(grid);
	}

	private copyConfigDiff(
		base: FalconFlightVisualConfig,
		current: Readonly<FalconFlightVisualConfig>
	): void {
		const diff: Partial<FalconFlightVisualConfig> = {};
		if (current.fogDensity !== base.fogDensity) diff.fogDensity = current.fogDensity;
		if (current.stormFogDensity !== base.stormFogDensity) diff.stormFogDensity = current.stormFogDensity;
		if (current.fogColor !== base.fogColor) diff.fogColor = current.fogColor;

		if (
			current.bloom.threshold !== base.bloom.threshold ||
			current.bloom.weight !== base.bloom.weight ||
			current.bloom.scale !== base.bloom.scale
		) {
			diff.bloom = { ...current.bloom };
		}

		if (current.sun.intensity !== base.sun.intensity) diff.sun = { ...current.sun };
		if (current.ambient.intensity !== base.ambient.intensity) diff.ambient = { ...current.ambient };

		const json = JSON.stringify(diff, null, 2);
		// eslint-disable-next-line no-console
		console.log('[FalconFlight] tuned VisualConfig diff:', json);
		if (typeof navigator !== 'undefined') {
			navigator.clipboard.writeText(json).catch(() => {
				/* ignore */
			});
		}
	}

	private applyStyles(el: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
		Object.assign(el.style, styles);
	}

	dispose(): void {
		if (this.disposed) return;
		this.disposed = true;
		if (this.container && this.container.parentNode) {
			this.container.parentNode.removeChild(this.container);
		}
		this.container = null;
	}
}
