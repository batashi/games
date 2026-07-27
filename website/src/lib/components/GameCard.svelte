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

	let stars = $derived(difficultyStars(game.ageRange));
	let thumbGradient = $derived(genreBg[game.genre] ?? 'from-sea/20 to-sand-dark/30');
</script>

<article class="group bg-cream rounded-2xl shadow-md overflow-hidden border border-sand-dark/20 flex flex-col h-full card-lift">
	<!-- Thumbnail placeholder -->
	<div class="relative aspect-video bg-gradient-to-br {thumbGradient} flex items-center justify-center overflow-hidden">
		<span class="text-7xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{game.icon}</span>
		{#if !isReady}
			<span class="absolute top-3 right-3 bg-charcoal/80 text-cream text-xs font-bold px-2 py-1 rounded-full">
				قريباً
			</span>
		{/if}
	</div>

	<div class="p-5 flex flex-col flex-1">
		<div class="flex items-start justify-between gap-2 mb-2">
			<h3 class="font-display font-bold text-lg text-charcoal group-hover:text-sea transition-colors">
				{game.nameAr}
			</h3>
		</div>

		<p class="text-sm text-charcoal/70 mb-3 line-clamp-2">{game.taglineAr}</p>

		<div class="flex flex-wrap items-center gap-2 mb-4">
			<span class="text-xs bg-sand text-charcoal px-2 py-1 rounded-full">{game.genreLabelAr}</span>
			<span class="text-xs bg-sand text-charcoal px-2 py-1 rounded-full" title="العمر">
				{game.ageRange}
			</span>
			<span class="text-xs bg-sun/20 text-charcoal px-2 py-1 rounded-full" title="الصعوبة">
				{'⭐'.repeat(stars)}
			</span>
			{#each platformLabels as platform}
				<span class="text-xs bg-sand text-charcoal px-2 py-1 rounded-full" title={platform.ar}>
					<span aria-hidden="true">{platform.icon}</span>
					<span class="sr-only">{platform.ar}</span>
				</span>
			{/each}
		</div>

		<div class="mt-auto space-y-3">
			<p class="text-xs text-charcoal/60">{modeLabels}</p>

			<div class="flex gap-2">
				{#if isReady}
					<a
						href="/play/{game.id}"
						class="flex-1 bg-sun hover:bg-sun-dark text-charcoal text-center font-bold py-2.5 px-4 rounded-xl btn-bounce"
					>
						🎮 العب الآن
					</a>
				{/if}
				<a
					href="/games/{game.slug}"
					class="{isReady ? 'flex-1' : 'w-full'} bg-sand hover:bg-sand-dark text-charcoal text-center font-bold py-2.5 px-4 rounded-xl transition-colors"
				>
					{isReady ? 'التفاصيل' : 'اعرف المزيد'}
				</a>
			</div>
		</div>
	</div>
</article>
