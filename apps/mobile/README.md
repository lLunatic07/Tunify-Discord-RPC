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

## Wireless Debugging Install

1. Enable Developer Options on the Android phone.
2. Enable Wireless debugging.
3. Open Wireless debugging and tap Pair device with pairing code.
4. Pair from the laptop:

```sh
adb pair PHONE_IP:PAIRING_PORT
```

5. Connect using the IP address and port from the main Wireless debugging screen:

```sh
adb connect PHONE_IP:CONNECT_PORT
adb devices
```

6. Start Metro and install the debug app:

```sh
npm run start
npm run android
```

For a standalone release APK:

```sh
cd android
./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
```

On Windows PowerShell:

```powershell
cd android
.\gradlew.bat assembleRelease
adb install -r app\build\outputs\apk\release\app-release.apk
```
