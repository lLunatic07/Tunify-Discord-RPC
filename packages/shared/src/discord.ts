export type DiscordTokenResponse = {
  accessToken: string;
  refreshToken?: string;
  tokenType: "Bearer" | "User";
  expiresIn: number;
  scope: string;
  expiresAt: number;
};

export type DiscordPresencePayload = {
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
  position?: number;
  startedAt?: number;
  endsAt?: number;
  isPlaying: boolean;
  largeImage: string;
  largeText?: string;
  smallImage: string;
  smallText?: string;
};
