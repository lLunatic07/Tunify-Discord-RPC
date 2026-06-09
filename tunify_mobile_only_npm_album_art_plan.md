# Tunify Mobile-Only Android Discord Presence Plan — npm Version

Dokumen ini adalah versi terbaru dari plan **Tunify** dengan perubahan berikut:

```txt
- Menggunakan npm, bukan pnpm
- Tetap monorepo
- Tanpa backend
- React Native CLI Android app
- Discord Social SDK
- OAuth2 Public Client + PKCE
- Presence menampilkan nama lagu
- Presence memakai album art jika tersedia sebagai URL publik
- Jika album art tidak tersedia / hanya file lokal, fallback ke app icon
```

> Catatan penting: Discord Rich Presence image bisa memakai **asset key** dari Discord Developer Portal atau **external image URL**. Namun gambar album yang hanya tersimpan lokal di HP tidak bisa langsung ditampilkan di Discord Presence sebagai local file path. Agar muncul di Discord, gambar harus berupa asset yang sudah diupload ke Developer Portal atau URL gambar publik yang bisa diakses Discord.

---

## 1. Tujuan Project

Membuat aplikasi Android music player lokal yang dapat:

```txt
- Memutar file musik lokal dari device Android
- Membaca metadata lagu
- Membaca title, artist, album, duration
- Membaca embedded album art jika tersedia
- Background playback
- Menampilkan media notification/control
- Login/link Discord account dari mobile
- Update Discord Rich Presence saat lagu diputar
- Menampilkan nama lagu di Discord Presence
- Menampilkan album art di Discord Presence jika tersedia sebagai URL publik
- Fallback ke app icon jika tidak ada album art yang valid
- Clear Discord Presence saat lagu pause/stop
```

Arsitektur tanpa backend:

```txt
React Native Android App
→ Native Android Module
→ Discord Social SDK
→ Discord OAuth2 Public Client + PKCE
→ Discord Rich Presence
```

---

## 2. Arsitektur Monorepo

Gunakan satu monorepo dengan **npm workspaces**:

```txt
tunify/
├── apps/
│   └── mobile/      # React Native Android app
├── packages/
│   └── shared/      # Shared types, constants
├── docs/
│   └── DISCORD_SETUP.md
├── package.json
├── package-lock.json
├── turbo.json
├── tsconfig.base.json
└── .gitignore
```

Tidak perlu membuat:

```txt
apps/backend/
```

Backend bisa ditambahkan nanti saat masuk tahap production.

---

## 3. Tech Stack

### Monorepo

```txt
Package manager : npm
Workspace       : npm workspaces
Monorepo tool   : Turborepo
Language        : TypeScript
Shared package  : packages/shared
```

### Mobile App

```txt
Framework        : React Native CLI
Language         : TypeScript
Platform awal    : Android
Audio player     : React Native Track Player
State management : Zustand
Env              : react-native-config / compatible env library
Storage token    : MMKV / encrypted storage
Native module    : Kotlin
Native bridge    : Kotlin + C++/JNI jika dibutuhkan Discord SDK
```

### Discord

```txt
Discord Developer Application
Discord Social SDK
Public Client enabled
OAuth2 + PKCE
Mobile deep link
Rich Presence assets
External image URL support for album art
```

---

## 4. Kenapa Tanpa Backend Bisa?

Tanpa backend berarti app menggunakan:

```txt
OAuth2 Public Client + PKCE
```

Dalam mode ini:

```txt
- Mobile app tidak memakai DISCORD_CLIENT_SECRET.
- Token exchange dilakukan lewat Discord Social SDK/client-side flow.
- DISCORD_CLIENT_SECRET tidak dibutuhkan.
- Cocok untuk prototype/development.
```

Yang tidak boleh dilakukan:

```txt
- Jangan pakai Discord user token.
- Jangan pakai self-bot.
- Jangan pakai private API Discord.
- Jangan hardcode secret.
```

---

## 5. Batasan Penting Album Art di Discord Presence

Target user:

```txt
Jika lagu punya gambar album, tampilkan gambar album di Discord Presence.
Jika tidak ada, tampilkan icon app.
```

