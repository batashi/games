import { error } from '@sveltejs/kit';
import { getGameById } from '$lib/data/games';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const game = getGameById(params.id);

	if (!game) {
		error(404, 'اللعبة غير موجودة');
	}

	if (game.status !== 'ready') {
		error(403, 'اللعبة غير متاحة بعد');
	}

	return { game };
};
