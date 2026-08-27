export type SouqArithmeticSfx =
	| 'customer'
	| 'correct'
	| 'incorrect'
	| 'restock'
	| 'complete'
	| 'fail'
	| 'coin'
	| 'hint';

export class SouqArithmeticAudio {
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
		}, 2800);
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
		const bar = 2.6;

		// Light market ambience drone.
		const drone = ctx.createOscillator();
		drone.type = 'sine';
		drone.frequency.setValueAtTime(110, now);
		const droneGain = ctx.createGain();
		droneGain.gain.setValueAtTime(0.03, now);
		droneGain.gain.exponentialRampToValueAtTime(0.001, now + bar);
		drone.connect(droneGain);
		droneGain.connect(ctx.destination);
		drone.start(now);
		drone.stop(now + bar);

		// Cheerful pentatonic market melody.
		const notes = [220, 261.63, 293.66, 329.63, 392];
		const times = [0, 0.5, 1.0, 1.5, 2.0];
		times.forEach((t, i) => {
			const freq = notes[i % notes.length];
			const osc = ctx.createOscillator();
			osc.type = 'triangle';
			osc.frequency.setValueAtTime(freq, now + t);
			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.0001, now + t);
			gain.gain.exponentialRampToValueAtTime(0.05, now + t + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.45);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now + t);
			osc.stop(now + t + 0.5);
		});
	}

	playSfx(type: SouqArithmeticSfx): void {
		const ctx = this.ensureCtx();
		if (!ctx) return;

		switch (type) {
			case 'customer':
				this.playCustomer(ctx);
				break;
			case 'correct':
				this.playCorrect(ctx);
				break;
			case 'incorrect':
				this.playIncorrect(ctx);
				break;
			case 'restock':
				this.playRestock(ctx);
				break;
			case 'complete':
				this.playComplete(ctx);
				break;
			case 'fail':
				this.playFail(ctx);
				break;
			case 'coin':
				this.playCoin(ctx);
				break;
			case 'hint':
				this.playHint(ctx);
				break;
		}
	}

	private playCustomer(ctx: AudioContext): void {
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(440, now);
		osc.frequency.exponentialRampToValueAtTime(554, now + 0.12);
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.08, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + 0.2);
	}

	private playCorrect(ctx: AudioContext): void {
		const now = ctx.currentTime;
		// Brass scale balance chord.
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
		this.playCoin(ctx, 0.15);
	}

	private playIncorrect(ctx: AudioContext): void {
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		osc.type = 'sawtooth';
		osc.frequency.setValueAtTime(180, now);
		osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.2, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + 0.28);
	}

	private playRestock(ctx: AudioContext): void {
		const now = ctx.currentTime;
		// Crate slide + stack thuds.
		const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
		const data = noiseBuffer.getChannelData(0);
		for (let i = 0; i < data.length; i++) {
			data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / data.length);
		}
		const noise = ctx.createBufferSource();
		noise.buffer = noiseBuffer;
		const filter = ctx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value = 600;
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.25, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
		noise.connect(filter);
		filter.connect(gain);
		gain.connect(ctx.destination);
		noise.start(now);
	}

	private playComplete(ctx: AudioContext): void {
		const now = ctx.currentTime;
		const notes = [392, 493.88, 587.33, 783.99, 987.77];
		notes.forEach((freq, i) => {
			const osc = ctx.createOscillator();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(freq, now + i * 0.1);
			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.0001, now + i * 0.1);
			gain.gain.exponentialRampToValueAtTime(0.2, now + i * 0.1 + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.45);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now + i * 0.1);
			osc.stop(now + i * 0.1 + 0.5);
		});
	}

	private playFail(ctx: AudioContext): void {
		const now = ctx.currentTime;
		[330, 293.66, 261.63, 220].forEach((freq, i) => {
			const osc = ctx.createOscillator();
			osc.type = 'triangle';
			osc.frequency.setValueAtTime(freq, now + i * 0.14);
			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.0001, now + i * 0.14);
			gain.gain.exponentialRampToValueAtTime(0.2, now + i * 0.14 + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.35);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now + i * 0.14);
			osc.stop(now + i * 0.14 + 0.4);
		});
	}

	private playCoin(ctx: AudioContext, delay = 0): void {
		const now = ctx.currentTime + delay;
		const osc = ctx.createOscillator();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(1200, now);
		osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.15, now);
		gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + 0.12);
	}

	private playHint(ctx: AudioContext): void {
		const now = ctx.currentTime;
		const osc = ctx.createOscillator();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(523.25, now);
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
