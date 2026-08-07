import { error } from '@sveltejs/kit';
import { getGameBySlug } from '$lib/data/games';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const game = getGameBySlug(params.slug);

	if (!game) {
		error(404, 'اللعبة غير موجودة');
	}

	return { game };
};
