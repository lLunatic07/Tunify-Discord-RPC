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

Wireless debugging lets you preview the app on a physical Android phone and build/install APKs through ADB.

On Windows PowerShell, if `adb` is not in your `PATH`, define it first:

```powershell
$adb="$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
```

### 1. Pair and Connect the Phone

On the phone:

1. Enable Developer Options.
2. Enable Wireless debugging.
3. Open Wireless debugging.
4. Tap Pair device with pairing code.
5. Note the pairing IP, pairing port, and pairing code.

On the laptop:

```sh
adb pair PHONE_IP:PAIRING_PORT
```

On Windows PowerShell:

```powershell
& $adb kill-server
& $adb start-server
& $adb pair PHONE_IP:PAIRING_PORT
```

Enter the pairing code when prompted.

After pairing, go back to the main Wireless debugging screen on the phone. Use the IP address and port shown there for the actual ADB connection. This port is usually different from the pairing port.

```sh
adb connect PHONE_IP:CONNECT_PORT
adb devices
```

On Windows PowerShell:

```powershell
& $adb connect PHONE_IP:CONNECT_PORT
& $adb devices
```

You should see:

```txt
PHONE_IP:CONNECT_PORT    device
```

### 2. Preview with Fast Refresh

Terminal 1:

```sh
npm run start
```

Terminal 2:

```sh
adb reverse tcp:8081 tcp:8081
npm run android
```

On Windows PowerShell:

```powershell
& $adb reverse tcp:8081 tcp:8081
npm.cmd run android
```

If more than one device is connected:

```powershell
npm.cmd run android -- --deviceId=PHONE_IP:CONNECT_PORT
```

### 3. Build and Install a Standalone Release APK

Use this when you want the app to run without Metro:

```sh
cd android
./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
```

On Windows PowerShell:

```powershell
cd android
.\gradlew.bat assembleRelease
& $adb install -r app\build\outputs\apk\release\app-release.apk
```
