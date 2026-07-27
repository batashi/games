<script lang="ts">
	// @ts-nocheck
	import { onMount, onDestroy } from 'svelte';
	import type { MajlisHostState, ServingItem } from '$lib/games/majlis-host';
	import { MAJLIS_LEVELS } from '$lib/games/majlis-host';

	let canvas: HTMLCanvasElement;
	let game: import('$lib/games/majlis-host').MajlisHostGame | null = null;
	let state = $state<MajlisHostState | null>(null);
	let muted = $state(false);
	let phase = $state<'menu' | 'playing' | 'result'>('menu');
	let selectedLevel = $state(1);

	onMount(() => {
		import('$lib/games/majlis-host');
	});

	onDestroy(() => {
		game?.dispose();
	});

	async function startLevel(level: number) {
		selectedLevel = level;
		const { MajlisHostGame } = await import('$lib/games/majlis-host');
		phase = 'playing';
		game = new MajlisHostGame(
			canvas,
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
		game?.dispose();
		game = null;
		state = null;
		phase = 'menu';
	}

	function serveItem(item: ServingItem) {
		game?.serveItem(item);
	}

	function usePowerUp(type: 'freshBukhoor' | 'quickPour' | 'extraHand') {
		game?.usePowerUp(type);
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

	function itemIcon(item: ServingItem): string {
		const icons: Record<ServingItem, string> = {
			bukhoor: '🌿',
			qahwa: '☕',
			dates: '🌴',
			water: '💧',
			halwa: '🍬',
			refill: '♨️'
		};
		return icons[item];
	}

	function itemLabel(item: ServingItem): string {
		const labels: Record<ServingItem, string> = {
			bukhoor: 'بخور',
			qahwa: 'قهوة',
			dates: 'تمر',
			water: 'ماء',
			halwa: 'حلوى',
			refill: 'إعادة ملء'
		};
		return labels[item];
	}

	function keyboardLabel(index: number): string {
		return ['1', '2', '3', '4'][index] ?? '';
	}
</script>

<div class="absolute inset-0 bg-gradient-to-b from-amber-100 via-orange-100 to-amber-200 overflow-hidden">
	<canvas bind:this={canvas} class="block w-full h-full outline-none" tabindex="0"></canvas>

	{#if phase === 'menu'}
		<div class="absolute inset-0 flex items-center justify-center bg-charcoal/60 px-4">
			<div class="bg-sea-dark text-cream rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl">
				<div class="text-5xl mb-3">🫖</div>
				<h2 class="font-display font-bold text-2xl mb-2">ضيافة المجلس</h2>
				<p class="text-sm opacity-80 mb-6">
					رحّب بضيوفك في المجلس بالترتيب الصحيح: بخور، قهوة، تمر، ماء. كن سريعاً ولا تنسَ اللباقة!
				</p>

				<div class="grid grid-cols-3 gap-3">
					{#each MAJLIS_LEVELS as level}
						<button
							type="button"
							data-level={level.level}
							class="bg-sun hover:bg-sun-dark text-charcoal font-bold py-3 rounded-xl transition-colors"
							onclick={() => startLevel(level.level)}
						>
							<div class="text-lg">{level.level}</div>
							<div class="text-xs opacity-80">{level.targetGuests} ضيف</div>
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
				<div class="text-xs opacity-80">النقاط</div>
				<div class="font-bold">{state.score}</div>
			</div>
			<div class="bg-charcoal/80 text-cream px-4 py-2 rounded-xl text-center">
				<div class="text-xs opacity-80">الضيوف السعداء</div>
				<div class="font-bold">{state.happyGuests} / {state.targetGuests}</div>
			</div>
			<div class="bg-charcoal/80 text-cream px-4 py-2 rounded-xl text-center">
				<div class="text-xs opacity-80">الوقت</div>
				<div class="font-bold {state.timeRemaining <= 10 ? 'text-danger' : ''}">{formatTime(state.timeRemaining)}</div>
			</div>
			<div class="bg-charcoal/80 text-cream px-4 py-2 rounded-xl text-center">
				<div class="text-xs opacity-80">القلوب</div>
				<div class="font-bold">{'❤️'.repeat(state.lives)}{'🖤'.repeat(state.maxLives - state.lives)}</div>
			</div>
		</div>

		<!-- Combo -->
		{#if state.combo > 1}
			<div class="absolute top-20 left-4 right-4 flex justify-center pointer-events-none">
				<div class="bg-orange-500/90 text-cream px-4 py-1 rounded-lg text-sm font-bold animate-pulse">
					سلسلة خدمة ×{state.combo} 🔥
				</div>
			</div>
		{/if}

		<!-- Active guest sequence bubble -->
		{#if state.activeGuest && state.activeGuest.state !== 'leaving-happy' && state.activeGuest.state !== 'leaving-angry'}
			<div class="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-none">
				<div class="bg-cream/95 text-charcoal px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2">
					{#each state.activeGuest.sequence as step, index}
						<div
							class="flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors {index < state.activeGuest.progress ? 'bg-success/20' : 'bg-charcoal/10'}"
						>
							<span class="text-2xl {index < state.activeGuest.progress ? 'opacity-40' : ''}">{itemIcon(step)}</span>
							<span class="text-xs font-bold {index < state.activeGuest.progress ? 'opacity-40' : ''}">{itemLabel(step)}</span>
						</div>
						{#if index < state.activeGuest.sequence.length - 1}
							<span class="text-charcoal/40">→</span>
						{/if}
					{/each}
				</div>
			</div>
		{/if}

		<!-- Power-ups -->
		<div class="absolute bottom-4 right-4 flex gap-2">
			<button
				type="button"
				class="bg-sea hover:bg-sea-dark text-cream font-bold py-2 px-3 rounded-xl shadow-lg transition-colors text-xs"
				onclick={() => usePowerUp('freshBukhoor')}
				disabled={state.freshBukhoorTimer > 0}
			>
				🌿 بخور طازج {state.freshBukhoorTimer > 0 ? `(${state.freshBukhoorTimer.toFixed(1)}ث)` : ''}
			</button>
			<button
				type="button"
				class="bg-sun hover:bg-sun-dark text-charcoal font-bold py-2 px-3 rounded-xl shadow-lg transition-colors text-xs"
				onclick={() => usePowerUp('quickPour')}
			>
				☕ سكب سريع
			</button>
			<button
				type="button"
				class="bg-success hover:bg-success/80 text-cream font-bold py-2 px-3 rounded-xl shadow-lg transition-colors text-xs"
				onclick={() => usePowerUp('extraHand')}
				disabled={state.extraHandCharges > 0}
			>
				🤝 يد مساعدة {state.extraHandCharges > 0 ? '(جاهز)' : ''}
			</button>
		</div>

		<!-- Desktop keyboard hint -->
		<div class="absolute bottom-4 left-4 bg-charcoal/70 text-cream px-3 py-2 rounded-xl text-xs pointer-events-none hidden sm:block">
			<div class="flex gap-3">
				{#each ['bukhoor', 'qahwa', 'dates', 'water'] as item, i}
					<div class="flex items-center gap-1">
						<span class="bg-cream/20 px-1.5 rounded font-bold">{keyboardLabel(i)}</span>
						<span>{itemLabel(item as ServingItem)}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if phase === 'result' && state}
		<div class="absolute inset-0 flex items-center justify-center bg-charcoal/70 px-4">
			<div class="bg-sea-dark text-cream rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center shadow-xl">
				<div class="text-5xl mb-3">{state.resultReason === 'level_complete' ? '🎉' : '⏰'}</div>
				<h2 class="font-display font-bold text-2xl mb-2">
					{state.resultReason === 'level_complete' ? 'أحسنت!' : 'حاول مرة أخرى'}
				</h2>
				<p class="text-sm opacity-80 mb-4">
					{state.resultReason === 'level_complete'
						? `قدّمت الضيافة لـ ${state.happyGuests} ضيف`
						: state.resultReason === 'time_up'
							? 'انتهى الوقت قبل إكمال الضيافة'
							: 'نفدت قلوبك'}
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
