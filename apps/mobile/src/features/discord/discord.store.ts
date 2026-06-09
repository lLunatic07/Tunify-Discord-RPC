import { create } from 'zustand';
import type { DiscordPresencePayload } from '@tunify/shared';

type DiscordConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

type DiscordStore = {
  status: DiscordConnectionStatus;
  lastPayload?: DiscordPresencePayload;
  error?: string;
  setStatus: (status: DiscordConnectionStatus) => void;
  setLastPayload: (payload?: DiscordPresencePayload) => void;
  setError: (error?: string) => void;
};

export const useDiscordStore = create<DiscordStore>(set => ({
  status: 'idle',
  lastPayload: undefined,
  error: undefined,
  setStatus: status => set({ status }),
  setLastPayload: payload => set({ lastPayload: payload }),
  setError: error => set({ error }),
}));
