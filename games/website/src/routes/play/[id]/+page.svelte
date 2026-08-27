<script lang="ts">
	import { onMount } from 'svelte';

	let { data } = $props();
	let game = $derived(data.game);
	let gameContainer: HTMLDivElement | null = $state(null);
	let showHowTo = $state(false);
	let isFullscreen = $state(false);

	// Lazy-load game components so Babylon.js is only fetched for playable games.
	let FortBattle = $state<typeof import('$lib/components/games/FortBattle.svelte').default | null>(null);
	let fortBattleRef: import('$lib/components/games/FortBattle.svelte').default | null = $state(null);
	let SouqManager = $state<typeof import('$lib/components/games/SouqManager.svelte').default | null>(null);
	let souqManagerRef: import('$lib/components/games/SouqManager.svelte').default | null = $state(null);
	let FalconFlight = $state<typeof import('$lib/components/games/FalconFlight.svelte').default | null>(null);
	let falconFlightRef: import('$lib/components/games/FalconFlight.svelte').default | null = $state(null);
	let MajlisHost = $state<typeof import('$lib/components/games/MajlisHost.svelte').default | null>(null);
	let majlisHostRef: import('$lib/components/games/MajlisHost.svelte').default | null = $state(null);
	let NumberVault = $state<typeof import('$lib/components/games/NumberVault.svelte').default | null>(null);
	let numberVaultRef: import('$lib/components/games/NumberVault.svelte').default | null = $state(null);
	let SouqArithmetic = $state<typeof import('$lib/components/games/SouqArithmetic.svelte').default | null>(null);
	let souqArithmeticRef: import('$lib/components/games/SouqArithmetic.svelte').default | null = $state(null);
	let muted = $state(false);

	onMount(() => {
		if (game.id === 'archery') {
			import('$lib/components/games/FortBattle.svelte').then((m) => {
				FortBattle = m.default;
			});
		}
		if (game.id === 'souq-alfereej') {
			import('$lib/components/games/SouqManager.svelte').then((m) => {
				SouqManager = m.default;
			});
		}
		if (game.id === 'falcon') {
			import('$lib/components/games/FalconFlight.svelte').then((m) => {
				FalconFlight = m.default;
			});
		}
		if (game.id === 'majlis-host') {
			import('$lib/components/games/MajlisHost.svelte').then((m) => {
				MajlisHost = m.default;
			});
		}
		if (game.id === 'number-vault') {
			import('$lib/components/games/NumberVault.svelte').then((m) => {
				NumberVault = m.default;
			});
		}
		if (game.id === 'souq-arithmetic') {
			import('$lib/components/games/SouqArithmetic.svelte').then((m) => {
				SouqArithmetic = m.default;
			});
		}

		const handler = () => {
			isFullscreen = document.fullscreenElement === gameContainer;
		};
		document.addEventListener('fullscreenchange', handler);
		return () => document.removeEventListener('fullscreenchange', handler);
	});

	function toggleMute() {
		if (game.id === 'archery') {
			fortBattleRef?.toggleMute();
			muted = fortBattleRef?.isMuted() ?? false;
		} else if (game.id === 'souq-alfereej') {
			souqManagerRef?.toggleMute();
			muted = souqManagerRef?.isMuted() ?? false;
		} else if (game.id === 'falcon') {
			falconFlightRef?.toggleMute();
			muted = falconFlightRef?.isMuted() ?? false;
		} else if (game.id === 'majlis-host') {
			majlisHostRef?.toggleMute();
			muted = majlisHostRef?.isMuted() ?? false;
		} else if (game.id === 'number-vault') {
			numberVaultRef?.toggleMute();
			muted = numberVaultRef?.isMuted() ?? false;
		} else if (game.id === 'souq-arithmetic') {
			souqArithmeticRef?.toggleMute();
			muted = souqArithmeticRef?.isMuted() ?? false;
		}
	}

	function toggleFullscreen() {
		if (!gameContainer) return;
		if (!document.fullscreenElement) {
			gameContainer.requestFullscreen().catch(() => {
				// Fullscreen may be blocked by the browser; ignore silently.
			});
		} else {
			document.exitFullscreen();
		}
	}
