# Development Procedure — mplay

> Reference companion to `plan.md`. Use both side‑by‑side during development:
> - **plan.md** → what the system should do (specification)
> - **PROCEDURE.md** → how to build it, in what order, and what to watch for

---

## PHASE 0 — Project Scaffold & Build System

**Goal**: Runnable skeleton that compiles and links.

| Step | Action | Checkpoint |
|------|--------|------------|
| 0.1 | Choose language + framework (C++ with Qt? Rust with egui/iced? Python with PySide6?). **Decision needed** before any code. | A single `main()` that opens a window |
| 0.2 | Set up build system (CMake, Cargo.toml, pyproject.toml). Pin deps: audio decoder + tag reader. | `cmake --build .` or `cargo build` succeeds |
| 0.3 | Create app data directory (e.g. `~/.local/share/mplay/` on Linux, `%APPDATA%/mplay` on Windows). | Directory exists with expected structure |
| 0.4 | Verify a minimal GUI window opens and the event loop runs. | Window shows, closes cleanly |

**Libraries needed** (per language):
- **Audio decoding**: minimp3, libflac, libogg + libvorbis, or a meta‑lib like sndfile / miniaudio
- **Tag reading**: TagLib (C++), lofty (Rust), mutagen (Python)
- **Image handling**: stb_image or built‑in GUI image loader
- **JSON**: nlohmann/json (C++), serde_json (Rust), json/stdlib (Python)

---

## PHASE 1 — Data Models & State

**Goal**: All logical entities exist, serialisable, and tested in isolation.

| Step | Action | Ref (plan.md) |
|------|--------|---------------|
| 1.1 | Implement `Song` struct/class with all fields (§2.1). | §2.1 |
| 1.2 | Implement `Playlist` struct/class (§2.2). | §2.2 |
| 1.3 | Implement `Queue` struct/class (§2.3). | §2.3 |
| 1.4 | Implement `AppState` struct (§2.4) with enums for `PlaybackStatus` and `RepeatMode`. | §2.4 |
| 1.5 | Write serialisation/deserialisation (to/from JSON) for all models. | §9.2 |
| 1.6 | Unit‑test round‑trip: construct → serialise → deserialise → compare fields. | — |

**Edge cases to test**:
- `Song` with empty optional fields (no thumbnail, no lyrics)
- `Playlist` with zero songs
- `Queue` with empty items
- `AppState` with `currentSongId = null` and `shuffledSequence = null`

---

## PHASE 2 — Library Manager & Folder Import

**Goal**: Import a folder, produce Song objects, persist to disk.

| Step | Action | Ref |
|------|--------|-----|
| 2.1 | Implement recursive directory walker. Collect files matching extension list (`.mp3`, `.m4a`, `.flac`, `.ogg`, `.opus`, `.wav`, `.wma`, `.aac`). | §3.2 |
| 2.2 | Compute Song `id` = hash of absolute path (SHA‑256 truncated to 16 chars, or std hash). | §3.2.a |
| 2.3 | Build duplicate‑detection map: skip if `id` already in library. | §3.2.b |
| 2.4 | Integrate tag‑reader library to extract `title`, `artist`, `album`, `duration`. Fallback: filename (w/o ext) as title, empty strings for artist/album. | §3.2.d |
| 2.5 | Implement thumbnail resolution ladder (embedded → same‑name sidecar → cover/folder/albumart/front). | §3.2.e |
| 2.6 | Extract embedded cover art, save to cache dir as `<id>.jpg`. Cache dir = `app_data/covers/`. | §3.2.e |
| 2.7 | Implement lyrics resolution: same‑basename `.lrc`/`.txt` sidecar file. | §3.2.f |
| 2.8 | Rebuild the "Library" playlist sorted by (artist, album, track-number metadata, filename). | §3.2.g–h |
| 2.9 | Run import on a **background thread**. Notify UI on completion. | §3.1 |
| 2.10 | Write tests: import a known folder, verify Song count, fields, thumbnail paths. | — |
| 2.11 | Incremental import: run same folder again, verify only new files added, removed files marked unavailable. | §3.3 |
| 2.12 | **Optional**: File watcher for real‑time folder changes. | §3.3 |

