import { NumberVaultLogic, type NumberVaultState } from './NumberVaultLogic';
import { NumberVaultAudio } from './NumberVaultAudio';

export interface NumberVaultGameOptions {
	level?: number;
}

export class NumberVaultGame {
	private logic: NumberVaultLogic;
	private audio: NumberVaultAudio;
	private muted = false;
	private prevState: NumberVaultState | null = null;

	constructor(
		private onChange: (state: NumberVaultState) => void,
		options: NumberVaultGameOptions = {}
	) {
		this.audio = new NumberVaultAudio();
		this.logic = new NumberVaultLogic(
			(state) => {
				this.onChange(state);
				this.handleAudio(state);
				this.prevState = state;
			},
			{
				onWaveCleared: () => this.audio.playSfx('wave'),
				onLevelComplete: (stars) => this.audio.playSfx(stars > 0 ? 'complete' : 'defeat'),
				onTreasureStolen: () => this.audio.playSfx('steal')
			}
		);
		this.logic.startLevel(options.level ?? 1);
		this.audio.playMusic();
	}

	restartLevel(): void {
		this.logic.restartLevel();
		this.audio.playMusic();
	}

	backToMenu(): void {
		this.logic.backToMenu();
		this.audio.stopMusic();
	}

	submitAnswer(answer: number | number[]): void {
		this.logic.submitAnswer(answer);
	}

	showHint(): void {
		this.logic.showHint();
		this.audio.playSfx('hint');
	}

	setMuted(muted: boolean): void {
		this.muted = muted;
		this.audio.setMuted(muted);
	}

	isMuted(): boolean {
		return this.muted;
	}

	dispose(): void {
		this.logic.dispose();
		this.audio.dispose();
	}

	private handleAudio(state: NumberVaultState): void {
		if (state.phase !== 'playing' || !this.prevState) return;

		// Feedback-triggered SFX.
		if (state.feedback !== this.prevState.feedback) {
			if (state.feedback === 'correct' || state.feedback === 'slow') {
				this.audio.playSfx('correct');
			} else if (state.feedback === 'incorrect') {
				this.audio.playSfx('incorrect');
			}
		}

		// Ghoul defeated (lead removed from queue).
		if (state.ghouls.length < this.prevState.ghouls.length) {
			this.audio.playSfx('correct');
		}
	}
}
