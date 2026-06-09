import Config from 'react-native-config';
import type { Track } from '@tunify/shared';

import { isPublicHttpsArtworkUrl } from './artwork.utils';

export function resolvePresenceLargeImage(track: Track): string {
  if (isPublicHttpsArtworkUrl(track.artworkRemoteUrl)) {
    return track.artworkRemoteUrl;
  }

  return Config.DISCORD_RP_DEFAULT_LARGE_IMAGE_KEY || 'app_logo';
}
