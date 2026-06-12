# Tunify

Tunify is an Android-first React Native music player for local audio libraries. It scans audio files from the device, builds a local-first library, plays tracks with queue controls, and can publish Discord Rich Presence through the Discord Social SDK.

## Features

- Local Android music library powered by device media storage.
- Tracks, albums, artists, folders, favorites, playlists, and queue views.
- Now Playing screen with album artwork, progress, shuffle, repeat, queue, and lyrics panels.
- Light, dark, and system theme support.
- Discord Social SDK authentication with persistent session restore.
- Discord Rich Presence updates when a track starts or changes.
- Optional Cloudinary upload for local album artwork, with local cache and app-logo fallback.
- Local storage for library cache, playlists, favorites, Discord settings, and Discord tokens.

## Tech Stack

- React Native 0.82
- React 19
- TypeScript
- Zustand
- React Native Track Player
- React Native Config
- Discord Social SDK native Android bridge
- Cloudinary unsigned uploads for optional album-art hosting
- Turborepo and npm workspaces

## Repository Structure

```txt
.
|-- apps/
|   `-- mobile/          # React Native Android app
|-- packages/
|   `-- shared/          # Shared TypeScript models
|-- discord_social_sdk/  # Local Discord SDK files, ignored by Git
|-- package.json         # Workspace scripts
`-- turbo.json
```

## Requirements

- Node.js 20 or newer
- npm
- JDK 17 or newer
- Android Studio
- Android SDK Platform 36
- Android SDK Build-Tools 36.1
- Android SDK Platform-Tools
- Android NDK 30.0.14904198
- CMake from the Android SDK tools
- A physical Android device or emulator
- Discord Social SDK files for native presence support

The app currently targets Android. iOS is not wired for the Discord native bridge yet.

## Environment Variables

Create a local env file from the template:

```sh
cp apps/mobile/.env.example apps/mobile/.env
```

On Windows PowerShell:

```powershell
Copy-Item apps/mobile/.env.example apps/mobile/.env
```

Then fill the values in `apps/mobile/.env`:

```env
APP_ENV=development

DISCORD_APPLICATION_ID=YOUR_DISCORD_APPLICATION_ID
DISCORD_CLIENT_ID=YOUR_DISCORD_CLIENT_ID
DISCORD_REDIRECT_URI=discord-YOUR_DISCORD_APPLICATION_ID:/authorize/callback

DISCORD_RP_DEFAULT_LARGE_IMAGE_KEY=app_logo
DISCORD_RP_SMALL_PLAY_IMAGE_KEY=play_icon
DISCORD_RP_SMALL_PAUSE_IMAGE_KEY=pause_icon

CLOUDINARY_CLOUD_NAME=YOUR_CLOUDINARY_CLOUD_NAME
CLOUDINARY_UPLOAD_PRESET=YOUR_PRESET

ANDROID_PACKAGE_NAME=com.tunify.mobile
```

Do not commit `.env`. It is ignored by Git.

## Discord Social SDK

The Discord SDK folder and binary files are ignored by Git because SDK distribution may be license-restricted. To build the native Discord bridge after cloning, provide the SDK files locally:

```txt
discord_social_sdk/
|-- include/
|   |-- cdiscord.h
|   `-- discordpp.h
`-- lib/
    `-- release/
        `-- discord_partner_sdk.aar
