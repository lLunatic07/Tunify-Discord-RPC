import Config from 'react-native-config';
import type { Track } from '@tunify/shared';

import { isPublicHttpsArtworkUrl } from './artwork.utils';

type CloudinaryUploadResponse = {
  error?: {
    message?: string;
  };
  secure_url?: string;
};

const getLocalArtworkUri = (track: Track) => track.localArtworkUri ?? track.localArtworkPath;

const inferArtworkMimeType = (uri: string) => {
  const normalized = uri.toLowerCase();
  if (normalized.endsWith('.png')) {
    return 'image/png';
  }

  if (normalized.endsWith('.webp')) {
    return 'image/webp';
  }

  return 'image/jpeg';
};

export const CloudinaryAlbumArtService = {
  uploadTrackArtwork: async (track: Track) => {
    const cloudName = Config.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = Config.CLOUDINARY_UPLOAD_PRESET;
    const localArtworkUri = getLocalArtworkUri(track);

    if (!cloudName || !uploadPreset || !localArtworkUri) {
      return undefined;
    }

    const formData = new FormData();
    formData.append('upload_preset', uploadPreset);
    formData.append('file', {
      name: `tunify-${track.albumId ?? track.id}.jpg`,
      type: inferArtworkMimeType(localArtworkUri),
      uri: localArtworkUri,
    } as unknown as Blob);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      body: formData,
      method: 'POST',
    });
    const body = await response.json() as CloudinaryUploadResponse;

    if (!response.ok || body.error) {
      throw new Error(body.error?.message ?? `Cloudinary upload failed with HTTP ${response.status}.`);
    }

    return isPublicHttpsArtworkUrl(body.secure_url) ? body.secure_url : undefined;
  },
};
