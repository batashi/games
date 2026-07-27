<script lang="ts">
	import { page } from '$app/state';

	const mainNavItems = [
		{ href: '/', labelAr: 'الرئيسية', labelEn: 'Home' },
		{ href: '/games', labelAr: 'الألعاب', labelEn: 'Games' }
	];

	const grownupsItems = [
		{ href: '/parents', labelAr: 'للأهل', labelEn: 'Parents' },
		{ href: '/teachers', labelAr: 'للمعلمين', labelEn: 'Teachers' },
		{ href: '/about', labelAr: 'عن المنصة', labelEn: 'About' },
		{ href: '/contact', labelAr: 'تواصل', labelEn: 'Contact' }
	];

	let mobileMenuOpen = $state(false);
	let grownupsOpen = $state(false);

	function isActive(href: string) {
		return page.url.pathname === href;
	}
</script>

<header class="bg-sea-dark text-cream shadow-lg sticky top-0 z-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-2 hover:opacity-90 transition-opacity">
				<span class="text-2xl">🎮</span>
				<div class="hidden sm:block">
					<h1 class="font-display font-bold text-lg leading-tight">صحراء بلاي</h1>
					<p class="text-xs opacity-80">Sahara Play</p>
				</div>
			</a>

			<!-- Desktop Nav -->
			<nav class="hidden md:flex items-center gap-1">
				{#each mainNavItems as item}
					<a
						href={item.href}
						class="px-3 py-2 rounded-lg text-sm font-medium transition-colors {isActive(item.href) ? 'bg-sea text-cream' : 'hover:bg-sea/50'}"
						aria-current={isActive(item.href) ? 'page' : undefined}
					>
						{item.labelAr}
					</a>
				{/each}

				<!-- Grown-ups dropdown -->
				<div class="relative">
					<button
						type="button"
						class="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-sea/50 flex items-center gap-1"
						aria-expanded={grownupsOpen}
						aria-haspopup="true"
						onclick={() => grownupsOpen = !grownupsOpen}
					>
						قسم الكبار 🧑‍🤝‍🧑
						<svg class="w-4 h-4 transition-transform {grownupsOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					{#if grownupsOpen}
						<div
							class="absolute right-0 top-full mt-2 w-44 bg-cream text-charcoal rounded-xl shadow-xl border border-sand-dark/20 overflow-hidden"
							role="menu"
						>
							{#each grownupsItems as item}
								<a
									href={item.href}
									class="block px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sand {isActive(item.href) ? 'bg-sand font-bold' : ''}"
									role="menuitem"
									onclick={() => grownupsOpen = false}
								>
									{item.labelAr}
								</a>
							{/each}
						</div>
					{/if}
				</div>
			</nav>

			<!-- Mobile menu button -->
			<button
				type="button"
				class="md:hidden p-2 rounded-lg hover:bg-sea transition-colors"
				aria-label="Toggle menu"
				aria-expanded={mobileMenuOpen}
				onclick={() => mobileMenuOpen = !mobileMenuOpen}
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					{#if mobileMenuOpen}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					{/if}
				</svg>
			</button>
		</div>
	</div>

	<!-- Mobile Nav -->
	{#if mobileMenuOpen}
		<nav class="md:hidden bg-sea-dark border-t border-sea px-4 py-3 space-y-1">
			{#each mainNavItems as item}
				<a
					href={item.href}
					class="block px-3 py-2 rounded-lg text-sm font-medium transition-colors {isActive(item.href) ? 'bg-sea text-cream' : 'hover:bg-sea/50'}"
					onclick={() => mobileMenuOpen = false}
				>
					{item.labelAr}
				</a>
			{/each}
			<div class="pt-2 mt-2 border-t border-sea/50">
				<p class="px-3 py-1 text-xs opacity-70">قسم الكبار</p>
				{#each grownupsItems as item}
					<a
						href={item.href}
						class="block px-3 py-2 rounded-lg text-sm font-medium transition-colors {isActive(item.href) ? 'bg-sea text-cream' : 'hover:bg-sea/50'}"
						onclick={() => mobileMenuOpen = false}
					>
						{item.labelAr}
					</a>
				{/each}
			</div>
		</nav>
	{/if}
</header>
