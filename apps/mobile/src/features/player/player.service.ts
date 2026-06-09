import TrackPlayer, { Capability, RepeatMode } from 'react-native-track-player';
import type { Track } from '@tunify/shared';

import { usePlayerStore } from './player.store';

let setupPromise: Promise<void> | undefined;

const getPlayableArtwork = (track: Track) => {
  const remoteArtwork = track.artworkRemoteUrl?.trim();
  if (remoteArtwork?.startsWith('https://') || remoteArtwork?.startsWith('http://')) {
    return remoteArtwork;
  }

  return undefined;
};

const toTrackPlayerTrack = (track: Track) => ({
  id: track.id,
  url: track.url,
  title: track.title,
  artist: track.artist,
  album: track.album,
  duration: track.duration,
  artwork: getPlayableArtwork(track),
});

export const PlayerService = {
  setup: async () => {
    if (!setupPromise) {
      setupPromise = (async () => {
        await TrackPlayer.setupPlayer();
        await TrackPlayer.updateOptions({
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.SeekTo,
            Capability.Stop,
          ],
          compactCapabilities: [Capability.Play, Capability.Pause],
          progressUpdateEventInterval: 1,
        });
        usePlayerStore.getState().setReady(true);
      })().catch(error => {
        setupPromise = undefined;
        console.warn('[Tunify][Player] setup failed', error);
        throw error;
      });
    }

    return setupPromise;
  },

  addTrack: async (track: Track) => {
    usePlayerStore.getState().setCurrentTrack(track);

    try {
      await PlayerService.setup();
      await TrackPlayer.reset();
      await TrackPlayer.add(toTrackPlayerTrack(track));
    } catch (error) {
      console.warn('[Tunify][Player] addTrack fallback to store-only mode', error);
    }
  },

  loadQueue: async (tracks: Track[], startIndex = 0) => {
    if (!tracks.length) {
      usePlayerStore.getState().setQueue([], 0);
      usePlayerStore.getState().setCurrentTrack(undefined);
      usePlayerStore.getState().setIsPlaying(false);
      return;
    }

    const safeIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
    usePlayerStore.getState().setQueue(tracks, safeIndex);

    if (tracks[safeIndex]) {
      usePlayerStore.getState().setCurrentTrack(tracks[safeIndex]);
    }

    try {
      await PlayerService.setup();
      await TrackPlayer.reset();
      await TrackPlayer.add(tracks.map(toTrackPlayerTrack));
      await TrackPlayer.skip(safeIndex);
    } catch (error) {
      console.warn('[Tunify][Player] loadQueue fallback to store-only mode', error);
    }
  },

  playTrack: async (track: Track, queue?: Track[]) => {
    const tracks = queue?.length ? queue : [track];
    const startIndex = Math.max(0, tracks.findIndex(item => item.id === track.id));
    await PlayerService.loadQueue(tracks, startIndex);
    await PlayerService.play();
  },

  play: async () => {
    usePlayerStore.getState().setIsPlaying(true);

    try {
      await PlayerService.setup();
      await TrackPlayer.play();
    } catch (error) {
      console.warn('[Tunify][Player] play fallback to store-only mode', error);
    }
  },

  pause: async () => {
    usePlayerStore.getState().setIsPlaying(false);

    try {
      await TrackPlayer.pause();
    } catch (error) {
      console.warn('[Tunify][Player] pause fallback to store-only mode', error);
    }
  },

  skipToNext: async () => {
    const state = usePlayerStore.getState();
    const hasNext = state.queueIndex < state.queue.length - 1;
    const nextIndex = hasNext
      ? state.queueIndex + 1
      : state.repeatMode === RepeatMode.Queue
        ? 0
        : state.queueIndex;
    const nextTrack = state.queue[nextIndex];
    if (nextTrack) {
      usePlayerStore.getState().setQueue(state.queue, nextIndex);
      usePlayerStore.getState().setCurrentTrack(nextTrack);
    }

    try {
      await PlayerService.setup();
      if (hasNext) {
        await TrackPlayer.skipToNext();
      } else if (state.repeatMode === RepeatMode.Queue) {
        await TrackPlayer.skip(0);
      }
    } catch (error) {
      console.warn('[Tunify][Player] next fallback to store-only mode', error);
    }
  },

  skipToPrevious: async () => {
    const state = usePlayerStore.getState();
    const nextIndex = Math.max(state.queueIndex - 1, 0);
    const nextTrack = state.queue[nextIndex];
    if (nextTrack) {
      usePlayerStore.getState().setQueue(state.queue, nextIndex);
      usePlayerStore.getState().setCurrentTrack(nextTrack);
    }

    try {
      await PlayerService.setup();
      if (state.queueIndex > 0) {
        await TrackPlayer.skipToPrevious();
      } else {
        await TrackPlayer.seekTo(0);
      }
    } catch (error) {
      console.warn('[Tunify][Player] previous fallback to store-only mode', error);
    }
  },

  next: async () => PlayerService.skipToNext(),

  previous: async () => PlayerService.skipToPrevious(),

  stop: async () => {
    usePlayerStore.getState().setIsPlaying(false);
    try {
      await TrackPlayer.stop();
    } catch (error) {
      console.warn('[Tunify][Player] stop fallback to store-only mode', error);
    }
  },

  seekTo: async (seconds: number) => {
    usePlayerStore.getState().setPosition(seconds);
    try {
      await TrackPlayer.seekTo(seconds);
    } catch (error) {
      console.warn('[Tunify][Player] seek fallback to store-only mode', error);
    }
  },

  getCurrentTrack: async () => {
    const activeTrack = await (TrackPlayer as any).getActiveTrack?.();
    return activeTrack ?? usePlayerStore.getState().currentTrack;
  },

  toggleShuffle: async () => {
    const state = usePlayerStore.getState();
    const currentTrack = state.currentTrack;
    const wasPlaying = state.isPlaying;
    const sourceQueue = state.queue.length ? state.queue : currentTrack ? [currentTrack] : [];
    if (!sourceQueue.length) {
      return;
    }

    const shuffled = [...sourceQueue].sort(() => Math.random() - 0.5);
    const queueIndex = Math.max(
      0,
      shuffled.findIndex(track => track.id === currentTrack?.id),
    );
    usePlayerStore.getState().setShuffleEnabled(!state.shuffleEnabled);
    await PlayerService.loadQueue(shuffled, queueIndex);
    if (wasPlaying) {
      await PlayerService.play();
    }
  },

  setRepeatMode: async (mode: RepeatMode) => {
    usePlayerStore.getState().setRepeatMode(mode);
    try {
      await PlayerService.setup();
      await TrackPlayer.setRepeatMode(mode);
    } catch (error) {
      console.warn('[Tunify][Player] repeat fallback to store-only mode', error);
    }
  },

  addToQueue: async (track: Track) => {
    const state = usePlayerStore.getState();
    if (!state.queue.length) {
      await PlayerService.loadQueue([track], 0);
      return;
    }

    usePlayerStore.getState().addToQueue(track);

    try {
      await PlayerService.setup();
      await TrackPlayer.add(toTrackPlayerTrack(track));
    } catch (error) {
      console.warn('[Tunify][Player] addToQueue fallback to store-only mode', error);
    }
  },

  playNext: async (track: Track) => {
    const state = usePlayerStore.getState();
    if (!state.queue.length) {
      await PlayerService.loadQueue([track], 0);
      return;
    }

    const insertIndex = Math.min(state.queueIndex + 1, state.queue.length);
    usePlayerStore.getState().addNext(track);

    try {
      await PlayerService.setup();
      await TrackPlayer.add(toTrackPlayerTrack(track), insertIndex);
    } catch (error) {
      console.warn('[Tunify][Player] playNext fallback to store-only mode', error);
    }
  },

  skipToQueueIndex: async (queueIndex: number) => {
    const state = usePlayerStore.getState();
    const track = state.queue[queueIndex];
    if (!track) {
      return;
    }

    usePlayerStore.getState().setQueue(state.queue, queueIndex);
    usePlayerStore.getState().setCurrentTrack(track);
    usePlayerStore.getState().setPosition(0);

    try {
      await PlayerService.setup();
      await TrackPlayer.skip(queueIndex);
      if (state.isPlaying) {
        await TrackPlayer.play();
      }
    } catch (error) {
      console.warn('[Tunify][Player] skipToQueueIndex fallback to store-only mode', error);
    }
  },

  removeFromQueue: async (queueIndex: number) => {
    usePlayerStore.getState().removeFromQueue(queueIndex);
    try {
      await TrackPlayer.remove(queueIndex);
    } catch (error) {
      console.warn('[Tunify][Player] removeFromQueue fallback to store-only mode', error);
    }
  },

  clearQueue: async () => {
    const state = usePlayerStore.getState();
    usePlayerStore.getState().clearQueue();

    try {
      await PlayerService.setup();
      await TrackPlayer.removeUpcomingTracks();
      const activeIndex = await TrackPlayer.getActiveTrackIndex();
      if (activeIndex && activeIndex > 0 && state.currentTrack) {
        await PlayerService.loadQueue([state.currentTrack], 0);
      }
    } catch (error) {
      console.warn('[Tunify][Player] clearQueue fallback to store-only mode', error);
    }
  },
};
