<script lang="ts">
	import type { Game } from '$lib/types/game';
	import { MODE_LABELS, COUNTRY_LABELS } from '$lib/types/game';

	interface Props {
		game: Game;
	}

	let { game }: Props = $props();

	let isReady = $derived(game.status === 'ready');
	let modeLabels = $derived(game.modes.map((mode) => MODE_LABELS[mode]?.ar ?? mode).join(' • '));
</script>

<article class="group bg-cream rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-sand-dark/20 flex flex-col h-full">
	<!-- Thumbnail placeholder -->
	<div class="relative aspect-video bg-gradient-to-br from-sea/20 to-sand-dark/30 flex items-center justify-center overflow-hidden">
		<span class="text-6xl group-hover:scale-110 transition-transform duration-300">{game.icon}</span>
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

		<div class="flex flex-wrap gap-2 mb-4">
			<span class="text-xs bg-sand text-charcoal px-2 py-1 rounded-full">{game.genreLabelAr}</span>
			<span class="text-xs bg-sand text-charcoal px-2 py-1 rounded-full">{game.ageRange}</span>
		</div>

		<div class="mt-auto space-y-3">
			<p class="text-xs text-charcoal/60">{modeLabels}</p>

			<div class="flex gap-2">
				{#if isReady}
					<a
						href="/play/{game.id}"
						class="flex-1 bg-sea hover:bg-sea-dark text-cream text-center font-bold py-2.5 px-4 rounded-xl transition-colors"
					>
						العب الآن
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
