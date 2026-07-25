<script lang="ts">
	// @ts-nocheck
	import { onMount, onDestroy } from 'svelte';
	import type { FalconFlightState } from '$lib/games/falcon-flight';

	let canvas: HTMLCanvasElement;
	let game: import('$lib/games/falcon-flight').FalconFlightGame | null = null;
	let state = $state<FalconFlightState | null>(null);
	let muted = $state(false);
	let phase = $state<'menu' | 'playing' | 'result'>('menu');

	onMount(() => {
		import('$lib/games/falcon-flight');
	});

	onDestroy(() => {
		game?.dispose();
	});

	async function startGame() {
		const { FalconFlightGame } = await import('$lib/games/falcon-flight');
		phase = 'playing';
		game = new FalconFlightGame(
			canvas,
			(s) => {
				state = s;
				if (s.phase === 'result') {
					phase = 'result';
				}
			}
		);
		game.setMuted(muted);
		game.startRun();
	}

	function restartGame() {
		game?.restart();
		phase = 'playing';
	}

	function backToMenu() {
		game?.backToMenu();
		phase = 'menu';
	}

	export function toggleMute() {
		muted = !muted;
		game?.setMuted(muted);
	}

	export function isMuted(): boolean {
		return muted;
	}
</script>

<div class="absolute inset-0 bg-gradient-to-b from-orange-300 via-amber-200 to-purple-200 overflow-hidden">
	<canvas bind:this={canvas} class="block w-full h-full outline-none" tabindex="0"></canvas>

	{#if phase === 'menu'}
		<div class="absolute inset-0 flex items-center justify-center bg-charcoal/60 px-4">
			<div class="bg-sea-dark text-cream rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl">
				<div class="text-5xl mb-3">🦅</div>
				<h2 class="font-display font-bold text-2xl mb-2">رحلة الصقر</h2>
				<p class="text-sm opacity-80 mb-6">
					حلق فوق كثبان الصحراء الذهبية، اقتنص الفرائس، وتجنب العوائق. استمر بالضغط للطيران للأعلى، اترك للانخفاض.
				</p>
				<button
					type="button"
					class="bg-sun hover:bg-sun-dark text-charcoal font-bold py-3 px-8 rounded-xl transition-colors"
					onclick={startGame}
				>
					ابدأ الرحلة
				</button>
			</div>
		</div>
	{/if}

	{#if state && phase === 'playing'}
		<!-- HUD -->
		<div class="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
			<div class="bg-charcoal/80 text-cream px-4 py-2 rounded-xl text-center">
				<div class="text-xs opacity-80">المسافة</div>
				<div class="font-bold">{state.distance} م</div>
			</div>
			<div class="flex-1 mx-4 bg-charcoal/80 text-cream px-4 py-2 rounded-xl text-center">
				<div class="text-xs opacity-80 mb-1">الطاقة</div>
				<div class="w-full h-3 bg-charcoal rounded-full overflow-hidden">
					<div
						class="h-full bg-gradient-to-r from-danger to-sun transition-all duration-200"
						style="width: {state.energy}%"
					></div>
				</div>
			</div>
			<div class="bg-charcoal/80 text-cream px-4 py-2 rounded-xl text-center">
				<div class="text-xs opacity-80">النقاط</div>
				<div class="font-bold">{state.score} 🪶</div>
			</div>
		</div>

		<!-- Power-up badges -->
		<div class="absolute top-20 left-4 right-4 flex justify-center gap-2 pointer-events-none">
			{#if state.tailwindTimer > 0}
				<div class="bg-sun/90 text-charcoal px-3 py-1 rounded-lg text-sm font-bold">
					رياح مواتية 💨 {state.tailwindTimer.toFixed(1)}ث
				</div>
			{/if}
			{#if state.sharperEyesTimer > 0}
				<div class="bg-sea/90 text-cream px-3 py-1 rounded-lg text-sm font-bold">
					عين حادة 👁 {state.sharperEyesTimer.toFixed(1)}ث
				</div>
			{/if}
			{#if state.streakCount >= 3}
				<div class="bg-orange-500/90 text-cream px-3 py-1 rounded-lg text-sm font-bold animate-pulse">
					سلسلة صيد ×{state.streakCount >= 6 ? 3 : 2} 🔥
				</div>
			{/if}
		</div>

		<!-- Hint -->
		<div class="absolute bottom-20 left-4 right-4 text-cream/90 text-xs bg-charcoal/60 px-3 py-2 rounded-lg pointer-events-none text-center leading-relaxed">
			استمر بالضغط للطيران للأعلى، اترك للانخفاض. اجتاز الفرائس لزيادة النقاط واستعادة الطاقة.
		</div>
	{/if}

	{#if phase === 'result' && state}
		<div class="absolute inset-0 flex items-center justify-center bg-charcoal/70 px-4">
			<div class="bg-sea-dark text-cream rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center shadow-xl">
				<div class="text-5xl mb-3">🦅</div>
				<h2 class="font-display font-bold text-2xl mb-2">عُدت إلى القفاز</h2>
				<p class="text-sm opacity-80 mb-4">
					{state.gameOverReason}
				</p>
				<div class="grid grid-cols-2 gap-3 mb-6">
					<div class="bg-charcoal/60 rounded-xl p-3">
						<div class="text-xs opacity-80">المسافة</div>
						<div class="font-bold text-lg">{state.distance} م</div>
					</div>
					<div class="bg-charcoal/60 rounded-xl p-3">
						<div class="text-xs opacity-80">أفضل مسافة</div>
						<div class="font-bold text-lg">{state.bestDistance} م</div>
					</div>
					<div class="bg-charcoal/60 rounded-xl p-3">
						<div class="text-xs opacity-80">النقاط</div>
						<div class="font-bold text-lg">{state.score}</div>
					</div>
					<div class="bg-charcoal/60 rounded-xl p-3">
						<div class="text-xs opacity-80">الفرائس</div>
						<div class="font-bold text-lg">{state.preyCount}</div>
					</div>
				</div>
				<div class="flex flex-col gap-3">
					<button
						type="button"
						class="bg-sun hover:bg-sun-dark text-charcoal font-bold py-3 px-6 rounded-xl transition-colors"
						onclick={restartGame}
					>
						إعادة الطيران
					</button>
					<button
						type="button"
						class="bg-white/10 hover:bg-white/20 text-cream font-bold py-3 px-6 rounded-xl transition-colors"
						onclick={backToMenu}
					>
						القائمة
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
