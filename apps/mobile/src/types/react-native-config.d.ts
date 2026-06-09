declare module 'react-native-config' {
  const Config: {
    APP_ENV?: string;
    DISCORD_APPLICATION_ID?: string;
    DISCORD_CLIENT_ID?: string;
    DISCORD_REDIRECT_URI?: string;
    DISCORD_RP_DEFAULT_LARGE_IMAGE_KEY?: string;
    DISCORD_RP_SMALL_PLAY_IMAGE_KEY?: string;
    DISCORD_RP_SMALL_PAUSE_IMAGE_KEY?: string;
    CLOUDINARY_CLOUD_NAME?: string;
    CLOUDINARY_UPLOAD_PRESET?: string;
    ANDROID_PACKAGE_NAME?: string;
  };

  export default Config;
}
