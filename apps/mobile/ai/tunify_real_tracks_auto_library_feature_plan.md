# Tunify Implementation Plan — Real Tracks, Auto Library, Playlist & Favorites

Dokumen ini adalah plan implementasi fitur Tunify untuk Android React Native CLI.

Perubahan penting:

```txt
- Tidak memakai mock tracks.
- Tidak menjadikan scan manual sebagai flow utama.
- App langsung mendeteksi lagu asli dari device Android.
- Perilaku dibuat seperti media player bawaan HP.
- Saat app dibuka, app otomatis membaca lagu/audio dari Android MediaStore.
- Tetap ada Refresh Library di Settings/pull-to-refresh, tapi bukan flow utama.
- Tambahkan fitur create playlist.
- Tambahkan fitur add/remove favorite.
- Tetap tanpa backend.
- Tetap memakai npm workspaces.
- Tetap menyiapkan Discord Presence payload.
```

---

## 1. Target Utama

Tunify harus bisa:

```txt
1. Membaca lagu asli dari storage Android.
2. Menampilkan daftar track lokal secara otomatis.
3. Memutar lagu lokal.
4. Menampilkan metadata lagu.
5. Menampilkan album art lokal jika tersedia.
6. Menampilkan mini player.
7. Menampilkan halaman Now Playing.
8. Membuat playlist.
9. Menambahkan track ke playlist.
10. Menghapus track dari playlist.
11. Menambahkan track ke favorites.
12. Menghapus track dari favorites.
13. Menampilkan daftar favorites.
14. Support light mode dan dark mode.
15. Menyiapkan payload Discord Presence dari lagu yang sedang diputar.
16. Nanti menghubungkan Discord Social SDK.
```

---

## 2. Core App Behavior

Saat user membuka app:

```txt
1. App cek permission audio/storage.
2. Jika permission belum diberikan:
   tampilkan permission screen/card.
3. Jika permission sudah diberikan:
   app otomatis query lagu dari Android MediaStore.
4. Lagu yang ditemukan langsung muncul di Home/Library.
5. User bisa tap track untuk langsung play.
```

Tidak boleh:

```txt
- Memakai mockTracks.
- Generate dummy songs.
- Menjadikan tombol scan sebagai langkah wajib.
```

Boleh ada fitur:

```txt
Refresh Library
```

Letaknya di:

```txt
- Settings
- Pull-to-refresh di Library
```

Tujuannya hanya untuk sync ulang jika user baru menambahkan file musik.

---

## 3. Project Architecture

```txt
tunify/
├── apps/
│   └── mobile/
├── packages/
│   └── shared/
├── docs/
├── package.json
├── package-lock.json
├── turbo.json
├── tsconfig.base.json
└── .gitignore
```

Tech stack:

```txt
Package manager : npm
Workspace       : npm workspaces
Monorepo tool   : Turborepo
Mobile          : React Native CLI
Language        : TypeScript
Platform utama  : Android
Audio player    : React Native Track Player
State           : Zustand
Native module   : Kotlin
Music source    : Android MediaStore/ or anything
Theme           : Light/Dark/System
Font            : Plus Jakarta Sans
Discord         : Discord Social SDK (later)
```

---

## 4. Android Permissions

Tambahkan ke `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />

<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />

<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
```

Permission behavior:

```txt
Android 13+:
- Gunakan READ_MEDIA_AUDIO.

Android 12 ke bawah:
- Gunakan READ_EXTERNAL_STORAGE.

Android 13+ notification:
- Minta POST_NOTIFICATIONS jika app menampilkan media notification.
```

---

## 5. Folder Structure