**Thumbnail priority ladder** (copy this into code as a function):
```
1. Embedded cover art in audio tags → extract, save to covers/<id>.jpg, thumbnailPath = cached file
2. <basename>.jpg|jpeg|png|webp in same directory → thumbnailPath = absolute path
3. cover|folder|albumart|front.jpg|jpeg|png|webp → thumbnailPath = absolute path
4. No thumbnail → thumbnailPath = ""
```

**Lyrics resolution**:
```
- <basename>.lrc (preferred) → lyricsPath = absolute path
- <basename>.txt             → lyricsPath = absolute path
- Otherwise                  → lyricsPath = ""
```

**Decision**: base‑name matching only for lyrics; no ambiguous `lyrics.lrc` fallback. (§3.2.f final decision)

---

## PHASE 3 — State Persistence

**Goal**: App state survives restart.

| Step | Action | Ref |
|------|--------|-----|
| 3.1 | On startup: read `state.json` from app data dir, deserialise into `AppState` + `Playlist[]` + `Song[]`. Validate file existence, mark missing songs. | §9.2 |
| 3.2 | On every significant change (track change, pause, queue update, volume): write `state.json`. Throttle to 1 write/sec max. | §9.3 |
| 3.3 | On app exit: flush pending save synchronously. | — |
| 3.4 | Handle corrupted JSON: backup previous file, parse, on failure restore backup. | — |
| 3.5 | Test: start app, import folder, close, reopen, verify state restored correctly. | — |

**State file path**:
- Linux: `~/.local/share/mplay/state.json`
- macOS: `~/Library/Application Support/mplay/state.json`
- Windows: `%APPDATA%/mplay/state.json`

---

## PHASE 4 — Queue Manager

**Goal**: Determine the next track under all conditions (shuffle, repeat, queue).

| Step | Action | Ref |
|------|--------|-----|
| 4.1 | Implement `activePlaylist` reference + `queue` (FIFO list of songId). | §5.1 |
| 4.2 | Implement shuffle‑off next‑track logic (simple index increment + wrap on Repeat All). | §5.2 Case A |
| 4.3 | Implement Fisher–Yates shuffle with forbidden‑start constraint. | §5.3 |
| 4.4 | Implement shuffle‑on next‑track logic (shuffledSequence index increment + re‑generation on exhaustion when Repeat All). | §5.2 Case B |
| 4.5 | Implement queue‑first logic: drain queue before touching playlist sequence. | §5.2 Step 1 |
| 4.6 | Implement shuffle ON/OFF during playback without skipping current track. | §5.4 |
| 4.7 | Implement Repeat‑One shortcut (bypasses Queue Manager entirely). | §5.6 |
| 4.8 | Wire `getNextTrack()` as the single entry point for end‑of‑track and user "Next". | — |
| 4.9 | **Test all combinations** of: shuffle OFF/ON × repeat Off/All/One × queue empty/pending. | — |

**Test matrix for `getNextTrack()`** (`src/tests/queue_manager_test.py` or equivalent):

| # | Shuffle | Repeat | Queue | Playlist Size | Expected |
|---|---------|--------|-------|---------------|----------|
| 1 | Off | Off | Empty | 5 | index + 1 |
| 2 | Off | Off | Empty | 1 | null (stop) |
| 3 | Off | All | Empty | 5 | wrap to 0 |
| 4 | Off | One | Empty | any | repeat same |
| 5 | On | Off | Empty | 5 | next in shuffledSequence |
| 6 | On | Off | Empty | 5 (exhausted) | null |
| 7 | On | All | Empty | 5 (exhausted) | new sequence, play from 0 |
| 8 | Any | Any | Non‑empty | any | dequeue, return that |

---

## PHASE 5 — History Stack & Previous Track

**Goal**: Previous‑track navigation works (restart vs go back, threshold rule).