Secara konsep bisa, tapi ada batasan teknis:

```txt
Discord Presence large image tidak bisa memakai path lokal seperti:
file:///storage/emulated/0/Music/cover.jpg

Discord butuh salah satu:
1. Asset key dari Discord Developer Portal
2. External image URL yang bisa diakses publik via https
```

Jadi strategi yang dipakai:

```txt
1. Jika track punya artworkRemoteUrl berupa https URL:
   → pakai artworkRemoteUrl sebagai large image.

2. Jika track hanya punya embedded artwork lokal:
   → tampilkan artwork di UI app.
   → untuk Discord Presence, fallback ke app_logo.
   → optional future: upload/host artwork agar punya public URL.

3. Jika track tidak punya artwork:
   → pakai app_logo.
```

Rule final:

```txt
Presence large image priority:
artworkRemoteUrl → app_logo
```

Bukan:

```txt
localArtworkPath → Discord Presence
```

Karena localArtworkPath hanya bisa dipakai di UI app, bukan Discord Presence.

---

## 6. Security Rules

Wajib:

```txt
1. Jangan pernah meminta user token Discord.
2. Jangan menggunakan self-bot.
3. Jangan memakai private/undocumented Discord API.
4. Jangan menaruh DISCORD_CLIENT_SECRET di mobile.
5. Jangan commit file .env asli.
6. Commit hanya .env.example.
7. Gunakan OAuth2 Public Client + PKCE.
8. Simpan token user di encrypted storage.
```

Karena tidak ada backend, file env mobile **tidak boleh** berisi:

```txt
DISCORD_CLIENT_SECRET
SERVER_INTERNAL_SECRET
TOKEN_ENCRYPTION_SECRET
DATABASE_URL
```

---

## 7. Folder Structure

Buat struktur berikut:

```txt
tunify/
├── apps/
│   └── mobile/
│       ├── android/
│       ├── ios/
│       ├── src/
│       │   ├── app/
│       │   ├── features/
│       │   │   ├── player/
│       │   │   ├── discord/
│       │   │   └── library/
│       │   ├── services/
│       │   │   ├── artwork/
│       │   │   └── metadata/
│       │   ├── storage/
│       │   └── types/
│       ├── .env.example
│       └── package.json
│
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── discord.ts
│       │   ├── player.ts
│       │   ├── artwork.ts
│       │   └── index.ts
│       └── package.json
│
├── docs/
│   └── DISCORD_SETUP.md
│
├── package.json
├── package-lock.json
├── turbo.json
├── tsconfig.base.json
└── .gitignore
```

---

## 8. Root Config npm Workspaces

### Root `package.json`

```json
{
  "name": "tunify",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "mobile:android": "npm run android -w mobile",
    "mobile:start": "npm run start -w mobile",
    "mobile:typecheck": "npm run typecheck -w mobile"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "latest"
  }
}
```

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"]
    },
    "lint": {},
    "typecheck": {}
  }
}
```

### `.gitignore`

```gitignore
node_modules
dist
build

.env
.env.*
!.env.example

# React Native
apps/mobile/android/.gradle
apps/mobile/android/app/build
apps/mobile/ios/Pods
apps/mobile/ios/build

# Android outputs
*.apk
*.aab

# Discord SDK binary
apps/mobile/android/app/libs/discord_partner_sdk.aar

# Local IDE
.idea
.vscode
.DS_Store
```

---

## 9. Environment Variables

### `apps/mobile/.env.example`

```env
APP_ENV=development

DISCORD_APPLICATION_ID=YOUR_DISCORD_APPLICATION_ID
DISCORD_CLIENT_ID=YOUR_DISCORD_CLIENT_ID
DISCORD_REDIRECT_URI=discord-YOUR_DISCORD_APPLICATION_ID:/authorize/callback

DISCORD_RP_DEFAULT_LARGE_IMAGE_KEY=app_logo
DISCORD_RP_SMALL_PLAY_IMAGE_KEY=play_icon
DISCORD_RP_SMALL_PAUSE_IMAGE_KEY=pause_icon

