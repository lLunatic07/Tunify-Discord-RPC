import type { Track } from '@tunify/shared';

import { MediaStoreService } from '../mediaStore/mediaStore.service';
import { ArtworkRemoteCacheService } from '../../services/artwork/artworkRemoteCache.service';
import { normalizeTrackMetadata } from '../../services/metadata/metadata.service';
import { AppStorage } from '../../services/storage/storage';
import { storageKeys } from '../../services/storage/storageKeys';

export const LibraryService = {
  getTracks: async (): Promise<Track[]> => {
    const tracks = await MediaStoreService.getAudioTracks();
    const normalizedTracks = await ArtworkRemoteCacheService.applyCachedRemoteArtworkToTracks(
      tracks.map(normalizeTrackMetadata),
    );
    await AppStorage.setJson(storageKeys.libraryCache, normalizedTracks);
    return normalizedTracks;
  },

  getCachedTracks: async (): Promise<Track[]> => {
    const tracks = await AppStorage.getJson<Track[]>(storageKeys.libraryCache, []);
    return ArtworkRemoteCacheService.applyCachedRemoteArtworkToTracks(tracks);
  },

  clearCache: async () => {
    await AppStorage.remove(storageKeys.libraryCache);
  },
};
