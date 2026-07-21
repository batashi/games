<svelte:head>
	<title>تواصل معنا | ألعاب أطفال الخليج</title>
	<meta name="description" content="تواصل مع فريق Aldoolab لأسئلة، اقتراحات، أو فرص تعاون." />
</svelte:head>

<section class="bg-sea-dark text-cream py-16">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
		<h1 class="font-display font-bold text-4xl md:text-5xl mb-4">تواصل معنا</h1>
		<p class="text-lg opacity-90 max-w-2xl mx-auto">
			هل لديك سؤال، اقتراح، أو فرصة تعاون؟ نحن هنا للاستماع.
		</p>
	</div>
</section>

<section class="py-12 bg-sand">
	<div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="bg-cream rounded-2xl shadow-lg p-6 md:p-8">
			<form class="space-y-5" onsubmit={(e) => { e.preventDefault(); alert('شكراً لتواصلك! سنعود إليك قريباً.'); }}>
				<div>
					<label for="name" class="block text-sm font-bold text-charcoal mb-1">الاسم</label>
					<input
						type="text"
						id="name"
						name="name"
						required
						class="w-full px-4 py-3 rounded-xl border border-sand-dark/30 bg-cream focus:border-sea focus:ring-2 focus:ring-sea/20 outline-none transition-all"
					/>
				</div>
				<div>
					<label for="email" class="block text-sm font-bold text-charcoal mb-1">البريد الإلكتروني</label>
					<input
						type="email"
						id="email"
						name="email"
						required
						class="w-full px-4 py-3 rounded-xl border border-sand-dark/30 bg-cream focus:border-sea focus:ring-2 focus:ring-sea/20 outline-none transition-all"
					/>
				</div>
				<div>
					<label for="subject" class="block text-sm font-bold text-charcoal mb-1">الموضوع</label>
					<select
						id="subject"
						name="subject"
						class="w-full px-4 py-3 rounded-xl border border-sand-dark/30 bg-cream focus:border-sea focus:ring-2 focus:ring-sea/20 outline-none transition-all"
					>
						<option>استفسار عام</option>
						<option>دعم فني</option>
						<option>ترخيص مؤسسي</option>
						<option>إعلان ورعاية</option>
						<option>اقتراح</option>
					</select>
				</div>
				<div>
					<label for="message" class="block text-sm font-bold text-charcoal mb-1">الرسالة</label>
					<textarea
						id="message"
						name="message"
						rows="5"
						required
						class="w-full px-4 py-3 rounded-xl border border-sand-dark/30 bg-cream focus:border-sea focus:ring-2 focus:ring-sea/20 outline-none transition-all resize-none"
					></textarea>
				</div>
				<button
					type="submit"
					class="w-full bg-sea hover:bg-sea-dark text-cream font-bold py-3 px-6 rounded-xl transition-colors"
				>
					إرسال الرسالة
				</button>
			</form>

			<div class="mt-8 pt-6 border-t border-sand-dark/20 text-center text-charcoal/70">
				<p>أو راسلنا مباشرة على:</p>
				<a href="mailto:hello@aldoolab.com" class="text-sea hover:text-sea-dark font-bold">hello@aldoolab.com</a>
			</div>
		</div>
	</div>
</section>
