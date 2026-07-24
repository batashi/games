import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		// Force runes mode for all project components.
		runes: true
	},
	kit: {
		adapter: adapter({
			fallback: '404.html',
			strict: false
		}),
		prerender: {
			entries: ['*']
		}
	}
};

export default config;
