## Dark mode:

name: Nocturne Audio
colors:
surface: '#131314'
surface-dim: '#131314'
surface-bright: '#39393a'
surface-container-lowest: '#0d0e0f'
surface-container-low: '#1b1c1c'
surface-container: '#1f2020'
surface-container-high: '#292a2b'
surface-container-highest: '#343535'
on-surface: '#e4e2e2'
on-surface-variant: '#c3c7cb'
inverse-surface: '#e4e2e2'
inverse-on-surface: '#303031'
outline: '#8d9195'
outline-variant: '#43474b'
surface-tint: '#b7c9d5'
primary: '#ffffff'
on-primary: '#22333c'
primary-container: '#d3e5f1'
on-primary-container: '#566771'
inverse-primary: '#50616b'
secondary: '#b7c8e1'
on-secondary: '#213145'
secondary-container: '#3a4a5f'
on-secondary-container: '#a9bad3'
tertiary: '#ffffff'
on-tertiary: '#383018'
tertiary-container: '#f1e1bf'
on-tertiary-container: '#6e6348'
error: '#ffb4ab'
on-error: '#690005'
error-container: '#93000a'
on-error-container: '#ffdad6'
primary-fixed: '#d3e5f1'
primary-fixed-dim: '#b7c9d5'
on-primary-fixed: '#0c1e26'
on-primary-fixed-variant: '#384953'
secondary-fixed: '#d3e4fe'
secondary-fixed-dim: '#b7c8e1'
on-secondary-fixed: '#0b1c30'
on-secondary-fixed-variant: '#38485d'
tertiary-fixed: '#f1e1bf'
tertiary-fixed-dim: '#d4c5a4'
on-tertiary-fixed: '#221b06'
on-tertiary-fixed-variant: '#50462d'
background: '#131314'
on-background: '#e4e2e2'
surface-variant: '#343535'
typography:
display-lg:
fontFamily: Plus Jakarta Sans
fontSize: 32px
fontWeight: '700'
lineHeight: 40px
letterSpacing: -0.02em
headline-md:
fontFamily: Plus Jakarta Sans
fontSize: 24px
fontWeight: '600'
lineHeight: 32px
letterSpacing: -0.01em
headline-md-mobile:
fontFamily: Plus Jakarta Sans
fontSize: 20px
fontWeight: '600'
lineHeight: 28px
body-lg:
fontFamily: Plus Jakarta Sans
fontSize: 16px
fontWeight: '500'
lineHeight: 24px
body-sm:
fontFamily: Plus Jakarta Sans
fontSize: 14px
fontWeight: '400'
lineHeight: 20px
label-caps:
fontFamily: Plus Jakarta Sans
fontSize: 12px
fontWeight: '700'
lineHeight: 16px
letterSpacing: 0.05em
rounded:
sm: 0.25rem
DEFAULT: 0.5rem
md: 0.75rem
lg: 1rem
xl: 1.5rem
full: 9999px
spacing:
unit: 8px
container-padding-mobile: 24px
container-padding-desktop: 48px
gutter: 16px
element-gap: 12px

---

## Brand & Style

The design system is centered on a "Midnight Immersive" philosophy. It targets a premium audience that values focus and high-fidelity aesthetics. The emotional response is one of calm, sophisticated isolation—where the music is the only thing that matters.

The visual style blends **Minimalism** with **Glassmorphism**. It utilizes deep, ink-like canvases contrasted with ethereal, soft-glowing elements that mimic physical light sources behind frosted glass. This creates a sense of infinite depth and three-dimensional space within a two-dimensional interface.

## Colors

The palette is strictly curated to maintain the premium dark-mode aesthetic.

- **Primary Glow (#E0F2FE):** Used for high-emphasis actions and "light-source" elements. It should feel luminescent against the dark background.
- **Background (#05070A):** A near-black navy that provides more depth than pure black, allowing for subtle shadow play.
- **Surface (#0F172A):** Used for elevated cards and secondary containers.
- **Text Hierarchy:** Pure white (#FFFFFF) is reserved for primary titles and active states. Muted Gray (#94A3B8) handles secondary information, metadata, and inactive icons.

## Typography

This design system utilizes **Plus Jakarta Sans** for its modern, geometric clarity. The type scale is designed to be highly legible against dark backgrounds, using generous line heights to prevent "letter-glow" blurring.

Headline styles use tighter letter-spacing and heavier weights to feel "anchored" in the interface. Secondary labels use uppercase tracking to differentiate metadata from body content. For the "Now Playing" title, use `display-lg` to ensure the track name remains the focal point.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a heavy emphasis on safe-area margins. Content is centered and vertically balanced to simulate the experience of physical media (like a vinyl cover).

- **Mobile:** A single-column layout with 24px side margins. The album art should be a responsive square with 32px of top/bottom breathing room.
- **Desktop:** A 12-column grid. The music player controls and album art occupy a central 6-column "focus zone," while the playlist or library occupies the flanking columns as translucent overlays.
- **Rhythm:** All spacing is based on an 8px base unit to ensure consistent vertical alignment across lists and player controls.

## Elevation & Depth

Hierarchy is established through **Soft Lighting** rather than traditional drop shadows.

1.  **The Canvas (Level 0):** The base `#05070A` background.
2.  **Floating Containers (Level 1):** Subtle `#0F172A` surfaces with 1px semi-transparent borders (`rgba(255,255,255,0.05)`).
3.  **Active Focus (Level 2):** Elements like the current song or the play button utilize a "Backdrop Glow." This is achieved with a large, low-opacity radial gradient behind the element using the `primary_color_hex`.
4.  **Glassmorphism:** Bottom navigation bars and mini-players use a 20px backdrop blur with 70% opacity to maintain a sense of space while staying functional.

## Shapes

The design system uses high-radius curves to evoke a friendly, modern, and "liquid" feel.

- **Containers:** Standard cards and album art use `rounded-lg` (16px/1rem).
- **Interactive Elements:** Buttons and toggle switches use `rounded-xl` (24px/1.5rem) or are fully circular (pill-shaped) to distinguish them from content containers.
- **Waveforms:** Progress bars and audio visualizers use rounded line-caps to match the overall softness of the UI.

## Components

### Buttons

- **Primary Play Button:** A large circular button with a solid `#FFFFFF` background and a soft `primary_color_hex` outer glow.
- **Secondary Actions (Shuffle/Repeat):** Outlined buttons with 1px `rgba(255,255,255,0.2)` borders and no fill.

### Waveforms & Sliders

- The progress bar is a stylized waveform. The "played" portion is high-contrast white, while the "remaining" portion is muted gray at 30% opacity.

### Lists

- Track lists feature 12px vertical spacing. The active track is highlighted by a subtle background fill and a small animated "equalizer" icon instead of the track number.

### Cards

- Album cards feature a slight "inner-glow" on top-left edges to simulate a light source, making the artwork pop against the dark canvas.

### Mini-Player

- A persistent floating bar at the bottom of the screen using heavy backdrop blur and a thin top-border to separate it from the navigation.
