<script lang="ts">
	import './layout.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { page } from '$app/state';

	let { children } = $props();

	let isGame = $derived(page.url.pathname.startsWith('/play/'));
</script>

<div class="min-h-screen flex flex-col bg-sand">
	{#if !isGame}
		<Header />
	{/if}
	<main class="flex-1 flex flex-col min-h-0">
		{@render children()}
	</main>
	{#if !isGame}
		<Footer />
	{/if}
</div>
