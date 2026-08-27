/**
 * Falcon Flight — Visual Upgrade Experiment
 *
 * This file is now the orchestration layer:
 * - FalconFlightLogic: pure game rules (untouched).
 * - FalconFlightPresentation: scene, camera, lights, materials, fog, particles, quality tiers.
 * - FalconFlightAudio: synthesized music/SFX.
 * - FalconFlightTuningOverlay: dev-only live tuning UI.
 *
 * See FRAMEWORK.md §10.1.7 for the experiment record.
 */

import { Color3 } from '@babylonjs/core';
import {
	FalconFlightLogic,
	DEFAULT_FALCON_FLIGHT_CONFIG,
	type FalconFlightState,
	type FalconFlightConfig,
	type PreyType,
	type PowerUpType
} from './FalconFlightLogic';
import { FalconFlightPresentation } from './FalconFlightPresentation';
import { FalconFlightTuningOverlay } from './FalconFlightTuningOverlay';
import type { QualityTierName } from './FalconFlightVisualConfig';

export type { FalconFlightState };

export interface FalconFlightGameOptions {
	config?: Partial<FalconFlightConfig>;
}

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

export class FalconFlightGame {
	private presentation: FalconFlightPresentation;
	private audio: FalconFlightAudio;
	private logic: FalconFlightLogic;
	private onChange: (state: FalconFlightState) => void;
	private config: FalconFlightConfig;

	private disposed = false;
	private handleResize: () => void;
	private handleKeydown: (e: KeyboardEvent) => void;
	private handleKeyup: (e: KeyboardEvent) => void;

	private displayedScore = 0;
	private displayedEnergy = 100;

	private lowFpsAccumulator = 0;
	private performanceReduced = false;
	private qualityOrder: QualityTierName[] = ['high', 'medium', 'low'];

	private windStreakTimer = 0;
	private sandParticleTimer = 0;

	private tuningOverlay: FalconFlightTuningOverlay | null = null;

	constructor(
		canvas: HTMLCanvasElement,
		onChange: (state: FalconFlightState) => void,
		options: FalconFlightGameOptions = {}
	) {
		this.onChange = onChange;
		this.config = { ...DEFAULT_FALCON_FLIGHT_CONFIG, ...options.config };
		this.audio = new FalconFlightAudio();
		this.presentation = new FalconFlightPresentation(canvas, options.config);
		this.tuningOverlay = new FalconFlightTuningOverlay(this.presentation);

		this.logic = new FalconFlightLogic(
			(state) => {
				this.displayedScore = state.score;
				this.displayedEnergy = state.energy;
				this.onChange(state);
			},
			options.config,
			{
				onPreyCollected: (kind, _pos) => {
					this.audio.playPreyCatch();
					this.presentation.squishStretchFalcon(0.3);
					const state = this.logic.getState();
					const delta = state.score - this.displayedScore;
					this.presentation.spawnConfetti(0, state.falcon.y, this.preyColor(kind));
					this.presentation.showFloatingText(0, state.falcon.y + 0.5, `+${delta}`, '#ffd54f');
				},
				onPowerUpCollected: (kind, _pos) => {
					this.audio.playPowerUp();
					this.presentation.squishStretchFalcon(0.3);
					const state = this.logic.getState();
					this.presentation.spawnConfetti(0, state.falcon.y, this.powerupColor(kind));
					this.presentation.showFloatingText(
						0,
						state.falcon.y + 0.5,
						this.powerupLabel(kind),
						this.powerupHex(kind)
					);
				},
				onHazardHit: (kind, pos) => {
					this.audio.playCollision();
					this.presentation.spawnConfetti(pos.x, pos.y, new Color3(0.7, 0.1, 0.1), 32, true);
				},
				onGameOver: () => this.audio.playFanfare()
			}
		);

		this.handleResize = () => this.presentation.resize();
		window.addEventListener('resize', this.handleResize);
		this.presentation.resize();

		this.handleKeydown = (e: KeyboardEvent) => {
			if (e.code === 'Space') {
				e.preventDefault();
				this.presentation.setInputActive(true);
			}
		};
		this.handleKeyup = (e: KeyboardEvent) => {
			if (e.code === 'Space') {
				e.preventDefault();
				this.presentation.setInputActive(false);
			}
		};
		window.addEventListener('keydown', this.handleKeydown);
		window.addEventListener('keyup', this.handleKeyup);

		this.presentation.engine.runRenderLoop(() => {
			if (this.disposed) return;
			const dt = this.presentation.engine.getDeltaTime() / 1000;
			this.update(dt);
			this.presentation.scene.render();
		});
	}

