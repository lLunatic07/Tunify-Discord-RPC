import { NativeModules } from 'react-native';
import Config from 'react-native-config';
import type { DiscordPresencePayload, PlaybackState, Track } from '@tunify/shared';

import { resolvePresenceLargeImage } from '../../services/artwork/artwork.service';

type NativeDiscordPresenceModule = {
  init: (applicationId: string) => Promise<boolean>;
  login: (
    applicationId: string,
    redirectUri: string,
    scopes: string,
  ) => Promise<DiscordNativeLoginResult>;
  updateToken: (tokenType: string, accessToken: string) => Promise<boolean>;
  connect: () => Promise<boolean>;
  updatePresence: (
    title: string,
    artist: string,
    album: string,
    startedAt: number,
    largeImage: string,
    largeText: string,
    smallImage: string,
    smallText: string,
  ) => Promise<boolean>;
  clearPresence: () => Promise<boolean>;
  logout: () => Promise<boolean>;
  getStatus: () => Promise<string>;
};

type DiscordNativeLoginResult = {
  success: boolean;
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer' | 'User';
  expiresIn: number;
  expiresAt: number;
  scope: string;
  status?: string;
  error?: string;
};

const NativeDiscordPresence = NativeModules.DiscordPresenceNative as
  | NativeDiscordPresenceModule
  | undefined;

const logFallback = (method: string, payload?: unknown) => {
  console.log(`[Tunify][DiscordPresence] ${method}`, payload ?? '');
};

const PRESENCE_DUPLICATE_WINDOW_MS = 2000;

let inFlightPresence:
  | {
      key: string;
      promise: Promise<boolean>;
    }
  | undefined;
let presenceUpdateQueue: Promise<boolean> = Promise.resolve(true);
let lastSuccessfulPresenceKey: string | undefined;
let lastSuccessfulPresenceAt = 0;

const buildPresenceKey = (payload: DiscordPresencePayload) =>
  [
    payload.title,
    payload.artist ?? '',
    payload.album ?? '',
    payload.isPlaying ? 'playing' : 'paused',
    payload.largeImage,
    payload.largeText ?? '',
    payload.smallImage,
    payload.smallText ?? '',
  ].join('\u001f');

export function buildDiscordPresencePayload(
  track: Track,
  state: PlaybackState,
): DiscordPresencePayload {
  const largeImage = resolvePresenceLargeImage(track);

  return {
    title: track.title || 'Unknown Title',
    artist: track.artist || 'Unknown Artist',
    album: track.album,
    duration: track.duration,
    position: state.position,
    isPlaying: state.isPlaying,
    largeImage,
    largeText: track.album || track.title || 'Tunify',
    smallImage: state.isPlaying
      ? Config.DISCORD_RP_SMALL_PLAY_IMAGE_KEY || 'play_icon'
      : Config.DISCORD_RP_SMALL_PAUSE_IMAGE_KEY || 'pause_icon',
    smallText: state.isPlaying ? 'Listening' : 'Paused',
  };
}

export const DiscordPresence = {
  init: async () => {
    const applicationId = Config.DISCORD_APPLICATION_ID || 'YOUR_DISCORD_APPLICATION_ID';
    logFallback('init', { applicationId });
    return NativeDiscordPresence?.init(applicationId) ?? Promise.resolve(true);
  },

  login: async () => {
    const applicationId = Config.DISCORD_APPLICATION_ID || '';
    const redirectUri = Config.DISCORD_REDIRECT_URI || `discord-${applicationId}:/authorize/callback`;
    const scopes = 'openid sdk.social_layer_presence';
    logFallback('login', { applicationId, redirectUri, scopes });
    return NativeDiscordPresence?.login(applicationId, redirectUri, scopes);
  },

  updateToken: async (tokenType: string, accessToken: string) => {
    logFallback('updateToken', { tokenType, hasAccessToken: Boolean(accessToken) });
    return (
      NativeDiscordPresence?.updateToken(tokenType, accessToken) ??
      Promise.resolve(true)
    );
  },

  connect: async () => {
    logFallback('connect');
    return NativeDiscordPresence?.connect() ?? Promise.resolve(true);
  },

  updatePresence: async (payload: DiscordPresencePayload) => {
    const presenceKey = buildPresenceKey(payload);
    const now = Date.now();

    if (inFlightPresence?.key === presenceKey) {
      return inFlightPresence.promise;
    }

    if (
      lastSuccessfulPresenceKey === presenceKey &&
      now - lastSuccessfulPresenceAt < PRESENCE_DUPLICATE_WINDOW_MS
    ) {
      return true;
    }

    logFallback('updatePresence', payload);
    const startedAt = payload.isPlaying
      ? now - (payload.position ?? 0) * 1000
      : 0;

    const updatePromise = presenceUpdateQueue
      .catch(() => true)
      .then(
        () =>
          NativeDiscordPresence?.updatePresence(
            payload.title,
            payload.artist ?? '',
            payload.album ?? '',
            startedAt,
            payload.largeImage,
            payload.largeText ?? '',
            payload.smallImage,
            payload.smallText ?? '',
          ) ?? Promise.resolve(true),
      )
      .then(success => {
        if (success) {
          lastSuccessfulPresenceKey = presenceKey;
          lastSuccessfulPresenceAt = Date.now();
        }

        return success;
      })
      .finally(() => {
        if (inFlightPresence?.key === presenceKey) {
          inFlightPresence = undefined;
        }
      });

    presenceUpdateQueue = updatePromise.catch(() => false);
    inFlightPresence = {
      key: presenceKey,
      promise: updatePromise,
    };

    return updatePromise;
  },

  clearPresence: async () => {
    logFallback('clearPresence');
    lastSuccessfulPresenceKey = undefined;
    lastSuccessfulPresenceAt = 0;

    const clearPromise = presenceUpdateQueue
      .catch(() => true)
      .then(() => NativeDiscordPresence?.clearPresence() ?? Promise.resolve(true));

    presenceUpdateQueue = clearPromise.catch(() => false);
    return clearPromise;
  },

  logout: async () => {
    logFallback('logout');
    return NativeDiscordPresence?.logout() ?? Promise.resolve(true);
  },

  getStatus: async () => NativeDiscordPresence?.getStatus() ?? Promise.resolve('unavailable'),
};
