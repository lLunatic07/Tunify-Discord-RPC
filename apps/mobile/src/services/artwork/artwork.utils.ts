import type { Track } from '@tunify/shared';

const LOCAL_OR_PRIVATE_HOST_PATTERN =
  /^https:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.)/i;

export function isPublicHttpsArtworkUrl(value?: string): value is string {
  if (!value || !value.startsWith('https://')) {
    return false;
  }

  return !LOCAL_OR_PRIVATE_HOST_PATTERN.test(value);
}

export function getArtworkPreviewUri(track?: Track) {
  return track?.localArtworkUri ?? track?.localArtworkPath ?? track?.artworkRemoteUrl;
}

export function getPresenceImageSourceLabel(track?: Track) {
  if (isPublicHttpsArtworkUrl(track?.artworkRemoteUrl)) {
    return 'Remote album art URL';
  }

  return 'Tunify app icon fallback';
}
