import { registerPlayerEventListeners } from './player.events';

export async function playbackService() {
  registerPlayerEventListeners();
}
