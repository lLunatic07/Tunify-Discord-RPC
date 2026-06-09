import { AppStorage } from '../../services/storage/storage';
import { storageKeys } from '../../services/storage/storageKeys';
import type { FavoriteTrack } from './favorites.types';

const normalizeFavorites = (value: Array<string | FavoriteTrack>): FavoriteTrack[] =>
  value.map(item =>
    typeof item === 'string'
      ? { trackId: item, addedAt: Date.now() }
      : item,
  );

export const FavoritesService = {
  load: async () => {
    const favorites = await AppStorage.getJson<Array<string | FavoriteTrack>>(storageKeys.favorites, []);
    return normalizeFavorites(favorites);
  },
  save: async (favorites: FavoriteTrack[]) => AppStorage.setJson(storageKeys.favorites, favorites),
};
