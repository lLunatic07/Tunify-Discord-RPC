import { create } from 'zustand';
import type { Track } from '@tunify/shared';

import { LibraryService } from './library.service';

type LibraryStore = {
  tracks: Track[];
  isLoading: boolean;
  isReady: boolean;
  error?: string;
  selectedTrack?: Track;
  loadDeviceTracks: () => Promise<void>;
  refreshDeviceTracks: () => Promise<void>;
  loadCachedTracks: () => Promise<void>;
  clearLibraryCache: () => Promise<void>;
  getTrackById: (trackId: string) => Track | undefined;
  searchTracks: (query: string) => Track[];
  setTrackRemoteArtworkUrl: (trackId: string, remoteUrl: string) => void;
  setTracks: (tracks: Track[]) => void;
  setSelectedTrack: (track: Track) => void;
};

const loadTracks = async (set: (partial: Partial<LibraryStore>) => void) => {
  set({ isLoading: true, error: undefined });

  try {
    const tracks = await LibraryService.getTracks();
    set({
      tracks,
      selectedTrack: tracks[0],
      isLoading: false,
      isReady: true,
      error: undefined,
    });
  } catch (error) {
    set({
      isLoading: false,
      isReady: false,
      error: error instanceof Error ? error.message : 'Failed to load library.',
    });
  }
};

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  tracks: [],
  isLoading: false,
  isReady: false,
  error: undefined,
  selectedTrack: undefined,
  loadDeviceTracks: async () => loadTracks(set),
  refreshDeviceTracks: async () => loadTracks(set),
  loadCachedTracks: async () => {
    const tracks = await LibraryService.getCachedTracks();
    if (tracks.length) {
      set({ tracks, selectedTrack: tracks[0], isReady: true });
    }
  },
  clearLibraryCache: async () => {
    await LibraryService.clearCache();
  },
  getTrackById: trackId => get().tracks.find(track => track.id === trackId),
  searchTracks: query => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return get().tracks;
    }

    return get().tracks.filter(track =>
      [track.title, track.artist, track.album]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  },
  setTrackRemoteArtworkUrl: (trackId, remoteUrl) => set(state => {
    const applyRemoteUrl = (track?: Track) =>
      track?.id === trackId ? { ...track, artworkRemoteUrl: remoteUrl } : track;

    return {
      selectedTrack: applyRemoteUrl(state.selectedTrack),
      tracks: state.tracks.map(track => applyRemoteUrl(track) ?? track),
    };
  }),
  setTracks: tracks => set({ tracks }),
  setSelectedTrack: track => set({ selectedTrack: track }),
}));
