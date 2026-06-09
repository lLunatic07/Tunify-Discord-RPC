import type { Track } from '@tunify/shared';

const fallbackFromUrl = (url: string) => {
  const filename = url.split('/').pop() ?? 'Unknown Title';
  return filename.replace(/\.[^/.]+$/, '') || 'Unknown Title';
};

export function normalizeTrackMetadata(track: Track): Track {
  return {
    ...track,
    title: track.title || fallbackFromUrl(track.url),
    artist: track.artist || 'Unknown Artist',
    album: track.album || 'Unknown Album',
  };
}
