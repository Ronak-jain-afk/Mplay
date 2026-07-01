---
name: mplay
description: Immersive, content-first dark theme inspired by YouTube Music
colors:
  primary: "#ff003c"
  neutral-bg: "#030303"
  neutral-surface: "#0f0f0f"
  neutral-surface-hover: "#212121"
  ink-primary: "#ffffff"
  ink-secondary: "#b3b3b3"
  ink-tertiary: "#808080"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.neutral-surface-hover}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System: mplay

## 1. Overview

**Creative North Star: "The Immersive Theater"**

"The Immersive Theater" represents a complete visual design framework tailored for desktop audio playback. The interface is characterized by a high-density, flat-designed layout where content (album art, lyrics, titles) takes center stage, and chrome (sidebar, top bar, player controls) is visually pushed back. Colors are restrained, keeping the interface pitch-black or very dark gray, with cherry red reserved exclusively for key action triggers, progress tracking, and active playback indicators.

The design explicitly rejects cluttered 2000s desktop media player layouts, heavy shadows, generic light-mode cards, and unnecessary section subtitles. Instead, it relies on clean typography, precise grid alignment, and interactive hover states to communicate hierarchy and affordance.

**Key Characteristics:**
- Pitch-black background (`#030303`) to ensure high contrast and highlight colorful album art.
- Deep matte gray panels (`#0f0f0f`) to group navigation and control regions.
- High-density spacing and tight layout rhythms tailored for efficient content exploration.
- Pill-shaped interaction handles (buttons, chips) matching standard streaming aesthetics.

## 2. Colors

The color palette is highly restrained, leveraging deep near-blacks for structure, crisp whites for readability, and a vibrant cherry red accent for primary actions and playing status.

### Primary
- **Cherry Red** (`#ff003c` / `oklch(58% 0.25 15)`): Used for primary action indicators, active playing state (e.g. active sidebar indicator, playing speaker icon), and track progress bars.

### Neutral
- **Pitch Black** (`#030303` / `oklch(8% 0 0)`): Canvas background. The ultimate background for making cover art stand out.
- **Matte Charcoal** (`#0f0f0f` / `oklch(15% 0 0)`): Sidebar, bottom player panel, and card container background.
- **Active Grey** (`#212121` / `oklch(22% 0 0)`): Active navigation background, chip background, and hover states.
- **Pure White** (`#ffffff` / `oklch(100% 0 0)`): Primary headings, titles, active nav text, and search text. High legibility.
- **Muted Silver** (`#b3b3b3` / `oklch(76% 0 0)`): Secondary text, subtitles, track counts, and inactive nav labels.
- **Deep Grey** (`#808080` / `oklch(58% 0 0)`): Unfocused placeholders, disabled elements, and secondary metadata.

### Named Rules
**The Restrained Accent Rule.** The Cherry Red accent must never exceed 5% of any screen surface. It is a status indicator and primary action trigger, never a background wash or container fill.
**The Tinted Contrast Rule.** Text colors must maintain at least a 4.5:1 contrast ratio against their respective charcoal/black backgrounds. Avoid muddy gray tints on secondary text; use crisp muted silver.

## 3. Typography

**Display Font:** Inter (with `system-ui, sans-serif` fallback)
**Body Font:** Inter (with `system-ui, sans-serif` fallback)
**Label/Mono Font:** Inter (with `system-ui, sans-serif` fallback)

**Character:** A single sans-serif typeface (Inter) is used across all UI layers. This preserves uniformity, reduces visual noise, and ensures excellent readability at both display and body scales.

### Hierarchy
- **Display** (Bold (700), `2.25rem` (36px), `1.2` line-height): Section titles (e.g., "Listen again", "Forgotten favorites").
- **Headline** (Semi-Bold (600), `1.25rem` (20px), `1.3` line-height): Medium headings, album/playlist names in detail views.
- **Title** (Semi-Bold (600), `1rem` (16px), `1.4` line-height): Active song titles, list item headers.
- **Body** (Regular (400), `0.875rem` (14px), `1.5` line-height): Subtitles, artist names, descriptions. Maximum line length for prose is 65ch.
- **Label** (Medium (500), `0.75rem` (12px), `1.4` line-height, letter-spacing `0.02em`): Chips, button labels, timecode markers, and secondary metadata.

