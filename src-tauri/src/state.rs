use serde::{Deserialize, Serialize};

// Phase 1 data models — stubs for now

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Song {
    pub id: String,
    pub file_path: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration: f64,
    pub thumbnail_path: String,
    pub lyrics_path: String,
    pub format: String,
    pub embedded_cover: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Playlist {
    pub id: String,
    pub name: String,
    pub song_ids: Vec<String>,
    pub is_library: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Queue {
    pub items: Vec<String>,
    pub next_index: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PlaybackStatus {
    Playing,
    Paused,
    Stopped,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RepeatMode {
    Off,
    One,
    All,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppState {
    pub current_song_id: Option<String>,
    pub playback_status: PlaybackStatus,
    pub position: f64,
    pub volume: f64,
    pub muted: bool,
    pub shuffle_enabled: bool,
    pub repeat_mode: RepeatMode,
    pub active_playlist_id: Option<String>,
    pub shuffled_sequence: Option<Vec<usize>>,
    pub history: Vec<HistoryEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub playlist_id: String,
    pub song_id: String,
    pub position: f64,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            current_song_id: None,
            playback_status: PlaybackStatus::Stopped,
            position: 0.0,
            volume: 0.8,
            muted: false,
            shuffle_enabled: false,
            repeat_mode: RepeatMode::Off,
            active_playlist_id: None,
            shuffled_sequence: None,
            history: Vec::new(),
        }
    }
}
