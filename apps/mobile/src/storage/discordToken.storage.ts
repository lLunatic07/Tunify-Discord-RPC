import EncryptedStorage from 'react-native-encrypted-storage';
import type { DiscordTokenResponse } from '@tunify/shared';

const DISCORD_TOKEN_STORAGE_KEY = 'tunify.discord.token';

export const DiscordTokenStorage = {
  get: async (): Promise<DiscordTokenResponse | undefined> => {
    const raw = await EncryptedStorage.getItem(DISCORD_TOKEN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : undefined;
  },

  set: async (token: DiscordTokenResponse) => {
    await EncryptedStorage.setItem(DISCORD_TOKEN_STORAGE_KEY, JSON.stringify(token));
  },

  clear: async () => {
    await EncryptedStorage.removeItem(DISCORD_TOKEN_STORAGE_KEY);
  },
};
