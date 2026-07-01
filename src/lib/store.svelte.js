import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { getNextTrackId } from "./queue-manager.svelte.js";

let saveTimeout = null;
const SAVE_DELAY = 1000;
let audio = null;
let loadedSongId = null;
let skipCooldown = 0;
let errorSkipCount = 0;
const lyricsCache = new Map();

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => flushSave(), SAVE_DELAY);
}

async function flushSave() {
  saveTimeout = null;
  try {
    const pl = library.playlists.find((p) => p.id === playerState.activePlaylistId);
    await invoke("save_state", {
      data: {
        songs: library.songs,
        playlists: library.playlists,
        app_state: {
          current_song_id: playerState.currentSongId,
          playback_status: playerState.playbackStatus,
          position: playerState.position,
          volume: playerState.volume,
          muted: playerState.muted,
          shuffle_enabled: playerState.shuffleEnabled,
          repeat_mode: playerState.repeatMode,
          active_playlist_id: playerState.activePlaylistId,
          shuffled_sequence: playerState.shuffledSequence,
          history: playerState.history,
        },
      },
    });
  } catch (e) {
    console.error("Save failed:", e);
  }
}

// ── Player state ──
export const playerState = $state({
  currentSongId: null,
  playbackStatus: "Stopped",
  position: 0,
  volume: 0.8,
  muted: false,
  shuffleEnabled: false,
  repeatMode: "Off",
  activePlaylistId: null,
  duration: 0,
  shuffledSequence: [],
  currentSequenceIndex: 0,
  history: [],
});

$effect(() => {
  playerState.volume;
  playerState.muted;
  playerState.shuffleEnabled;
  playerState.repeatMode;
  playerState.currentSongId;
  playerState.playbackStatus;
  playerState.position;
  playerState.shuffledSequence;
  scheduleSave();
});

// ── Library ──
export const library = $state({
  songs: [],
  playlists: [],
  activePlaylistId: null,
  searchQuery: "",
});

$effect(() => {
  library.songs;
  library.playlists;
  library.activePlaylistId;
  scheduleSave();
});

// ── Queue ──
export const queue = $state({
  items: [],
  nextIndex: null,
});

// ── Lyric display ──
export const lyrics = $state({
  synced: [],
  plain: "",
  currentLine: "",
  currentIndex: -1,
});

$effect(() => {
  if (playerState.currentSongId) {
    loadLyrics(playerState.currentSongId);
  }
});

$effect(() => {
  const pos = playerState.position;
  const lines = lyrics.synced;
  if (!lines.length) return;
  // binary search for the last line whose time <= pos
  let lo = 0, hi = lines.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lines[mid].time <= pos) lo = mid;
    else hi = mid - 1;
  }
  const idx = lines[lo].time <= pos ? lo : -1;
  if (idx !== lyrics.currentIndex) {
    lyrics.currentIndex = idx;
    lyrics.currentLine = idx >= 0 ? lines[idx].text : "";
  }
});

// ── UI state ──
export const ui = $state({
  sidebarActive: "library",
  importProgress: null,
  appDataPath: "",
});

// ── Audio element setup ──
function initAudio() {
  audio = new Audio();
  audio.preload = "auto";

  audio.addEventListener("timeupdate", () => {
    if (!isNaN(audio.currentTime)) {
      playerState.position = audio.currentTime;
    }
  });

  audio.addEventListener("loadedmetadata", () => {
    errorSkipCount = 0;
    if (!isNaN(audio.duration)) {
      playerState.duration = audio.duration;
    }
  });

  audio.addEventListener("play", () => { errorSkipCount = 0; });

  audio.addEventListener("ended", () => {
    nextTrack();
  });

  audio.addEventListener("error", () => {
    errorSkipCount++;
    if (errorSkipCount <= 3) {
      console.error("Audio error, skipping to next track");
      nextTrack();
    } else {
      console.error("Audio error, stopping after 3 consecutive skips");
      playerState.playbackStatus = "Stopped";
      errorSkipCount = 0;
    }
  });
}

