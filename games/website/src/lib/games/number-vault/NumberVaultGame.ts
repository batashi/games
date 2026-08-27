import { NumberVaultLogic, type NumberVaultState } from './NumberVaultLogic';

export interface NumberVaultGameOptions {
	level?: number;
}

export class NumberVaultGame {
	private logic: NumberVaultLogic;
	private muted = false;

	constructor(
		private onChange: (state: NumberVaultState) => void,
		options: NumberVaultGameOptions = {}
	) {
		this.logic = new NumberVaultLogic(
			(state) => {
				this.onChange(state);
			},
			{
				onWaveCleared: () => this.playSound('wave'),
				onLevelComplete: () => this.playSound('complete'),
				onTreasureStolen: () => this.playSound('steal')
			}
		);
		this.logic.startLevel(options.level ?? 1);
	}

	restartLevel(): void {
		this.logic.restartLevel();
	}

	backToMenu(): void {
		this.logic.backToMenu();
	}

	submitAnswer(answer: number | number[]): void {
		this.logic.submitAnswer(answer);
	}

	showHint(): void {
		this.logic.showHint();
	}

	setMuted(muted: boolean): void {
		this.muted = muted;
	}

	isMuted(): boolean {
		return this.muted;
	}

	dispose(): void {
		this.logic.dispose();
	}

	private playSound(type: 'wave' | 'complete' | 'steal'): void {
		if (this.muted) return;
		// Sounds are placeholders; synthesis or procedural audio can be wired here.
		void type;
	}
}
