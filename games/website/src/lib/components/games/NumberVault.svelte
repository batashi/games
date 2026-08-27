<script lang="ts">
	// @ts-nocheck
	import { onDestroy } from 'svelte';
	import type { NumberVaultState, Ghoul, PuzzleType } from '$lib/games/number-vault';
	import { NUMBER_VAULT_LEVELS } from '$lib/games/number-vault';

	let canvas: HTMLCanvasElement;
	let game: import('$lib/games/number-vault').NumberVaultGame | null = null;
	let state = $state<NumberVaultState | null>(null);
	let muted = $state(false);
	let phase = $state<'menu' | 'playing' | 'result'>('menu');
	let selectedLevel = $state(1);
	let trapAnim = $state<'none' | 'gate' | 'sand' | 'smoke' | 'stone'>('none');

	onDestroy(() => {
		game?.dispose();
	});

	async function startLevel(level: number) {
		selectedLevel = level;
		const { NumberVaultGame } = await import('$lib/games/number-vault');
		phase = 'playing';
		game = new NumberVaultGame(
			(s) => {
				state = s;
				if (s.feedback === 'correct' || s.feedback === 'slow') {
					triggerTrap();
				}
				if (s.phase === 'result') {
					phase = 'result';
				}
			},
			{ level }
		);
		game.setMuted(muted);
	}

	function restartLevel() {
		game?.restartLevel();
		phase = 'playing';
	}

	function backToMenu() {
		game?.backToMenu();
		game = null;
		state = null;
		phase = 'menu';
	}

	function submitAnswer(answer: number | number[]) {
		game?.submitAnswer(answer);
	}

	function showHint() {
		game?.showHint();
	}

	export function toggleMute() {
		muted = !muted;
		game?.setMuted(muted);
	}

	export function isMuted(): boolean {
		return muted;
	}

	function triggerTrap() {
		const traps: ('gate' | 'sand' | 'smoke' | 'stone')[] = ['gate', 'sand', 'smoke', 'stone'];
		trapAnim = traps[Math.floor(Math.random() * traps.length)];
		setTimeout(() => {
			trapAnim = 'none';
		}, 500);
	}

	function starLabel(count: number): string {
		return '⭐'.repeat(count) + '✩'.repeat(3 - count);
	}

	function puzzleIcon(type: PuzzleType): string {
		const icons: Record<PuzzleType, string> = {
			'place-value': '🔢',
			order: '📊',
			round: '🎯',
			sequence: '⛓️'
		};
		return icons[type];
	}

	function ghoulIcon(type: Ghoul['type']): string {
		const icons: Record<Ghoul['type'], string> = {
			sand: '👤',
			wind: '💨',
			echo: '👥',
			boss: '👹'
		};
		return icons[type];
	}

	function treasureIcon(index: number): string {
		const icons = ['🗡️', '☕', '🌿', '🗺️', '🦪', '🏺'];
		return icons[index % icons.length];
	}

	function formatCombo(n: number): string {
		return n > 1 ? `×${n}` : '';
	}
</script>

