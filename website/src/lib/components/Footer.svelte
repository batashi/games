<script lang="ts">
	const currentYear = new Date().getFullYear();
</script>

<footer class="bg-charcoal text-cream mt-auto">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
			<!-- Brand -->
			<div>
				<div class="flex items-center gap-2 mb-3">
					<span class="text-2xl">🎮</span>
					<div>
						<h3 class="font-display font-bold">ألعاب أطفال الخليج</h3>
						<p class="text-xs opacity-70">GCC Kids Games</p>
					</div>
				</div>
				<p class="text-sm opacity-80 leading-relaxed">
					منصة ألعاب ويب آمنة ومجانية للأطفال من عمر 7 إلى 12 عاماً، تحتفي بتراث دول مجلس التعاون الخليجي.
				</p>
			</div>

			<!-- Links -->
			<div>
				<h4 class="font-bold mb-3 text-sun">روابط سريعة</h4>
				<ul class="space-y-2 text-sm">
					<li><a href="/games" class="hover:text-sun transition-colors">الألعاب</a></li>
					<li><a href="/parents" class="hover:text-sun transition-colors">للأهل</a></li>
					<li><a href="/teachers" class="hover:text-sun transition-colors">للمعلمين</a></li>
					<li><a href="/about" class="hover:text-sun transition-colors">عن المنصة</a></li>
				</ul>
			</div>

			<!-- Legal -->
			<div>
				<h4 class="font-bold mb-3 text-sun">قانوني</h4>
				<ul class="space-y-2 text-sm">
					<li><a href="/privacy" class="hover:text-sun transition-colors">سياسة الخصوصية</a></li>
					<li><a href="/terms" class="hover:text-sun transition-colors">شروط الاستخدام</a></li>
					<li><a href="/contact" class="hover:text-sun transition-colors">تواصل معنا</a></li>
				</ul>
			</div>
		</div>

		<div class="border-t border-white/10 mt-8 pt-6 text-center text-sm opacity-70">
			<p>© {currentYear} Aldoolab. جميع الحقوق محفوظة.</p>
		</div>
	</div>
</footer>
