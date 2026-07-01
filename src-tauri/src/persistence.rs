use crate::state::{AppState, Playlist, Song};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveData {
    pub songs: Vec<Song>,
    pub playlists: Vec<Playlist>,
    pub app_state: AppState,
}

pub fn save(path: &Path, data: &SaveData) -> Result<(), String> {
    let json = serde_json::to_string_pretty(data).map_err(|e| e.to_string())?;
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, &json).map_err(|e| e.to_string())?;
    fs::rename(&tmp, path).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn load(path: &Path) -> Result<SaveData, String> {
    if !path.exists() {
        return Ok(SaveData {
            songs: Vec::new(),
            playlists: Vec::new(),
            app_state: AppState::default(),
        });
    }

    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    match serde_json::from_str::<SaveData>(&content) {
        Ok(data) => Ok(data),
        Err(_) => {
            let backup = path.with_extension("json.bak");
            let _ = fs::copy(path, &backup);
            eprintln!("Corrupted state.json, backed up to state.json.bak");
            Ok(SaveData {
                songs: Vec::new(),
                playlists: Vec::new(),
                app_state: AppState::default(),
            })
        }
    }
}
