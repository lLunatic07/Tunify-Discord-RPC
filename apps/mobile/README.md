# Tunify Mobile

This folder contains the React Native Android app for Tunify.

For full project setup, environment variables, Discord SDK notes, release builds, and troubleshooting, see the root [README.md](../../README.md).

## Local Commands

Run these commands from the repository root:

```sh
npm run mobile:start
npm run mobile:android
npm run mobile:typecheck
```

Or run them from this folder:

```sh
npm run start
npm run android
npm run typecheck
```

## Android Release APK

From this folder:

```sh
cd android
./gradlew assembleRelease
```

On Windows PowerShell:

```powershell
cd android
.\gradlew.bat assembleRelease
```

The release APK is generated at:

```txt
android/app/build/outputs/apk/release/app-release.apk
```
