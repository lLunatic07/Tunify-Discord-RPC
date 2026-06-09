import { create } from 'zustand';
import { RepeatMode } from 'react-native-track-player';
import type { Track } from '@tunify/shared';

type PlayerStore = {
  currentTrack?: Track;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  buffered: number;
  isReady: boolean;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  setReady: (isReady: boolean) => void;
  setQueue: (tracks: Track[], queueIndex?: number) => void;
  setQueueIndex: (queueIndex: number) => void;
  setCurrentTrack: (track?: Track) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPosition: (position: number) => void;
  setProgress: (position: number, duration?: number, buffered?: number) => void;
  setShuffleEnabled: (shuffleEnabled: boolean) => void;
  setRepeatMode: (repeatMode: RepeatMode) => void;
  addToQueue: (track: Track) => void;
  addNext: (track: Track) => void;
  removeFromQueue: (queueIndex: number) => void;
  clearQueue: () => void;
};

export const usePlayerStore = create<PlayerStore>(set => ({
  currentTrack: undefined,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  position: 0,
  duration: 0,
  buffered: 0,
  isReady: false,
  shuffleEnabled: false,
  repeatMode: RepeatMode.Off,
  setReady: isReady => set({ isReady }),
  setQueue: (queue, queueIndex = 0) => set({ queue, queueIndex }),
  setQueueIndex: queueIndex => set({ queueIndex }),
  setCurrentTrack: track => set({ currentTrack: track }),
  setIsPlaying: isPlaying => set({ isPlaying }),
  setPosition: position => set({ position }),
  setProgress: (position, duration, buffered) =>
    set(state => ({
      position,
      duration: duration ?? state.duration,
      buffered: buffered ?? state.buffered,
    })),
  setShuffleEnabled: shuffleEnabled => set({ shuffleEnabled }),
  setRepeatMode: repeatMode => set({ repeatMode }),
  addToQueue: track =>
    set(state => ({
      queue: [...state.queue, track],
    })),
  addNext: track =>
    set(state => {
      const insertIndex = Math.min(state.queueIndex + 1, state.queue.length);
      return {
        queue: [
          ...state.queue.slice(0, insertIndex),
          track,
          ...state.queue.slice(insertIndex),
        ],
      };
    }),
  removeFromQueue: removeIndex =>
    set(state => {
      const queue = state.queue.filter((_, index) => index !== removeIndex);
      if (!queue.length) {
        return {
          currentTrack: undefined,
          queue,
          queueIndex: 0,
          isPlaying: false,
          position: 0,
          duration: 0,
        };
      }

      const queueIndex =
        removeIndex < state.queueIndex
          ? Math.max(0, state.queueIndex - 1)
          : Math.min(state.queueIndex, queue.length - 1);

      return {
        queue,
        queueIndex,
        currentTrack: queue[queueIndex],
      };
    }),
  clearQueue: () =>
    set(state => ({
      queue: state.currentTrack ? [state.currentTrack] : [],
      queueIndex: 0,
    })),
}));
