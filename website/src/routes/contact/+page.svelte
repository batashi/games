<svelte:head>
	<title>تواصل معنا | صحراء بلاي</title>
	<meta name="description" content="تواصل مع فريق Aldoolab لأسئلة، اقتراحات، أو فرص تعاون." />
</svelte:head>

<section class="bg-sea-dark text-cream py-16">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
		<h1 class="font-display font-bold text-4xl md:text-5xl mb-4">تواصل معنا</h1>
		<p class="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
			هل لديك سؤال، اقتراح، أو فرصة تعاون؟ نحن هنا للاستماع.
		</p>
	</div>
</section>

<section class="py-12 bg-sand">
	<div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="bg-cream rounded-3xl shadow-lg p-6 md:p-8 border-2 border-sand-dark/20">
			<form class="space-y-5" onsubmit={(e) => { e.preventDefault(); alert('شكراً لتواصلك! سنعود إليك قريباً.'); }}>
				<div>
					<label for="name" class="block text-base font-bold text-charcoal mb-2 flex items-center gap-2">👤 الاسم</label>
					<input
						type="text"
						id="name"
						name="name"
						required
						class="w-full px-4 py-3 rounded-xl border-2 border-sand-dark/30 bg-cream focus:border-sea focus:ring-2 focus:ring-sea/20 outline-none transition-all text-base"
					/>
				</div>
				<div>
					<label for="email" class="block text-base font-bold text-charcoal mb-2 flex items-center gap-2">📧 البريد الإلكتروني</label>
					<input
						type="email"
						id="email"
						name="email"
						required
						class="w-full px-4 py-3 rounded-xl border-2 border-sand-dark/30 bg-cream focus:border-sea focus:ring-2 focus:ring-sea/20 outline-none transition-all text-base"
					/>
				</div>
				<div>
					<label for="subject" class="block text-base font-bold text-charcoal mb-2 flex items-center gap-2">📝 الموضوع</label>
					<select
						id="subject"
						name="subject"
						class="w-full px-4 py-3 rounded-xl border-2 border-sand-dark/30 bg-cream focus:border-sea focus:ring-2 focus:ring-sea/20 outline-none transition-all text-base"
					>
						<option>استفسار عام</option>
						<option>دعم فني</option>
						<option>ترخيص مؤسسي</option>
						<option>إعلان ورعاية</option>
						<option>اقتراح</option>
					</select>
				</div>
				<div>
					<label for="message" class="block text-base font-bold text-charcoal mb-2 flex items-center gap-2">💬 الرسالة</label>
					<textarea
						id="message"
						name="message"
						rows="5"
						required
						class="w-full px-4 py-3 rounded-xl border-2 border-sand-dark/30 bg-cream focus:border-sea focus:ring-2 focus:ring-sea/20 outline-none transition-all resize-none text-base"
					></textarea>
				</div>
				<button
					type="submit"
					class="w-full bg-sea hover:bg-sea-dark text-cream font-bold py-4 px-6 rounded-2xl transition-colors text-lg btn-bounce"
				>
					🚀 إرسال الرسالة
				</button>
			</form>

			<div class="mt-8 pt-6 border-t border-sand-dark/20 text-center text-charcoal/70">
				<p class="text-lg mb-2">أو راسلنا مباشرة على:</p>
				<a href="mailto:hello@aldoolab.com" class="text-sea hover:text-sea-dark font-bold text-lg">hello@aldoolab.com</a>
			</div>
		</div>

		<div class="mt-8 bg-gradient-to-br from-sea to-sea-dark rounded-3xl shadow-lg p-6 text-cream text-center border-4 border-white/20">
			<img src="/images/mascot-fox.svg" alt="" class="w-20 h-20 mx-auto mb-3 animate-float" />
			<p class="text-lg font-bold">ثعلب الصحراء يقرأ رسالتك ويرد عليك بأسرع وقت! 🦊</p>
		</div>
	</div>
</section>
