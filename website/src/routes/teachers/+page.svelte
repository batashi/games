<script lang="ts">
	import { getReadyGames } from '$lib/data/games';

	const suggestedGames = getReadyGames().slice(0, 3);
</script>

<svelte:head>
	<title>للمعلمين | صحراء بلاي</title>
	<meta name="description" content="استخدم صحراء بلاي / Sahara Play في الفصول الدراسية." />
</svelte:head>

<section class="bg-sea-dark text-cream py-16">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
		<h1 class="font-display font-bold text-4xl md:text-5xl mb-4">للمعلمين</h1>
		<p class="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
			أدوات ثقافية وتعليمية آمنة للاستخدام داخل الفصل الدراسي.
		</p>
	</div>
</section>

<section class="py-12 bg-sand">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
		<div class="bg-cream rounded-3xl shadow-lg p-6 md:p-8 border-2 border-sand-dark/20">
			<h2 class="font-display font-bold text-2xl md:text-3xl text-charcoal mb-6 flex items-center gap-3">
				<span class="text-4xl">🏫</span> وضع الفصل الدراسي
			</h2>
			<p class="text-charcoal/80 leading-relaxed mb-4 text-lg">
				يسمح المعلم بإنشاء غرفة خاصة يدخلها الطلاب برمز بسيط. لا حاجة لحسابات فردية للأطفال، ولا تواصل خارجي.
			</p>
			<ul class="space-y-4 text-charcoal/80 text-lg">
				<li class="flex items-start gap-3"><span class="text-2xl">✓</span> غرف خاصة بدعوة فقط.</li>
				<li class="flex items-start gap-3"><span class="text-2xl">✓</span> تحكم المعلم ببدء وإنهاء الجلسة.</li>
				<li class="flex items-start gap-3"><span class="text-2xl">✓</span> مناسب للألعاب الجماعية مثل إكس-أو ومعركة القلاع.</li>
			</ul>
		</div>

		<div class="bg-cream rounded-3xl shadow-lg p-6 md:p-8 border-2 border-sand-dark/20">
			<h2 class="font-display font-bold text-2xl md:text-3xl text-charcoal mb-6 flex items-center gap-3">
				<span class="text-4xl">🎓</span> القيمة التعليمية
			</h2>
			<p class="text-charcoal/80 leading-relaxed text-lg">
				كل لعبة تقدم محتوى ثقافي خليجي أصيل: التراث المعماري، التجارة القديمة، الحرف اليدوية، والبيئة الطبيعية. يمكن استخدامها كنقاط انطلاق للنقاش أو المشاريع الصفية.
			</p>
		</div>

		<div class="bg-cream rounded-3xl shadow-lg p-6 md:p-8 border-2 border-sand-dark/20">
			<h2 class="font-display font-bold text-2xl md:text-3xl text-charcoal mb-6 flex items-center gap-3">
				<span class="text-4xl">🎮</span> ألعاب مقترحة للفصل
			</h2>
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
				{#each suggestedGames as game}
					<a
						href="/games/{game.slug}"
						class="bg-sand/40 rounded-2xl p-4 text-center card-lift hover:bg-sand/60 transition-colors"
					>
						<div class="text-5xl mb-3">{game.icon}</div>
						<h3 class="font-bold text-charcoal mb-1">{game.nameAr}</h3>
						<p class="text-sm text-charcoal/70">{game.genreLabelAr}</p>
					</a>
				{/each}
			</div>
		</div>

		<div class="bg-gradient-to-br from-sea to-sea-dark rounded-3xl shadow-lg p-6 md:p-8 text-cream text-center border-4 border-white/20">
			<h2 class="font-display font-bold text-2xl md:text-3xl mb-4">مهتم بالترخيص المؤسسي؟</h2>
			<p class="text-lg md:text-xl mb-6 opacity-95">تواصل معنا لمناقشة تراخيص المدارس والجهات التعليمية.</p>
			<a href="/contact" class="inline-block bg-sun hover:bg-sun-dark text-charcoal font-bold py-3 px-8 rounded-2xl btn-bounce text-lg">
				📧 تواصل معنا
			</a>
		</div>
	</div>
</section>
