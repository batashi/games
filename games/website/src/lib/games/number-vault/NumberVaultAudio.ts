export type NumberVaultSfx =
	| 'correct'
	| 'incorrect'
	| 'defeat'
	| 'wave'
	| 'complete'
	| 'steal'
	| 'hint';

export class NumberVaultAudio {
	private ctx: AudioContext | null = null;
	private muted = false;
	private musicTimer: ReturnType<typeof setInterval> | null = null;
	private musicPlaying = false;

	setMuted(muted: boolean): void {
		this.muted = muted;
		if (muted) {
			this.pauseMusic();
		} else if (this.musicPlaying) {
			this.playMusic();
		}
	}

	getMuted(): boolean {
		return this.muted;
	}

	private ensureCtx(): AudioContext | null {
		if (this.muted) return null;
		if (!this.ctx) {
			this.ctx = new (
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
			)();
		}
		if (this.ctx.state === 'suspended') {
			void this.ctx.resume();
		}
		return this.ctx;
	}

	private getCtx(): AudioContext {
		if (!this.ctx) {
			this.ctx = new (
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
			)();
		}
		if (this.ctx.state === 'suspended') {
			void this.ctx.resume();
		}
		return this.ctx;
	}

	playMusic(): void {
		this.musicPlaying = true;
		if (this.muted || this.musicTimer) return;

		const ctx = this.ensureCtx();
		if (!ctx) return;

		this.playMusicBar(ctx);
		this.musicTimer = setInterval(() => {
			if (this.muted) return;
			this.playMusicBar(this.getCtx());
		}, 3200);
	}

	stopMusic(): void {
		this.musicPlaying = false;
		this.pauseMusic();
	}

	private pauseMusic(): void {
		if (this.musicTimer) {
			clearInterval(this.musicTimer);
			this.musicTimer = null;
		}
	}

	private playMusicBar(ctx: AudioContext): void {
		const now = ctx.currentTime;
		const bar = 3.0;

		// Deep, warm desert drone (Omani coastal fort ambience).
		const drone = ctx.createOscillator();
		drone.type = 'sine';
		drone.frequency.setValueAtTime(55, now);
		const droneGain = ctx.createGain();
		droneGain.gain.setValueAtTime(0.04, now);
		droneGain.gain.exponentialRampToValueAtTime(0.001, now + bar);
		drone.connect(droneGain);
		droneGain.connect(ctx.destination);
		drone.start(now);
		drone.stop(now + bar);

		// Sparse pentatonic "oud-like" plucks.
		const notes = [110, 130.81, 146.83, 164.81, 196];
		const pluckTimes = [0, 0.8, 1.55, 2.25];
		pluckTimes.forEach((t, i) => {
			const freq = notes[(i * 2) % notes.length];
			const osc = ctx.createOscillator();
			osc.type = 'triangle';
			osc.frequency.setValueAtTime(freq, now + t);
			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.0001, now + t);
			gain.gain.exponentialRampToValueAtTime(0.045, now + t + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.55);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now + t);
			osc.stop(now + t + 0.6);
		});
	}

	playSfx(type: NumberVaultSfx): void {
		const ctx = this.ensureCtx();
		if (!ctx) return;

		switch (type) {
			case 'correct':
				this.playCorrect(ctx);
				break;
			case 'incorrect':
				this.playIncorrect(ctx);
				break;
			case 'defeat':
				this.playDefeat(ctx);
				break;
			case 'wave':
				this.playWave(ctx);
				break;
			case 'complete':
				this.playComplete(ctx);
				break;
			case 'steal':
				this.playSteal(ctx);
				break;
			case 'hint':
				this.playHint(ctx);
				break;
		}
	}

	private playCorrect(ctx: AudioContext): void {
		const now = ctx.currentTime;
		[523.25, 659.25, 783.99].forEach((freq, i) => {
			const osc = ctx.createOscillator();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(freq, now + i * 0.05);
			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.0001, now + i * 0.05);
			gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.05 + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.28);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now + i * 0.05);
			osc.stop(now + i * 0.05 + 0.32);
		});
	}

	private playIncorrect(ctx: AudioContext): void {
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(150, now);
		osc.frequency.exponentialRampToValueAtTime(90, now + 0.22);
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.2, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + 0.28);
	}

	private playDefeat(ctx: AudioContext): void {
		const now = ctx.currentTime;
		[220, 196, 164.81, 130.81].forEach((freq, i) => {
			const osc = ctx.createOscillator();
			osc.type = 'triangle';
			osc.frequency.setValueAtTime(freq, now + i * 0.14);
			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.0001, now + i * 0.14);
			gain.gain.exponentialRampToValueAtTime(0.22, now + i * 0.14 + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.35);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now + i * 0.14);
			osc.stop(now + i * 0.14 + 0.4);
		});
	}

	private playWave(ctx: AudioContext): void {
		const now = ctx.currentTime;
		[392, 440, 493.88, 587.33].forEach((freq, i) => {
			const osc = ctx.createOscillator();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(freq, now + i * 0.07);
			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.0001, now + i * 0.07);
			gain.gain.exponentialRampToValueAtTime(0.16, now + i * 0.07 + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.25);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now + i * 0.07);
			osc.stop(now + i * 0.07 + 0.3);
		});
	}

	private playComplete(ctx: AudioContext): void {
		const now = ctx.currentTime;
		const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
		notes.forEach((freq, i) => {
			const osc = ctx.createOscillator();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(freq, now + i * 0.1);
			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.0001, now + i * 0.1);
			gain.gain.exponentialRampToValueAtTime(0.22, now + i * 0.1 + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.45);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now + i * 0.1);
			osc.stop(now + i * 0.1 + 0.5);
		});
	}

	private playSteal(ctx: AudioContext): void {
		const now = ctx.currentTime;
		// Metallic clang + low thud.
		const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
		const data = noiseBuffer.getChannelData(0);
		for (let i = 0; i < data.length; i++) {
			data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / data.length);
		}
		const noise = ctx.createBufferSource();
		noise.buffer = noiseBuffer;
		const filter = ctx.createBiquadFilter();
		filter.type = 'bandpass';
		filter.frequency.value = 900;
		filter.Q.value = 1;
		const noiseGain = ctx.createGain();
		noiseGain.gain.setValueAtTime(0.35, now);
		noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
		noise.connect(filter);
		filter.connect(noiseGain);
		noiseGain.connect(ctx.destination);
		noise.start(now);

		const osc = ctx.createOscillator();
		osc.type = 'square';
		osc.frequency.setValueAtTime(80, now);
		osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
		const oscGain = ctx.createGain();
		oscGain.gain.setValueAtTime(0.18, now);
		oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
		osc.connect(oscGain);
		oscGain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + 0.28);
	}

	private playHint(ctx: AudioContext): void {
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(440, now);
		osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.1, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + 0.2);
	}

	dispose(): void {
		this.stopMusic();
		if (this.ctx && this.ctx.state !== 'closed') {
			void this.ctx.close();
		}
		this.ctx = null;
	}
}