```txt
apps/mobile/src/
├── app/
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── BottomTabs.tsx
│   │   └── routes.ts
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── tokens.ts
│   │   ├── ThemeProvider.tsx
│   │   └── useTheme.ts
│   └── providers/
│       └── AppProviders.tsx
│
├── components/
│   ├── base/
│   │   ├── AppText.tsx
│   │   ├── AppButton.tsx
│   │   ├── IconButton.tsx
│   │   ├── ScreenContainer.tsx
│   │   ├── EmptyState.tsx
│   │   ├── SectionHeader.tsx
│   │   ├── AppModal.tsx
│   │   └── BottomSheet.tsx
│   ├── music/
│   │   ├── AlbumArt.tsx
│   │   ├── TrackListItem.tsx
│   │   ├── MiniPlayer.tsx
│   │   ├── PlaybackControls.tsx
│   │   ├── ProgressSlider.tsx
│   │   ├── PlaylistCard.tsx
│   │   ├── QueueList.tsx
│   │   ├── FavoriteButton.tsx
│   │   └── MoreTrackMenu.tsx
│   ├── playlist/
│   │   ├── CreatePlaylistModal.tsx
│   │   ├── AddToPlaylistModal.tsx
│   │   └── PlaylistHeader.tsx
│   └── discord/
│       ├── DiscordConnectionCard.tsx
│       └── PresencePreviewCard.tsx
│
├── features/
│   ├── permissions/
│   │   ├── permissions.service.ts
│   │   ├── permissions.store.ts
│   │   └── permissions.types.ts
│   ├── mediaStore/
│   │   ├── mediaStore.service.ts
│   │   ├── mediaStore.types.ts
│   │   └── mediaStore.mapper.ts
│   ├── library/
│   │   ├── library.store.ts
│   │   ├── library.service.ts
│   │   ├── library.types.ts
│   │   └── library.selectors.ts
│   ├── player/
│   │   ├── player.store.ts
│   │   ├── player.service.ts
│   │   ├── player.events.ts
│   │   └── player.types.ts
│   ├── playlists/
│   │   ├── playlists.store.ts
│   │   ├── playlists.service.ts
│   │   ├── playlists.types.ts
│   │   └── playlists.utils.ts
│   ├── favorites/
│   │   ├── favorites.store.ts
│   │   ├── favorites.service.ts
│   │   └── favorites.types.ts
│   ├── discord/
│   │   ├── discordPresence.ts
│   │   ├── discord.store.ts
│   │   ├── discord.types.ts
│   │   └── presencePayload.ts
│   └── settings/
│       ├── settings.store.ts
│       └── settings.types.ts
│
├── screens/
│   ├── HomeScreen.tsx
│   ├── LibraryScreen.tsx
│   ├── NowPlayingScreen.tsx
│   ├── PlaylistsScreen.tsx
│   ├── PlaylistDetailScreen.tsx
│   ├── FavoritesScreen.tsx
│   ├── PermissionScreen.tsx
│   ├── DiscordScreen.tsx
│   └── SettingsScreen.tsx
│
├── services/
│   ├── storage/
│   │   ├── storage.ts
│   │   └── storageKeys.ts
│   ├── artwork/
│   │   ├── artwork.service.ts
│   │   └── artwork.utils.ts
│   └── metadata/
│       └── metadata.service.ts
│
└── types/
    └── index.ts
```

---

## 6. Native Android MediaStore Module

Buat native module Kotlin:

```txt
apps/mobile/android/app/src/main/java/com/tunify/mobile/media/
├── MediaStoreModule.kt
└── MediaStorePackage.kt
```

Expose ke JavaScript:

```txt
getAudioTracks()
getAlbumArtworkUri(albumId)
```

Optional future:

```txt
watchAudioLibraryChanges()
stopWatchingAudioLibraryChanges()
```

---

## 7. MediaStore Query Requirement

`getAudioTracks()` harus membaca audio dari Android MediaStore.

Data yang perlu diambil:

```txt
id
title
artist
album
albumId
duration
contentUri
mimeType
size
dateAdded
dateModified
trackNumber
```

Preferred playback URL:

```txt
content://media/external/audio/media/{id}
```

Filter:

```txt
IS_MUSIC = 1
duration > 0
mimeType audio/*
```

Default sort:

```txt
title ASC
```

Recently Added sort:

```txt
dateAdded DESC
```

---

## 8. Track Model

```ts
export type Track = {
  id: string;
  title: string;
  artist?: string;
  album?: string;

  url: string;
  duration?: number;

  albumId?: string;
  localArtworkUri?: string;
  artworkRemoteUrl?: string;

  mimeType?: string;
  fileName?: string;
  folderPath?: string;
  fileSize?: number;

  dateAdded?: number;
  dateModified?: number;
};
```

Fallback rule:

```txt
title kosong       → filename tanpa extension
artist kosong      → Unknown Artist
album kosong       → Unknown Album
duration kosong    → --:--
artwork kosong     → gradient placeholder
```

---

## 9. Artwork Rules

UI app:

```txt
localArtworkUri
→ artworkRemoteUrl
→ placeholder gradient
```

Discord Presence:

```txt
artworkRemoteUrl
→ DISCORD_RP_DEFAULT_LARGE_IMAGE_KEY
```

Jangan kirim ke Discord:

```txt
file:///...
content://...
base64...
localArtworkUri...
```

Karena Discord membutuhkan asset key atau public HTTPS URL.

---

## 10. Library Store

```ts
type LibraryState = {
  tracks: Track[];
  isLoading: boolean;
  isReady: boolean;
  error?: string;

  loadDeviceTracks: () => Promise<void>;
  refreshDeviceTracks: () => Promise<void>;

  getTrackById: (trackId: string) => Track | undefined;
  searchTracks: (query: string) => Track[];
};
```

Behavior:

```txt
loadDeviceTracks:
- Dipanggil otomatis saat app start jika permission granted.
- Query MediaStore.
- Normalize metadata.
- Simpan tracks ke store.
- Persist cache ke MMKV optional(jika tidak menggunakan mmkv cari opsi lain yg kamu tau).

refreshDeviceTracks:
- Dipanggil dari pull-to-refresh atau Settings.
- Query ulang MediaStore.
```

Important:

```txt
Tidak boleh memakai mockTracks.
Jika permission belum ada, jangan generate dummy data.
Tampilkan permission/empty state.
```

---

## 11. Permission Flow

Pada app start:

```txt
1. Cek permission audio.
2. Jika belum granted:
   tampilkan PermissionScreen atau PermissionRequiredCard di Home.
3. User tap Allow Access.
4. Request permission.
5. Jika granted:
   panggil library.loadDeviceTracks().
6. Jika denied:
   tampilkan penjelasan dan tombol Open Settings.
```

Copy:

```txt
Allow music access
Tunify needs access to your audio files to show your local music library.
```

Button:

```txt
Allow Access
```

Denied copy:

```txt
Music access denied
Enable audio permission from Android Settings to use Tunify.
```

Button:

```txt
Open Settings
```

---

## 12. Home Screen

Home Screen adalah halaman utama daftar track dan ringkasan library.

Layout:

```txt
Top Header
- Left: menu/settings icon
- Center: Tunify
- Right: search icon

Title
- Your Music / Library

Primary Actions
- Play All
- Shuffle

Library Summary
- Total Tracks
- Total Albums
- Total Artists
- Total Playlists

Sections
- Recently Added
- Favorites
- Local Playlists
- All Tracks

Mini Player
Bottom Navigation
```

Behavior:

```txt
Jika permission belum granted:
- Tampilkan PermissionRequiredCard.

Jika loading:
- Tampilkan loading skeleton.

Jika tracks kosong:
- Tampilkan empty state.

Jika tracks ada:
- Tampilkan list track asli dari device.
```

Features:

```txt
1. Auto-load real tracks.
2. Search track.
3. Play selected track.
4. Play All.
5. Shuffle.
6. Show Favorites shortcut.
7. Show Playlist cards.
8. Show MiniPlayer if currentTrack exists.
9. Navigate to Now Playing when mini player tapped.
```

