import type { Track } from '@tunify/shared';

export type TrackMetadata = Pick<
  Track,
  'title' | 'artist' | 'album' | 'duration' | 'localArtworkPath' | 'artworkRemoteUrl'
>;
