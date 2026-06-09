import { AppStorage } from '../../services/storage/storage';
import { storageKeys } from '../../services/storage/storageKeys';
import type { Playlist } from './playlists.types';

export const PlaylistsService = {
  load: async () => AppStorage.getJson<Playlist[]>(storageKeys.playlists, []),
  save: async (playlists: Playlist[]) =>
    AppStorage.setJson(storageKeys.playlists, playlists),
};