// ── Lyrics ──
function parseLRC(text) {
  const lines = text.split("\n");
  const synced = [];
  for (const line of lines) {
    const match = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/);
    if (match) {
      const time = parseInt(match[1]) * 60 + parseFloat(match[2]);
      const content = match[3].trim();
      if (content) synced.push({ time, text: content });
    }
  }
  return synced;
}

async function loadLyrics(songId) {
  lyrics.synced = [];
  lyrics.plain = "";
  lyrics.currentLine = "";
  lyrics.currentIndex = -1;

  const cached = lyricsCache.get(songId);
  if (cached) {
    lyrics.synced = cached.synced;
    lyrics.plain = cached.plain;
    return;
  }

  const song = library.songs.find((s) => s.id === songId);
  if (!song?.lyricsPath) return;

  try {
    const url = convertFileSrc(song.lyricsPath);
    const res = await fetch(url);
    const text = await res.text();

    const parsed = parseLRC(text);
    if (parsed.length > 0) {
      lyrics.synced = parsed;
      lyricsCache.set(songId, { synced: parsed, plain: "" });
    } else {
      lyrics.plain = text.trim();
      lyricsCache.set(songId, { synced: [], plain: text.trim() });
    }
  } catch (e) {
    console.error("Failed to load lyrics:", e);
  }
}

// ── Init ──
export async function initApp() {
  initAudio();

  try {
    const path = await invoke("get_app_data_path");
    ui.appDataPath = path;
  } catch (e) {
    console.error("Failed to get app data path:", e);
  }

  try {
    const saved = await invoke("load_state");
    if (saved.songs?.length) {
      library.songs = saved.songs;
      library.playlists = saved.playlists || [];
      library.activePlaylistId = saved.app_state?.active_playlist_id || null;
    }
    if (saved.app_state) {
      const s = saved.app_state;
      playerState.currentSongId = s.current_song_id;
      playerState.playbackStatus = s.playback_status;
      playerState.position = s.position;
      playerState.volume = s.volume;
      playerState.muted = s.muted;
      playerState.shuffleEnabled = s.shuffle_enabled;
      playerState.repeatMode = s.repeat_mode;
      playerState.activePlaylistId = s.active_playlist_id;
      if (s.shuffled_sequence) playerState.shuffledSequence = s.shuffled_sequence;
      if (s.history) playerState.history = s.history;
    }
  } catch (e) {
    console.error("Failed to load state:", e);
  }
}

// ── Import ──
export async function importFolder() {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({ directory: true, multiple: false, title: "Import music folder" });
  if (!selected) return;

  ui.importProgress = "Scanning...";
  try {
    const songs = await invoke("import_folder", { path: selected });
    library.songs = songs;
    playerState.activePlaylistId = "library";
    library.playlists = [
      { id: "library", name: "Library", songIds: songs.map((s) => s.id), isLibrary: true },
    ];
    ui.importProgress = null;
  } catch (e) {
    console.error("Import failed:", e);
    ui.importProgress = null;
  }
}

// ── Playback controls ──
function updateOSStatus() {
  invoke("set_playback_status", {
    status: playerState.playbackStatus,
    position: playerState.position,
  }).catch(() => {});
}

export function play() {
  if (playerState.playbackStatus === "Paused") {
    audio?.play().catch(console.error);
    playerState.playbackStatus = "Playing";
    updateOSStatus();
    return;
  }
  if (playerState.currentSongId && loadedSongId !== playerState.currentSongId) {
    loadTrack(playerState.currentSongId);
  } else if (!playerState.currentSongId) {
    const ids = library.playlists.find((p) => p.id === playerState.activePlaylistId)?.songIds;
    if (!ids?.length) return;
    loadTrack(ids[0]);
  }
  if (!playerState.currentSongId) return;
  audio?.play().catch(console.error);
  playerState.playbackStatus = "Playing";
  updateOSStatus();
}

export function pause() {
  if (playerState.playbackStatus === "Playing") {
    audio?.pause();
    playerState.playbackStatus = "Paused";
    updateOSStatus();
  }
}

export function togglePlay() {
  if (playerState.playbackStatus === "Playing") pause();
  else play();
}