---

## 13. Library Screen

Tabs:

```txt
Tracks
Albums
Artists
Folders
Favorites
```

MVP minimal:

```txt
Tracks
Favorites
```

Tracks Tab:

```txt
- Semua track asli dari device.
- Search.
- Sort by title.
- Sort by artist.
- Sort by recently added.
- Tap track to play.
- More menu.
```

Favorites Tab:

```txt
- Semua track yang difavoritkan.
- Play all favorites.
- Shuffle favorites.
- Remove favorite.
```

---

## 14. Now Playing Screen

Layout:

```txt
Top Bar
- Chevron down
- NOW PLAYING
- More menu

Context title
- Local Library / Playlist name

Album Art
- Large square album art
- Jika localArtworkUri ada, tampilkan gambar tersebut.
- Jika tidak ada, tampilkan placeholder.

Song Info
- Title besar
- Artist
- Album optional
- Favorite button

Progress
- Current time
- Slider
- Remaining time

Controls
- Shuffle
- Previous
- Play/Pause large gradient circle
- Next
- Repeat

Bottom Actions
- Up Next
- Lyrics placeholder
```

Features:

```txt
1. Current track display.
2. Local album art display.
3. Favorite toggle.
4. Progress update.
5. Seek.
6. Play/pause.
7. Next/previous.
8. Shuffle toggle.
9. Repeat mode: off/one/all.
10. Up Next bottom sheet.
11. Lyrics placeholder.
12. Dark mode immersive style.
```

---

## 15. Mini Player

Layout:

```txt
Album art thumbnail
Song title
Artist
Mini progress bar
Favorite button
Play/pause button
```

Behavior:

```txt
1. Muncul jika currentTrack ada.
2. Tap membuka Now Playing.
3. Play/pause langsung dari mini player.
4. Favorite toggle.
5. Progress mini update realtime.
```

---

## 16. Player Service

Gunakan React Native Track Player.

```ts
export const PlayerService = {
  setup: async () => {},
  loadQueue: async (tracks: Track[], startIndex?: number) => {},
  playTrack: async (track: Track, queue?: Track[]) => {},
  play: async () => {},
  pause: async () => {},
  stop: async () => {},
  next: async () => {},
  previous: async () => {},
  seekTo: async (seconds: number) => {},
  toggleShuffle: async () => {},
  setRepeatMode: async (mode: RepeatMode) => {},
};
```

Track mapping:

```ts
{
  id: track.id,
  url: track.url,
  title: track.title,
  artist: track.artist || "Unknown Artist",
  album: track.album || "Unknown Album",
  duration: track.duration,
  artwork: track.localArtworkUri || track.artworkRemoteUrl
}
```

---

## 17. Playlist Feature

Screens:

```txt
PlaylistsScreen
PlaylistDetailScreen
CreatePlaylistModal
AddToPlaylistModal
```

Playlist model:

```ts
export type Playlist = {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  coverTrackId?: string;
  createdAt: number;
  updatedAt: number;
};
```

PlaylistsScreen features:

```txt
1. Tampilkan semua playlist.
2. Create playlist.
3. Rename playlist.
4. Delete playlist.
5. Tap playlist untuk buka detail.
6. Tampilkan jumlah track.
7. Tampilkan cover playlist dari coverTrackId.
```

Create Playlist validation:

```txt
Name wajib.
Name minimal 1 karakter.
Name maksimal 40 karakter.
Tidak boleh duplicate name persis.
```

Playlist Detail features:

```txt
1. Tampilkan track dalam playlist.
2. Play playlist.
3. Shuffle playlist.
4. Remove track dari playlist.
5. Add tracks.
6. Rename playlist.
7. Delete playlist.
```

Add to Playlist flow:

```txt
1. User tap More.
2. Pilih Add to Playlist.
3. Modal daftar playlist muncul.
4. User pilih playlist.
5. Track ditambahkan.
6. Tampilkan toast: Added to playlist.
```