	startRun(): void {
		this.logic.startRun();
		this.audio.playMusic();
	}

	restart(): void {
		this.presentation.cleanupDynamicMeshes();
		this.logic.restart();
	}

	backToMenu(): void {
		this.presentation.cleanupDynamicMeshes();
		this.logic.resetToMenu();
	}

	setMuted(muted: boolean): void {
		this.audio.setMuted(muted);
	}

	getMuted(): boolean {
		return this.audio.getMuted();
	}

	private update(dt: number): void {
		const state = this.logic.getState();

		this.logic.update(dt, { active: this.presentation.inputIsActive });

		this.presentation.syncFalcon(state, dt);
		this.presentation.syncChunks(state);
		this.presentation.syncObjects(state);
		this.presentation.updateCamera(state, dt);
		this.presentation.updateParticles(dt);

		if (state.tailwindTimer > 0) {
			this.windStreakTimer -= dt;
			if (this.windStreakTimer <= 0) {
				this.presentation.spawnWindStreaks();
				this.windStreakTimer = 0.12;
			}
		} else {
			this.windStreakTimer = 0;
		}

		if (
			this.presentation.getConfig().stormSpeedThreshold > 0 &&
			state.speed >= this.presentation.getConfig().stormSpeedThreshold
		) {
			this.sandParticleTimer -= dt;
			if (this.sandParticleTimer <= 0) {
				this.presentation.spawnSandParticles(1);
				this.sandParticleTimer = 0.08;
			}
		} else {
			this.sandParticleTimer = 0;
		}

		this.checkPerformance(dt);
	}

	private checkPerformance(dt: number): void {
		if (this.performanceReduced) return;
		const fps = this.presentation.engine.getFps();
		if (fps < 30) {
			this.lowFpsAccumulator += dt;
			if (this.lowFpsAccumulator > 3) {
				this.stepDownQuality();
			}
		} else {
			this.lowFpsAccumulator = Math.max(0, this.lowFpsAccumulator - dt);
		}
	}

	private stepDownQuality(): void {
		const currentTier = this.presentation.getQualityTier();
		const currentIndex = this.qualityOrder.indexOf(currentTier);
		if (currentIndex >= this.qualityOrder.length - 1) {
			this.performanceReduced = true;
			return;
		}
		const nextTier = this.qualityOrder[currentIndex + 1];
		this.presentation.setQualityTier(nextTier);
		this.lowFpsAccumulator = 0;
		if (nextTier === 'low') {
			this.performanceReduced = true;
		}
	}

	private preyColor(kind: PreyType): Color3 {
		return Color3.FromHexString(this.presentation.getConfig().palette[kind]);
	}

	private powerupColor(kind: PowerUpType): Color3 {
		return Color3.FromHexString(this.presentation.getConfig().palette[kind]);
	}

	private powerupHex(kind: PowerUpType): string {
		return this.presentation.getConfig().palette[kind];
	}

	private powerupLabel(kind: PowerUpType): string {
		switch (kind) {
			case 'tailwind':
				return 'رياح مواتية';
			case 'sharperEyes':
				return 'عين حادة';
			case 'secondWind':
				return 'نسيم ثانٍ';
		}
	}

	dispose(): void {
		this.disposed = true;
		this.presentation.cleanupDynamicMeshes();
		this.audio.stopMusic();
		this.tuningOverlay?.dispose();
		window.removeEventListener('resize', this.handleResize);
		window.removeEventListener('keydown', this.handleKeydown);
		window.removeEventListener('keyup', this.handleKeyup);
		this.presentation.dispose();
	}
}
