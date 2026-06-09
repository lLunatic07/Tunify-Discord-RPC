import { Linking, PermissionsAndroid, Platform } from 'react-native';

import type { AudioPermissionStatus } from './permissions.types';

const getAudioPermission = () => {
  if (Platform.OS !== 'android') {
    return undefined;
  }

  if (Platform.Version >= 33) {
    return PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO;
  }

  return PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
};

export const PermissionsService = {
  checkAudioPermission: async (): Promise<AudioPermissionStatus> => {
    const permission = getAudioPermission();
    if (!permission) {
      return 'granted';
    }

    const granted = await PermissionsAndroid.check(permission);
    return granted ? 'granted' : 'unknown';
  },

  requestAudioPermission: async (): Promise<AudioPermissionStatus> => {
    const permission = getAudioPermission();
    if (!permission) {
      return 'granted';
    }

    const result = await PermissionsAndroid.request(permission, {
      title: 'Allow Tunify to read your music',
      message: 'Tunify needs audio access to build your local music library.',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
    });

    return result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
  },

  requestNotificationPermission: async () => {
    if (Platform.OS !== 'android' || Platform.Version < 33) {
      return true;
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  },

  openAppSettings: async () => {
    await Linking.openSettings();
  },
};
