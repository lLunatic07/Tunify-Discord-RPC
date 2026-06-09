import { create } from 'zustand';

import { PermissionsService } from './permissions.service';
import type { AudioPermissionStatus } from './permissions.types';

type PermissionsStore = {
  audioPermission: AudioPermissionStatus;
  checkAudioPermission: () => Promise<AudioPermissionStatus>;
  requestAudioPermission: () => Promise<AudioPermissionStatus>;
};

export const usePermissionsStore = create<PermissionsStore>(set => ({
  audioPermission: 'unknown',
  checkAudioPermission: async () => {
    const status = await PermissionsService.checkAudioPermission();
    set({ audioPermission: status });
    return status;
  },
  requestAudioPermission: async () => {
    const status = await PermissionsService.requestAudioPermission();
    set({ audioPermission: status });
    return status;
  },
}));
