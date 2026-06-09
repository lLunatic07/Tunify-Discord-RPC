import type { Track } from '@tunify/shared';

import { AppStorage } from '../storage/storage';
import { storageKeys } from '../storage/storageKeys';
import { isPublicHttpsArtworkUrl } from './artwork.utils';

type ArtworkRemoteCache = Record<string, string>;

let cache: ArtworkRemoteCache | undefined;

export function getArtworkCacheKey(track: Track) {
  if (track.albumId) {
    return `album:${track.albumId}`;
  }

  if (track.localArtworkUri || track.localArtworkPath) {
    return `artwork:${track.localArtworkUri ?? track.localArtworkPath}`;
  }

  return `track:${track.id}`;
}

const ensureCache = async () => {
  if (!cache) {
    cache = await AppStorage.getJson<ArtworkRemoteCache>(storageKeys.artworkRemoteCache, {});
  }

  return cache;
};

export const ArtworkRemoteCacheService = {
  applyCachedRemoteArtwork: async (track: Track): Promise<Track> => {
    if (isPublicHttpsArtworkUrl(track.artworkRemoteUrl)) {
      return track;
    }

    const cachedUrl = await ArtworkRemoteCacheService.get(track);
    return cachedUrl ? { ...track, artworkRemoteUrl: cachedUrl } : track;
  },

  applyCachedRemoteArtworkToTracks: async (tracks: Track[]): Promise<Track[]> => {
    await ensureCache();
    return Promise.all(tracks.map(ArtworkRemoteCacheService.applyCachedRemoteArtwork));
  },

  get: async (track: Track) => {
    const currentCache = await ensureCache();
    const cachedUrl = currentCache[getArtworkCacheKey(track)];
    return isPublicHttpsArtworkUrl(cachedUrl) ? cachedUrl : undefined;
  },

  set: async (track: Track, remoteUrl: string) => {
    if (!isPublicHttpsArtworkUrl(remoteUrl)) {
      return;
    }

    const currentCache = await ensureCache();
    currentCache[getArtworkCacheKey(track)] = remoteUrl;
    cache = currentCache;
    await AppStorage.setJson(storageKeys.artworkRemoteCache, currentCache);
  },
};
