<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { FortBattleState } from '$lib/games/fort-battle';

	let canvas: HTMLCanvasElement;
	let game: import('$lib/games/fort-battle').FortBattleGame | null = null;
	let state = $state<FortBattleState | null>(null);
	let charging = $state(false);
	let muted = $state(false);

	onMount(async () => {
		const { FortBattleGame } = await import('$lib/games/fort-battle');
		game = new FortBattleGame(canvas, (s) => {
			state = s;
			charging = s.gameState === 'aiming' && s.power > 10 && s.message.includes('شحن');
		});
	});

	onDestroy(() => {
		game?.dispose();
	});

	function adjustAngle(delta: number) {
		game?.adjustAngle(delta);
	}

	function startCharge() {
		game?.startCharge();
		charging = true;
	}

	function releaseCharge() {
		game?.releaseCharge();
		charging = false;
	}

	function resetGame() {
		game?.resetGame();
	}

	export function toggleMute() {
		muted = !muted;
		game?.setMuted(muted);
	}

	export function isMuted(): boolean {
		return muted;
	}

	function windText(w: number): string {
		if (w > 0) return `→ ${w}`;
		if (w < 0) return `← ${Math.abs(w)}`;
		return '—';
	}
</script>

<div class="absolute inset-0 bg-gradient-to-b from-sky-200 to-sand overflow-hidden">
	<canvas bind:this={canvas} class="block w-full h-full outline-none" tabindex="0"></canvas>

	{#if state}
		<!-- HUD -->
		<div class="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
			<div class="bg-charcoal/80 text-cream px-4 py-2 rounded-xl min-w-[120px]">
				<div class="text-xs opacity-80 mb-1">القلعة الحمراء</div>
				<div class="w-full h-3 bg-charcoal rounded-full overflow-hidden">
					<div class="h-full bg-danger transition-all duration-300" style="width: {state.healths[0]}%"></div>
				</div>
				<div class="text-xs mt-1 text-center">{state.healths[0]}</div>
			</div>

			<div class="bg-sea-dark/90 text-cream px-4 py-2 rounded-xl text-center">
				<div class="text-sm font-bold">{state.currentPlayer === 0 ? 'الأحمر' : 'الأزرق'}</div>
				<div class="text-xs opacity-80">الدور</div>
			</div>

			<div class="bg-charcoal/80 text-cream px-4 py-2 rounded-xl min-w-[120px]">
				<div class="text-xs opacity-80 mb-1 text-left">القلعة الزرقاء</div>
				<div class="w-full h-3 bg-charcoal rounded-full overflow-hidden">
					<div class="h-full bg-sea transition-all duration-300" style="width: {state.healths[1]}%"></div>
				</div>
				<div class="text-xs mt-1 text-center">{state.healths[1]}</div>
			</div>
		</div>

		<!-- Stats -->
		<div class="absolute top-24 left-4 right-4 flex justify-center gap-3 pointer-events-none">
			<div class="bg-charcoal/70 text-cream px-3 py-1.5 rounded-lg text-sm">
				الزاوية: <span class="font-bold">{state.angle}°</span>
			</div>
			<div class="bg-charcoal/70 text-cream px-3 py-1.5 rounded-lg text-sm">
				القوة: <span class="font-bold">{state.power}%</span>
			</div>
			<div class="bg-charcoal/70 text-cream px-3 py-1.5 rounded-lg text-sm">
				الرياح: <span class="font-bold">{windText(state.wind)}</span>
			</div>
		</div>

		<!-- Message -->
		<div class="absolute top-40 left-4 right-4 flex justify-center pointer-events-none">
			<div class="bg-charcoal/80 text-cream px-5 py-2 rounded-xl text-center font-bold text-sm max-w-md">
				{state.message}
			</div>
		</div>

		<!-- Controls -->
		<div class="absolute bottom-6 left-4 right-4 flex flex-col sm:flex-row items-center justify-center gap-3 pointer-events-auto">
			{#if state.gameState === 'gameover'}
				<button
					type="button"
					class="bg-sun hover:bg-sun-dark text-charcoal font-bold py-3 px-8 rounded-xl transition-colors"
					onclick={resetGame}
				>
					إعادة اللعب
				</button>
			{:else}
				<div class="flex gap-2">
					<button
						type="button"
						class="bg-charcoal/80 hover:bg-charcoal text-cream font-bold py-3 px-5 rounded-xl"
						onpointerdown={() => adjustAngle(-3)}
					>
						▼ زاوية
					</button>
					<button
						type="button"
						class="bg-charcoal/80 hover:bg-charcoal text-cream font-bold py-3 px-5 rounded-xl"
						onpointerdown={() => adjustAngle(3)}
					>
						▲ زاوية
					</button>
				</div>

				<button
					type="button"
					class="flex-1 sm:flex-none {charging ? 'bg-danger' : 'bg-sun hover:bg-sun-dark'} text-charcoal font-bold py-4 px-10 rounded-xl transition-colors select-none"
					onpointerdown={startCharge}
					onpointerup={releaseCharge}
					onpointerleave={releaseCharge}
				>
					{charging ? 'شحن...' : 'اضغط للإطلاق'}
				</button>
			{/if}
		</div>

		<!-- Desktop hint -->
		<div class="hidden sm:block absolute bottom-20 left-4 text-cream/70 text-xs bg-charcoal/50 px-3 py-1 rounded-lg pointer-events-none">
			حرك الماوس للتصويب | ↑ ↓ لضبط الزاوية | مسافة لشحن القوة
		</div>
	{/if}
</div>
