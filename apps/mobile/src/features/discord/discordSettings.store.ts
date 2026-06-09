import { create } from 'zustand';

import { AppStorage } from '../../services/storage/storage';
import { storageKeys } from '../../services/storage/storageKeys';

type DiscordSettings = {
  uploadLocalAlbumArtEnabled: boolean;
};

type DiscordSettingsStore = DiscordSettings & {
  isReady: boolean;
  loadSettings: () => Promise<void>;
  setUploadLocalAlbumArtEnabled: (enabled: boolean) => Promise<void>;
};

const DEFAULT_SETTINGS: DiscordSettings = {
  uploadLocalAlbumArtEnabled: true,
};

export const useDiscordSettingsStore = create<DiscordSettingsStore>(set => ({
  ...DEFAULT_SETTINGS,
  isReady: false,
  loadSettings: async () => {
    const settings = await AppStorage.getJson<DiscordSettings>(
      storageKeys.discordSettings,
      DEFAULT_SETTINGS,
    );
    set({ ...DEFAULT_SETTINGS, ...settings, isReady: true });
  },
  setUploadLocalAlbumArtEnabled: async enabled => {
    const settings = {
      uploadLocalAlbumArtEnabled: enabled,
    };
    set(settings);
    await AppStorage.setJson(storageKeys.discordSettings, settings);
  },
}));