| Step | Action | Ref |
|------|--------|-----|
| 5.1 | Implement stack of `{songId, position}` records. Max depth = 100 (configurable). | §4.4 |
| 5.2 | Push current song onto history before any track transition (Next, track select, queue song start). | §5.5 |
| 5.3 | Implement Previous: if position > 3s → seek to 0 (no pop). If ≤ 3s → pop history and load that song at stored position. | §8.5 |
| 5.4 | Handle edge: empty history → do nothing (or restart current track). | §8.5 |
| 5.5 | Handle edge: popped song no longer available → skip to next history entry. | §8.5 |

**Decision**: single stack, no forward‑history. Popped items are not re‑pushed.

---

## PHASE 6 — Playback Engine

**Goal**: Audio plays, pauses, seeks, stops, and reports position.

| Step | Action | Ref |
|------|--------|-----|
| 6.1 | Select audio backend: miniaudio (C/Rust), SDL2, Qt Multimedia, or Python `sounddevice` + ffmpeg. **Platform decision**. | §4.1 |
| 6.2 | Implement stream‑based decoder: open file → decode PCM frames → push to ring buffer. | §4.1 |
| 6.3 | Implement state machine (Idle → Loaded → Playing ↔ Paused → Stopped). Enforce valid transitions. | §4.2 |
| 6.4 | Implement `Load(songId)`: close previous stream, open new file, decode initial buffer, position = 0, emit signal. | §4.2 |
| 6.5 | Implement `Play()`, `Pause()`, `Stop()`, `Seek(seconds)`. Clamp seek to [0, duration]. | §4.2, §8.6 |
| 6.6 | Implement end‑of‑track detection (position >= duration). Fire callback for Queue Manager. | §4.3 |
| 6.7 | Run audio decode on dedicated thread. Communicate with UI via message queue / signals. | §4.1 |
| 6.8 | Internal clock: track `elapsed` via samples‑consumed counter (not wall clock). | §4.1 |
| 6.9 | Wire Repeat‑One: on end‑of‑track, reload same song, position = 0, play. | §4.3, §5.6 |
| 6.10 | Wire end‑of‑track with Queue Manager: get next track, auto‑play. | §4.3 |
| 6.11 | Write tests: load → play → pause → seek → stop; verify state transitions and position accuracy. | — |

**State machine transition table** (assert this in code):

| From \ To | Load | Play | Pause | Stop | Seek |
|-----------|------|------|-------|------|------|
| Idle | OK | — | — | — | — |
| Loaded | OK | OK | — | OK | OK |
| Playing | OK | — | OK | OK | OK |
| Paused | OK | OK | — | OK | OK |
| Stopped | OK | OK | — | — | — |

---

## PHASE 7 — Lyrics Manager

**Goal**: Load, parse, and serve time‑synced lyrics.

| Step | Action | Ref |
|------|--------|-----|
| 7.1 | On track load: read `lyricsPath` from Song. If null → no lyrics. | §6.1 |
| 7.2 | Implement `.lrc` parser: extract `[mm:ss.xx]` timestamps, build sorted array of `{startTime, text}`. Handle multiple timestamps per line. | §6.2 |
| 7.3 | Implement `.txt` handler: store entire content as plain string. | §6.2 |
| 7.4 | As playback position updates (every ~100ms), binary‑search for active lyric. Expose `currentLyric` and optionally `nextLyric`. | §6.3 |
| 7.5 | Cache parsed lyrics in memory (per song id) so re‑loading a track doesn't re‑parse. | — |

**LRC format edge cases**:
- `[mm:ss.xx]` with `.xx` as hundredths of second (standard) — convert to float
- `[mm:ss.xxx]` with milliseconds — also fine, just parse accordingly
- Empty lines between lyrics — skip
- Lines with timestamp but no text — ignore
- Tags like `[ti:...]`, `[ar:...]`, `[by:...]` — ignore (they are metadata, not lyrics)

---

## PHASE 8 — Playback Control Behaviours (User Actions)

**Goal**: All user‑triggered player controls work end‑to‑end.