ANDROID_PACKAGE_NAME=com.tunify.mobile
```

Penjelasan:

```txt
DISCORD_APPLICATION_ID:
- Ambil dari Discord Developer Portal.

DISCORD_CLIENT_ID:
- Biasanya sama dengan Application ID.

DISCORD_REDIRECT_URI:
- Harus sama persis dengan redirect URI di Discord Developer Portal.
- Format:
  discord-YOUR_APPLICATION_ID:/authorize/callback

DISCORD_RP_DEFAULT_LARGE_IMAGE_KEY:
- Asset default jika album art tidak tersedia sebagai public URL.

DISCORD_RP_SMALL_PLAY_IMAGE_KEY:
- Asset key untuk icon play.

DISCORD_RP_SMALL_PAUSE_IMAGE_KEY:
- Asset key untuk icon pause.
```

Jangan tambahkan:

```env
DISCORD_CLIENT_SECRET=...
```

---

## 10. Discord Developer Portal Setup

Buat dokumentasi:

```txt
docs/DISCORD_SETUP.md
```

Isi langkah:

```txt
1. Buka Discord Developer Portal.
2. Create New Application.
3. Beri nama app, misalnya "Tunify".
4. Catat Application ID.
5. Catat Client ID.
6. Masuk ke OAuth2 tab.
7. Enable Public Client.
8. Tambahkan Redirect URI:
   discord-YOUR_APPLICATION_ID:/authorize/callback
9. Masuk ke Rich Presence assets.
10. Upload asset:
   - app_logo
   - play_icon
   - pause_icon
11. Pastikan asset key lowercase.
12. Copy value ke apps/mobile/.env.
```

Scopes yang perlu dipakai untuk presence:

```txt
openid
sdk.social_layer_presence
```

Jika Discord Social SDK menyediakan helper seperti default presence scopes, gunakan helper tersebut.

---

## 11. Mobile App Setup

### 11.1 Buat React Native app

Buat React Native TypeScript app di:

```txt
apps/mobile
```

Command contoh:

```bash
npx @react-native-community/cli init mobile --template react-native-template-typescript
```

Jika command membuat folder di lokasi lain, pindahkan hasilnya ke:

```txt
apps/mobile
```

---

### 11.2 Install dependencies dengan npm

Dari root project:

```bash
npm install
```

Install dependency mobile:

```bash
npm install react-native-track-player zustand react-native-config react-native-mmkv -w mobile
```

Opsional storage aman:

```bash
npm install react-native-encrypted-storage -w mobile
```

Jika perlu dependency shared package:

```bash
npm install @tunify/shared -w mobile
```

> Catatan: nama package shared bisa disesuaikan, misalnya `@tunify/shared`.

---

### 11.3 Mobile scripts

`apps/mobile/package.json`:

```json
{
  "name": "mobile",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "start": "react-native start",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  }
}
```

---

## 12. Android Permissions

Tambahkan ke:

```txt
apps/mobile/android/app/src/main/AndroidManifest.xml
```

Permissions:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
```

Catatan:

```txt
READ_MEDIA_AUDIO:
- Untuk Android 13+.

READ_EXTERNAL_STORAGE:
- Untuk Android 12 ke bawah.

POST_NOTIFICATIONS:
- Untuk Android 13+ notification permission.

FOREGROUND_SERVICE_MEDIA_PLAYBACK:
- Untuk background music playback.
```

---

## 13. Android Deep Link

Tambahkan activity untuk Discord auth callback di:

```txt
apps/mobile/android/app/src/main/AndroidManifest.xml
```

Contoh:

```xml
<activity
    android:name="com.discord.socialsdk.AuthenticationActivity"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />

        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />

        <data android:scheme="discord-YOUR_APPLICATION_ID" />
    </intent-filter>
</activity>
```

Redirect URI:

```txt
discord-YOUR_APPLICATION_ID:/authorize/callback
```

Pastikan value ini sama dengan yang ada di:

```txt
1. Discord Developer Portal
2. apps/mobile/.env
3. AndroidManifest/build config
```

---

## 14. Mobile Feature Structure

### 14.1 Player feature

Buat:

```txt
apps/mobile/src/features/player/
├── player.service.ts
├── player.store.ts
├── player.events.ts
└── player.types.ts
```

Minimal API:

```ts
export const PlayerService = {
  setup: async () => {},
  addTrack: async () => {},
  play: async () => {},
  pause: async () => {},
  skipToNext: async () => {},
  skipToPrevious: async () => {},
  seekTo: async (seconds: number) => {},
  getCurrentTrack: async () => {}
};
```

Event yang perlu didengar:

```txt
track changed
playback started
playback paused
playback stopped
seek changed
```

---

### 14.2 Library feature

Buat:

```txt
apps/mobile/src/features/library/
├── library.service.ts
├── library.store.ts
└── library.types.ts
```

Untuk MVP awal gunakan mock track:

```ts
export const mockTracks = [
  {
    id: "1",
    title: "Test Song",
    artist: "Unknown Artist",
    album: "Unknown Album",
    url: "file:///storage/emulated/0/Music/test.mp3",
    duration: 180,
    localArtworkPath: undefined,
    artworkRemoteUrl: undefined
  }
];
```

Setelah player stabil, implement scanner real menggunakan Android MediaStore native module.

---

### 14.3 Artwork / Metadata services

Buat:

```txt
apps/mobile/src/services/artwork/
├── artwork.service.ts
├── artwork.types.ts
└── artwork.utils.ts

apps/mobile/src/services/metadata/
├── metadata.service.ts
└── metadata.types.ts
```

Target metadata:

```txt
- title
- artist
- album
- duration
- localArtworkPath
- artworkRemoteUrl
```

Rule:

```txt
localArtworkPath:
- Dipakai untuk UI app.
- Tidak dikirim langsung ke Discord Presence.

artworkRemoteUrl:
- Dipakai untuk Discord Presence jika URL valid HTTPS dan bisa diakses publik.

fallback:
- Jika artworkRemoteUrl tidak tersedia, pakai DISCORD_RP_DEFAULT_LARGE_IMAGE_KEY.
```

Function yang perlu dibuat:

```ts
export function resolvePresenceLargeImage(track: Track): string {
  if (track.artworkRemoteUrl && track.artworkRemoteUrl.startsWith("https://")) {
    return track.artworkRemoteUrl;
  }

  return Config.DISCORD_RP_DEFAULT_LARGE_IMAGE_KEY;
}
```

---

### 14.4 Discord feature

Buat:

```txt
apps/mobile/src/features/discord/
├── discordPresence.ts
├── discordPresence.types.ts
├── discordAuth.service.ts
└── discord.store.ts
```

Type:

```ts
export type DiscordPresencePayload = {
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
  position?: number;
  isPlaying: boolean;
  largeImage: string;
  largeText?: string;
  smallImage: string;
  smallText?: string;
};
```

JS-facing API:

```ts
export const DiscordPresence = {
  init: async () => {},
  login: async () => {},
  updateToken: async () => {},
  connect: async () => {},
  updatePresence: async (payload: DiscordPresencePayload) => {},
  clearPresence: async () => {},
  logout: async () => {}
};
```

Untuk tahap awal, function boleh mock/log dulu sampai native bridge siap.

---

## 15. Discord Auth Flow Tanpa Backend

Flow mobile-only:

```txt
1. User buka Tunify.
2. User klik Connect Discord.
3. App init Discord Social SDK.
4. App membuat code verifier.
5. App membuat code challenge.
6. App membuka authorization Discord dengan:
   - clientId
   - redirectUri
   - scopes
   - codeChallenge
7. User approve di Discord.
8. Discord mengembalikan authorization code via deep link.
9. App / Discord Social SDK menukar code menjadi access token memakai PKCE.
10. App menyimpan access token + refresh token secara aman.
11. App update token ke Discord SDK.
12. App connect ke Discord SDK.
13. Saat lagu play, app update Rich Presence.
14. Saat pause/stop, app clear Rich Presence.
```

Important:

```txt
- Jangan kirim authorization code ke backend karena backend tidak ada.
- Jangan pakai client secret.
- Jangan pakai user token.
- Token exchange harus memakai flow yang disediakan Discord Social SDK untuk public client.
```

