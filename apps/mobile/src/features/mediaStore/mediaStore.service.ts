import { NativeModules } from 'react-native';
import type { Track } from '@tunify/shared';

import { mapNativeAudioTrack } from './mediaStore.mapper';
import type { NativeAudioTrack } from './mediaStore.types';

type NativeMediaStoreModule = {
  getAudioTracks: () => Promise<NativeAudioTrack[]>;
  getAlbumArtworkUri: (albumId: string) => Promise<string | undefined>;
};

const NativeMediaStore = NativeModules.TunifyMediaStore as
  | NativeMediaStoreModule
  | undefined;

export const MediaStoreService = {
  getAudioTracks: async (): Promise<Track[]> => {
    if (!NativeMediaStore?.getAudioTracks) {
      throw new Error('Tunify MediaStore native module is not available.');
    }

    const tracks = await NativeMediaStore.getAudioTracks();
    return tracks.map(mapNativeAudioTrack);
  },

  getAlbumArtworkUri: async (albumId: string) => {
    return NativeMediaStore?.getAlbumArtworkUri(albumId);
  },
};
