import EncryptedStorage from 'react-native-encrypted-storage';

export const AppStorage = {
  getJson: async <T>(key: string, fallback: T): Promise<T> => {
    const raw = await EncryptedStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  },

  setJson: async (key: string, value: unknown) => {
    await EncryptedStorage.setItem(key, JSON.stringify(value));
  },

  remove: async (key: string) => {
    await EncryptedStorage.removeItem(key);
  },
};
