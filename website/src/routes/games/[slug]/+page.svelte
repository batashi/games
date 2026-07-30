<script lang="ts">
	import { MODE_LABELS, COUNTRY_LABELS, PLATFORM_LABELS } from '$lib/types/game';

	let { data } = $props();
	let game = $derived(data.game);

	let isReady = $derived(game.status === 'ready');
	let modeLabels = $derived(game.modes.map((mode) => MODE_LABELS[mode]?.ar ?? mode));
	let platformLabels = $derived(game.supportedPlatforms.map((p) => PLATFORM_LABELS[p]));
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
							class="bg-sun hover:bg-sun-dark text-charcoal font-bold py-4 px-10 rounded-2xl text-lg btn-bounce text-center inline-flex items-center justify-center gap-2"
						>
							<span class="animate-sparkle">🎮</span>
							العب الآن
						</a>
					{:else}
						<span class="bg-charcoal/50 text-cream font-bold py-4 px-10 rounded-2xl text-lg text-center cursor-not-allowed inline-flex items-center justify-center gap-2">
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
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
		<!-- Quick description -->
		<div class="bg-cream rounded-3xl shadow-lg p-6 md:p-8 border-2 border-sand-dark/20">
			<h2 class="font-display font-bold text-2xl md:text-3xl text-charcoal mb-4 flex items-center gap-3">
				<span class="text-4xl">🎯</span> عن اللعبة
			</h2>
			<p class="text-charcoal/80 leading-relaxed text-lg md:text-xl">{game.descriptionAr}</p>
		</div>

		<!-- How to play -->
		<div class="bg-cream rounded-3xl shadow-lg p-6 md:p-8 border-2 border-sand-dark/20">
			<h2 class="font-display font-bold text-2xl md:text-3xl text-charcoal mb-6 flex items-center gap-3">
				<span class="text-4xl">🎮</span> كيف ألعب؟
			</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
				{#each game.howToPlayAr as step, i}
					<div class="bg-sand/40 rounded-2xl p-5 text-center card-lift">
						<div class="w-14 h-14 bg-sun text-charcoal font-extrabold rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
							{i + 1}
						</div>
						<p class="text-charcoal/90 font-bold text-base leading-relaxed">{step}</p>
					</div>
				{/each}
			</div>
		</div>

		<!-- Cultural note -->
		<div class="bg-gradient-to-br from-sea to-sea-dark rounded-3xl shadow-lg p-6 md:p-8 text-cream border-4 border-white/20">
			<h2 class="font-display font-bold text-2xl md:text-3xl mb-4 flex items-center gap-3">
				<span class="text-4xl">🌟</span> هل تعلم؟
			</h2>
			<p class="leading-relaxed text-lg md:text-xl opacity-95">{game.culturalNoteAr}</p>
		</div>

		<!-- Quick info grid -->
		<div class="bg-cream rounded-3xl shadow-lg p-6 md:p-8 border-2 border-sand-dark/20">
			<h2 class="font-display font-bold text-xl md:text-2xl text-charcoal mb-6 flex items-center gap-3">
				<span class="text-3xl">⚡</span> معلومات سريعة
			</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
				<div class="bg-sand/40 rounded-2xl p-5">
					<h3 class="font-bold text-charcoal mb-3 text-base flex items-center gap-2">🎮 أوضاع اللعب</h3>
					<div class="flex flex-wrap gap-2">
						{#each modeLabels as label}
							<span class="bg-sea/10 text-sea-dark px-3 py-1 rounded-full text-sm font-bold">{label}</span>
						{/each}
					</div>
				</div>

				<div class="bg-sand/40 rounded-2xl p-5">
					<h3 class="font-bold text-charcoal mb-3 text-base flex items-center gap-2">🌍 الدول</h3>
					<div class="flex flex-wrap gap-2">
						{#each game.countries as code}
							<span class="bg-sand text-charcoal px-3 py-1 rounded-full text-sm font-bold">
								{COUNTRY_LABELS[code].flag} {COUNTRY_LABELS[code].ar}
							</span>
						{/each}
					</div>
				</div>

				<div class="bg-sand/40 rounded-2xl p-5">
					<h3 class="font-bold text-charcoal mb-3 text-base flex items-center gap-2">📱 الأجهزة</h3>
					<div class="flex flex-wrap gap-2">
						{#each platformLabels as platform}
							<span class="bg-sand text-charcoal px-3 py-1 rounded-full text-sm font-bold">
								{platform.icon} {platform.ar}
							</span>
						{/each}
					</div>
				</div>

				<div class="bg-sand/40 rounded-2xl p-5">
					<h3 class="font-bold text-charcoal mb-3 text-base flex items-center gap-2">🎂 العمر</h3>
					<p class="text-charcoal/80 text-base font-bold">{game.ageRange} سنوات</p>
				</div>

				<div class="bg-sand/40 rounded-2xl p-5">
					<h3 class="font-bold text-charcoal mb-3 text-base flex items-center gap-2">⏱️ مدة الجولة</h3>
					<p class="text-charcoal/80 text-base font-bold">{game.sessionLength}</p>
				</div>

				<div class="bg-sand/40 rounded-2xl p-5">
					<h3 class="font-bold text-charcoal mb-3 text-base flex items-center gap-2">🏷️ النوع</h3>
					<p class="text-charcoal/80 text-base font-bold">{game.genreLabelAr}</p>
				</div>
			</div>
		</div>
	</div>
</section>
