import type { Track } from '@tunify/shared';

import { ArtworkRemoteCacheService } from './artworkRemoteCache.service';
import { isPublicHttpsArtworkUrl } from './artwork.utils';
import { CloudinaryAlbumArtService } from './cloudinaryAlbumArt.service';

const inFlightUploads = new Map<string, Promise<string | undefined>>();

const canUploadLocalArtwork = (track: Track) =>
  Boolean(track.localArtworkUri || track.localArtworkPath);

export const DiscordAlbumArtUploadService = {
  ensureRemoteArtwork: async (track: Track, enabled: boolean) => {
    if (isPublicHttpsArtworkUrl(track.artworkRemoteUrl)) {
      return track.artworkRemoteUrl;
    }

    const cachedUrl = await ArtworkRemoteCacheService.get(track);
    if (cachedUrl) {
      return cachedUrl;
    }

    if (!enabled || !canUploadLocalArtwork(track)) {
      return undefined;
    }

    const cacheKey = track.albumId ?? track.localArtworkUri ?? track.localArtworkPath ?? track.id;
    const existingUpload = inFlightUploads.get(cacheKey);
    if (existingUpload) {
      return existingUpload;
    }

    const uploadPromise = CloudinaryAlbumArtService.uploadTrackArtwork(track)
      .then(async remoteUrl => {
        if (remoteUrl) {
          await ArtworkRemoteCacheService.set(track, remoteUrl);
        }

        return remoteUrl;
      })
      .catch(error => {
        console.warn('[Tunify][AlbumArtUpload] upload failed', error);
        return undefined;
      })
      .finally(() => {
        inFlightUploads.delete(cacheKey);
      });

    inFlightUploads.set(cacheKey, uploadPromise);
    return uploadPromise;
  },
};