| Step | Action | Ref |
|------|--------|-----|
| 8.1 | Implement `Play()` handler: handles resume, start from stopped, load‑first‑track‑if‑none. | §8.1 |
| 8.2 | Implement `Pause()` handler. | §8.2 |
| 8.3 | Implement `Stop()` handler. | §8.3 |
| 8.4 | Implement `Next()`: calls Queue Manager, pushes history, loads+plays. | §8.4 |
| 8.5 | Implement `Previous()`: threshold check, history pop, load at stored position. | §8.5 |
| 8.6 | Implement `Seek(seconds)`. | §8.6 |
| 8.7 | Implement `SetVolume(factor)` + `ToggleMute()`. Mute preserves volume, un‑mute restores. Changing volume while muted auto‑unmutes. | §8.7 |
| 8.8 | Implement track selection from playlist: push history, load, auto‑play if was playing. | §8.8 |
| 8.9 | Implement "Add to Queue": append songId(s) to queue, no auto‑start. | §8.9 |
| 8.10 | Implement Repeat‑mode cycling: Off → All → One → Off. | §8.10 |

**Decision**: When a track is selected while Paused, load and stay paused (position = 0). When selected while Stopped, load and remain stopped. (§8.8)

---

## PHASE 9 — User Interface (Minimum Viable)

**Goal**: Functional GUI that exposes all Phase 8 controls.

| Step | Action | Priority |
|------|--------|----------|
| 9.1 | Library view: scrollable list of all songs with search/filter. | High |
| 9.2 | Now‑playing bar: cover art, title, artist, position slider, volume slider. | High |
| 9.3 | Transport controls: Play/Pause, Stop, Next, Previous. | High |
| 9.4 | Playlist selector: dropdown/tabs for Library + custom playlists. | High |
| 9.5 | Queue view: shows queued songs, reorder/remove. | Medium |
| 9.6 | Lyrics panel: synced highlight or plain text. | Medium |
| 9.7 | Folder import button + progress indicator. | High |
| 9.8 | Settings: extensions list, custom data dir. | Low |

**UI layout (suggested)**:
```
+--------------------------------------------+
|  [Menu Bar]                    [Search]     |
+------+-------------------------------------+
|      |                                     |
| Lib  |   Lyrics / Now Playing / Queue      |
| Play |                                     |
| list |                                     |
|      |                                     |
+------+-------------------------------------+
|  [Cover] Title - Artist    [⏮] ▶️ [⏭] [⏹] |
|  ████████████████░░░░░░░░    🔊 ████░░░   |
+--------------------------------------------+
```

---

## PHASE 10 — Background Playback & OS Integration

**Goal**: Playback continues when window is closed. Media keys work.

| Step | Action | Ref |
|------|--------|-----|
| 10.1 | Window close → hide instead of quit. Keep audio thread alive. | §7.1 |
| 10.2 | System tray icon to show/hide window. | §7.1 |
| 10.3 | Register OS media session (SMTC on Windows, MPRIS on Linux, NowPlaying on macOS). | §7.2 |
| 10.4 | Update session metadata: title, artist, album, thumbnail, status, position. | §7.2 |
| 10.5 | Handle OS‑initiated commands: Play, Pause, Next, Previous. | §7.2 |
| 10.6 | Provide thumbnail to OS from `thumbnailPath`. Fallback to placeholder. | §7.3 |
| 10.7 | Explicit Quit → save state, stop playback, exit process. | §7.1 |

---

## PHASE 11 — Error Handling & Edge Cases

**Goal**: No crash on bad data. Graceful degradation.

| Step | Action | Ref |
|------|--------|-----|
| 11.1 | Track not found on load → mark unavailable, skip to next track. | §10 |
| 11.2 | Corrupted audio file → catch decode error, skip to next. | §10 |
| 11.3 | Missing thumbnail/lyrics → empty state, no crash. | §10 |
| 11.4 | Empty playlist → disable Play/Next, show "no songs" message. | §10 |
| 11.5 | All tracks unavailable → stop playback, notify user. | §10 |
| 11.6 | Concurrency: serialise all state mutations via message queue / mutex. | §10 |
| 11.7 | Seek near end of track → clamp to duration, trigger end‑of‑track. | §10 |
| 11.8 | Rapid Next/Previous → debounce or queue commands (200ms cooldown). | §10 |

---

## PHASE 12 — Performance & Resource Management

**Goal**: Low memory, low battery impact.

