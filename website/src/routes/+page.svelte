<script lang="ts">
	import { getReadyGames } from '$lib/data/games';
	import GameCard from '$lib/components/GameCard.svelte';

	const readyGames = getReadyGames();
</script>

<svelte:head>
	<title>صحراء بلاي | العب وتعلّم عن تراث الخليج</title>
	<meta name="description" content="ألعاب ويب مجانية وممتعة للأطفال من عمر 7 إلى 12 عاماً. اكتشف تراث دول الخليج و العب مباشرة في المتصفح." />
</svelte:head>

<!-- Hero -->
<section class="relative bg-gradient-to-br from-sea via-sky to-sea-dark text-cream overflow-hidden">
	<div class="absolute inset-0 opacity-10">
		<div class="absolute top-10 right-10 text-9xl">🌴</div>
		<div class="absolute bottom-10 left-10 text-9xl">🏰</div>
		<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12rem] opacity-20">🎮</div>
	</div>

	<div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
		<div class="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
			<div class="flex-1 max-w-2xl">
				<h1 class="font-display font-extrabold text-4xl md:text-6xl mb-6 leading-tight">
					العب، اكتشف،<br />وتعلّم عن تراث الخليج!
				</h1>
				<p class="text-lg md:text-xl opacity-95 max-w-xl mx-auto mb-8 leading-relaxed">
					ألعاب مجانية مباشرة في المتصفح. آمنة للأطفال وممتعة للعائلة.
				</p>
				<div class="flex flex-col items-center gap-3">
					<a
						href="/games"
						class="bg-sun hover:bg-sun-dark text-charcoal font-bold py-4 px-10 rounded-2xl text-xl btn-bounce inline-flex items-center gap-2 shadow-lg"
					>
						<span class="animate-sparkle">🎮</span>
						اكتشف الألعاب
					</a>
					<a
						href="/parents"
						class="text-cream/90 hover:text-cream text-sm font-medium underline underline-offset-4 transition-colors"
					>
						معلومات للأهل 👨‍👩‍👧‍👦
					</a>
				</div>
			</div>
			<div class="hidden md:block w-48 lg:w-56 animate-float">
				<img src="/images/mascot-fox.svg" alt="ثعلب الصحراء دليلك في صحراء بلاي" class="w-full h-auto drop-shadow-xl" />
			</div>
		</div>
	</div>
</section>

<!-- Trust badges -->
<section class="bg-cream border-b border-sand-dark/20">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
			<div class="p-4">
				<div class="text-3xl mb-2">🛡️</div>
				<h3 class="font-bold text-charcoal">آمنة للأطفال</h3>
				<p class="text-sm text-charcoal/70">لا دردشة نصية حرة</p>
			</div>
			<div class="p-4">
				<div class="text-3xl mb-2">🎓</div>
				<h3 class="font-bold text-charcoal">ثقافية وتعليمية</h3>
				<p class="text-sm text-charcoal/70">تراث الخليج العربي</p>
			</div>
			<div class="p-4">
				<div class="text-3xl mb-2">📱</div>
				<h3 class="font-bold text-charcoal">تعمل على كل الأجهزة</h3>
				<p class="text-sm text-charcoal/70">تابلت، موبايل، كمبيوتر</p>
			</div>
			<div class="p-4">
				<div class="text-3xl mb-2">🌐</div>
				<h3 class="font-bold text-charcoal">لعب جماعي خاص</h3>
				<p class="text-sm text-charcoal/70">غرف بدعوة فقط</p>
			</div>
		</div>
	</div>
</section>

<!-- Featured games -->
<section class="py-16 bg-sand">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="text-center mb-12">
			<h2 class="font-display font-bold text-3xl md:text-4xl text-charcoal mb-4">الألعاب الجاهزة للعب</h2>
			<p class="text-charcoal/70 text-lg">اختر لعبتك المفضلة وابدأ المغامرة الآن</p>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each readyGames as game (game.id)}
				<GameCard {game} />
			{/each}
		</div>

		<div class="text-center mt-10">
			<a
				href="/games"
				class="inline-block bg-sea hover:bg-sea-dark text-cream font-bold py-3 px-8 rounded-xl transition-colors"
			>
				عرض جميع الألعاب
			</a>
		</div>
	</div>
</section>

<!-- CTA -->
<section class="bg-sea-dark text-cream py-16">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
		<h2 class="font-display font-bold text-3xl md:text-4xl mb-4">جاهز للمغامرة؟</h2>
		<p class="text-lg opacity-90 mb-8">
			اختر لعبتك المفضلة وانطلق في رحلة مليئة بالتحدي والتراث الخليجي.
		</p>
		<a href="/games" class="inline-block bg-sun hover:bg-sun-dark text-charcoal font-bold py-4 px-10 rounded-2xl text-lg btn-bounce">
			🚀 العب الآن
		</a>
		<p class="mt-6 text-sm opacity-80">
			<a href="/parents" class="underline underline-offset-4 hover:text-sun transition-colors">معلومات للأهل</a>
			•
			<a href="/teachers" class="underline underline-offset-4 hover:text-sun transition-colors">للمعلمين</a>
		</p>
	</div>
</section>
