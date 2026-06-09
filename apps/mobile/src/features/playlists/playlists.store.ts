import { create } from 'zustand';

import { createPlaylistId } from './playlists.utils';
import { PlaylistsService } from './playlists.service';
import type { Playlist } from './playlists.types';

type PlaylistsStore = {
  playlists: Playlist[];
  isReady: boolean;
  loadPlaylists: () => Promise<void>;
  createPlaylist: (name: string, description?: string) => Promise<Playlist>;
  renamePlaylist: (playlistId: string, name: string) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  getPlaylistById: (playlistId: string) => Playlist | undefined;
  removeMissingTracks: (validTrackIds: string[]) => Promise<void>;
};

const normalizeName = (name: string) => name.trim();

const validatePlaylistName = (name: string, playlists: Playlist[], currentPlaylistId?: string) => {
  const normalized = normalizeName(name);
  if (!normalized) {
    throw new Error('Playlist name is required.');
  }

  if (normalized.length > 40) {
    throw new Error('Playlist name must be 40 characters or fewer.');
  }

  const duplicate = playlists.some(
    playlist =>
      playlist.id !== currentPlaylistId &&
      playlist.name.trim().toLowerCase() === normalized.toLowerCase(),
  );

  if (duplicate) {
    throw new Error('Playlist name already exists.');
  }

  return normalized;
};

export const usePlaylistsStore = create<PlaylistsStore>((set, get) => ({
  playlists: [],
  isReady: false,
  loadPlaylists: async () => {
    const playlists = await PlaylistsService.load();
    set({ playlists, isReady: true });
  },
  createPlaylist: async (name, description) => {
    const now = Date.now();
    const playlistName = validatePlaylistName(name, get().playlists);
    const playlist: Playlist = {
      id: createPlaylistId(),
      name: playlistName,
      description,
      trackIds: [],
      createdAt: now,
      updatedAt: now,
    };
    const playlists = [...get().playlists, playlist];
    set({ playlists });
    await PlaylistsService.save(playlists);
    return playlist;
  },
  renamePlaylist: async (playlistId, name) => {
    const playlistName = validatePlaylistName(name, get().playlists, playlistId);
    const playlists = get().playlists.map(playlist =>
      playlist.id === playlistId
        ? { ...playlist, name: playlistName, updatedAt: Date.now() }
        : playlist,
    );
    set({ playlists });
    await PlaylistsService.save(playlists);
  },
  deletePlaylist: async playlistId => {
    const playlists = get().playlists.filter(playlist => playlist.id !== playlistId);
    set({ playlists });
    await PlaylistsService.save(playlists);
  },
  addTrackToPlaylist: async (playlistId, trackId) => {
    const playlists = get().playlists.map(playlist => {
      if (playlist.id !== playlistId || playlist.trackIds.includes(trackId)) {
        return playlist;
      }

      return {
        ...playlist,
        trackIds: [...playlist.trackIds, trackId],
        coverTrackId: playlist.coverTrackId ?? trackId,
        updatedAt: Date.now(),
      };
    });
    set({ playlists });
    await PlaylistsService.save(playlists);
  },
  removeTrackFromPlaylist: async (playlistId, trackId) => {
    const playlists = get().playlists.map(playlist => {
      if (playlist.id !== playlistId) {
        return playlist;
      }

      const trackIds = playlist.trackIds.filter(id => id !== trackId);
      return {
        ...playlist,
        trackIds,
        coverTrackId: trackIds[0],
        updatedAt: Date.now(),
      };
    });
    set({ playlists });
    await PlaylistsService.save(playlists);
  },
  getPlaylistById: playlistId => get().playlists.find(playlist => playlist.id === playlistId),
  removeMissingTracks: async validTrackIds => {
    const valid = new Set(validTrackIds);
    const playlists = get().playlists.map(playlist => {
      const trackIds = playlist.trackIds.filter(trackId => valid.has(trackId));
      return {
        ...playlist,
        trackIds,
        coverTrackId: trackIds.includes(playlist.coverTrackId ?? '')
          ? playlist.coverTrackId
          : trackIds[0],
      };
    });
    set({ playlists });
    await PlaylistsService.save(playlists);
  },
}));