```

The Android build currently reads the AAR from:

```txt
discord_social_sdk/lib/release/discord_partner_sdk.aar
```

## Install Dependencies

From the repository root:

```sh
npm install
```

## Run on Android

Start Metro:

```sh
npm run mobile:start
```

In another terminal, install and run the debug app:

```sh
npm run mobile:android
```

For a physical Android phone:

1. Enable Developer Options.
2. Enable USB debugging or Wireless debugging.
3. Confirm the device is connected:

```sh
adb devices
```

## Install on a Phone with Wireless Debugging

Wireless debugging lets you build, install, and preview the app on a real Android phone without a USB cable after the first pairing step.

Before starting:

- Keep the laptop and Android phone on the same network.
- On the phone, open Developer Options and enable Wireless debugging.
- Keep the Wireless debugging screen open while pairing.
- Make sure Android SDK Platform-Tools is installed and `adb` is available in your terminal.

### 1. Pair the Phone

On the phone:

1. Open Settings.
2. Go to Developer Options.
3. Open Wireless debugging.
4. Tap Pair device with pairing code.
5. Note the IP address, pairing port, and pairing code shown on the phone.

On the laptop:

```sh
adb pair PHONE_IP:PAIRING_PORT
```

Example:

```sh
adb pair 192.168.1.67:40699
```

Enter the pairing code when prompted.

### 2. Connect ADB Wirelessly

After pairing, go back to the main Wireless debugging screen on the phone and note the IP address and port shown under IP address & Port. This port is usually different from the pairing port.

```sh
adb connect PHONE_IP:CONNECT_PORT
```

Example:

```sh
adb connect 192.168.1.67:43203
```

Confirm the device is connected:

```sh
adb devices
```

You should see something like:

```txt
192.168.1.67:43203    device
```

### 3. Install and Preview the Debug App

Use this flow when you want Fast Refresh / hot reload while developing.

Terminal 1:

```sh
npm run mobile:start
```

Terminal 2:

```sh
npm run mobile:android
```

React Native will build the debug app, install it to the connected wireless device, and open it. Keep Metro running for Fast Refresh.

### 4. Build and Install a Debug APK Manually

If you want to build the debug APK first and install it yourself:

```sh
cd apps/mobile/android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

On Windows PowerShell:

```powershell
cd apps/mobile/android
.\gradlew.bat assembleDebug
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

The debug APK still expects Metro when opened in development mode.

## Build a Release APK

From the mobile Android folder:

```sh
cd apps/mobile/android
./gradlew assembleRelease
```

On Windows PowerShell:

```powershell
cd apps/mobile/android
.\gradlew.bat assembleRelease
```

The APK will be generated at:

```txt
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

Install it on a connected Android device:

```sh
adb install -r apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

If you are already inside `apps/mobile/android`, install it with:

```sh
adb install -r app/build/outputs/apk/release/app-release.apk
```

On Windows PowerShell:

```powershell
adb install -r app\build\outputs\apk\release\app-release.apk
```

Release APKs are standalone and do not need Metro to be running.

## Useful Commands

```sh
npm run mobile:start      # Start Metro
npm run mobile:android    # Build and install debug app
npm run mobile:typecheck  # Type-check the mobile app
npm run typecheck         # Type-check workspace packages through Turbo
npm run build             # Run workspace build tasks
```

## Album Art and Cloudinary

Discord Rich Presence needs a public HTTPS URL for dynamic album artwork. Local file paths cannot be shown directly by Discord.

Tunify supports this flow:

1. Play a local track.
2. Use cached `artworkRemoteUrl` if it already exists.
3. If album-art upload is enabled, upload local artwork to Cloudinary in the background.
4. Cache the returned Cloudinary HTTPS URL.
5. Update Discord Presence again with the remote album-art URL.
6. Fall back to the app logo if upload fails, there is no internet, or upload is disabled.

For production, prefer a backend or signed upload flow. The current setup uses an unsigned Cloudinary upload preset so the mobile app can run without a backend.

## Discord Presence Notes

- Presence uses Discord's Listening activity type.
- Presence automatically restores after a saved Discord session is loaded.
- Presence updates automatically when a playing track changes.
- The app de-duplicates and serializes presence updates to avoid native SDK update collisions.
- A progress-bar style presence can be added later by sending both start and end timestamps.

## Troubleshooting

If Android cannot find the device:

```sh
adb kill-server
adb start-server
adb devices
```

If wireless debugging disconnects:

```sh
adb disconnect
adb connect PHONE_IP:CONNECT_PORT
adb devices
```

If `adb pair` succeeds but `adb connect` fails, check that you are using the connection port from the main Wireless debugging screen, not the pairing port.

If Discord Presence does not update:

- Confirm the Discord SDK files exist locally.
- Confirm `DISCORD_APPLICATION_ID`, `DISCORD_CLIENT_ID`, and `DISCORD_REDIRECT_URI` match the Discord application.
- Confirm the Discord asset keys exist for `app_logo`, `play_icon`, and `pause_icon`.
- Check Android logs for `Tunify`, `DiscordPresence`, or `TunifyDiscordBridge`.

If album artwork does not appear in Discord:

- Confirm Cloudinary settings are filled in `.env`.
- Confirm the unsigned upload preset accepts image uploads.
- Confirm the device has internet access.
- Confirm album-art upload is enabled in the app settings.

## License

No license has been selected yet.
