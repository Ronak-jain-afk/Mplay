use crate::state::Song;
use lofty::prelude::Accessor;
use lofty::file::AudioFile;
use lofty::file::TaggedFileExt;
use lofty::probe::Probe;
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

const AUDIO_EXTENSIONS: &[&str] = &["mp3", "m4a", "flac", "ogg", "opus", "wav", "wma", "aac"];
const IMAGE_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "webp"];
const COVER_NAMES: &[&str] = &["cover", "folder", "albumart", "front"];

fn file_id(path: &Path) -> String {
    let abs = fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf());
    let hash = Sha256::digest(abs.to_string_lossy().as_bytes());
    hex::encode(&hash[..8])
}

fn is_audio_file(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| AUDIO_EXTENSIONS.contains(&e.to_lowercase().as_str()))
        .unwrap_or(false)
}

fn read_tags(path: &Path) -> (String, String, String, f64) {
    let probe = match Probe::open(path) {
        Ok(p) => p,
        Err(_) => {
            let title = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Unknown")
                .to_string();
            return (title, String::new(), String::new(), 0.0);
        }
    };
    let tagged_file = match probe.read() {
        Ok(f) => f,
        Err(_) => {
            let title = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Unknown")
                .to_string();
            return (title, String::new(), String::new(), 0.0);
        }
    };

    let props = tagged_file.properties();
    let tags = tagged_file.tags();

    let title = tags
        .first()
        .and_then(|t| t.title())
        .unwrap_or_default()
        .to_string();
    let artist = tags
        .first()
        .and_then(|t| t.artist())
        .unwrap_or_default()
        .to_string();
    let album = tags
        .first()
        .and_then(|t| t.album())
        .unwrap_or_default()
        .to_string();
    let duration = props.duration().as_secs_f64();

    let title = if title.is_empty() {
        path.file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Unknown")
            .to_string()
    } else {
        title
    };

    (title, artist, album, duration)
}

fn extract_embedded_cover(path: &Path, covers_dir: &Path, song_id: &str) -> Option<String> {
    let probe = Probe::open(path).ok()?;
    let tagged_file = probe.read().ok()?;

    for tag in tagged_file.tags() {
        for picture in tag.pictures() {
            let ext = match picture.mime_type() {
                Some(lofty::picture::MimeType::Jpeg) => "jpg",
                Some(lofty::picture::MimeType::Png) => "png",
                _ => "jpg",
            };
            let cover_path = covers_dir.join(format!("{}.{}", song_id, ext));
            if fs::write(&cover_path, picture.data()).is_ok() {
                return Some(cover_path.to_string_lossy().to_string());
            }
        }
    }

    None
}

fn find_sidecar_thumbnail(path: &Path) -> Option<String> {
    let parent = path.parent()?;
    let stem = path.file_stem()?.to_str()?;

    for ext in IMAGE_EXTENSIONS {
        let candidate = parent.join(format!("{}.{}", stem, ext));
        if candidate.exists() {
            return Some(candidate.to_string_lossy().to_string());
        }
    }

    for name in COVER_NAMES {
        for ext in IMAGE_EXTENSIONS {
            let candidate = parent.join(format!("{}.{}", name, ext));
            if candidate.exists() {
                return Some(candidate.to_string_lossy().to_string());
            }
        }
    }

    None
}

fn find_lyrics(path: &Path) -> Option<String> {
    let parent = path.parent()?;
    let stem = path.file_stem()?.to_str()?;

    for ext in &["lrc", "txt"] {
        let candidate = parent.join(format!("{}.{}", stem, ext));
        if candidate.exists() {
            return Some(candidate.to_string_lossy().to_string());
        }
    }

    None
}

pub fn scan_directory(path: &Path, covers_dir: &Path) -> Result<Vec<Song>, String> {
    let mut songs = Vec::new();

    let entries: Vec<PathBuf> = WalkDir::new(path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
        .map(|e| e.path().to_path_buf())
        .filter(|p| is_audio_file(p))
        .collect();

    for file_path in entries {
        let id = file_id(&file_path);
        let format = file_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        let (title, artist, album, duration) = read_tags(&file_path);

        let thumbnail_path = extract_embedded_cover(&file_path, covers_dir, &id)
            .or_else(|| find_sidecar_thumbnail(&file_path))
            .unwrap_or_default();

        let embedded_cover = !thumbnail_path.is_empty()
            && (covers_dir.join(format!("{}.jpg", &id)).exists()
                || covers_dir.join(format!("{}.png", &id)).exists());

        let lyrics_path = find_lyrics(&file_path).unwrap_or_default();

        songs.push(Song {
            id,
            file_path: file_path.to_string_lossy().to_string(),
            title,
            artist,
            album,
            duration,
            thumbnail_path,
            lyrics_path,
            format,
            embedded_cover,
        });
    }

    songs.sort_by(|a, b| {
        a.artist
            .cmp(&b.artist)
            .then_with(|| a.album.cmp(&b.album))
            .then_with(|| a.title.cmp(&b.title))
    });

    Ok(songs)
}
