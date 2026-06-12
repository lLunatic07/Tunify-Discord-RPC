# Tunify Design System & UI Direction

Dokumen ini berisi arahan desain untuk aplikasi **Tunify**, yaitu aplikasi music media player offline/local file yang memiliki integrasi Discord Presence.

Referensi style utama:
- Clean futuristic music player
- Soft rounded UI
- Purple/pink gradient accent
- Light mode dengan background soft gray/lavender
- Dark mode dengan background deep purple/black
- Large album art focus
- Floating mini player
- Bottom navigation
- Typography modern menggunakan Jakarta Sans / Plus Jakarta Sans

> Catatan: referensi gambar berasal dari aplikasi music online, jadi layout Tunify disesuaikan agar cocok untuk **offline/local music player**.

---

## 1. Design Goals

Tunify harus terasa seperti:

```txt
Modern
Clean
Smooth
Premium
Local-first
Music-focused
Discord-ready
```

Karakter desain:

```txt
- Rounded, soft, friendly
- Futuristic tapi tidak terlalu gaming
- Banyak whitespace
- Fokus pada album art
- Accent warna ungu dan pink
- Animasi halus
- Support light mode dan dark mode
```

---

## 2. App Identity

### App Name

```txt
Tunify
```

### Visual Personality

```txt
Soft digital music player
Local music library
Modern personal audio space
Offline-first but connected to Discord Presence
```

### Style Keywords

```txt
soft gradient
rounded card
floating player
minimal icon
large album art
lavender glow
dark purple ambience
clean typography
```

---

## 3. Font

Gunakan:

```txt
Plus Jakarta Sans
```

Alias yang boleh dipakai di desain:

```txt
Jakarta Sans
```

### Font Usage

```txt
Heading       : Plus Jakarta Sans Bold / ExtraBold
Title         : Plus Jakarta Sans Bold
Body          : Plus Jakarta Sans Regular / Medium
Caption       : Plus Jakarta Sans Medium
Button        : Plus Jakarta Sans SemiBold
```

### Suggested Font Weights

```txt
Regular  : 400
Medium   : 500
SemiBold : 600
Bold     : 700
ExtraBold: 800
```

### React Native Font Naming

Simpan font di:

```txt
apps/mobile/src/assets/fonts/
```

Contoh file:

```txt
PlusJakartaSans-Regular.ttf
PlusJakartaSans-Medium.ttf
PlusJakartaSans-SemiBold.ttf
PlusJakartaSans-Bold.ttf
PlusJakartaSans-ExtraBold.ttf
```

Gunakan font family:

```ts
fontFamily: "PlusJakartaSans-Regular"
fontFamily: "PlusJakartaSans-Medium"
fontFamily: "PlusJakartaSans-SemiBold"
fontFamily: "PlusJakartaSans-Bold"
fontFamily: "PlusJakartaSans-ExtraBold"
```

---

## 4. Color System

### Brand Colors

```txt
Primary Purple : #6C5CE7
Accent Pink    : #E84393
Soft Lavender  : #EDEBFF
Deep Purple    : #24102F
Dark Surface   : #14111C
```

### Light Theme

```txt
Background         : #F7F7FC
Surface            : #FFFFFF
Surface Soft       : #EFEFF7
Surface Lavender   : #EDEBFF

Text Primary       : #11121A
Text Secondary     : #6E6A7C
Text Muted         : #A5A1B3

Primary            : #6C5CE7
Primary Dark       : #5848D9
Accent             : #E84393
Accent Soft        : #F7D8EA

Divider            : #E4E2EC
Icon               : #343241

Success            : #2ECC71
Warning            : #F6C343
Danger             : #FF5C7A
```

### Dark Theme

