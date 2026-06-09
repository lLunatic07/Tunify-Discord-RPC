import TrackPlayer, { Event, State } from 'react-native-track-player';

import { PlayerService } from './player.service';
import { usePlayerStore } from './player.store';

type Subscription = {
  remove: () => void;
};

export function registerPlayerEventListeners() {
  const subscriptions: Subscription[] = [];

  subscriptions.push(
    TrackPlayer.addEventListener(Event.PlaybackState, event => {
      usePlayerStore.getState().setIsPlaying(event.state === State.Playing);
    }),
  );

  subscriptions.push(
    TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, event => {
      const store = usePlayerStore.getState();
      const queueIndex = event.index ?? 0;
      const currentTrack =
        store.queue[queueIndex] ??
        store.queue.find(track => track.id === event.track?.id);

      store.setQueueIndex(queueIndex);
      store.setCurrentTrack(currentTrack);
      store.setPosition(0);
    }),
  );

  subscriptions.push(
    TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, event => {
      usePlayerStore.getState().setProgress(event.position, event.duration, event.buffered);
    }),
  );

  subscriptions.push(
    TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
      usePlayerStore.getState().setIsPlaying(false);
    }),
  );

  subscriptions.push(
    TrackPlayer.addEventListener(Event.PlaybackError, event => {
      console.warn('[Tunify][Player] playback error', event);
      usePlayerStore.getState().setIsPlaying(false);
    }),
  );

  subscriptions.push(
    TrackPlayer.addEventListener(Event.RemotePlay, () => {
      PlayerService.play();
    }),
  );

  subscriptions.push(
    TrackPlayer.addEventListener(Event.RemotePause, () => {
      PlayerService.pause();
    }),
  );

  subscriptions.push(
    TrackPlayer.addEventListener(Event.RemoteNext, () => {
      PlayerService.next();
    }),
  );

  subscriptions.push(
    TrackPlayer.addEventListener(Event.RemotePrevious, () => {
      PlayerService.previous();
    }),
  );

  subscriptions.push(
    TrackPlayer.addEventListener(Event.RemoteSeek, event => {
      PlayerService.seekTo(event.position);
    }),
  );

  return () => {
    subscriptions.forEach(subscription => subscription.remove());
  };
}
