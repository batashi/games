import gamesData from './games.json';
import type { Game, GamesData } from '$lib/types/game';

const data: GamesData = gamesData as GamesData;

export function getAllGames(): Game[] {
	return data.games;
}

export function getReadyGames(): Game[] {
	return data.games.filter((game) => game.status === 'ready');
}

export function getGameById(id: string): Game | undefined {
	return data.games.find((game) => game.id === id);
}

export function getGameBySlug(slug: string): Game | undefined {
	return data.games.find((game) => game.slug === slug);
}

export function getGamesByGenre(genre: string): Game[] {
	return data.games.filter((game) => game.genre === genre);
}

export function getGamesByCountry(countryCode: string): Game[] {
	return data.games.filter((game) => game.countries.includes(countryCode));
}

export function getGenres(): string[] {
	return [...new Set(data.games.map((game) => game.genre))];
}