### Named Rules
**The Fixed-Scale Rule.** Do not use fluid viewport-relative typography. Heading scales are fixed in rem/pixel equivalents to prevent text overlap in compact desktop layouts.
**The No-Eyebrow Rule.** Section headings must never be accompanied by a small, all-caps tracked uppercase eyebrow. Visual hierarchy is achieved solely through font weight and size.

## 4. Elevation

Depth in this system is conveyed through structural color layers rather than realistic drop shadows. The design is flat by default, separating panels by contrasting matte charcoal surfaces against the pitch-black backdrop.

### Shadow Vocabulary
- **None/Flat**: Surfaces are completely flat at rest.
- **Overlay Shadow** (`box-shadow: 0 -4px 16px rgba(0,0,0,0.5)`): Used on the docked bottom player bar to establish visual depth as it sits on top of scrollable lists.

### Named Rules
**The Flat-By-Default Rule.** Surfaces must remain flat. Do not pair 1px borders with soft drop shadows. If depth is needed, use alternating neutral surface colors.

## 5. Components

### Buttons
- **Shape:** Fully rounded, pill-shaped (`border-radius: 9999px` or `rounded.full`).
- **Primary:** Background is Cherry Red (`#ff003c`), text is Pure White (`#ffffff`), horizontal padding `16px`, vertical padding `8px`. Used for high-impact actions like "Play".
- **Hover / Focus:** On hover, background color shifts to a brighter tint (`#ff2a5d`). On focus, a subtle 1px white ring outline is applied. Transition time is 150ms.
- **Secondary:** Background is Active Grey (`#212121`), text is Pure White (`#ffffff`), border is None. Used for "+ New playlist" or "More".

### Chips
- **Style:** Background is Active Grey (`#212121`), text color is Pure White (`#ffffff`), fully rounded edges (`rounded.full`), padding is `6px 12px`.
- **State:** Default is Active Grey. On hover, background becomes lighter (`#333333`). In active/selected state, background is Pure White (`#ffffff`) and text is Pitch Black (`#030303`).

### Cards / Containers
- **Corner Style:** Rounded corners at `8px` (`rounded.md`) or `12px` (`rounded.lg`).
- **Background:** Transparent at rest for media rows, showing cover art. Cards that wrap items have background Matte Charcoal (`#0f0f0f`).
- **Shadow Strategy:** Flat. No drop shadows.
- **Border:** None. No border accents.
- **Internal Padding:** `16px` (`spacing.md`).

### Inputs / Fields
- **Style:** Text search box has background Active Grey (`#212121`), fully rounded pill shape (`rounded.full`), padding `10px 16px 10px 48px` (to accommodate search icon). Text color is Pure White (`#ffffff`), placeholder text is Deep Grey (`#808080`).
- **Focus:** Background remains `#212121`, but border is outlined with a subtle 1px white border or glow, placeholder fades slightly.

### Navigation
- **Style:** Sidebar navigation items are full-width rows with vertical padding `12px`, horizontal padding `16px`. Active item has background Active Grey (`#212121`) with `border-radius: 12px` and active white icon/text. Inactive items have transparent backgrounds and muted silver text/icon. Hover state has background `rgba(255,255,255,0.05)` with standard `150ms` transitions.

## 6. Do's and Don'ts

### Do:
- **Do** use a solid, pitch-black canvas background (`#030303`) to create maximum contrast for album art.
- **Do** use fully rounded pill-shaped button borders (`border-radius: 9999px`) for interactive selectors and action buttons.
- **Do** maintain a strict 4.5:1 text-to-background contrast ratio using muted silver (`#b3b3b3`) or pure white (`#ffffff`).
- **Do** use the single `Inter` sans-serif font family across all UI elements to ensure layout density and clean hierarchy.

### Don't:
- **Don't** use border-left or border-right accent stripes on cards, navigation, or playlist lists.
- **Don't** apply realistic drop shadows (blur >= 16px) on cards or surface containers; keep them flat.
- **Don't** use fluid typography scales or all-caps eyebrows above section titles.
- **Don't** allow active accent colors (Cherry Red) to cover more than 5% of any screen surface.
