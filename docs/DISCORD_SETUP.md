# Discord Setup

This project uses a mobile-only Discord OAuth2 Public Client flow with PKCE.
Do not add a Discord client secret to the mobile app.

## Developer Portal

1. Open the Discord Developer Portal.
2. Create a new application named `Tunify`.
3. Copy the Application ID.
4. Copy the Client ID.
5. Open the OAuth2 tab.
6. Enable Public Client.
7. Add this redirect URI:

```txt
discord-YOUR_APPLICATION_ID:/authorize/callback
```

8. Open Rich Presence assets.
9. Upload these assets:

```txt
app_logo
play_icon
pause_icon
```

10. Keep asset keys lowercase.
11. Copy the values into `apps/mobile/.env`.

## Scopes

Use the Social SDK presence scopes provided by Discord. The planned scopes are:

```txt
openid
sdk.social_layer_presence
```

## Environment

Create `apps/mobile/.env` from `apps/mobile/.env.example`.

Allowed mobile env values:

```txt
DISCORD_APPLICATION_ID
DISCORD_CLIENT_ID
DISCORD_REDIRECT_URI
DISCORD_RP_DEFAULT_LARGE_IMAGE_KEY
DISCORD_RP_SMALL_PLAY_IMAGE_KEY
DISCORD_RP_SMALL_PAUSE_IMAGE_KEY
ANDROID_PACKAGE_NAME
```

Never add server-only secrets, database URLs, or private token encryption keys to the mobile app.

## Album Art Rule

Discord Rich Presence images must be either Discord Developer Portal asset keys or public HTTPS image URLs.

Tunify can show local embedded artwork inside the app, but it must not send `file://`, `content://`, base64, or local cache paths to Discord Presence.

Presence image priority:

```txt
artworkRemoteUrl -> app_logo
```