<div class="absolute inset-0 bg-gradient-to-b from-stone-700 via-stone-600 to-stone-800 overflow-hidden">
	<canvas bind:this={canvas} class="block w-full h-full outline-none" tabindex="0"></canvas>

	{#if phase === 'menu'}
		<div class="absolute inset-0 flex items-center justify-center bg-black/50 px-4">
			<div class="bg-amber-50 text-stone-900 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border-4 border-amber-700">
				<div class="text-5xl mb-3">🛡️</div>
				<h2 class="font-display font-bold text-2xl mb-2">حارس الخزنة</h2>
				<p class="text-sm opacity-80 mb-6">
					الغول العدديّ يتسلل نحو خزنة القلعة. حلّ الألغاز بسرعة لتفعيل الفخاخ وتدافع عن كنوز عُمان.
				</p>

				<div class="grid grid-cols-3 gap-3">
					{#each NUMBER_VAULT_LEVELS as level}
						<button
							type="button"
							data-level={level.level}
							class="bg-amber-600 hover:bg-amber-700 text-amber-50 font-bold py-3 rounded-xl transition-colors"
							onclick={() => startLevel(level.level)}
						>
							<div class="text-lg">{level.level}</div>
							<div class="text-xs opacity-90">{level.waves} موجات</div>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	{#if state && phase === 'playing'}
		<!-- HUD -->
		<div class="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
			<div class="bg-stone-900/80 text-amber-50 px-4 py-2 rounded-xl text-center">
				<div class="text-xs opacity-80">المستوى</div>
				<div class="font-bold">{state.level}</div>
			</div>
			<div class="bg-stone-900/80 text-amber-50 px-4 py-2 rounded-xl text-center">
				<div class="text-xs opacity-80">الموجة</div>
				<div class="font-bold">{state.wave} / {state.totalWaves}</div>
			</div>
			<div class="bg-stone-900/80 text-amber-50 px-4 py-2 rounded-xl text-center">
				<div class="text-xs opacity-80">النقاط</div>
				<div class="font-bold">{state.score}</div>
			</div>
			<div class="bg-stone-900/80 text-amber-50 px-4 py-2 rounded-xl text-center">
				<div class="text-xs opacity-80">الكنوز</div>
				<div class="font-bold">
					{#each Array(state.maxTreasures) as _, i}
						<span class={i < state.treasures ? '' : 'opacity-30 grayscale'}>{treasureIcon(i)}</span>
					{/each}
				</div>
			</div>
		</div>

		<!-- Combo -->
		{#if state.combo > 1}
			<div class="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none">
				<div class="bg-orange-500/90 text-amber-50 px-5 py-2 rounded-2xl text-lg font-bold shadow-xl animate-pulse">
					سلسلة {formatCombo(state.combo)} 🔥
				</div>
			</div>
		{/if}

		<!-- Tunnel / Game area -->
		<div class="absolute inset-0 flex flex-col justify-end px-4 pb-4 pointer-events-none">
			<!-- Vault door and treasures -->
			<div class="absolute right-4 top-1/2 -translate-y-1/2 w-24 sm:w-32 h-64 bg-amber-900 rounded-l-3xl border-4 border-amber-950 shadow-2xl flex flex-col items-center justify-center gap-2">
				<div class="text-3xl">🚪</div>
				<div class="text-xs text-amber-100 text-center font-bold">خزنة القلعة</div>
			</div>

			<!-- Ghouls -->
			{#each state.ghouls as ghoul, i (ghoul.id)}
				<div
					class="absolute bottom-28 sm:bottom-32 transition-all duration-500 ease-linear"
					style="left: {Math.min(ghoul.position, 88)}%;"
				>
					<div class="relative flex flex-col items-center">
						{#if i === 0}
							<div class="absolute -top-16 left-1/2 -translate-x-1/2 bg-stone-900/90 text-amber-50 text-xs sm:text-sm px-3 py-1.5 rounded-xl whitespace-nowrap text-center font-bold shadow-lg">
								{ghoul.puzzle.promptAr}
							</div>
						{/if}
						<div class="text-4xl sm:text-5xl filter drop-shadow-lg">{ghoulIcon(ghoul.type)}</div>
						{#if ghoul.type === 'boss'}
							<div class="w-16 h-2 bg-stone-800 rounded-full mt-1 overflow-hidden">
								<div class="h-full bg-red-500" style="width: {(ghoul.health / ghoul.maxHealth) * 100}%"></div>
							</div>
						{/if}
					</div>
				</div>
			{/each}

			<!-- Trap animation -->
			{#if trapAnim !== 'none'}
				<div class="absolute bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 pointer-events-none">
					<div class="text-6xl animate-bounce">
						{#if trapAnim === 'gate'}🚪{/if}
						{#if trapAnim === 'sand'}🌪️{/if}
						{#if trapAnim === 'smoke'}💨{/if}
						{#if trapAnim === 'stone'}🪨{/if}
					</div>
				</div>
			{/if}

			<!-- Answer stones -->
			{#if state.ghouls.length > 0}
				<div class="bg-stone-900/70 rounded-2xl p-3 sm:p-4 mb-2 pointer-events-auto">
					<div class="flex items-center justify-between mb-2">
						<div class="flex items-center gap-2 text-amber-50 text-sm font-bold">
							<span>{puzzleIcon(state.ghouls[0].puzzle.type)}</span>
							<span>{state.waveMessage}</span>
						</div>
						<button
							type="button"
							class="text-amber-200 hover:text-amber-50 text-sm font-bold"
							onclick={showHint}
						>
							💡 تلميح
						</button>
					</div>
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
						{#each state.ghouls[0].puzzle.options as option}
							<button
								type="button"
								class="bg-amber-100 text-stone-900 font-bold text-2xl py-4 rounded-xl hover:bg-amber-200 active:bg-amber-300 transition-colors shadow"
								onclick={() => submitAnswer(option)}
							>
								{typeof option === 'number' ? option.toLocaleString('en') : option}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Feedback overlay -->
		{#if state.feedback !== 'none'}
			<div class="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 pointer-events-none">
				<div
					class="{state.feedback === 'correct'
						? 'bg-green-600/90'
						: state.feedback === 'slow'
							? 'bg-amber-600/90'
							: 'bg-red-600/90'} text-amber-50 px-6 py-3 rounded-2xl shadow-xl text-center font-bold text-lg animate-bounce"
				>
					{state.feedbackMessage}
				</div>
			</div>
		{/if}
	{/if}

	{#if phase === 'result' && state}
		<div class="absolute inset-0 flex items-center justify-center bg-black/70 px-4">
			<div class="bg-amber-50 text-stone-900 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border-4 border-amber-700">
				<div class="text-5xl mb-3">{state.stars > 0 ? '🏆' : '💔'}</div>
				<h2 class="font-display font-bold text-2xl mb-2">
					{state.stars > 0 ? 'حمايت الخزنة!' : 'الخزنة سُرقت!'}
				</h2>
				<div class="text-3xl mb-4">{starLabel(state.stars)}</div>
				<p class="text-sm opacity-80 mb-6">
					نقاطك: {state.score} — أعلى سلسلة: ×{state.maxCombo}
				</p>

				<div class="flex gap-3 justify-center">
					<button
						type="button"
						class="bg-stone-700 hover:bg-stone-600 text-amber-50 font-bold py-3 px-5 rounded-xl transition-colors"
						onclick={backToMenu}
					>
						القائمة
					</button>
					<button
						type="button"
						class="bg-amber-600 hover:bg-amber-700 text-amber-50 font-bold py-3 px-5 rounded-xl transition-colors"
						onclick={restartLevel}
					>
						إعادة المحاولة
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
