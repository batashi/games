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
	let shake = $state(false);
	let deathBursts = $state<{ id: number; x: number; icon: string }[]>([]);
	let prevGhoulCount = $state(0);

	onDestroy(() => {
		game?.dispose();
	});

	async function startLevel(level: number) {
		selectedLevel = level;
		const { NumberVaultGame } = await import('$lib/games/number-vault');
		phase = 'playing';
		deathBursts = [];
		prevGhoulCount = 0;
		game = new NumberVaultGame(
			(s) => {
				const wasHit = s.feedback === 'incorrect' || s.feedbackMessage.includes('سرق');
				const wasCorrect = s.feedback === 'correct' || s.feedback === 'slow';

				if (wasHit) {
					shakeScreen();
				}

				if (wasCorrect) {
					triggerTrap();
					// If a ghoul was defeated, spawn a death burst at the lead position.
					if (state && s.ghouls.length < state.ghouls.length) {
						const defeated = state.ghouls[0];
						if (defeated) {
							spawnDeathBurst(defeated.position, defeated.type);
						}
					}
				}

				state = s;
				prevGhoulCount = s.ghouls.length;

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
		deathBursts = [];
	}

	function backToMenu() {
		game?.backToMenu();
		game = null;
		state = null;
		phase = 'menu';
		deathBursts = [];
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
		}, 700);
	}

	function shakeScreen() {
		shake = true;
		setTimeout(() => (shake = false), 300);
	}

	function spawnDeathBurst(position: number, type: Ghoul['type']) {
		const id = Date.now() + Math.random();
		const icon = type === 'boss' ? '💀' : '✨';
		deathBursts = [...deathBursts, { id, x: Math.min(position, 88), icon }];
		setTimeout(() => {
			deathBursts = deathBursts.filter((b) => b.id !== id);
		}, 800);
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

<div class="absolute inset-0 bg-gradient-to-b from-stone-700 via-stone-600 to-stone-800 overflow-hidden {shake ? 'animate-shake' : ''}">
	<canvas bind:this={canvas} class="block w-full h-full outline-none" tabindex="0"></canvas>

	{#if phase === 'menu'}
		<div class="absolute inset-0 flex items-center justify-center bg-black/50 px-4">
			<div class="bg-amber-50 text-stone-900 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border-4 border-amber-700">
				<div class="text-6xl mb-3 animate-bounce">🛡️</div>
				<h2 class="font-display font-bold text-3xl mb-2">حارس الخزنة</h2>
				<p class="text-base opacity-80 mb-6">
					الغول العدديّ يتسلل نحو خزنة القلعة العمانية. حلّ الألغاز بسرعة لتفعيل الفخاخ وتدافع عن الكنوز.
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
		<div class="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none gap-2">
			<div class="bg-stone-900/80 text-amber-50 px-3 sm:px-4 py-2 rounded-xl text-center min-w-[70px]">
				<div class="text-[10px] sm:text-xs opacity-80">المستوى</div>
				<div class="font-bold text-lg">{state.level}</div>
			</div>
			<div class="bg-stone-900/80 text-amber-50 px-3 sm:px-4 py-2 rounded-xl text-center min-w-[70px]">
				<div class="text-[10px] sm:text-xs opacity-80">الموجة</div>
				<div class="font-bold text-lg">{state.wave} / {state.totalWaves}</div>
			</div>
			<div class="bg-stone-900/80 text-amber-50 px-3 sm:px-4 py-2 rounded-xl text-center min-w-[70px]">
				<div class="text-[10px] sm:text-xs opacity-80">النقاط</div>
				<div class="font-bold text-lg">{state.score}</div>
			</div>
			<div class="bg-stone-900/80 text-amber-50 px-3 sm:px-4 py-2 rounded-xl text-center min-w-[70px]">
				<div class="text-[10px] sm:text-xs opacity-80">الكنوز</div>
				<div class="font-bold text-lg">
					{#each Array(state.maxTreasures) as _, i}
						<span class={i < state.treasures ? '' : 'opacity-30 grayscale'}>{treasureIcon(i)}</span>
					{/each}
				</div>
			</div>
		</div>

		<!-- Combo -->
		{#if state.combo > 1}
			<div class="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none">
				<div class="{state.combo >= 5 ? 'bg-red-500' : 'bg-orange-500'} text-amber-50 px-6 py-2 rounded-2xl text-xl font-black shadow-xl animate-pulse border-2 border-amber-100">
					سلسلة {formatCombo(state.combo)} 🔥
				</div>
			</div>
		{/if}

		<!-- Tunnel / Game area -->
		<div class="absolute inset-0 flex flex-col justify-end px-2 sm:px-4 pb-2 sm:pb-4 pointer-events-none">
			<!-- Vault door and treasures -->
			<div class="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 w-20 sm:w-28 h-56 sm:h-64 bg-amber-900 rounded-l-3xl border-4 border-amber-950 shadow-2xl flex flex-col items-center justify-center gap-2">
				<div class="text-4xl sm:text-5xl">🚪</div>
				<div class="text-[10px] sm:text-xs text-amber-100 text-center font-bold">خزنة<br/>القلعة</div>
			</div>

			<!-- Ghouls -->
			{#each state.ghouls as ghoul, i (ghoul.id)}
				<div
					class="absolute bottom-24 sm:bottom-32 transition-all duration-300 ease-linear z-10"
					style="left: {Math.min(ghoul.position, 86)}%;"
				>
					<div class="relative flex flex-col items-center">
						{#if i === 0}
							<div class="absolute -top-20 sm:-top-24 left-1/2 -translate-x-1/2 bg-stone-900/95 text-amber-50 text-sm sm:text-lg px-4 py-2 rounded-2xl whitespace-nowrap text-center font-black shadow-2xl border-2 border-amber-500">
								{ghoul.puzzle.promptAr}
							</div>
						{/if}
						<div class="text-5xl sm:text-6xl filter drop-shadow-2xl {i === 0 ? 'animate-pulse' : 'opacity-90'}">{ghoulIcon(ghoul.type)}</div>
						{#if ghoul.type === 'boss'}
							<div class="w-20 h-3 bg-stone-800 rounded-full mt-1 overflow-hidden border border-amber-200">
								<div class="h-full bg-red-500 transition-all" style="width: {(ghoul.health / ghoul.maxHealth) * 100}%"></div>
							</div>
						{/if}
					</div>
				</div>
			{/each}

			<!-- Death bursts -->
			{#each deathBursts as burst (burst.id)}
				<div
					class="absolute bottom-28 sm:bottom-36 z-20 pointer-events-none"
					style="left: {burst.x}%;"
				>
					<div class="text-6xl animate-explode">{burst.icon}</div>
				</div>
			{/each}

			<!-- Trap animation -->
			{#if trapAnim !== 'none'}
				<div class="absolute bottom-28 sm:bottom-36 left-1/2 -translate-x-1/2 pointer-events-none z-30">
					<div class="text-8xl animate-trap">
						{#if trapAnim === 'gate'}🚪{/if}
						{#if trapAnim === 'sand'}🌪️{/if}
						{#if trapAnim === 'smoke'}💨{/if}
						{#if trapAnim === 'stone'}🪨{/if}
					</div>
				</div>
			{/if}

			<!-- Answer stones -->
			{#if state.ghouls.length > 0}
				<div class="bg-stone-900/80 backdrop-blur-sm rounded-2xl p-3 sm:p-4 mb-2 pointer-events-auto border border-amber-700/50">
					<div class="flex items-center justify-between mb-2">
						<div class="flex items-center gap-2 text-amber-50 text-sm sm:text-base font-black">
							<span class="text-xl">{puzzleIcon(state.ghouls[0].puzzle.type)}</span>
							<span>{state.waveMessage}</span>
						</div>
						<button
							type="button"
							class="text-amber-200 hover:text-amber-50 text-xs sm:text-sm font-bold"
							onclick={showHint}
						>
							💡 تلميح
						</button>
					</div>
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
						{#each state.ghouls[0].puzzle.options as option}
							<button
								type="button"
								class="bg-amber-100 text-stone-900 font-black text-2xl sm:text-3xl py-4 sm:py-5 rounded-xl hover:bg-amber-200 active:scale-95 active:bg-amber-300 transition-all shadow-lg border-b-4 border-amber-300"
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
	{/if}

	{#if phase === 'result' && state}
		<div class="absolute inset-0 flex items-center justify-center bg-black/80 px-4">
			<div class="bg-amber-50 text-stone-900 rounded-3xl p-6 sm:p-10 max-w-md w-full text-center shadow-2xl border-4 border-amber-700">
				<div class="text-7xl mb-4 animate-bounce">{state.stars > 0 ? '🏆' : '💔'}</div>
				<h2 class="font-display font-bold text-3xl mb-2">
					{state.stars > 0 ? 'حمايت الخزنة!' : 'الخزنة سُرقت!'}
				</h2>
				<div class="text-4xl mb-4">{starLabel(state.stars)}</div>
				<p class="text-base opacity-80 mb-6">
					نقاطك: {state.score} — أعلى سلسلة: ×{state.maxCombo}
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
	@keyframes shake {
		0%, 100% { transform: translate(0, 0); }
		20% { transform: translate(-6px, 4px); }
		40% { transform: translate(6px, -4px); }
		60% { transform: translate(-4px, 4px); }
		80% { transform: translate(4px, -4px); }
	}

	@keyframes explode {
		0% { transform: scale(0.2) rotate(0deg); opacity: 1; }
		50% { transform: scale(1.6) rotate(15deg); opacity: 1; }
		100% { transform: scale(2) rotate(-15deg); opacity: 0; }
	}

	@keyframes trap {
		0% { transform: scale(0.5); opacity: 0; }
		30% { transform: scale(1.4); opacity: 1; }
		100% { transform: scale(1); opacity: 0; }
	}

	@keyframes pop {
		0% { transform: scale(0.2); opacity: 0; }
		50% { transform: scale(1.15); opacity: 1; }
		100% { transform: scale(1); opacity: 1; }
	}

	:global(.animate-shake) {
		animation: shake 0.3s ease-in-out;
	}

	:global(.animate-explode) {
		animation: explode 0.8s ease-out forwards;
	}

	:global(.animate-trap) {
		animation: trap 0.7s ease-out forwards;
	}

	:global(.animate-pop) {
		animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
	}
</style>
