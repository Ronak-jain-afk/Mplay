# mplay — Agent Guide

## Stack
- **Desktop shell**: Tauri v2 (Rust backend, Svelte frontend)
- **Frontend**: Svelte 5 (runes API) + Vite 6, no framework router
- **Backend**: Rust with serde/serde_json, tauri-plugin-shell
- **Dev server**: `http://localhost:1420` (not 5173 — set in `vite.config.js`)

## Key commands
| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite dev server (frontend only) |
| `npm run build` | Vite production build to `dist/` |
| `npm run tauri dev` | Full Tauri dev (Rust + Vite) |
| `cargo build` (in `src-tauri/`) | Rust backend only |

## Architecture
- **Two sides, one crate**: Rust models in `src-tauri/src/state.rs`, Tauri commands in `src-tauri/src/lib.rs`.
- **Frontend state**: `src/lib/store.svelte.js` — Svelte 5 `$state` runes exported as named objects (`playerState`, `library`, `queue`, `lyrics`, `ui`).
- **Type bridge**: TS interfaces in `src/lib/types.ts` mirror Rust `state.rs` structs. Keep them in sync.
- **Tauri IPC**: Frontend calls `invoke("command_name")` from `@tauri-apps/api/core`. Register commands in `lib.rs` via `generate_handler![]`.

## Layout
```
App.svelte: sidebar (240px) | content | player bar (bottom)
```
- CSS grid, three areas: `sidebar` / `content` / `player`.
- Components: `Sidebar.svelte` (nav), `LibraryView.svelte` (main content), `PlayerBar.svelte` (transport controls).

## Design system (from `DESIGN.md`)
All tokens as CSS custom properties in `src/app.css`:
- `--color-bg: #030303`, `--color-surface: #0f0f0f`, `--color-primary: #ff003c`
- `--radius-full: 9999px`, `--radius-lg: 12px`
- Inter font + Material Symbols Outlined
- No fluid typography (fixed rem scale). No gradients, no drop shadows except `--shadow-overlay` on player bar.

## Build quirks
- Vite ignores `src-tauri/` changes (`watch.ignored` in `vite.config.js`).
- Tauri icons must be RGBA PNG (not indexed/grayscale). Regenerate with `src-tauri/icons/` Python script if adding new sizes.
- No TypeScript config file (`tsconfig.json`) — Vite uses default.
- No CI, no test framework installed yet.

## Phase 2 — Folder import
- Import lives in `src-tauri/src/scanner.rs` (Rust) + Tauri command `import_folder` in `lib.rs`.
- Supported audio: `mp3`, `m4a`, `flac`, `ogg`, `opus`, `wav`, `wma`, `aac`.
- Song ID = SHA256 of absolute path, truncated to 16 hex chars.
- Thumbnail priority: embedded cover → same‑basename sidecar (`song.jpg`) → `cover`/`folder`/`albumart`/`front`.
- Lyrics: same‑basename `.lrc` or `.txt` sidecar only (no `lyrics.lrc` fallback — per plan decision).
- Embedded covers extracted to `app_data/covers/<song_id>.{jpg,png}`.
- Tags read via `lofty` crate; fallback to filename if no title tag.
- Frontend uses `@tauri-apps/plugin-dialog` for native folder picker.
- `convertFileSrc()` from `@tauri-apps/api/core` needed to display local thumbnail paths.

## Phase 3 — State persistence
- Persistence in `src-tauri/src/persistence.rs` — `SaveData` struct wraps `Vec<Song>`, `Vec<Playlist>`, `AppState`.
- `load_state` / `save_state` Tauri commands in `lib.rs`.
- Atomic write: write to `.json.tmp`, then rename over `state.json`. Corrupt files backed up to `.json.bak`.
- Frontend auto-saves via `$effect` runes in `store.svelte.js`, throttled to 1 write/sec.
- State loaded in `initApp()` on startup — restores player state, library, playlists.

## Phase 4 — Queue & Shuffle
- Queue manager in `src/lib/queue-manager.svelte.js` (frontend logic module).
- `getNextTrackId()`: checks queue FIFO first → shuffle ON (via `shuffledSequence`) → shuffle OFF (linear with repeat wrap).
- Fisher-Yates shuffle with forbidden-start constraint (no immediate repeat of last track).
- Toggle shuffle: current track placed at start of shuffled sequence, rest random.
- Repeat cycling: Off → All → One → Off. Repeat One bypasses queue manager entirely.
- Control functions in `store.svelte.js`: `nextTrack()`, `previousTrack()`, `togglePlay()`, `toggleMute()`, `setVolume()`, `seek()`, `cycleRepeatMode()`. History stack (max 100) pushed on every track transition.
- Previous-track: position > 3s → restart current; else pop history.

