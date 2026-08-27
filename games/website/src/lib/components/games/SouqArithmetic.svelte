<script lang="ts">
	// @ts-nocheck
	import { onDestroy } from 'svelte';
	import type { SouqArithmeticState, GoodId, Good } from '$lib/games/souq-arithmetic';
	import { SOUQ_LEVELS, GOODS, COIN_VALUES, formatMoney } from '$lib/games/souq-arithmetic';

	let canvas: HTMLCanvasElement;
	let game: import('$lib/games/souq-arithmetic').SouqArithmeticGame | null = null;
	let state = $state<SouqArithmeticState | null>(null);
	let muted = $state(false);
	let phase = $state<'menu' | 'playing' | 'result'>('menu');
	let selectedLevel = $state(1);

	onDestroy(() => {
		game?.dispose();
	});

	async function startLevel(level: number) {
		selectedLevel = level;
		const { SouqArithmeticGame } = await import('$lib/games/souq-arithmetic');
		phase = 'playing';
		game = new SouqArithmeticGame(
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

	function addToCart(goodId: GoodId) {
		game?.addToCart(goodId);
	}

	function removeFromCart(goodId: GoodId) {
		game?.removeFromCart(goodId);
	}

	function addChange(coin: number) {
		game?.addChange(coin);
	}

	function removeChange(coin: number) {
		game?.removeChange(coin);
	}

	function submitTransaction() {
		game?.submitTransaction();
	}

	function submitRestock(answer: number) {
		game?.submitRestock(answer);
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

	function customerIcon(type: string): string {
		const icons: Record<string, string> = {
			villager: '👴',
			sailor: '⚓',
			falconer: '🦅',
			merchant: '🧔'
		};
		return icons[type] ?? '👤';
	}

	function starLabel(count: number): string {
		return '⭐'.repeat(count) + '✩'.repeat(3 - count);
	}

	function formatTime(seconds: number): string {
		const s = Math.max(0, Math.ceil(seconds));
		const m = Math.floor(s / 60);
		const rem = s % 60;
		return `${m}:${rem.toString().padStart(2, '0')}`;
	}

	function orderTotal(state: SouqArithmeticState): number {
		if (!state.customer) return 0;
		return GOODS.reduce((sum, good) => sum + (state.customer?.order[good.id] ?? 0) * good.price, 0);
	}

	function cartTotal(state: SouqArithmeticState): number {
		return GOODS.reduce((sum, good) => sum + (state.cart[good.id] ?? 0) * good.price, 0);
	}

	function expectedChange(state: SouqArithmeticState): number {
		if (!state.customer) return 0;
		return state.customer.payment - orderTotal(state);
	}

	function givenCoinsList(baisa: number): { coin: number; count: number }[] {
		const result: { coin: number; count: number }[] = [];
		let remaining = baisa;
		for (const coin of [...COIN_VALUES].sort((a, b) => b - a)) {
			const count = Math.floor(remaining / coin);
			if (count > 0) {
				result.push({ coin, count });
				remaining -= count * coin;
			}
		}
		return result;
	}
</script>

<div class="absolute inset-0 bg-gradient-to-b from-amber-100 via-orange-50 to-amber-200 overflow-hidden">
	<canvas bind:this={canvas} class="block w-full h-full outline-none" tabindex="0"></canvas>

	{#if phase === 'menu'}
		<div class="absolute inset-0 flex items-center justify-center bg-black/40 px-4">
			<div class="bg-amber-50 text-stone-900 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border-4 border-amber-700">
				<div class="text-6xl mb-3 animate-bounce">🧮</div>
				<h2 class="font-display font-bold text-3xl mb-2">حسابات السوق</h2>
				<p class="text-base opacity-80 mb-6">
					افتتحstallك في سوق عُماني تقليدي. احسب الحسابات بسرعة، أعطِ الباقي الصحيح، واكسب ثقة الزبائن.
				</p>

				<div class="grid grid-cols-3 gap-3">
					{#each SOUQ_LEVELS as level}
						<button
							type="button"
							data-level={level.level}
							class="bg-amber-600 hover:bg-amber-700 text-amber-50 font-bold py-3 rounded-xl transition-colors"
							onclick={() => startLevel(level.level)}
						>
							<div class="text-lg">{level.level}</div>
							<div class="text-xs opacity-90">{level.customers} زبون</div>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	{#if state && phase === 'playing'}
		<!-- HUD -->
		<div class="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none gap-2">
			<div class="bg-stone-900/80 text-amber-50 px-3 sm:px-4 py-2 rounded-xl text-center min-w-[70px]">
				<div class="text-[10px] sm:text-xs opacity-80">المستوى</div>
				<div class="font-bold text-lg">{state.level}</div>
			</div>
			<div class="bg-stone-900/80 text-amber-50 px-3 sm:px-4 py-2 rounded-xl text-center min-w-[70px]">
				<div class="text-[10px] sm:text-xs opacity-80">الزبائن</div>
				<div class="font-bold text-lg">{state.customersServed} / {state.customerQuota}</div>
			</div>
			<div class="bg-stone-900/80 text-amber-50 px-3 sm:px-4 py-2 rounded-xl text-center min-w-[70px]">
				<div class="text-[10px] sm:text-xs opacity-80">السمعة</div>
				<div class="font-bold text-lg">
					{#each Array(state.maxReputation) as _, i}
						<span class={i < state.reputation ? '' : 'opacity-30 grayscale'}>❤️</span>
					{/each}
				</div>
			</div>
			<div class="bg-stone-900/80 text-amber-50 px-3 sm:px-4 py-2 rounded-xl text-center min-w-[70px]">
				<div class="text-[10px] sm:text-xs opacity-80">النقاط</div>
				<div class="font-bold text-lg">{state.score}</div>
			</div>
			<div class="bg-stone-900/80 text-amber-50 px-3 sm:px-4 py-2 rounded-xl text-center min-w-[70px]">
				<div class="text-[10px] sm:text-xs opacity-80">الوقت</div>
				<div class="font-bold text-lg {state.timeRemaining <= 15 ? 'text-red-400 animate-pulse' : ''}">
					{formatTime(state.timeRemaining)}
				</div>
			</div>
		</div>

		<!-- Combo -->
		{#if state.combo > 1}
			<div class="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none">
				<div class="{state.combo >= 5 ? 'bg-red-500' : 'bg-orange-500'} text-amber-50 px-6 py-2 rounded-2xl text-xl font-black shadow-xl animate-pulse border-2 border-amber-100">
					سلسلة ×{state.combo} 🔥
				</div>
			</div>
		{/if}

		<!-- Game area -->
		<div class="absolute inset-0 flex flex-col justify-end px-2 sm:px-4 pb-2 sm:pb-4 pointer-events-none">
			{#if state.restockProblem}
				<!-- Restock panel -->
				<div class="bg-stone-900/90 text-amber-50 rounded-2xl p-4 sm:p-6 mb-4 pointer-events-auto border-2 border-amber-600 text-center">
					<div class="text-4xl mb-2">📦</div>
					<h3 class="font-bold text-lg mb-3">حان وقت إعادة التزويد!</h3>
					<p class="text-xl font-black mb-4">{state.restockProblem.questionAr}</p>
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
						{#each state.restockProblem.options as option}
							<button
								type="button"
								class="bg-amber-100 text-stone-900 font-black text-2xl py-4 rounded-xl hover:bg-amber-200 active:scale-95 transition-all shadow-lg border-b-4 border-amber-300"
								onclick={() => submitRestock(option)}
							>
								{option.toLocaleString('en')}
							</button>
						{/each}
					</div>
				</div>
			{:else if state.customer}
				<!-- Customer -->
				<div class="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none">
					<div class="flex flex-col items-center">
						<div class="bg-stone-900/95 text-amber-50 text-sm sm:text-base px-4 py-3 rounded-2xl text-center font-black shadow-2xl border-2 border-amber-500 mb-2 max-w-xs">
							<div class="mb-1">أريد شراء:</div>
							<div class="flex flex-wrap justify-center gap-2">
								{#each GOODS as good}
									{#if state.customer.order[good.id] > 0}
										<span class="bg-amber-700/50 px-2 py-1 rounded-lg">
											{good.icon} ×{state.customer.order[good.id]}
										</span>
										{/if}
								{/each}
							</div>
							<div class="mt-2 text-amber-300">يدفع: {formatMoney(state.customer.payment)}</div>
						</div>
						<div class="text-6xl sm:text-7xl filter drop-shadow-2xl animate-bounce">
							{customerIcon(state.customer.type)}
						</div>
						<!-- Patience bar -->
						<div class="w-24 h-2 bg-stone-800 rounded-full mt-2 overflow-hidden border border-amber-200">
							<div
								class="h-full transition-all {state.customer.patience / state.customer.maxPatience > 0.5 ? 'bg-green-500' : state.customer.patience / state.customer.maxPatience > 0.25 ? 'bg-yellow-500' : 'bg-red-500'}"
								style="width: {(state.customer.patience / state.customer.maxPatience) * 100}%"
							></div>
						</div>
					</div>
				</div>

				<!-- Counter / Cart -->
				<div class="bg-stone-900/80 backdrop-blur-sm rounded-2xl p-3 sm:p-4 mb-2 pointer-events-auto border border-amber-700/50">
					<div class="flex items-center justify-between mb-2">
						<div class="text-amber-50 text-sm sm:text-base font-black">
							السلة:
							{#each GOODS as good}
								{#if state.cart[good.id] > 0}
									<button
										type="button"
										class="mx-1 bg-amber-700/50 hover:bg-amber-600 px-2 py-1 rounded-lg transition-colors"
										onclick={() => removeFromCart(good.id)}
									>
										{good.icon} ×{state.cart[good.id]} ❌
									</button>
								{/if}
							{/each}
							{#if Object.values(state.cart).every((q) => q === 0)}
								<span class="opacity-60">فارغة</span>
							{/if}
						</div>
						<div class="text-amber-50 font-black text-lg">
							المجموع: {formatMoney(cartTotal(state))}
						</div>
					</div>
				</div>

				<!-- Shelf -->
				<div class="bg-amber-900/80 rounded-2xl p-3 sm:p-4 mb-2 pointer-events-auto border border-amber-700/50">
					<div class="grid grid-cols-5 gap-2 sm:gap-3">
						{#each GOODS as good}
							<button
								type="button"
								class="bg-amber-100 text-stone-900 rounded-xl p-2 sm:p-3 hover:bg-amber-200 active:scale-95 transition-all shadow-lg border-b-4 border-amber-300 disabled:opacity-40 disabled:grayscale"
								onclick={() => addToCart(good.id)}
								disabled={state.stock[good.id] <= 0}
							>
								<div class="text-2xl sm:text-3xl">{good.icon}</div>
								<div class="text-xs sm:text-sm font-bold">{good.nameAr}</div>
								<div class="text-xs font-black text-amber-800">{formatMoney(good.price)}</div>
								<div class="text-[10px] opacity-70">المخزن: {state.stock[good.id]}</div>
							</button>
						{/each}
					</div>
				</div>

				<!-- Change drawer -->
				{#if state.checkoutReady}
					<div class="bg-stone-800/90 rounded-2xl p-3 sm:p-4 mb-2 pointer-events-auto border border-amber-600 animate-pop">
						<div class="flex items-center justify-between mb-2">
							<div class="text-amber-50 font-black">
								الباقي المطلوب: {formatMoney(expectedChange(state))}
							</div>
							<div class="text-amber-50 font-black">
								أعطيت: {formatMoney(state.changeGiven)}
							</div>
						</div>
						<div class="grid grid-cols-5 gap-2 mb-3">
							{#each COIN_VALUES as coin}
								<button
									type="button"
									class="bg-amber-200 text-stone-900 font-black text-sm sm:text-base py-3 rounded-xl hover:bg-amber-300 active:scale-95 transition-all shadow border-b-4 border-amber-400"
									onclick={() => addChange(coin)}
								>
									{formatMoney(coin)}
								</button>
							{/each}
						</div>
						{#if state.changeGiven > 0}
							<div class="flex flex-wrap gap-2 mb-3">
								{#each givenCoinsList(state.changeGiven) as { coin, count }}
									<button
										type="button"
										class="bg-amber-600 text-amber-50 px-2 py-1 rounded-lg text-xs font-bold hover:bg-amber-700"
										onclick={() => removeChange(coin)}
									>
										{formatMoney(coin)} ×{count} ❌
									</button>
								{/each}
							</div>
						{/if}
						<button
							type="button"
							class="w-full bg-green-600 hover:bg-green-700 text-amber-50 font-black text-xl py-3 rounded-xl transition-colors shadow-lg animate-pulse"
							onclick={submitTransaction}
						>
							🔔 إنهاء البيعة
						</button>
					</div>
				{/if}
			{/if}
		</div>

		<!-- Feedback overlay -->
		{#if state.feedback !== 'none'}
			<div class="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none z-40">
				<div
					class="{state.feedback === 'correct'
						? 'bg-green-600'
						: state.feedback === 'slow'
							? 'bg-amber-600'
							: 'bg-red-600'} text-amber-50 px-8 py-4 rounded-3xl shadow-2xl text-center font-black text-2xl sm:text-3xl animate-pop border-4 border-amber-100"
				>
					{state.feedbackMessage}
				</div>
			</div>
		{/if}

		<!-- Hint button -->
		{#if state.customer || state.restockProblem}
			<div class="absolute bottom-4 left-4 pointer-events-auto">
				<button
					type="button"
					class="bg-stone-700/80 hover:bg-stone-600 text-amber-50 font-bold px-4 py-2 rounded-xl transition-colors text-sm"
					onclick={showHint}
				>
					💡 تلميح
				</button>
			</div>
		{/if}
	{/if}

	{#if phase === 'result' && state}
		<div class="absolute inset-0 flex items-center justify-center bg-black/80 px-4">
			<div class="bg-amber-50 text-stone-900 rounded-3xl p-6 sm:p-10 max-w-md w-full text-center shadow-2xl border-4 border-amber-700">
				<div class="text-7xl mb-4 animate-bounce">{state.stars > 0 ? '🏆' : '💔'}</div>
				<h2 class="font-display font-bold text-3xl mb-2">
					{state.stars > 0 ? 'يوم سوق ممتاز!' : 'انتهى السوق بخسارة!'}
				</h2>
				<div class="text-4xl mb-4">{starLabel(state.stars)}</div>
				<p class="text-base opacity-80 mb-6">
					نقاطك: {state.score} — أعلى سلسلة: ×{state.maxCombo} — الدقة: {state.accuracy}%
				</p>

				<div class="flex gap-3 justify-center">
					<button
						type="button"
						class="bg-stone-700 hover:bg-stone-600 text-amber-50 font-bold py-3 px-6 rounded-xl transition-colors"
						onclick={backToMenu}
					>
						القائمة
					</button>
					<button
						type="button"
						class="bg-amber-600 hover:bg-amber-700 text-amber-50 font-bold py-3 px-6 rounded-xl transition-colors"
						onclick={restartLevel}
					>
						إعادة المحاولة
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes pop {
		0% { transform: scale(0.2); opacity: 0; }
		50% { transform: scale(1.15); opacity: 1; }
		100% { transform: scale(1); opacity: 1; }
	}

	:global(.animate-pop) {
		animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
	}
</style>
