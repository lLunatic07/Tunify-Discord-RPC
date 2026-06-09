export type Track = {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  albumId?: string;
  url: string;
  duration?: number;
  mimeType?: string;
  size?: number;
  fileName?: string;
  folderPath?: string;
  fileSize?: number;
  dateAdded?: number;
  dateModified?: number;
  trackNumber?: number;
  localArtworkUri?: string;
  localArtworkPath?: string;
  artworkRemoteUrl?: string;
};

export type PlaybackState = {
  isPlaying: boolean;
  position: number;
  startedAt?: number;
};
