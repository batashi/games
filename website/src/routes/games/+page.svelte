<script lang="ts">
	import { getAllGames } from '$lib/data/games';
	import GameCard from '$lib/components/GameCard.svelte';
	import { COUNTRY_LABELS, PLATFORM_LABELS } from '$lib/types/game';

	const games = getAllGames();
	const countries = ['ALL', 'OM', 'SA', 'AE', 'QA', 'BH', 'KW'] as const;
	const platforms = ['ALL', 'desktop', 'tablet', 'mobile'] as const;
	type Platform = 'desktop' | 'tablet' | 'mobile';

	let selectedCountry = $state<string>('ALL');
	let selectedPlatform = $state<typeof platforms[number]>('ALL');

	const filteredGames = $derived(
		games.filter((game) => {
			const countryMatch = selectedCountry === 'ALL' || game.countries.includes(selectedCountry);
			const platformMatch = selectedPlatform === 'ALL' || game.supportedPlatforms.includes(selectedPlatform as Platform);
			return countryMatch && platformMatch;
		})
	);

	const readyCount = games.filter((g) => g.status === 'ready').length;
	const comingSoonCount = games.filter((g) => g.status === 'coming-soon').length;
</script>

<svelte:head>
	<title>الألعاب | ألعاب أطفال الخليج</title>
	<meta name="description" content="استكشف جميع ألعاب منصة ألعاب أطفال الخليج الثقافية والتعليمية." />
</svelte:head>

<section class="bg-sea-dark text-cream py-16">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
		<h1 class="font-display font-bold text-4xl md:text-5xl mb-4">جميع الألعاب</h1>
		<p class="text-lg opacity-90 max-w-2xl mx-auto">
			ألعاب ثقافية وتعليمية للأطفال من عمر 7 إلى 12 عاماً. اختر اللعبة وابدأ اللعب فوراً.
		</p>
	</div>
</section>

<section class="py-8 bg-cream border-b border-sand-dark/20">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
			<div class="flex gap-2 text-sm">
				<span class="bg-success/10 text-success px-3 py-1 rounded-full font-bold">{readyCount} جاهزة</span>
				<span class="bg-charcoal/10 text-charcoal px-3 py-1 rounded-full font-bold">{comingSoonCount} قريباً</span>
			</div>

			<div class="flex flex-wrap gap-2">
				{#each countries as code}
					<button
						type="button"
						class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors {selectedCountry === code ? 'bg-sea text-cream' : 'bg-sand text-charcoal hover:bg-sand-dark'}"
						onclick={() => selectedCountry = code}
					>
						{#if code === 'ALL'}
							الكل
						{:else}
							{COUNTRY_LABELS[code].flag} {COUNTRY_LABELS[code].ar}
						{/if}
					</button>
				{/each}
			</div>

			<div class="flex flex-wrap gap-2">
				{#each platforms as platform}
					<button
						type="button"
						class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors {selectedPlatform === platform ? 'bg-sea text-cream' : 'bg-sand text-charcoal hover:bg-sand-dark'}"
						onclick={() => selectedPlatform = platform}
					>
						{#if platform === 'ALL'}
							كل الأجهزة
						{:else}
							{PLATFORM_LABELS[platform].icon} {PLATFORM_LABELS[platform].ar}
						{/if}
					</button>
				{/each}
			</div>
		</div>
	</div>
</section>

<section class="py-12 bg-sand min-h-[400px]">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		{#if filteredGames.length > 0}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each filteredGames as game (game.id)}
					<GameCard {game} />
				{/each}
			</div>
		{:else}
			<div class="text-center py-20">
				<p class="text-xl text-charcoal/70">لا توجد ألعاب متاحة بهذا التصفّح حالياً.</p>
			</div>
		{/if}
	</div>
</section>