---

## 16. Android Native Module Plan

Buat folder:

```txt
apps/mobile/android/app/src/main/java/com/tunify/mobile/discord/
```

File:

```txt
DiscordPresenceModule.kt
DiscordPresencePackage.kt
```

Expose method ke JS:

```txt
init(applicationId)
login()
updateToken(tokenType, accessToken)
connect()
updatePresence(
  title,
  artist,
  album,
  startedAt,
  largeImage,
  largeText,
  smallImage,
  smallText
)
clearPresence()
logout()
```

Native module ini nanti membungkus Discord Social SDK.

---

## 17. Discord SDK Placeholder

Buat folder:

```txt
apps/mobile/android/app/libs/
```

Isi:

```txt
.gitkeep
```

Tambahkan instruksi di README:

```txt
Place Discord Social SDK AAR file here:

apps/mobile/android/app/libs/discord_partner_sdk.aar
```

Jangan commit file SDK binary jika lisensinya tidak mengizinkan.

---

## 18. Gradle / CMake Placeholder

Siapkan placeholder untuk integrasi SDK native:

```txt
apps/mobile/android/app/src/main/cpp/
├── discord_presence_bridge.cpp
└── discord_presence_bridge.h
```

Buat juga:

```txt
apps/mobile/android/app/CMakeLists.txt
```

Untuk tahap awal, native module boleh log dulu tanpa memanggil SDK real.

---

## 19. Presence Mapping

Gunakan mapping ini:

```txt
Activity type : Playing
Details       : song title
State         : artist • album
Timestamp     : playback start time
Large image   : artworkRemoteUrl jika ada, kalau tidak app_logo
Large text    : album name atau song title
Small image   : play_icon / pause_icon
Small text    : Playing / Paused
```

Contoh dengan album art remote URL:

```txt
Playing Tunify
Numb
Linkin Park • Meteora
Large image = https://example.com/cover.jpg
```

Contoh tanpa album art remote URL:

```txt
Playing Tunify
Numb
Linkin Park • Meteora
Large image = app_logo
```

Presence formatter:

```ts
export function buildDiscordPresencePayload(track: Track, state: PlaybackState) {
  const largeImage = resolvePresenceLargeImage(track);

  return {
    title: track.title || "Unknown Title",
    artist: track.artist || "Unknown Artist",
    album: track.album,
    duration: track.duration,
    position: state.position,
    isPlaying: state.isPlaying,
    largeImage,
    largeText: track.album || track.title || "Tunify",
    smallImage: state.isPlaying
      ? Config.DISCORD_RP_SMALL_PLAY_IMAGE_KEY
      : Config.DISCORD_RP_SMALL_PAUSE_IMAGE_KEY,
    smallText: state.isPlaying ? "Playing" : "Paused"
  };
}
```

---

## 20. Playback to Presence Rules

Aturan integrasi:

```txt
Saat user play lagu:
- Build payload dari track metadata
- Set Details = nama lagu
- Set State = artist • album
- Set Large Image = artworkRemoteUrl atau app_logo
- updatePresence()

Saat user ganti lagu:
- updatePresence() dengan metadata lagu baru

Saat user pause:
- clearPresence() untuk MVP
- optional future: tampilkan paused dengan pause_icon

Saat user stop:
- clearPresence()

Saat app ditutup:
- clearPresence(), jika memungkinkan

Saat token expired:
- refresh token melalui Discord Social SDK/client-side flow
- updateToken()
- retry updatePresence()
```

Untuk MVP:

```txt
pause = clear presence
stop = clear presence
```

---

## 21. Shared Package

Buat:

```txt
packages/shared/src/discord.ts
packages/shared/src/player.ts
packages/shared/src/artwork.ts
packages/shared/src/index.ts
```

Contoh `player.ts`:

```ts
export type Track = {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  url: string;
  duration?: number;
  localArtworkPath?: string;
  artworkRemoteUrl?: string;
};
```

Contoh `artwork.ts`:

