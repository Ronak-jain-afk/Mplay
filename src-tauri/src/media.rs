use souvlaki::{MediaControlEvent, MediaControls, MediaMetadata, MediaPlayback, MediaPosition, PlatformConfig};
use std::sync::Mutex;
use tauri::Emitter;
use tauri::Manager;

pub struct MediaState(pub Mutex<Option<MediaControls>>);

pub fn create_media_controls(app_handle: &tauri::AppHandle) -> Option<MediaControls> {
    let hwnd = app_handle.get_webview_window("main").and_then(|w| {
        #[cfg(target_os = "windows")]
        {
            w.hwnd().ok().map(|h| h.0 as *mut std::ffi::c_void)
        }
        #[cfg(not(target_os = "windows"))]
        {
            let _ = w;
            None
        }
    });

    let config = PlatformConfig {
        dbus_name: "mplay",
        display_name: "mplay",
        hwnd,
    };

    let app = app_handle.clone();
    let mut controls = MediaControls::new(config).ok()?;

    controls
        .attach(move |event| {
            let payload = match event {
                MediaControlEvent::Play => "play",
                MediaControlEvent::Pause => "pause",
                MediaControlEvent::Toggle => "toggle",
                MediaControlEvent::Next => "next",
                MediaControlEvent::Previous => "previous",
                MediaControlEvent::Stop => "stop",
                _ => return,
            };
            let _ = app.emit("media-command", payload);
        })
        .ok()?;

    Some(controls)
}

pub fn update_metadata(
    controls: &mut MediaControls,
    title: &str,
    artist: &str,
    album: &str,
    thumbnail_path: &str,
    duration: f64,
) {
    let cover_url = if thumbnail_path.is_empty() {
        None
    } else {
        Some(format!("file://{}", thumbnail_path))
    };

    let _ = controls.set_metadata(MediaMetadata {
        title: Some(title),
        artist: Some(artist),
        album: if album.is_empty() { None } else { Some(album) },
        cover_url: cover_url.as_deref(),
        duration: Some(std::time::Duration::from_secs_f64(duration)),
    });
}

pub fn update_playback(controls: &mut MediaControls, status: &str, position: f64) {
    let progress = Some(MediaPosition(std::time::Duration::from_secs_f64(position)));
    let playback = match status {
        "Playing" => MediaPlayback::Playing { progress },
        "Paused" => MediaPlayback::Paused { progress },
        _ => MediaPlayback::Stopped,
    };
    let _ = controls.set_playback(playback);
}