| Step | Action | Ref |
|------|--------|-----|
| 12.1 | Audio streaming: never hold full decoded file in memory. Use ring buffer + streaming decode. | §11 |
| 12.2 | Album art LRU cache: max 50 images, evict oldest on full. Load on demand, not pre‑load. | §11 |
| 12.3 | Lyrics read on track load and cached in‑memory map. | §11 |
| 12.4 | Audio thread releases device when Stopped (no wakelock). | §11 |
| 12.5 | Thumbnail reads: async I/O, never block UI. | §11 |

---

## IMPLEMENTATION ORDER (Recommended)

```
Phase 0  (scaffold)
   ↓
Phase 1  (data models) — independent, build first
   ↓
Phase 2  (library import) — depends on Song model
   ↓
Phase 3  (persistence) — depends on all models being serialisable
   ↓
Phase 4  (queue manager) — depends on Playlist + Queue models
   ↓
Phase 5  (history) — depends on Queue Manager
   ↓
Phase 6  (playback engine) — mostly independent, can start after Phase 1
   ↓
Phase 7  (lyrics) — depends on Song model, executed by engine
   ↓
Phase 8  (control behaviours) — integrates engine + queue + history + lyrics
   ↓
Phase 9  (UI) — builds on everything above
   ↓
Phase 10 (background / OS integration) — last, platform‑specific
   ↓
Phase 11 (error handling) — ongoing, but dedicated pass after integration
   ↓
Phase 12 (performance) — measure first, optimise only where needed
```

**Parallel tracks possible**:
- Phase 1 + Phase 2 can be built together
- Phase 6 can start once Phase 1 models are done (no need to wait for import/persistence)
- Phase 7 can start once Phase 1 models are done
- Phase 11 (error handling) should be woven into each phase, not left for the end

---

## TESTING STRATEGY

- **Unit tests** for all data models (Phase 1), queue manager (Phase 4), history (Phase 5), lyrics parser (Phase 7).
- **Integration tests** for folder import (Phase 2), persistence round‑trip (Phase 3).
- **Manual testing** for playback engine (Phase 6) — test with 5‑second and 5‑minute files.
- **State transition tests** for playback engine — verify every valid/invalid transition.
- **End‑to‑end**: import folder → play → next → previous → shuffle → seek → pause → stop → close → reopen → verify state.

**Test audio files**: create or check in a `test/fixtures/` directory with:
- `test.mp3` (5s, with embedded cover)
- `test.flac` (5s, no cover, with sidecar `test.jpg`)
- `test.ogg` (5s, sidecar `test.lrc`)
- `corrupted.mp3` (intentionally broken bytes)
- `unsupported.wav` (support depends on format list)

---

## DEPENDENCY DECISIONS (To Be Made)

| Decision | Options | Suggested |
|----------|---------|-----------|
| Language | Python / Rust / C++ / C# | — |
| Audio backend | miniaudio, SDL2, Qt Multimedia, ffmpeg | — |
| GUI toolkit | PySide6, Qt6, egui, iced, Tauri | — |
| Tag library | TagLib, mutagen, lofty | — |
| Persistence | JSON file (plan default) / SQLite | JSON (per plan §9.2) |
| OS media session | platform APIs / dbus (MPRIS) / SMTC | — |
| File watcher | `inotify` / `ReadDirectoryChangesW` / polling | — |

**Fill these in before Phase 0.** Changing later is costly.

---

## PLAN.md CROSS‑REFERENCE

| Phase | Plan Sections |
|-------|---------------|
| Phase 1 — Models | §2.1–2.4 |
| Phase 2 — Import | §3.1–3.3 |
| Phase 3 — Persistence | §9.1–9.3 |
| Phase 4 — Queue | §5.1–5.6 |
| Phase 5 — History | §4.4, §5.5, §8.5 |
| Phase 6 — Engine | §4.1–4.3, §8.6 |
| Phase 7 — Lyrics | §6.1–6.3 |
| Phase 8 — Controls | §8.1–8.10 |
| Phase 9 — UI | (implied by all other sections) |
| Phase 10 — Background | §7.1–7.3 |
| Phase 11 — Errors | §10 |
| Phase 12 — Performance | §11 |