```ts
export type TrackArtwork = {
  localArtworkPath?: string;
  artworkRemoteUrl?: string;
  source: "embedded" | "remote" | "fallback" | "none";
};
```

Contoh `discord.ts`:

```ts
export type DiscordTokenResponse = {
  accessToken: string;
  refreshToken?: string;
  tokenType: "Bearer";
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
  isPlaying: boolean;
  largeImage: string;
  largeText?: string;
  smallImage: string;
  smallText?: string;
};
```

---

## 22. UI Screen untuk MVP

Buat satu screen sederhana:

```txt
HomeScreen
├── Button: Connect Discord
├── Button: Test Play
├── Button: Pause
├── Button: Test Presence
├── Button: Clear Presence
├── Text: current song title
├── Text: current artist
├── Text: current album
├── Image: local album art preview jika ada
└── Text: current presence image source
```

Tujuannya:

```txt
- Membuktikan player berjalan
- Membuktikan metadata lagu terbaca
- Membuktikan local artwork bisa tampil di app
- Membuktikan fallback presence image berjalan
```

---

## 23. Preview / Run App

Untuk React Native CLI, preview app dilakukan lewat Android Emulator atau HP Android fisik.

Terminal 1:

```bash
npm run mobile:start
```

Terminal 2:

```bash
npm run mobile:android
```

Atau langsung dari folder `apps/mobile`:

```bash
npm run start
npm run android
```

---

## 24. Milestones

### Milestone 1 — Monorepo skeleton npm

```txt
- Setup npm workspaces
- Setup Turborepo
- Setup root package.json
- Setup tsconfig.base.json
- Setup .gitignore
- Buat apps/mobile
- Buat packages/shared
- Buat docs/DISCORD_SETUP.md
```

Acceptance criteria:

```txt
npm install berhasil
npm run dev mengenali workspace
```

---

### Milestone 2 — Mobile base app

```txt
- Setup React Native TypeScript
- Setup Android build
- Setup env config
- Setup basic HomeScreen
```

Acceptance criteria:

```txt
npm run mobile:android berhasil
App terbuka di emulator/device Android
```

---

### Milestone 3 — Player MVP

```txt
- Install React Native Track Player
- Setup player service
- Tambahkan mock track
- Play/pause mock track
- Listen playback event
```

Acceptance criteria:

```txt
Tombol Test Play memutar lagu lokal/mock
Tombol Pause menghentikan playback sementara
```

---

### Milestone 4 — Metadata + artwork model

```txt
- Tambahkan field title, artist, album, duration
- Tambahkan localArtworkPath
- Tambahkan artworkRemoteUrl
- Buat resolvePresenceLargeImage()
- Buat buildDiscordPresencePayload()
```

Acceptance criteria:

```txt
Track punya metadata
UI menampilkan nama lagu
UI menampilkan local artwork jika ada
Presence payload selalu punya title dan largeImage
Jika artworkRemoteUrl ada, largeImage = artworkRemoteUrl
Jika artworkRemoteUrl tidak ada, largeImage = app_logo
```

---

### Milestone 5 — Discord JS API mock

```txt
- Buat DiscordPresence JS API
- Buat discord store
- Buat button Connect Discord
- Buat button Test Presence
- Buat button Clear Presence
- Untuk awal, semua method log dulu
```

Acceptance criteria:

```txt
Button memanggil function yang benar
Log muncul di Metro console
Payload presence menampilkan nama lagu dan selected largeImage
```

---

### Milestone 6 — Android native module placeholder

```txt
- Buat DiscordPresenceModule.kt
- Buat DiscordPresencePackage.kt
- Register package ke React Native
- Expose method ke JS
- Method native log ke Logcat
```

Acceptance criteria:

```txt
Button Test Presence memanggil native module
Log muncul di Android Logcat
```

---

### Milestone 7 — Discord SDK setup

```txt
- Tambahkan discord_partner_sdk.aar secara manual
- Setup Gradle
- Setup CMake jika dibutuhkan
- Setup AndroidManifest deep link
- Init Discord Social SDK
```

Acceptance criteria:

```txt
App build dengan SDK terpasang
SDK init tidak crash
```

---

### Milestone 8 — Discord Public Client login