</script>

<svelte:head>
	<title>العب {game.nameAr} | صحراء بلاي</title>
	<meta name="description" content="العب {game.nameAr} مباشرة في المتصفح." />
</svelte:head>

<div bind:this={gameContainer} class="bg-charcoal flex-1 flex flex-col min-h-0">
	<!-- Game header -->
	<div class="bg-sea-dark text-cream px-4 py-3 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a href="/games/{game.slug}" class="hover:text-sun transition-colors p-1" aria-label="العودة لتفاصيل اللعبة">
				<span class="text-2xl">←</span>
			</a>
			<div>
				<h1 class="font-display font-bold text-lg">{game.nameAr}</h1>
				<p class="text-xs opacity-80">{game.taglineAr}</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
				aria-label={muted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
				onclick={toggleMute}
			>
				<span class="text-xl">{muted ? '🔇' : '🔊'}</span>
			</button>
			<button
				type="button"
				class="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
				aria-label="كيف ألعب؟"
				aria-pressed={showHowTo}
				onclick={() => (showHowTo = !showHowTo)}
			>
				<span class="text-xl">❓</span>
			</button>
			<button
				type="button"
				class="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
				aria-label={isFullscreen ? 'إنهاء ملء الشاشة' : 'ملء الشاشة'}
				onclick={toggleFullscreen}
			>
				<span class="text-xl">{isFullscreen ? '⛶' : '⛶'}</span>
			</button>
		</div>
	</div>

	{#if showHowTo}
		<div class="bg-cream text-charcoal px-4 py-3 border-b border-sand-dark/20">
			<div class="max-w-4xl mx-auto">
				<h2 class="font-bold text-base mb-2 flex items-center gap-2">🎮 كيف ألعب {game.nameAr}؟</h2>
				<ol class="flex flex-wrap gap-2">
					{#each game.howToPlayAr as step, i}
						<li class="bg-sand/40 rounded-xl px-3 py-2 text-sm font-bold">
							<span class="text-sea-dark">{i + 1}.</span> {step}
						</li>
					{/each}
				</ol>
			</div>
		</div>
	{/if}

	<!-- Game container -->
	<div class="flex-1 relative min-h-0 bg-gradient-to-br from-charcoal to-sea-dark/50">
		{#if game.id === 'archery' && FortBattle}
			<FortBattle bind:this={fortBattleRef} />
		{:else if game.id === 'souq-alfereej' && SouqManager}
			<SouqManager bind:this={souqManagerRef} />
		{:else if game.id === 'falcon' && FalconFlight}
			<FalconFlight bind:this={falconFlightRef} />
		{:else if game.id === 'majlis-host' && MajlisHost}
			<MajlisHost bind:this={majlisHostRef} />
		{:else if game.id === 'number-vault' && NumberVault}
			<NumberVault bind:this={numberVaultRef} />
		{:else if game.id === 'souq-arithmetic' && SouqArithmetic}
			<SouqArithmetic bind:this={souqArithmeticRef} />
		{:else}
			<div class="absolute inset-0 flex items-center justify-center text-center px-4">
				<div>
					<div class="text-8xl mb-4 animate-bounce">{game.icon}</div>
					<img src="/images/mascot-fox.svg" alt="" class="w-24 h-24 mx-auto mb-6 animate-float opacity-90" />
					<h2 class="text-cream font-display font-bold text-2xl md:text-4xl mb-4">
						{game.nameAr} جاهزة قريباً!
					</h2>
					<p class="text-cream/70 text-lg max-w-md mx-auto mb-8">
						نحن نجهّز اللعبة لك 🎮
					</p>
					<div class="flex flex-col sm:flex-row gap-3 justify-center">
						<a
							href="/games/{game.slug}"
							class="bg-sun hover:bg-sun-dark text-charcoal font-bold py-3 px-6 rounded-xl transition-colors"
						>
							التفاصيل
						</a>
						<a
							href="/games"
							class="bg-white/10 hover:bg-white/20 text-cream font-bold py-3 px-6 rounded-xl transition-colors"
						>
							المزيد من الألعاب
						</a>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
