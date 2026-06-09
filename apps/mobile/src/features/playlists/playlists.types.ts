export type Playlist = {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  coverTrackId?: string;
  createdAt: number;
  updatedAt: number;
};