```txt
- Enable Public Client di Discord Developer Portal
- Implement OAuth2 + PKCE via SDK
- Implement login()
- Implement token storage
- Implement updateToken/connect
```

Acceptance criteria:

```txt
User bisa klik Connect Discord
Discord authorization terbuka
App menerima callback
SDK connected
```

---

### Milestone 9 — Real Presence integration

```txt
- Implement updatePresence real
- Implement clearPresence real
- Kirim Details = nama lagu
- Kirim State = artist • album
- Kirim Large Image = artworkRemoteUrl atau app_logo
- Hubungkan playback event ke presence
- Handle token expired
```

Acceptance criteria:

```txt
Saat lagu play, Discord profile menampilkan Tunify activity
Nama lagu tampil di Presence
Artist/album tampil di Presence
Jika artworkRemoteUrl valid, album art tampil sebagai large image
Jika tidak ada artworkRemoteUrl, app icon tampil sebagai large image
Saat pause/stop, presence hilang
Saat ganti lagu, presence berubah
```

---

### Milestone 10 — Android local music library

```txt
- Request READ_MEDIA_AUDIO
- Implement MediaStore scanner
- Ambil file musik lokal
- Ambil metadata dasar
- Ambil embedded album art jika tersedia
- Tampilkan list lagu
```

Acceptance criteria:

```txt
App bisa menampilkan lagu dari storage Android
User bisa memilih lagu dan memutarnya
Embedded album art tampil di UI app
Presence tetap fallback ke app_logo jika tidak ada artworkRemoteUrl
```

---

### Milestone 11 — Optional remote album art resolver

Karena local embedded artwork tidak bisa langsung menjadi Discord Presence image, tambahkan optional resolver:

```txt
- Cari artworkRemoteUrl dari metadata artist + album
- Simpan cache hasil lookup
- Gunakan hanya URL HTTPS publik
- Jika lookup gagal, fallback ke app_logo
```

Acceptance criteria:

```txt
Jika remote cover ditemukan, Discord Presence memakai cover tersebut
Jika remote cover tidak ditemukan, Discord Presence memakai app_logo
```

Catatan:

```txt
Jangan implement upload service dulu karena tidak ada backend.
Jangan mengirim local file path ke Discord Presence.
```

---

## 25. Acceptance Criteria Final

Project tahap mobile-only npm dianggap selesai jika:

```txt
1. Monorepo npm workspaces berhasil dibuat.
2. apps/mobile bisa build Android.
3. packages/shared tersedia.
4. .env.example tersedia di mobile.
5. Tidak ada DISCORD_CLIENT_SECRET di project.
6. HomeScreen punya:
   - Connect Discord
   - Test Play
   - Pause
   - Test Presence
   - Clear Presence
7. React Native Track Player terpasang.
8. Mock track bisa diputar.
9. Nama lagu tampil di UI.
10. Local album art tampil di UI jika ada.
11. Presence payload selalu mengirim nama lagu.
12. Presence large image memakai artworkRemoteUrl jika tersedia.
13. Presence large image fallback ke app_logo jika tidak ada artworkRemoteUrl.
14. DiscordPresence JS API tersedia.
15. Android native module placeholder tersedia.
16. AndroidManifest punya permission dan deep link.
17. Discord SDK folder placeholder tersedia.
18. docs/DISCORD_SETUP.md tersedia.
```

---

## 26. Prompt untuk AI Coding Agent

Gunakan prompt ini ke AI agent:

