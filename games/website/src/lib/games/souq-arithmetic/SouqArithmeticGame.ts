import { SouqArithmeticLogic, type SouqArithmeticState } from './SouqArithmeticLogic';
import { SouqArithmeticAudio } from './SouqArithmeticAudio';

export interface SouqArithmeticGameOptions {
	level?: number;
}

export class SouqArithmeticGame {
	private logic: SouqArithmeticLogic;
	private audio: SouqArithmeticAudio;
	private muted = false;
	private prevState: SouqArithmeticState | null = null;

	constructor(
		private onChange: (state: SouqArithmeticState) => void,
		options: SouqArithmeticGameOptions = {}
	) {
		this.audio = new SouqArithmeticAudio();
		this.logic = new SouqArithmeticLogic(
			(state) => {
				this.onChange(state);
				this.handleAudio(state);
				this.prevState = state;
			},
			{
				onCustomerArrive: () => this.audio.playSfx('customer'),
				onCorrect: () => this.audio.playSfx('correct'),
				onIncorrect: () => this.audio.playSfx('incorrect'),
				onRestock: () => this.audio.playSfx('restock'),
				onLevelComplete: (stars) => this.audio.playSfx(stars > 0 ? 'complete' : 'fail')
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

	addToCart(goodId: 'dates' | 'frankincense' | 'dallah' | 'spice' | 'khanjar'): void {
		this.logic.addToCart(goodId);
		this.audio.playSfx('coin');
	}

	removeFromCart(goodId: 'dates' | 'frankincense' | 'dallah' | 'spice' | 'khanjar'): void {
		this.logic.removeFromCart(goodId);
	}

	addChange(coin: number): void {
		this.logic.addChange(coin);
		this.audio.playSfx('coin');
	}

	removeChange(coin: number): void {
		this.logic.removeChange(coin);
	}

	submitTransaction(): void {
		this.logic.submitTransaction();
	}

	submitRestock(answer: number): void {
		this.logic.submitRestock(answer);
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

	private handleAudio(state: SouqArithmeticState): void {
		// Feedback-triggered SFX are handled by logic callbacks.
		// This hook is reserved for state-transition sounds not covered by callbacks.
		void state;
	}
}