Playlist store API:

```ts
type PlaylistsState = {
  playlists: Playlist[];

  createPlaylist: (name: string, description?: string) => void;
  renamePlaylist: (playlistId: string, name: string) => void;
  deletePlaylist: (playlistId: string) => void;

  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;

  getPlaylistById: (playlistId: string) => Playlist | undefined;
};
```

Persist playlists to MMKV(cari opsi lain jika sudah tidak menggunakan MMKV).

---

## 18. Favorites Feature

Favorite model:

```ts
export type FavoriteTrack = {
  trackId: string;
  addedAt: number;
};
```

Favorite button placement:

```txt
1. TrackListItem / More menu.
2. NowPlayingScreen.
3. MiniPlayer.
4. PlaylistDetail track item.
```

Favorites store API:

```ts
type FavoritesState = {
  favorites: FavoriteTrack[];

  addFavorite: (trackId: string) => void;
  removeFavorite: (trackId: string) => void;
  toggleFavorite: (trackId: string) => void;
  isFavorite: (trackId: string) => boolean;
  getFavoriteTrackIds: () => string[];
};
```

Persist favorites to MMKV(cari opsi lain jika sudah tidak menggunakan MMKV).

Favorites Screen / Tab features:

```txt
1. Tampilkan semua favorite tracks.
2. Play all favorites.
3. Shuffle favorites.
4. Remove from favorites.
5. Empty state jika belum ada favorite.
```

Empty copy:

```txt
No favorites yet
Tap the heart on songs you love.
```

---

## 19. Track More Menu

More menu untuk setiap track:

```txt
Play Now
Play Next
Add to Queue
Add to Playlist
Add to Favorites / Remove from Favorites
View Details
```

MVP wajib:

```txt
Play Now
Add to Playlist
Add to Favorites / Remove from Favorites
View Details
```

---

## 20. Queue / Up Next

Queue bottom sheet:

```txt
Now Playing
- current track

Up Next
- queue list
```

Features:

```txt
1. Tampilkan queue.
2. Tap track untuk play.
3. Remove from queue.
4. Clear queue.
```

Future:

```txt
Reorder queue.
Save queue as playlist.
```

---

## 21. Settings Screen

Sections:

```txt
Appearance
- Theme: System / Light / Dark

Library
- Refresh Library
- Clear library cache

Playback
- Resume last track
- Clear queue

Discord
- Presence enabled
- Clear presence on pause
- Open Discord screen

About
- App version
```

Important:

```txt
Refresh Library bukan flow utama.
Library tetap auto-load saat app dibuka.
```

---

## 22. Discord Presence Skeleton

Tahap awal hanya payload builder dan preview.

Presence Mapping:

```txt
details     = song title
state       = artist • album
largeImage  = artworkRemoteUrl jika valid HTTPS, fallback app_logo
largeText   = album name atau song title
smallImage  = play_icon / pause_icon
smallText   = Playing / Paused
timestamp   = playback start time
```

Payload Builder:

```ts
export function buildPresencePayload(
  track: Track,
  playerState: PlayerState,
): DiscordPresencePayload {
  return {
    title: track.title || 'Unknown Title',
    artist: track.artist || 'Unknown Artist',
    album: track.album,
    duration: track.duration,
    position: playerState.position,
    isPlaying: playerState.isPlaying,
    largeImage: resolvePresenceLargeImage(track),
    largeText: track.album || track.title || 'Tunify',
    smallImage: playerState.isPlaying
      ? Config.DISCORD_RP_SMALL_PLAY_IMAGE_KEY
      : Config.DISCORD_RP_SMALL_PAUSE_IMAGE_KEY,
    smallText: playerState.isPlaying ? 'Playing' : 'Paused',
  };
}
```

Discord Screen features:

```txt
1. Connect Discord.
2. Disconnect Discord.
3. Test Presence.
4. Clear Presence.
5. Preview current presence.
6. Toggle Discord Presence enabled.
7. Toggle clear presence on pause.
```

---

## 23. Theme & Design

Harus mengikuti `design.md`.

Required:

```txt
1. Font Plus Jakarta Sans.
2. Light mode.
3. Dark mode.
4. Purple/pink gradient accent.
5. Rounded cards.
6. Floating mini player.
7. Now Playing dark immersive mode.
8. Album art large focus.
```

Theme options:

```ts
export type ThemeMode = 'system' | 'light' | 'dark';
```

---

## 24. Implementation Milestones

### Milestone 1 — Base App & Theme

Tasks:

```txt
1. Setup navigation.
2. Setup theme provider.
3. Setup light/dark colors.
4. Load Plus Jakarta Sans.
5. Create base components.
6. Create screen container.
```

Acceptance criteria:

```txt
App run di Android.
Theme light/dark bisa diganti.
Font Jakarta Sans tampil.
```

---

### Milestone 2 — Permissions & MediaStore Native Module

Tasks:

```txt
1. Buat permissions.service.
2. Request READ_MEDIA_AUDIO / READ_EXTERNAL_STORAGE.
3. Buat MediaStoreModule.kt.
4. Expose getAudioTracks().
5. Map MediaStore result ke Track model.
6. Handle permission denied.
```

Acceptance criteria:

```txt
App bisa meminta permission audio.
Jika permission granted, app bisa membaca track asli dari device.
Tidak ada mock track.
```

---

### Milestone 3 — Auto Library Loading

Tasks:

```txt
1. Buat library.store.
2. App start otomatis cek permission.
3. Jika granted, panggil loadDeviceTracks().
4. Render loading state.
5. Render empty state jika tidak ada audio.
6. Render real track list jika ada audio.
```

Acceptance criteria:

```txt
Saat app dibuka, lagu dari HP otomatis tampil.
User tidak perlu menekan tombol scan.
```

---

### Milestone 4 — Static UI Screens

Tasks:

```txt
1. HomeScreen.
2. LibraryScreen.
3. NowPlayingScreen.
4. PlaylistsScreen.
5. SettingsScreen.
6. MiniPlayer.
```

Acceptance criteria:

```txt
UI mengikuti design.md.
Home menampilkan track list asli.
Now Playing screen tersedia.
Dark mode tersedia.
```

---

### Milestone 5 — Player MVP

Tasks:

```txt
1. Setup React Native Track Player.
2. Play selected real track.
3. Pause/resume.
4. Next/previous.
5. Progress update.
6. Seek slider.
7. MiniPlayer update.
8. NowPlaying update.
```

Acceptance criteria:

```txt
Tap track asli dari HP → lagu diputar.
Mini player muncul.
Now Playing menampilkan current track.
Play/pause/next/previous/seek berfungsi.
```

---

### Milestone 6 — Album Art & Metadata

Tasks:

```txt
1. Ambil albumId dari MediaStore.
2. Buat localArtworkUri.
3. Tampilkan album art di TrackListItem.
4. Tampilkan album art besar di NowPlaying.
5. Fallback placeholder jika tidak ada artwork.
6. Tambah artworkRemoteUrl support untuk Discord future.
```

Acceptance criteria:

```txt
Album art lokal/http tampil jika tersedia.
Placeholder tampil jika tidak tersedia.
Tidak ada crash jika artwork tidak valid.
```

---

### Milestone 7 — Favorites

Tasks:

```txt
1. Buat favorites.store.
2. Buat FavoriteButton.
3. Integrasi di TrackListItem.
4. Integrasi di NowPlayingScreen.
5. Integrasi di MiniPlayer.
6. Buat FavoritesScreen atau Library Favorites tab.
7. Persist favorites ke MMKV.
```

Acceptance criteria:

```txt
User bisa add favorite.
User bisa remove favorite.
Heart icon berubah state.
Favorites list menampilkan lagu favorite.
Favorite tetap ada setelah app restart.
```