```txt
Kamu adalah senior mobile engineer. Buat monorepo bernama "tunify" di folder project yang sudah ada. Gunakan npm workspaces, bukan pnpm. Jangan buat dua Git repository terpisah. Buat satu monorepo dengan npm workspaces dan Turborepo.

Kita tidak memakai backend untuk sekarang.

Struktur utama:
- apps/mobile sebagai React Native CLI Android app.
- packages/shared sebagai shared TypeScript package.
- docs/DISCORD_SETUP.md untuk dokumentasi setup Discord.

Tujuan:
Membuat Android-first React Native music player lokal yang nanti bisa update Discord Rich Presence menggunakan Discord Social SDK. Untuk sementara, login Discord memakai OAuth2 Public Client + PKCE langsung dari mobile. Jangan membuat backend.

Presence requirement:
- Discord Presence harus menampilkan nama lagu yang sedang diputar.
- State menampilkan artist dan album jika tersedia.
- Jika track punya artworkRemoteUrl berupa HTTPS URL publik, pakai itu sebagai large image.
- Jika tidak ada artworkRemoteUrl, pakai DISCORD_RP_DEFAULT_LARGE_IMAGE_KEY yaitu app_logo.
- Jika track hanya punya embedded/local album art, tampilkan di UI app, tapi jangan kirim local file path ke Discord Presence.
- Jangan mengirim file:/// path sebagai large image Discord.

Security rules:
- DISCORD_CLIENT_ID boleh ada di mobile env.
- DISCORD_APPLICATION_ID boleh ada di mobile env.
- DISCORD_REDIRECT_URI boleh ada di mobile env.
- Jangan membuat atau memakai DISCORD_CLIENT_SECRET.
- Jangan pakai Discord user token.
- Jangan pakai self-bot.
- Jangan pakai private API Discord.
- Jangan commit .env asli.
- Commit hanya .env.example.

Buat:
1. Root monorepo config:
   - package.json dengan npm workspaces
   - turbo.json
   - tsconfig.base.json
   - .gitignore

2. apps/mobile:
   - React Native CLI TypeScript Android app
   - .env.example
   - basic HomeScreen
   - player feature skeleton
   - discord feature skeleton
   - library feature skeleton
   - artwork/metadata service skeleton
   - Android permissions
   - Discord deep link placeholder
   - Kotlin native module placeholder for DiscordPresence
   - Discord SDK binary placeholder folder

3. packages/shared:
   - shared Track type
   - shared TrackArtwork type
   - shared DiscordPresencePayload type
   - shared DiscordTokenResponse type

4. docs:
   - DISCORD_SETUP.md explaining:
     - create Discord Application
     - enable Public Client
     - add redirect URI
     - upload Rich Presence assets
     - env setup
     - no client secret
     - album art limitation and fallback rule

Acceptance criteria:
- npm install works
- npm run mobile:start works
- npm run mobile:android works
- No DISCORD_CLIENT_SECRET exists anywhere
- .env.example exists for mobile
- HomeScreen buttons exist:
  - Connect Discord
  - Test Play
  - Pause
  - Test Presence
  - Clear Presence
- Native module placeholder logs to Logcat
- Presence payload includes song title
- Presence largeImage uses artworkRemoteUrl if valid HTTPS
- Presence largeImage falls back to app_logo if no valid artworkRemoteUrl
```

---

## 27. Development Order

Eksekusi urut:

```txt
1. Monorepo skeleton npm
2. Mobile base app
3. Player MVP
4. Metadata + artwork model
5. Discord JS API mock
6. Android native module placeholder
7. Discord SDK real integration
8. Public Client + PKCE login
9. Playback event → presence integration
10. Local music scanner
11. Optional remote album art resolver
12. UI polish
```

---

## 28. Future Production Upgrade

Nanti saat sudah ada dana/deployment, tambahkan:

```txt
tunify/
├── apps/
│   ├── mobile/
│   └── backend/
├── packages/
│   └── shared/
```

Backend future akan dipakai untuk:

```txt
- OAuth2 token exchange
- refresh token handling
- menyimpan DISCORD_CLIENT_SECRET
- optional upload/hosting album art
- rate limiting
- logging aman
- production security
```

Jika ingin local embedded album art benar-benar muncul di Discord Presence, backend/CDN bisa dipakai untuk:

```txt
1. Extract embedded album art dari file lokal.
2. Upload ke storage/CDN.
3. Dapatkan public HTTPS URL.
4. Kirim URL tersebut sebagai large_image ke Discord Presence.
```

Saat backend ditambahkan, flow berubah dari:

```txt
Mobile → Discord directly
```

menjadi:

```txt
Mobile → Backend → Discord
```

Tapi untuk sekarang, gunakan mobile-only public client flow.
