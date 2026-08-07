<script lang="ts">
	import type { Game } from '$lib/types/game';
	import { MODE_LABELS, PLATFORM_LABELS } from '$lib/types/game';

	interface Props {
		game: Game;
	}

	let { game }: Props = $props();

	let isReady = $derived(game.status === 'ready');
	let modeLabels = $derived(game.modes.map((mode) => MODE_LABELS[mode]?.ar ?? mode).join(' • '));
	let platformLabels = $derived(game.supportedPlatforms.map((p) => PLATFORM_LABELS[p]));

	function difficultyStars(ageRange: string): number {
		const match = ageRange.match(/(\d+)-(\d+)/);
		if (!match) return 2;
		const max = parseInt(match[2], 10);
		if (max <= 9) return 1;
		if (max <= 11) return 2;
		return 3;
	}

	const genreBg: Record<string, string> = {
		'endless-runner': 'from-poppy/20 to-sun/20',
		strategy: 'from-lime/20 to-sky/20',
		'physics-artillery': 'from-sky/20 to-sea/20',
		'shop-simulation': 'from-sun/20 to-poppy/20',
		'endless-flier': 'from-sea/20 to-sky/20',
		memory: 'from-lime/20 to-sand-dark/30'
	};

	const genreTag: Record<string, string> = {
		'endless-runner': 'bg-poppy text-cream',
		strategy: 'bg-lime text-charcoal',
		'physics-artillery': 'bg-sky text-charcoal',
		'shop-simulation': 'bg-sun text-charcoal',
		'endless-flier': 'bg-sea text-cream',
		memory: 'bg-sand-dark text-cream'
	};

	let stars = $derived(difficultyStars(game.ageRange));
	let thumbGradient = $derived(genreBg[game.genre] ?? 'from-sea/20 to-sand-dark/30');
	let genreClass = $derived(genreTag[game.genre] ?? 'bg-sand text-charcoal');
</script>

<article class="group bg-cream rounded-3xl shadow-md overflow-hidden border-2 border-sand-dark/20 flex flex-col h-full card-lift">
	<!-- Thumbnail placeholder -->
	<div class="relative aspect-video bg-gradient-to-br {thumbGradient} flex items-center justify-center overflow-hidden">
		<span class="text-8xl group-hover:scale-110 transition-transform duration-300 drop-shadow-md">{game.icon}</span>
		{#if !isReady}
			<span class="absolute top-3 right-3 bg-charcoal/80 text-cream text-sm font-bold px-3 py-1.5 rounded-full">
				قريباً
			</span>
		{/if}
	</div>

	<div class="p-6 flex flex-col flex-1">
		<div class="flex items-start justify-between gap-2 mb-3">
			<h3 class="font-display font-bold text-xl text-charcoal group-hover:text-sea transition-colors">
				{game.nameAr}
			</h3>
		</div>

		<p class="text-base text-charcoal/70 mb-4 line-clamp-2 leading-relaxed">{game.taglineAr}</p>

		<div class="flex flex-wrap items-center gap-2 mb-5">
			<span class="text-sm {genreClass} px-3 py-1 rounded-full font-bold">{game.genreLabelAr}</span>
			<span class="text-sm bg-sand text-charcoal px-3 py-1 rounded-full font-bold" title="العمر">
				🎂 {game.ageRange}
			</span>
			<span class="text-sm bg-sun/30 text-charcoal px-3 py-1 rounded-full font-bold" title="الصعوبة">
				{'⭐'.repeat(stars)}
			</span>
			{#each platformLabels as platform}
				<span class="text-sm bg-sand text-charcoal px-3 py-1 rounded-full font-bold" title={platform.ar}>
					<span aria-hidden="true">{platform.icon}</span>
					<span class="sr-only">{platform.ar}</span>
				</span>
			{/each}
		</div>

		<div class="mt-auto space-y-3">
			<p class="text-sm text-charcoal/60 font-medium">{modeLabels}</p>

			<div class="flex gap-3">
				{#if isReady}
					<a
						href="/play/{game.id}"
						class="flex-1 bg-sun hover:bg-sun-dark text-charcoal text-center font-bold py-3 px-4 rounded-2xl btn-bounce text-lg inline-flex items-center justify-center gap-2"
					>
						🎮 العب الآن
					</a>
				{/if}
				<a
					href="/games/{game.slug}"
					class="{isReady ? 'flex-1' : 'w-full'} bg-sand hover:bg-sand-dark text-charcoal text-center font-bold py-3 px-4 rounded-2xl transition-colors text-lg"
				>
					{isReady ? '🔍 التفاصيل' : 'اعرف المزيد'}
				</a>
			</div>
		</div>
	</div>
</article>
