import Config from 'react-native-config';
import type { DiscordTokenResponse } from '@tunify/shared';

import { DiscordPresence } from './discordPresence';
import { useDiscordStore } from './discord.store';
import { DiscordTokenStorage } from '../../storage/discordToken.storage';

const toTokenResponse = (token: {
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer' | 'User';
  expiresIn: number;
  expiresAt: number;
  scope: string;
}): DiscordTokenResponse => ({
  accessToken: token.accessToken,
  refreshToken: token.refreshToken,
  tokenType: token.tokenType,
  expiresIn: token.expiresIn,
  scope: token.scope,
  expiresAt: token.expiresAt,
});

const isTokenUsable = (token?: DiscordTokenResponse) =>
  Boolean(token?.accessToken && token.expiresAt > Date.now() + 60_000);

export const DiscordAuthService = {
  getPublicClientConfig: () => ({
    applicationId: Config.DISCORD_APPLICATION_ID,
    clientId: Config.DISCORD_CLIENT_ID,
    redirectUri: Config.DISCORD_REDIRECT_URI,
    scopes: ['openid', 'sdk.social_layer_presence'],
  }),

  login: async () => {
    const store = useDiscordStore.getState();
    store.setStatus('connecting');
    store.setError(undefined);

    await DiscordPresence.init();
    const savedToken = await DiscordTokenStorage.get();
    if (isTokenUsable(savedToken)) {
      const didUpdateToken = await DiscordPresence.updateToken(
        savedToken!.tokenType,
        savedToken!.accessToken,
      );
      const didConnect = didUpdateToken && await DiscordPresence.connect();
      store.setStatus(didConnect ? 'connected' : 'error');
      if (!didConnect) {
        store.setError('Discord token exists, but native SDK did not connect.');
      }
      return savedToken;
    }

    const token = await DiscordPresence.login();
    if (!token?.success || !token.accessToken) {
      const message = token?.error || 'Discord login failed.';
      store.setStatus('error');
      store.setError(message);
      throw new Error(message);
    }

    const tokenResponse = toTokenResponse(token);
    await DiscordTokenStorage.set(tokenResponse);
    store.setStatus('connected');
    return tokenResponse;
  },

  restoreSession: async () => {
    const store = useDiscordStore.getState();
    const savedToken = await DiscordTokenStorage.get();

    if (!isTokenUsable(savedToken)) {
      store.setStatus('idle');
      return undefined;
    }

    store.setStatus('connecting');
    store.setError(undefined);

    await DiscordPresence.init();
    const didUpdateToken = await DiscordPresence.updateToken(
      savedToken!.tokenType,
      savedToken!.accessToken,
    );
    const didConnect = didUpdateToken && await DiscordPresence.connect();

    store.setStatus(didConnect ? 'connected' : 'error');
    if (!didConnect) {
      store.setError('Discord token exists, but native SDK did not connect.');
      return undefined;
    }

    return savedToken;
  },

  logout: async () => {
    await DiscordPresence.clearPresence();
    await DiscordPresence.logout();
    await DiscordTokenStorage.clear();
    useDiscordStore.getState().setLastPayload(undefined);
    useDiscordStore.getState().setStatus('idle');
  },
};
