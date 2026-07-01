export interface Song {
  id: string;
  filePath: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  thumbnailPath: string;
  lyricsPath: string;
  format: string;
  embeddedCover: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  isLibrary: boolean;
}

export interface Queue {
  items: string[];
  nextIndex: number | null;
}

export type PlaybackStatus = "Playing" | "Paused" | "Stopped";
export type RepeatMode = "Off" | "One" | "All";

export interface PlayerState {
  currentSongId: string | null;
  playbackStatus: PlaybackStatus;
  position: number;
  volume: number;
  muted: boolean;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  activePlaylistId: string | null;
  duration: number;
}

export interface HistoryEntry {
  playlistId: string;
  songId: string;
  position: number;
}
