<script lang="ts">
	import './layout.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col bg-sand">
	<Header />
	<main class="flex-1">
		{@render children()}
	</main>
	<Footer />
</div>
