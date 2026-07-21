<script lang="ts">
	import { MODE_LABELS, COUNTRY_LABELS } from '$lib/types/game';

	let { data } = $props();
	let game = $derived(data.game);

	let isReady = $derived(game.status === 'ready');
	let modeLabels = $derived(game.modes.map((mode) => MODE_LABELS[mode]?.ar ?? mode));
</script>

<svelte:head>
	<title>{game.metaTitleAr}</title>
	<meta name="description" content={game.metaDescriptionAr} />
</svelte:head>

<!-- Hero -->
<section class="bg-gradient-to-br from-sea to-sea-dark text-cream py-12">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex flex-col md:flex-row items-center gap-8">
			<div class="text-8xl md:text-9xl">{game.icon}</div>
			<div class="text-center md:text-right flex-1">
				<div class="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
					<span class="bg-white/20 text-cream px-3 py-1 rounded-full text-sm font-medium">{game.genreLabelAr}</span>
					<span class="bg-white/20 text-cream px-3 py-1 rounded-full text-sm font-medium">{game.ageRange}</span>
					<span class="bg-white/20 text-cream px-3 py-1 rounded-full text-sm font-medium">{game.sessionLength}</span>
				</div>
				<h1 class="font-display font-extrabold text-3xl md:text-5xl mb-3">{game.nameAr}</h1>
				<p class="text-lg md:text-xl opacity-90 mb-6">{game.taglineAr}</p>
				<div class="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
					{#if isReady}
						<a
							href="/play/{game.id}"
							class="bg-sun hover:bg-sun-dark text-charcoal font-bold py-3 px-8 rounded-xl transition-colors text-center"
						>
							🎮 العب الآن
						</a>
					{:else}
						<span class="bg-charcoal/50 text-cream font-bold py-3 px-8 rounded-xl text-center cursor-not-allowed">
							⏳ قريباً
						</span>
					{/if}
					<a
						href="/games"
						class="bg-white/10 hover:bg-white/20 text-cream font-bold py-3 px-8 rounded-xl transition-colors text-center"
					>
						← العودة للألعاب
					</a>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Details -->
<section class="py-12 bg-sand">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="bg-cream rounded-2xl shadow-lg p-6 md:p-10 mb-8">
			<h2 class="font-display font-bold text-2xl text-charcoal mb-4">عن اللعبة</h2>
			<p class="text-charcoal/80 leading-relaxed text-lg mb-6">{game.descriptionAr}</p>

			<h3 class="font-bold text-xl text-charcoal mb-3">طريقة اللعب</h3>
			<ol class="list-decimal list-inside space-y-2 text-charcoal/80 mb-6">
				{#each game.howToPlayAr as step}
					<li>{step}</li>
				{/each}
			</ol>

			<h3 class="font-bold text-xl text-charcoal mb-3">الثقافة الخليجية</h3>
			<p class="text-charcoal/80 leading-relaxed bg-sand/50 p-4 rounded-xl">{game.culturalNoteAr}</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div class="bg-cream rounded-2xl shadow-lg p-6">
				<h3 class="font-bold text-xl text-charcoal mb-4">أوضاع اللعب</h3>
				<div class="flex flex-wrap gap-2">
					{#each modeLabels as label}
						<span class="bg-sea/10 text-sea-dark px-3 py-1 rounded-full text-sm font-medium">{label}</span>
					{/each}
				</div>
			</div>

			<div class="bg-cream rounded-2xl shadow-lg p-6">
				<h3 class="font-bold text-xl text-charcoal mb-4">الدول المرتبطة</h3>
				<div class="flex flex-wrap gap-2">
					{#each game.countries as code}
						<span class="bg-sand text-charcoal px-3 py-1 rounded-full text-sm font-medium">
							{COUNTRY_LABELS[code].flag} {COUNTRY_LABELS[code].ar}
						</span>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>
