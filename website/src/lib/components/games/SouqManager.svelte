<script lang="ts">
	// @ts-nocheck
	import { onMount, onDestroy } from 'svelte';
	import type { SouqManagerState } from '$lib/games/souq-manager';
	import { SOUQ_LEVELS } from '$lib/games/souq-manager';

	let canvas: HTMLCanvasElement;
	let game: import('$lib/games/souq-manager').SouqManagerGame | null = null;
	let state = $state<SouqManagerState | null>(null);
	let muted = $state(false);
	let phase = $state<'menu' | 'playing' | 'result'>('menu');
	let selectedLevel = $state(1);

	onMount(() => {
		import('$lib/games/souq-manager');
	});

	onDestroy(() => {
		game?.dispose();
	});

	async function startLevel(level: number) {
		selectedLevel = level;
		const { SouqManagerGame } = await import('$lib/games/souq-manager');
		phase = 'playing';
		game = new SouqManagerGame(
			canvas,
			(s) => {
				state = s;
				if (s.gameState === 'levelComplete' || s.gameState === 'levelFailed') {
					phase = 'result';
				}
			},
			{ level }
		);
		game.setMuted(muted);
	}

	function backToMenu() {
		game?.dispose();
		game = null;
		state = null;
		phase = 'menu';
	}

	function restartLevel() {
		game?.restartLevel();
		phase = 'playing';
	}

	function unload() {
		game?.unload();
	}

	export function toggleMute() {
		muted = !muted;
		game?.setMuted(muted);
	}

	export function isMuted(): boolean {
		return muted;
	}

	function formatTime(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function starLabel(count: number): string {
		return '⭐'.repeat(count) + '✩'.repeat(3 - count);
	}
</script>

<div class="absolute inset-0 bg-gradient-to-b from-amber-100 to-orange-200 overflow-hidden">
	<canvas bind:this={canvas} class="block w-full h-full outline-none" tabindex="0"></canvas>

	{#if phase === 'menu'}
		<div class="absolute inset-0 flex items-center justify-center bg-charcoal/60 px-4">
			<div class="bg-sea-dark text-cream rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl">
				<div class="text-5xl mb-3">🧺</div>
				<h2 class="font-display font-bold text-2xl mb-2">سوق الخليج</h2>
				<p class="text-sm opacity-80 mb-6">
					أدر دكاناً تقليدياً: ازرع التمر، احمص القهوة، وفرّز اللبان. اخدم زبائنك وحقق هدف اليوم!
				</p>

				<div class="grid grid-cols-3 gap-3">
					{#each SOUQ_LEVELS as level}
						<button
							type="button"
							data-level={level.level}
							class="bg-sun hover:bg-sun-dark text-charcoal font-bold py-3 rounded-xl transition-colors"
							onclick={() => startLevel(level.level)}
						>
							<div class="text-lg">{level.level}</div>
							<div class="text-xs opacity-80">{level.targetCoins}🪙</div>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	{#if state && phase === 'playing'}
		<!-- HUD -->
		<div class="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
			<div class="bg-charcoal/80 text-cream px-4 py-2 rounded-xl text-center">
				<div class="text-xs opacity-80">الهدف</div>
				<div class="font-bold">{state.targetCoins} 🪙</div>
			</div>
			<div class="bg-charcoal/80 text-cream px-4 py-2 rounded-xl text-center">
				<div class="text-xs opacity-80">الوقت</div>
				<div class="font-bold {state.timeRemaining <= 10 ? 'text-danger' : ''}">{formatTime(state.timeRemaining)}</div>
			</div>
			<div class="bg-charcoal/80 text-cream px-4 py-2 rounded-xl text-center">
				<div class="text-xs opacity-80">الرصيد</div>
				<div class="font-bold">{state.coins} 🪙</div>
			</div>
		</div>

		<!-- Message -->
		<div class="absolute top-24 left-4 right-4 flex justify-center pointer-events-none">
			<div class="bg-charcoal/80 text-cream px-5 py-2 rounded-xl text-center font-bold text-sm max-w-md">
				{state.message}
			</div>
		</div>

		<!-- Unload action -->
		{#if state.canUnloadHere}
			<button
				type="button"
				class="absolute bottom-32 left-1/2 -translate-x-1/2 bg-sun hover:bg-sun-dark text-charcoal font-bold py-2 px-6 rounded-xl shadow-lg transition-colors"
				onclick={unload}
			>
				ضع السلعة هنا (Space)
			</button>
		{/if}

		<!-- Hint -->
		<div class="absolute bottom-20 left-4 right-4 text-cream/90 text-xs bg-charcoal/60 px-3 py-2 rounded-lg pointer-events-none text-center leading-relaxed">
			سلاسل الإنتاج: النخلة ← التجفيف ← التعبئة &nbsp;|&nbsp; البن الأخضر ← المحمص ← الهاون ← الدلة &nbsp;|&nbsp; اللبان الخام ← الفرز ← التعبئة
			<br />
			اقف بالقرب من المحطة أو الرف واضغط Space (أو الزر) لوضع السلعة.
		</div>
	{/if}

	{#if phase === 'result' && state}
		<div class="absolute inset-0 flex items-center justify-center bg-charcoal/70 px-4">
			<div class="bg-sea-dark text-cream rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center shadow-xl">
				<div class="text-5xl mb-3">{state.gameState === 'levelComplete' ? '🎉' : '⏰'}</div>
				<h2 class="font-display font-bold text-2xl mb-2">
					{state.gameState === 'levelComplete' ? 'أحسنت!' : 'انتهى الوقت'}
				</h2>
				<p class="text-sm opacity-80 mb-4">
					{state.gameState === 'levelComplete'
						? `جمعت ${state.totalCoinsEarned} عملة من ${state.targetCoins} مطلوبة`
						: `جمعت ${state.totalCoinsEarned} عملة فقط من ${state.targetCoins} مطلوبة`}
				</p>
				<div class="text-2xl mb-6">{starLabel(state.stars)}</div>
				<div class="flex flex-col gap-3">
					<button
						type="button"
						class="bg-sun hover:bg-sun-dark text-charcoal font-bold py-3 px-6 rounded-xl transition-colors"
						onclick={restartLevel}
					>
						إعادة اللعب
					</button>
					<button
						type="button"
						class="bg-white/10 hover:bg-white/20 text-cream font-bold py-3 px-6 rounded-xl transition-colors"
						onclick={backToMenu}
					>
						قائمة المستويات
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