## Phase 5 — History & Previous Track
- History stack in `playerState.history` (max 100). Pushed via `pushHistory()` before every track transition.
- `previousTrack()`: position > 3s → seek to 0; else pop history. Validates song still exists in library (skips missing entries).
- `selectTrack(songId)` in store for library/playlist track selection — pushes history, loads track.
- LibraryView tracks show `.active` style (left border accent) when currently playing.

## Phase 6 — Playback Engine
- HTML5 Audio element managed in `store.svelte.js` (created in `initAudio()`, called from `initApp()`).
- Event-driven: `timeupdate` → `playerState.position`, `loadedmetadata` → `playerState.duration`, `ended` → `nextTrack()` auto-advance.
- `play()` / `pause()` call `audio.play()` / `audio.pause()`. Resume from paused state, or load-and-play if track changed.
- `loadTrack(songId)` converts `song.path` via `convertFileSrc()` for asset protocol URL, stores `loadedSongId`.
- `seek()`, `setVolume()`, `toggleMute()` update both store state and audio element in sync.
- No Rust audio dependencies — native webview audio.

## Phase 7 — Lyrics Manager
- Lyrics state in `store.svelte.js`: `lyrics.synced` (LRC parsed), `lyrics.plain` (raw text fallback), `lyrics.currentLine`/`currentIndex` (live sync).
- `loadLyrics(songId)`: fetches sidecar file via `convertFileSrc()`, runs `parseLRC()` regex `\[(\d+):(\d+(?:\.\d+)?)\](.*)`. Falls back to raw text if no LRC lines match.
- Position sync via `$effect`: binary search on `lyrics.synced` for last line with `time <= playerState.position`. Updates `currentLine`/`currentIndex` reactively.
- Current lyric line shown in PlayerBar below artist, italic cherry-red.

## Phase 8 — Playlists
- Store functions: `createPlaylist(name)`, `deletePlaylist(id)`, `addToPlaylist(playlistId, songId)`, `removeFromPlaylist(playlistId, songId)`, `setActiveView(view)`.
- `PlaylistView.svelte`: shows playlist songs with grid layout matching LibraryView, remove buttons (hover visible), right-click context menu, delete button in header.
- `Sidebar.svelte`: shows Library at top, user playlists below with delete-on-hover buttons, "New playlist" button with color-primary styling.
- `LibraryView.svelte`: "+" button on each song row opens add-to-playlist popover listing all user playlists.
- `App.svelte`: switches content area between LibraryView (default) and PlaylistView based on `ui.sidebarActive`.
- Playlist IDs via `crypto.randomUUID()`. Library playlist is special (isLibrary=true, can't be deleted, no remove buttons).

## Phase 9 — User Interface (remaining views)
- **QueueView.svelte**: shows queued songs with thumbnails, artist, duration; remove button on hover; empty state when queue is empty.
- **LyricsPanel.svelte**: full-screen lyrics view in content area — synced lines with current highlighted, plain text fallback, empty state. Live-syncs with playback position.
- All views switchable via sidebar nav items (Library, Queue, Lyrics, playlists).

## Phase 10 — Background Playback & OS Integration
- **Close → Hide**: `on_window_event(CloseRequested)` prevents close, calls `window.hide()`.
- **System tray**: `TrayIconBuilder` with Show/Hide + Quit menu, left-click toggles window visibility.
- **Media session (MPRIS/SMTC)**: `souvlaki` crate wraps Linux MPRIS (D-Bus) and Windows SMTC. Attached callback emits `media-command` events to frontend (play/pause/toggle/next/previous).
- **Metadata sync**: Frontend calls `update_media_metadata` + `set_playback_status` Tauri commands on track load, play/pause. `cover_url` set as `file://` URI from `song.thumbnailPath`.
- **Quit**: Tray menu → `app.exit(0)`. Frontend listens for `media-command` events from OS media keys.

## Phase 11 — Error Handling & Edge Cases
- **Corrupted audio** → auto-skip up to 3 consecutive errors, then stop. `errorSkipCount` resets on successful play/load.
- **Empty playlist** → `play()` returns early (keeps Stopped), `nextTrack()` returns null.
- **Rapid Next/Previous** → 200ms cooldown via `skipCooldown` timestamp.
- Missing thumbnail/lyrics → handled via CSS placeholders and empty-state views.
- Track not found on load → `loadTrack()` returns early if song missing from library.

## Development flow
- Build order per `PROCEDURE.md`: Phase 0 (scaffold) → Phase 1 (models) → Phase 2 (import) → 3→4→5→6→7→8→9→10→11→12.
- Phases 1+2, 6, and 7 can run in parallel.
- Model changes must land in `state.rs` (Rust) + `types.ts` (TS) + `store.svelte.js` (reactive state).

## Reference files
- `plan.md` — full system specification (12 modules)
- `PROCEDURE.md` — phased build order with test matrixes
- `PRODUCT.md` — user/market context, brand personality
- `DESIGN.md` — visual design system with exact color/type/spacing tokens