---

### Milestone 8 — Playlists

Tasks:

```txt
1. Buat playlists.store.
2. Buat PlaylistsScreen.
3. Buat CreatePlaylistModal.
4. Buat PlaylistDetailScreen.
5. Buat AddToPlaylistModal.
6. Integrasi Add to Playlist dari track more menu.
7. Persist playlists ke MMKV.
```

Acceptance criteria:

```txt
User bisa membuat playlist.
User bisa menghapus playlist.
User bisa menambahkan track ke playlist.
User bisa menghapus track dari playlist.
Playlist detail menampilkan track.
Playlist tetap ada setelah app restart.
```

---

### Milestone 9 — Queue / Up Next

Tasks:

```txt
1. Buat queue state.
2. Buat Queue bottom sheet.
3. Tampilkan current queue.
4. Add to queue.
5. Play track dari queue.
6. Remove from queue.
```

Acceptance criteria:

```txt
Up Next menampilkan queue.
User bisa play track dari queue.
User bisa remove queue item.
```

---

### Milestone 10 — Library Refresh & Auto Sync

Tasks:

```txt
1. Tambahkan Refresh Library di Settings.
2. Tambahkan pull-to-refresh di Library.
3. Optional: ContentObserver native untuk detect perubahan MediaStore.
4. Reconcile track IDs yang hilang/baru.
5. Bersihkan playlist/favorite references yang track-nya sudah tidak ada.
```

Acceptance criteria:

```txt
Jika user menambahkan MP3 baru, Refresh Library bisa memunculkan track baru.
Favorites/playlist tidak crash jika file asli dihapus.
```

---

### Milestone 11 — Discord Presence Skeleton

Tasks:

```txt
1. Buat discord.store.
2. Buat presencePayload.ts.
3. Buat DiscordScreen.
4. Buat PresencePreviewCard.
5. Test Presence mock.
6. Clear Presence mock.
```

Acceptance criteria:

```txt
Presence preview menampilkan lagu aktif.
Payload berisi title, artist, album, largeImage.
Large image fallback rule berjalan.
```

---

### Milestone 12 — Discord Native Placeholder

Tasks:

```txt
1. Buat DiscordPresenceModule.kt.
2. Expose init().
3. Expose login().
4. Expose updatePresence().
5. Expose clearPresence().
6. Log native method ke Logcat.
```

Acceptance criteria:

```txt
JS bisa memanggil native module.
Log muncul di Logcat.
Tidak crash.
```

---

### Milestone 13 — Discord Real Integration

Tasks:

```txt
1. Setup Discord Social SDK.
2. Enable Public Client di Discord Portal.
3. Setup deep link.
4. Implement OAuth2 + PKCE.
5. Connect Discord.
6. Update presence saat play.
7. Clear presence saat pause/stop.
```

Acceptance criteria:

```txt
User bisa connect Discord.
Saat lagu play, Discord profile menampilkan Tunify.
Nama lagu tampil.
Artist/album tampil.
Large image memakai artworkRemoteUrl atau app_logo.
Presence clear saat pause/stop.
```

---

## 25. Priority Order

Urutan kerja paling aman:

```txt
1. Theme + navigation.
2. Permission flow.
3. MediaStore real track reader.
4. Auto library loading.
5. Home + Library track list.
6. Player MVP.
7. Now Playing screen.
8. Mini player.
9. Album art.
10. Favorites.
11. Playlists.
12. Queue.
13. Library refresh/auto sync.
14. Discord Presence payload.
15. Discord native placeholder.
16. Discord real integration.
```

---

## 26. Agent AI Prompt

Gunakan prompt ini untuk coding agent:

```txt
Kamu adalah senior React Native Android engineer. Implementasikan Tunify berdasarkan plan ini.

Project:
- React Native CLI Android app
- npm workspaces monorepo
- Offline/local music player
- Tanpa backend
- Tidak boleh memakai mock track
- Tidak boleh menjadikan manual scan sebagai flow utama
- Library harus langsung membaca lagu asli dari Android MediaStore seperti media player bawaan HP
- Design mengikuti design.md
- Font wajib Plus Jakarta Sans
- Support light mode dan dark mode

Core requirement:
Saat app dibuka:
1. Cek permission audio.
2. Jika belum granted, tampilkan permission screen.
3. Jika granted, otomatis query Android MediaStore.
4. Render daftar track asli dari device.
5. User bisa tap track untuk play.

Fitur wajib:
- HomeScreen sebagai halaman list track dan library overview.
- LibraryScreen dengan tracks dan favorites.
- NowPlayingScreen sebagai halaman media player.
- MiniPlayer.
- React Native Track Player integration.
- Android MediaStore native module.
- Favorites feature.
- Playlist feature.
- Queue / Up Next.
- Settings dengan theme switcher dan refresh library.
- Discord Presence payload builder.
- Discord native module placeholder.

Tidak boleh:
- Jangan pakai mockTracks.
- Jangan generate dummy songs.
- Jangan mengirim local artwork path ke Discord Presence.
- Jangan membuat backend.
- Jangan memakai DISCORD_CLIENT_SECRET.

MediaStore:
- Buat Kotlin native module MediaStoreModule.
- Expose getAudioTracks().
- Ambil id, title, artist, album, albumId, duration, contentUri, mimeType, size, dateAdded.
- Filter hanya audio musik.
- Map ke Track model.
- Gunakan content URI untuk playback jika memungkinkan.

Favorites:
- User bisa favorite/unfavorite track.
- Favorite tersedia di TrackListItem, MiniPlayer, dan NowPlayingScreen.
- Favorites persist ke MMKV.

Playlists:
- User bisa create playlist.
- User bisa delete playlist.
- User bisa add track to playlist.
- User bisa remove track from playlist.
- Playlist persist ke MMKV.

Discord Presence:
- Buat payload dari current track.
- details = song title.
- state = artist • album.
- largeImage = artworkRemoteUrl jika valid HTTPS, fallback app_logo.
- Jangan kirim localArtworkUri/contentUri/file path sebagai Discord image.
- Clear presence saat pause/stop untuk MVP.

Acceptance criteria:
- App bisa build dan run di Android.
- App meminta permission audio.
- Setelah permission granted, lagu asli dari HP otomatis muncul.
- Tidak ada mock track.
- User bisa play track asli.
- MiniPlayer muncul saat track aktif.
- NowPlayingScreen menampilkan track aktif.
- Play/pause/next/previous/seek berfungsi.
- Album art lokal tampil jika tersedia.
- User bisa favorite/unfavorite track.
- Favorites list berjalan dan persist.
- User bisa create playlist.
- User bisa add/remove track dari playlist.
- Playlist persist setelah restart.
- Theme light/dark berjalan.
- Presence payload bisa dibuat dari lagu aktif.
```

---

## 27. MVP Definition of Done

MVP selesai jika:

```txt
1. App bisa run di HP Android.
2. App meminta permission audio.
3. Setelah permission diberikan, lagu asli dari device otomatis muncul.
4. Tidak ada mock track.
5. HomeScreen menampilkan daftar track asli.
6. User bisa memutar track asli.
7. MiniPlayer bekerja.
8. NowPlayingScreen bekerja.
9. Progress slider berjalan.
10. Next/previous bekerja.
11. Album art lokal tampil jika tersedia.
12. Placeholder tampil jika tidak ada album art.
13. Favorite bekerja dan persist.
14. Playlist bisa dibuat.
15. Lagu bisa ditambahkan ke playlist.
16. Lagu bisa dihapus dari playlist.
17. Playlist persist.
18. Dark mode bekerja.
19. Discord Presence payload menampilkan nama lagu.
20. Presence image fallback rule berjalan.
```
