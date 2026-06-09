export type TrackArtwork = {
  localArtworkPath?: string;
  artworkRemoteUrl?: string;
  source: "embedded" | "remote" | "fallback" | "none";
};