```txt
Background         : #100B16
Background Alt     : #180D23
Surface            : #1D1628
Surface Soft       : #251B33
Surface Elevated   : #2B1D3A

Text Primary       : #F7F3FF
Text Secondary     : #C8BFD6
Text Muted         : #8E839E

Primary            : #8B6CFF
Primary Dark       : #6C5CE7
Accent             : #F04CA8
Accent Soft        : #3A1A34

Divider            : #352840
Icon               : #E7DFF2

Success            : #3DDC84
Warning            : #FFD166
Danger             : #FF6B8A
```

### Gradient Tokens

Primary gradient:

```txt
#6C5CE7 → #E84393
```

Dark mode play button gradient:

```txt
#C026D3 → #EC4899
```

Light mode play button gradient:

```txt
#6C5CE7 → #E84393
```

Soft card gradient:

```txt
#ECE8FF → #F9E6F2
```

Dark background gradient:

```txt
#2A0F3F → #100B16
```

---

## 5. Theme Direction

### Light Mode

Light mode harus terlihat seperti:

```txt
- Bright
- Clean
- Soft gray/lavender background
- Purple as main action color
- Pink as emotional/music accent
- Subtle shadow
- Rounded surfaces
```

Contoh rasa visual:

```txt
Background soft gray
Top header minimal
Library title besar
Pill buttons Play All dan Shuffle
Horizontal cards
Top tracks list
Floating mini player
Bottom navigation rounded/elevated
```

### Dark Mode

Dark mode harus terlihat seperti:

```txt
- Deep purple/black background
- Album art besar
- Purple/pink glow
- Text putih/lavender
- Premium night music vibe
- Soft radial line pattern behind album art
```

Gunakan dark mode terutama di Now Playing screen agar terasa immersive.

---

## 6. Spacing System

Gunakan spacing berbasis 4px:

```txt
xs   : 4
sm   : 8
md   : 12
base : 16
lg   : 20
xl   : 24
2xl  : 32
3xl  : 40
4xl  : 48
```

Screen padding:

```txt
Horizontal padding : 24
Section spacing    : 32
Card gap           : 16
List item gap      : 14
```

---

## 7. Radius System

```txt
Button pill        : 999
Card small         : 14
Card medium        : 20
Card large         : 28
Album art          : 16 - 24
Mini player        : 18 - 24
Bottom nav         : 28
Modal / sheet      : 28
```

---

## 8. Shadow & Glow

### Light Mode Shadow

Gunakan shadow lembut:

```txt
Color   : #6C5CE7
Opacity : 0.18
Radius  : 18
Offset  : 0, 8
```

Untuk card umum:

```txt
Color   : #000000
Opacity : 0.08
Radius  : 12
Offset  : 0, 6
```

### Dark Mode Glow

Untuk play button / active element:

```txt
Color   : #E84393
Opacity : 0.35
Radius  : 28
Offset  : 0, 12
```

Untuk album art:

```txt
Color   : #8B6CFF
Opacity : 0.18
Radius  : 32
Offset  : 0, 18
```

---

## 9. Icon Style

Gunakan icon style:

```txt
Outline
Rounded
2px stroke
Minimal
Consistent size
```

Recommended icon sizes:

```txt
Header icon       : 28
Bottom nav icon   : 26
Track menu icon   : 24
Player control    : 30
Main play icon    : 44
Mini player icon  : 28
```

Icon yang dibutuhkan:

```txt
menu
search
home
library
music
folder
user/profile
heart
play
pause
next
previous
shuffle
repeat
more-vertical
chevron-down
discord
folder-plus
scan
settings
moon
sun
```

---

## 10. Navigation Structure

Karena Tunify adalah offline/local music player, navigasi utama sebaiknya:

```txt
Home
Library
Player
Discord
Settings
```

Bottom navigation:

```txt
Home      : ringkasan library lokal
Library   : semua lagu/folder/album/artist
Player    : now playing
Discord   : connection & presence status
Settings  : theme, scan folder, app settings
```

Alternatif 4-tab jika ingin lebih simple:

```txt
Home
Library
Player
Settings
```

Discord status bisa masuk Settings atau floating status indicator.

---

## 11. Main Screens

## 11.1 Home / Library Overview Screen

Screen ini mengambil inspirasi dari gambar pertama, tapi disesuaikan untuk local/offline music.

### Purpose

```txt
Menampilkan ringkasan koleksi musik lokal user.
```

### Layout

```txt
Top App Bar
- Left: menu / folder icon
- Center: Tunify logo text
- Right: search icon

Main Title
- "Library" atau "Your Music"

Primary Actions
- Play All
- Shuffle

Local Library Summary
- Tracks count
- Albums count
- Artists count
- Folders count

Sections
- Recently Added
- Recently Played
- Local Playlists
- Folders
- Top Tracks

Mini Player
Bottom Navigation
```

### Adjusted from online concept

Di referensi ada:

```txt
Your Playlists
Top Tracks
```

Untuk Tunify, ubah menjadi:

```txt
Local Playlists
Imported Folders
Recently Added
Top Tracks
```

Karena ini bukan streaming app, jangan pakai konsep:

```txt
Charts
Fans' Choice
Online Mix
Recommended For You
```

Kecuali nanti ada fitur online metadata.

### Example Content

```txt
Header:
Tunify

Title:
Your Music

Buttons:
Play All
Shuffle

Stats:
1,248 Tracks
82 Albums
341 Artists
4 Folders

Sections:
Recently Added
Local Playlists
Top Tracks
Imported Folders
```

### Visual Notes

```txt
- Background light gray/lavender
- Title besar dan bold
- Play All button purple pill
- Shuffle button soft gray pill
- Playlist/folder cards horizontal scroll
- Track list vertical
- Mini player floating above bottom nav
```

---

## 11.2 Library Detail Screen

### Purpose

Menampilkan koleksi musik lokal berdasarkan kategori.

### Tabs

```txt
Tracks
Albums
Artists
Folders
Playlists
```

### Layout

```txt
Top App Bar
Search bar
Tab selector
Content list/grid
Mini player
Bottom nav
```

### Track List Item

```txt
Album art thumbnail
Song title
Artist name
Duration
More menu
```

Jika tidak ada album art:

```txt
Gunakan gradient placeholder card dengan music note icon.
```

---

## 11.3 Folder Scan / Import Screen

Karena Tunify offline-first, screen ini penting.

### Purpose

User memilih folder musik lokal dan melakukan scan.

### Layout

```txt
Header:
Import Music

Hero card:
"Scan your local music folders"

Actions:
- Choose Folder
- Scan Device
- Rescan Library

Info card:
Supported formats:
MP3, FLAC, WAV, M4A, OGG

Permission status:
Storage permission granted / required
```

### Empty State

Jika belum ada lagu:

```txt
No music found yet
Choose a folder to start building your local library.
[Choose Folder]
```

Visual:

```txt
Soft lavender card
Folder icon besar
Primary gradient button
```

---

## 11.4 Now Playing Screen — Light Mode

Mengambil inspirasi dari gambar kedua.

### Purpose

Fokus pada lagu yang sedang diputar.

### Layout

```txt
Top bar:
- Chevron down
- "NOW PLAYING"
- More menu

Context title:
"Local Library" / playlist name / folder name

Album art:
Large square card
If no artwork:
  lavender placeholder with image/music icon

Song info:
- Song title large bold
- Artist name
- Heart/favorite button

Progress:
- Current time
- Slider
- Remaining time

Controls:
- Shuffle
- Previous
- Play/Pause large gradient circle
- Next
- Repeat

Bottom actions:
- Up Next
- Lyrics
```

### Offline adjustment

Lyrics button:

```txt
Jika lyrics file tersedia:
  tampilkan lyrics

Jika tidak:
  tampilkan "No local lyrics found"
```

Up Next:

```txt
Menampilkan queue lokal.
```

### Light Mode Visual

```txt
Background : #F7F7FC
Album placeholder : #E5DFFF
Icon : #6C5CE7
Text : #11121A
Progress active : #6C5CE7
Progress inactive : #E4E2EC
```

---

## 11.5 Now Playing Screen — Dark Mode

Mengambil inspirasi dari gambar ketiga.

### Purpose

Mode immersive untuk playback malam hari.

### Layout sama dengan light mode, tapi style:

```txt
Background deep purple
Radial rings pattern behind album art
Album art besar
Title besar putih
Artist lavender
Pink heart icon
Progress bar pink/purple
Main play button pink-purple gradient
Controls lavender
```

### Background Pattern

Gunakan decorative radial pattern:

```txt
- 4 sampai 6 lingkaran transparan
- Stroke opacity rendah
- Center di area atas screen
- Jangan mengganggu album art
```

Implementation idea:

```txt
Absolute positioned View/SVG
borderRadius besar
borderWidth 1
borderColor rgba(255,255,255,0.04)
```

### Dark Mode Visual Tokens

```txt
Background top     : #2A0F3F
Background bottom  : #100B16
Title              : #F7F3FF
Subtitle           : #C8BFD6
Progress active    : #E843F3 / #E84393
Progress inactive  : #3A3145
Play gradient      : #C026D3 → #EC4899
```

---

## 11.6 Mini Player

### Purpose

Floating player saat user browsing library.

### Layout

```txt
Left:
- album art thumbnail

Center:
- song title
- artist
- progress mini bar

Right:
- favorite icon
- play/pause button
```

### Style

```txt
Position: floating above bottom nav
Height: 76 - 88
Border radius: 20
Background light: #FFFFFF / #EFEFF7
Background dark: #1D1628
Shadow/glow
```

### Behavior

```txt
Tap mini player → open Now Playing screen
Swipe down/up optional
Pause/play button works inline
Progress updates live
```

---

## 11.7 Discord Presence Screen

### Purpose

Menampilkan status koneksi Discord dan preview Presence.

### Layout

```txt
Header:
Discord Presence

Connection Card:
- Discord icon
- Connected as username
- Connect / Disconnect button

Presence Preview:
- App icon / album art remote preview
- Song title
- Artist • Album
- Status:
  Playing / Paused / Not active

Image Source:
- Remote album art
- App logo fallback
- Local artwork only visible in app

Settings:
- Enable Discord Presence toggle
- Clear presence on pause toggle
- Show album art if remote URL available toggle
```

### Copywriting

```txt
Local album art can be shown inside Tunify.
Discord Presence requires a public image URL or Discord asset.
```

---

## 11.8 Settings Screen

### Sections

```txt
Appearance
- Theme: System / Light / Dark
- Accent: Purple Pink

Library
- Imported folders
- Rescan library
- Clear library cache

Playback
- Gapless playback
- Resume last track
- Clear presence on pause

Discord
- Connect Discord
- Presence enabled
- Presence image source

About
- App version
- Privacy note
```

---

## 12. Component System

## 12.1 Button

### Primary Button

```txt
Shape: pill
Background: primary purple or gradient
Text: white
Height: 56
Padding horizontal: 28
Font: SemiBold 16
```

### Secondary Button

```txt
Shape: pill
Background: Surface Soft
Text: Text Primary
Height: 56
Padding horizontal: 28
```

### Icon Button

```txt
Size: 44
Radius: 22
Background: transparent / surface soft
Icon size: 24
```

---

## 12.2 Album Art

### Sizes

```txt
Mini player       : 52 x 52
Track list        : 56 x 56
Card/grid         : 160 x 160
Now playing       : screen width - 48
```

### Placeholder

Jika tidak ada artwork:

```txt
Background: soft lavender gradient
Icon: music note / image icon
Icon color: primary purple
```

Dark placeholder:

