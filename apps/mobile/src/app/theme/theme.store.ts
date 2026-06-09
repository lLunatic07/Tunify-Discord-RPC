import { Appearance, ColorSchemeName } from 'react-native';
import { create } from 'zustand';

import { AppStorage } from '../../services/storage/storage';
import { storageKeys } from '../../services/storage/storageKeys';
import { darkColors, lightColors, type TunifyColors } from './colors';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeStore = {
  mode: ThemeMode;
  isReady: boolean;
  loadThemeMode: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  resolveColors: (systemScheme?: ColorSchemeName) => {
    isDark: boolean;
    colors: TunifyColors;
  };
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: 'system',
  isReady: false,
  loadThemeMode: async () => {
    const mode = await AppStorage.getJson<ThemeMode>(storageKeys.themeMode, 'system');
    set({ mode, isReady: true });
  },
  setThemeMode: async mode => {
    set({ mode });
    await AppStorage.setJson(storageKeys.themeMode, mode);
  },
  resolveColors: systemScheme => {
    const mode = get().mode;
    const isDark =
      mode === 'dark' || (mode === 'system' && (systemScheme ?? Appearance.getColorScheme()) === 'dark');
    return {
      isDark,
      colors: isDark ? darkColors : lightColors,
    };
  },
}));
