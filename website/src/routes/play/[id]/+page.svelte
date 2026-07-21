<script lang="ts">
	import { onMount } from 'svelte';

	let { data } = $props();
	let game = $derived(data.game);

	// Lazy-load game components so Babylon.js is only fetched for playable games.
	let FortBattle = $state<typeof import('$lib/components/games/FortBattle.svelte').default | null>(null);
	onMount(async () => {
		if (game.id === 'archery') {
			FortBattle = (await import('$lib/components/games/FortBattle.svelte')).default;
		}
	});
</script>

<svelte:head>
	<title>العب {game.nameAr} | ألعاب أطفال الخليج</title>
	<meta name="description" content="العب {game.nameAr} مباشرة في المتصفح." />
</svelte:head>

<div class="bg-charcoal min-h-[calc(100vh-64px)] flex flex-col">
	<!-- Game header -->
	<div class="bg-sea-dark text-cream px-4 py-3 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a href="/games/{game.slug}" class="hover:text-sun transition-colors">
				<span class="text-2xl">←</span>
			</a>
			<div>
				<h1 class="font-display font-bold text-lg">{game.nameAr}</h1>
				<p class="text-xs opacity-80">{game.taglineAr}</p>
			</div>
		</div>
		<div class="flex items-center gap-3">
			<button
				type="button"
				class="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
				aria-label="كتم الصوت"
			>
				🔊
			</button>
			<button
				type="button"
				class="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
				aria-label="ملء الشاشة"
			>
				⛶
			</button>
		</div>
	</div>

	<!-- Game container -->
	<div class="flex-1 relative bg-gradient-to-br from-charcoal to-sea-dark/50">
		{#if game.id === 'archery' && FortBattle}
			<FortBattle />
		{:else}
			<div class="absolute inset-0 flex items-center justify-center text-center px-4">
				<div>
					<div class="text-8xl mb-6">{game.icon}</div>
					<h2 class="text-cream font-display font-bold text-2xl md:text-4xl mb-4">
						جاري تحميل {game.nameAr}
					</h2>
					<p class="text-cream/70 text-lg max-w-md mx-auto mb-8">
						سيتم تشغيل اللعبة هنا قريباً باستخدام Babylon.js.
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