function pushHistory() {
  if (playerState.currentSongId) {
    playerState.history.push({
      playlistId: playerState.activePlaylistId,
      songId: playerState.currentSongId,
      position: playerState.position,
    });
    if (playerState.history.length > 100) playerState.history.shift();
  }
}

function loadTrack(songId) {
  const song = library.songs.find((s) => s.id === songId);
  if (!song) return;
  playerState.currentSongId = songId;
  playerState.position = 0;
  if (audio) {
    audio.src = convertFileSrc(song.path);
    loadedSongId = songId;
  }
  invoke("update_media_metadata", {
    title: song.title,
    artist: song.artist || "Unknown",
    album: song.album || "",
    thumbnailPath: song.thumbnailPath || "",
    duration: song.duration,
  }).catch(() => {});
}

export function nextTrack() {
  const now = Date.now();
  if (now - skipCooldown < 200) return;
  skipCooldown = now;
  const nextId = getNextTrackId();
  if (!nextId) {
    playerState.playbackStatus = "Stopped";
    return;
  }
  pushHistory();
  loadTrack(nextId);
  if (playerState.playbackStatus === "Playing" || playerState.playbackStatus === "Stopped") {
    playerState.playbackStatus = "Playing";
    audio?.play().catch(console.error);
  }
}

export function previousTrack() {
  const now = Date.now();
  if (now - skipCooldown < 200) return;
  skipCooldown = now;
  if (playerState.position > 3 && playerState.currentSongId) {
    playerState.position = 0;
    if (audio) audio.currentTime = 0;
    return;
  }
  while (playerState.history.length > 0) {
    const entry = playerState.history.pop();
    if (library.songs.some((s) => s.id === entry.songId)) {
      loadTrack(entry.songId);
      playerState.position = entry.position;
      playerState.activePlaylistId = entry.playlistId;
      playerState.playbackStatus = "Playing";
      audio.currentTime = entry.position;
      audio?.play().catch(console.error);
      return;
    }
  }
}

export function selectTrack(songId) {
  if (songId === playerState.currentSongId) return;
  const wasPlaying = playerState.playbackStatus === "Playing";
  pushHistory();
  loadTrack(songId);
  playerState.playbackStatus = wasPlaying ? "Playing" : "Paused";
  if (wasPlaying) {
    audio?.play().catch(console.error);
  }
}

export function seek(position) {
  const pos = Math.max(0, Math.min(position, playerState.duration));
  playerState.position = pos;
  if (audio) audio.currentTime = pos;
}

export function setVolume(v) {
  playerState.volume = Math.max(0, Math.min(1, v));
  if (playerState.muted) playerState.muted = false;
  if (audio) {
    audio.volume = playerState.volume;
    audio.muted = false;
  }
}

export function toggleMute() {
  playerState.muted = !playerState.muted;
  if (audio) audio.muted = playerState.muted;
}

// ── Playlist management ──
export function createPlaylist(name) {
  const id = crypto.randomUUID();
  library.playlists.push({ id, name, songIds: [], isLibrary: false });
  ui.sidebarActive = id;
  playerState.activePlaylistId = id;
}

export function deletePlaylist(id) {
  const pl = library.playlists.find((p) => p.id === id);
  if (!pl || pl.isLibrary) return;
  library.playlists = library.playlists.filter((p) => p.id !== id);
  if (ui.sidebarActive === id) {
    ui.sidebarActive = "library";
    playerState.activePlaylistId = "library";
  }
}

export function addToPlaylist(playlistId, songId) {
  const pl = library.playlists.find((p) => p.id === playlistId);
  if (!pl || pl.songIds.includes(songId)) return;
  pl.songIds = [...pl.songIds, songId];
}

export function removeFromPlaylist(playlistId, songId) {
  const pl = library.playlists.find((p) => p.id === playlistId);
  if (!pl || pl.isLibrary) return;
  pl.songIds = pl.songIds.filter((id) => id !== songId);
}

export function setActiveView(view) {
  ui.sidebarActive = view;
  if (view === "library" || library.playlists.some((p) => p.id === view)) {
    playerState.activePlaylistId = view;
  }
}
