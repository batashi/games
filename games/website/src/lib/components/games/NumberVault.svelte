<script lang="ts">
	// @ts-nocheck
	import { onDestroy } from 'svelte';
	import type { NumberVaultState, NumberVaultPuzzle, PuzzleType } from '$lib/games/number-vault';
	import { NUMBER_VAULT_LEVELS } from '$lib/games/number-vault';

	let canvas: HTMLCanvasElement;
	let game: import('$lib/games/number-vault').NumberVaultGame | null = null;
	let state = $state<NumberVaultState | null>(null);
	let muted = $state(false);
	let phase = $state<'menu' | 'playing' | 'result'>('menu');
	let selectedLevel = $state(1);

	// Order puzzle state
	let orderSlots = $state<number[]>([]);
	let orderPool = $state<number[]>([]);

	$effect(() => {
		if (state?.currentPuzzle?.type === 'order') {
			orderSlots = [];
			orderPool = [...(state.currentPuzzle.options ?? [])];
		}
	});

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

	function advance() {
		game?.advanceAfterFeedback();
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

	function puzzleLabel(type: PuzzleType): string {
		const labels: Record<PuzzleType, string> = {
			'place-value': 'القيمة المكانية',
			order: 'ترتيب الأعداد',
			round: 'التقريب',
			sequence: 'المتتاليات'
		};
		return labels[type];
	}

	function handleOrderTileClick(value: number) {
		if (!state?.currentPuzzle) return;
		orderSlots = [...orderSlots, value];
		orderPool = orderPool.filter((v) => v !== value);
		if (orderPool.length === 0) {
			submitAnswer(orderSlots);
		}
	}

	function removeOrderSlot(index: number) {
		const value = orderSlots[index];
		orderSlots = orderSlots.filter((_, i) => i !== index);
		orderPool = [...orderPool, value];
	}
</script>

<div class="absolute inset-0 bg-gradient-to-b from-stone-700 via-stone-600 to-stone-800 overflow-hidden">
	<canvas bind:this={canvas} class="block w-full h-full outline-none" tabindex="0"></canvas>

	{#if phase === 'menu'}
		<div class="absolute inset-0 flex items-center justify-center bg-black/50 px-4">
			<div class="bg-amber-50 text-stone-900 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border-4 border-amber-700">
				<div class="text-5xl mb-3">🔐</div>
				<h2 class="font-display font-bold text-2xl mb-2">خزنة الأرقام</h2>
				<p class="text-sm opacity-80 mb-6">
					افتح أبواب الخزنة القديمة بحل ألغاز القيمة المكانية والترتيب والتقريب والمتتاليات.
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
							<div class="text-xs opacity-90">{level.doors} أبواب</div>
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
				<div class="text-xs opacity-80">الأبواب</div>
				<div class="font-bold">{state.doorsSolved} / {state.totalDoors}</div>
			</div>
			<div class="bg-stone-900/80 text-amber-50 px-4 py-2 rounded-xl text-center">
				<div class="text-xs opacity-80">النقاط</div>
				<div class="font-bold">{state.score}</div>
			</div>
		</div>

		<!-- Vault door panel -->
		<div class="absolute inset-0 flex items-center justify-center px-4 pointer-events-none">
			<div class="bg-amber-900 rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border-8 border-amber-950 pointer-events-auto">
				{#if state.currentPuzzle}
					<div class="text-center mb-4">
						<div class="inline-flex items-center gap-2 bg-amber-950/60 text-amber-100 px-3 py-1 rounded-full text-sm mb-2">
							<span>{puzzleIcon(state.currentPuzzle.type)}</span>
							<span>{puzzleLabel(state.currentPuzzle.type)}</span>
						</div>
						<p class="text-xl font-bold text-amber-50 leading-relaxed">{state.currentPuzzle.promptAr}</p>
					</div>

					<div class="min-h-[180px] flex items-center justify-center">
						{#if state.currentPuzzle.type === 'place-value'}
							<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
								{#each state.currentPuzzle.options ?? [] as option}
									<button
										type="button"
										class="bg-amber-50 text-stone-900 font-bold text-2xl py-4 rounded-xl hover:bg-amber-200 transition-colors shadow"
										onclick={() => submitAnswer(option)}
									>
										{option}
									</button>
								{/each}
							</div>
						{:else if state.currentPuzzle.type === 'order'}
							<div class="w-full">
								<div class="flex flex-wrap justify-center gap-2 min-h-[64px] mb-4 p-3 bg-amber-950/40 rounded-xl">
									{#each orderSlots as value, index}
										<button
											type="button"
											class="bg-amber-500 text-stone-900 font-bold text-xl px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors"
											onclick={() => removeOrderSlot(index)}
										>
											{value.toLocaleString('en')}
										</button>
									{/each}
								</div>
								<div class="flex flex-wrap justify-center gap-2">
									{#each orderPool as value}
										<button
											type="button"
											class="bg-amber-100 text-stone-900 font-bold text-xl px-4 py-2 rounded-lg hover:bg-amber-200 transition-colors"
											onclick={() => handleOrderTileClick(value)}
										>
											{value.toLocaleString('en')}
										</button>
									{/each}
								</div>
							</div>
						{:else if state.currentPuzzle.type === 'round'}
							<div class="grid grid-cols-2 gap-3 w-full">
								{#each state.currentPuzzle.options ?? [] as option}
									<button
										type="button"
										class="bg-amber-50 text-stone-900 font-bold text-xl py-4 rounded-xl hover:bg-amber-200 transition-colors shadow"
										onclick={() => submitAnswer(option)}
									>
										{option.toLocaleString('en')}
									</button>
								{/each}
							</div>
						{:else if state.currentPuzzle.type === 'sequence'}
							<div class="grid grid-cols-2 gap-3 w-full">
								{#each state.currentPuzzle.options ?? [] as option}
									<button
										type="button"
										class="bg-amber-50 text-stone-900 font-bold text-xl py-4 rounded-xl hover:bg-amber-200 transition-colors shadow"
										onclick={() => submitAnswer(option)}
									>
										{option.toLocaleString('en')}
									</button>
								{/each}
							</div>
						{/if}
					</div>

					<div class="flex justify-between items-center mt-6">
						<button
							type="button"
							class="bg-stone-700 hover:bg-stone-600 text-amber-50 font-bold py-2 px-4 rounded-xl transition-colors text-sm"
							onclick={showHint}
							disabled={state.feedback === 'correct'}
						>
							💡 تلميح
						</button>

						{#if state.feedback !== 'none'}
							<button
								type="button"
								class="{state.feedback === 'correct' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'} text-amber-50 font-bold py-2 px-6 rounded-xl transition-colors"
								onclick={advance}
							>
								{state.feedback === 'correct' ? 'الباب التالي →' : 'حاول مرة أخرى'}
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- Feedback overlay -->
		{#if state.feedback !== 'none'}
			<div class="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none">
				<div
					class="{state.feedback === 'correct'
						? 'bg-green-600/90'
						: 'bg-amber-700/90'} text-amber-50 px-6 py-3 rounded-2xl shadow-xl text-center font-bold animate-bounce"
				>
					{state.feedbackMessage}
				</div>
			</div>
		{/if}
	{/if}

	{#if phase === 'result' && state}
		<div class="absolute inset-0 flex items-center justify-center bg-black/60 px-4">
			<div class="bg-amber-50 text-stone-900 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border-4 border-amber-700">
				<div class="text-5xl mb-3">🏆</div>
				<h2 class="font-display font-bold text-2xl mb-2">اكتمل المستوى!</h2>
				<div class="text-3xl mb-4">{starLabel(state.stars)}</div>
				<p class="text-sm opacity-80 mb-6">
					فتحت {state.doorsSolved} أبواب وحصلت على {state.score} نقطة.
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
