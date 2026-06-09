import { create } from 'zustand';

import { FavoritesService } from './favorites.service';
import type { FavoriteTrack } from './favorites.types';

type FavoritesStore = {
  favorites: FavoriteTrack[];
  favoriteTrackIds: string[];
  isReady: boolean;
  loadFavorites: () => Promise<void>;
  addFavorite: (trackId: string) => Promise<void>;
  removeFavorite: (trackId: string) => Promise<void>;
  isFavorite: (trackId: string) => boolean;
  toggleFavorite: (trackId: string) => Promise<void>;
  getFavoriteTrackIds: () => string[];
  removeMissingFavorites: (validTrackIds: string[]) => Promise<void>;
};

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favorites: [],
  favoriteTrackIds: [],
  isReady: false,
  loadFavorites: async () => {
    const favorites = await FavoritesService.load();
    set({
      favorites,
      favoriteTrackIds: favorites.map(favorite => favorite.trackId),
      isReady: true,
    });
  },
  isFavorite: trackId => get().favoriteTrackIds.includes(trackId),
  addFavorite: async trackId => {
    if (get().favoriteTrackIds.includes(trackId)) {
      return;
    }

    const favorites = [...get().favorites, { trackId, addedAt: Date.now() }];
    set({
      favorites,
      favoriteTrackIds: favorites.map(favorite => favorite.trackId),
    });
    await FavoritesService.save(favorites);
  },
  removeFavorite: async trackId => {
    const favorites = get().favorites.filter(favorite => favorite.trackId !== trackId);
    set({
      favorites,
      favoriteTrackIds: favorites.map(favorite => favorite.trackId),
    });
    await FavoritesService.save(favorites);
  },
  toggleFavorite: async trackId => {
    if (get().favoriteTrackIds.includes(trackId)) {
      await get().removeFavorite(trackId);
    } else {
      await get().addFavorite(trackId);
    }
  },
  getFavoriteTrackIds: () => get().favoriteTrackIds,
  removeMissingFavorites: async validTrackIds => {
    const valid = new Set(validTrackIds);
    const favorites = get().favorites.filter(favorite => valid.has(favorite.trackId));
    set({
      favorites,
      favoriteTrackIds: favorites.map(favorite => favorite.trackId),
    });
    await FavoritesService.save(favorites);
  },
}));
