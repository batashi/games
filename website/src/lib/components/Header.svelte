<script lang="ts">
	import { page } from '$app/state';

	const navItems = [
		{ href: '/', labelAr: 'الرئيسية', labelEn: 'Home' },
		{ href: '/games', labelAr: 'الألعاب', labelEn: 'Games' },
		{ href: '/parents', labelAr: 'للأهل', labelEn: 'Parents' },
		{ href: '/teachers', labelAr: 'للمعلمين', labelEn: 'Teachers' },
		{ href: '/about', labelAr: 'عن المنصة', labelEn: 'About' },
		{ href: '/contact', labelAr: 'تواصل', labelEn: 'Contact' }
	];

	let mobileMenuOpen = $state(false);
</script>

<header class="bg-sea-dark text-cream shadow-lg sticky top-0 z-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-2 hover:opacity-90 transition-opacity">
				<span class="text-2xl">🎮</span>
				<div class="hidden sm:block">
					<h1 class="font-display font-bold text-lg leading-tight">ألعاب أطفال الخليج</h1>
					<p class="text-xs opacity-80">GCC Kids Games</p>
				</div>
			</a>

			<!-- Desktop Nav -->
			<nav class="hidden md:flex items-center gap-1">
				{#each navItems as item}
					<a
						href={item.href}
						class="px-3 py-2 rounded-lg text-sm font-medium transition-colors {page.url.pathname === item.href ? 'bg-sea text-cream' : 'hover:bg-sea/50'}"
						aria-current={page.url.pathname === item.href ? 'page' : undefined}
					>
						{item.labelAr}
					</a>
				{/each}
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
			{#each navItems as item}
				<a
					href={item.href}
					class="block px-3 py-2 rounded-lg text-sm font-medium transition-colors {page.url.pathname === item.href ? 'bg-sea text-cream' : 'hover:bg-sea/50'}"
					onclick={() => mobileMenuOpen = false}
				>
					{item.labelAr}
				</a>
			{/each}
		</nav>
	{/if}
</header>