```txt
Background: #251B33
Icon color: #8B6CFF
```

---

## 12.3 Track List Item

```txt
Height: 72
Padding horizontal: 24
Album art: 56
Title font: 17 SemiBold
Artist font: 14 Medium
Duration font: 14 Medium
More icon: 24
```

States:

```txt
Normal
Playing
Pressed
Favorite
```

Playing state:

```txt
Title color: Primary
Show small equalizer indicator optional
```

---

## 12.4 Playlist / Folder Card

Untuk offline app, card bisa merepresentasikan:

```txt
Local Playlist
Folder
Album
Recently Added
Favorites
```

Card style:

```txt
Width: 160 - 220
Height: 160 - 180
Radius: 22
Background: gradient or album collage
Shadow: soft
```

Card content:

```txt
Icon / cover
Title
Subtitle:
- 128 Tracks
- Updated Today
- /Music/Anime Songs
```

---

## 13. Offline-First Adjustments

Karena Tunify adalah media player offline:

### Jangan terlalu menonjolkan:

```txt
Online recommendations
Streaming charts
Followers
Fans
Artist social cards
Daily mix generated by server
```

### Ganti dengan:

```txt
Recently Added
Recently Played
Imported Folders
Local Playlists
Favorites
Most Played
Albums
Artists
File Format
Storage Location
```

### Metadata states

Lagu lokal bisa punya metadata tidak lengkap.

Handle:

```txt
No title:
- Gunakan filename tanpa extension

No artist:
- "Unknown Artist"

No album:
- "Unknown Album"

No artwork:
- Placeholder gradient

No duration:
- "--:--"
```

---

## 14. Album Art Rules

### UI App

Tunify bisa menampilkan:

```txt
1. Embedded album art dari file lokal
2. Local artwork cache
3. Remote artwork URL
4. Placeholder gradient
```

Priority UI:

```txt
localArtworkPath
→ artworkRemoteUrl
→ placeholder
```

### Discord Presence

Discord Presence hanya boleh memakai:

```txt
1. artworkRemoteUrl yang valid dan publik
2. Discord Developer Portal asset key
```

Priority Discord Presence:

```txt
artworkRemoteUrl
→ DISCORD_RP_DEFAULT_LARGE_IMAGE_KEY
```

Jangan kirim ke Discord:

```txt
file:///storage/emulated/0/...
content://media/external/...
base64 image string
local cache path
```

### Required Track Model

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

### Presence Image Resolver

```ts
export function resolvePresenceLargeImage(track: Track) {
  if (
    track.artworkRemoteUrl &&
    track.artworkRemoteUrl.startsWith("https://")
  ) {
    return track.artworkRemoteUrl;
  }

  return Config.DISCORD_RP_DEFAULT_LARGE_IMAGE_KEY;
}
```

---

## 15. Discord Presence Preview Format

Discord Presence should show:

```txt
Playing Tunify
Song Title
Artist • Album
```

Example:

```txt
Playing Tunify
Re: Frain
Aimer • Your Mix
```

Payload mapping:

```txt
details     = song title
state       = artist • album
largeImage  = artworkRemoteUrl or app_logo
largeText   = album name or song title
smallImage  = play_icon
smallText   = Playing
timestamp   = playback start time
```

If paused:

```txt
MVP:
clear presence

Future:
smallImage = pause_icon
smallText = Paused
```

---

## 16. Animation Direction

Gunakan animasi halus:

```txt
Screen transition:
- fade + slight vertical slide

Mini player:
- slide up from bottom
- shadow appears gradually

Now playing:
- album art scale in
- controls fade in

Play button:
- soft scale on press
- glow pulse optional

Progress:
- smooth slider update
```

Durasi:

```txt
Fast press feedback : 120ms
Normal transition   : 220ms
Screen transition   : 280ms
```

---

## 17. Dark Mode Behavior

Theme options:

```txt
System
Light
Dark
```

Default:

```txt
System
```

Dark mode harus mempengaruhi:

```txt
Background
Surface
Cards
Text
Icons
Mini player
Bottom nav
Album placeholder
Progress
Discord status screen
```

Now Playing dark mode boleh lebih dramatic dibanding screen lain.

---

## 18. Accessibility

Minimal rules:

```txt
Text contrast harus jelas
Touch target minimal 44 x 44
Icon button harus punya accessibilityLabel
Progress slider harus accessible
Jangan hanya mengandalkan warna untuk status
Support dynamic font size jika memungkinkan
```

Labels:

```txt
Play button          : "Play"
Pause button         : "Pause"
Next button          : "Next track"
Previous button      : "Previous track"
Shuffle button       : "Shuffle"
Repeat button        : "Repeat"
Connect Discord      : "Connect Discord"
Clear Presence       : "Clear Discord Presence"
```

---

## 19. Recommended Implementation Tokens

Buat file:

```txt
apps/mobile/src/app/theme/tokens.ts
```

Isi konsep:

```ts
export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const typography = {
  fontFamily: {
    regular: "PlusJakartaSans-Regular",
    medium: "PlusJakartaSans-Medium",
    semiBold: "PlusJakartaSans-SemiBold",
    bold: "PlusJakartaSans-Bold",
    extraBold: "PlusJakartaSans-ExtraBold",
  },
};
```

Buat file:

```txt
apps/mobile/src/app/theme/colors.ts
```

Dengan light/dark colors dari dokumen ini.

---

## 20. MVP Design Checklist

MVP UI dianggap sesuai jika:

```txt
1. Menggunakan Plus Jakarta Sans.
2. Ada light mode.
3. Ada dark mode.
4. Home screen punya library overview.
5. Ada Play All dan Shuffle pill buttons.
6. Ada local playlist/folder horizontal cards.
7. Ada top/recent track list.
8. Ada floating mini player.
9. Ada bottom navigation.
10. Now Playing punya album art besar.
11. Now Playing punya title, artist, progress, controls.
12. Dark mode Now Playing punya deep purple background.
13. Jika tidak ada album art, tampil placeholder lavender.
14. Jika ada local album art, tampil di UI.
15. Discord Presence preview menampilkan nama lagu.
16. Discord Presence image rule jelas:
    remote URL → album art
    no remote URL → app icon
```

---

## 21. Notes for AI Coding Agent

Saat implementasi UI, jangan membuat desain seperti streaming app online penuh.

Prioritaskan offline/local concept:

```txt
Use:
- Local Library
- Imported Folders
- Recently Added
- Recently Played
- Favorites
- Albums
- Artists
- Folder Scan
- Storage Permission

Avoid:
- Online charts
- Followers
- Fans
- Online recommendations
- Subscription
- Social feed
```

Style harus tetap mirip referensi:

```txt
- soft lavender background
- purple/pink accent
- rounded cards
- large album art
- floating mini player
- bottom nav
- dark purple now playing
```

Font wajib:

```txt
Plus Jakarta Sans
```

---

## 22. Screen Copy Suggestions

### Empty Library

```txt
No music found yet
Choose a folder to start building your local library.
```

Button:

```txt
Choose Folder
```

### Discord Not Connected

```txt
Connect Discord
Show what you're listening to from your local music library.
```

### Album Art Limitation

```txt
Local album art is shown inside Tunify.
Discord Presence uses a public artwork URL when available, otherwise it uses the Tunify app icon.
```

### Scan Complete

```txt
Library updated
Found 1,248 tracks from 4 folders.
```

---

## 23. Future Design Improvements

```txt
- Animated equalizer indicator
- Dynamic background color from album art
- Blurred album art background
- Mini lyrics panel
- Queue drawer
- Swipeable mini player
- Custom theme accent
- Desktop companion design
- Discord Presence live preview card
```
