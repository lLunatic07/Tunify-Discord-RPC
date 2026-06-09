import type { Track } from '@tunify/shared';

import type { NativeAudioTrack } from './mediaStore.types';

const UNKNOWN_VALUE = '<unknown>';

const titleFromFileName = (fileName?: string) =>
  fileName?.replace(/\.[^/.]+$/, '').trim();

const isKnown = (value?: string) =>
  Boolean(value && value.toLowerCase() !== UNKNOWN_VALUE);

export function mapNativeAudioTrack(nativeTrack: NativeAudioTrack): Track {
  const title = nativeTrack.title?.trim() || titleFromFileName(nativeTrack.fileName) || 'Unknown Title';
  const artist = nativeTrack.artist?.trim();
  const album = nativeTrack.album?.trim();

  return {
    id: nativeTrack.id,
    title,
    artist: isKnown(artist) ? artist : 'Unknown Artist',
    album: isKnown(album) ? album : 'Unknown Album',
    albumId: nativeTrack.albumId,
    url: nativeTrack.contentUri || nativeTrack.url,
    duration: nativeTrack.duration,
    mimeType: nativeTrack.mimeType,
    size: nativeTrack.size,
    fileName: nativeTrack.fileName,
    folderPath: nativeTrack.folderPath,
    fileSize: nativeTrack.fileSize ?? nativeTrack.size,
    dateAdded: nativeTrack.dateAdded,
    dateModified: nativeTrack.dateModified,
    trackNumber: nativeTrack.trackNumber,
    localArtworkUri: nativeTrack.localArtworkUri,
    localArtworkPath: nativeTrack.localArtworkUri,
  };
}
