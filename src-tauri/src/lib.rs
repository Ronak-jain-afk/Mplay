use std::fs;
use std::sync::Mutex;
use tauri::Manager;
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};

mod media;
mod persistence;
mod scanner;
mod state;

use media::MediaState;

#[tauri::command]
fn load_state(app: tauri::AppHandle) -> Result<persistence::SaveData, String> {
    let path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    persistence::load(&path.join("state.json"))
}

#[tauri::command]
fn save_state(app: tauri::AppHandle, data: persistence::SaveData) -> Result<(), String> {
    let path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    persistence::save(&path.join("state.json"), &data)
}

#[tauri::command]
fn get_app_data_path(app: tauri::AppHandle) -> Result<String, String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    fs::create_dir_all(path.join("covers")).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn import_folder(path: String, app: tauri::AppHandle) -> Result<Vec<state::Song>, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let covers_dir = app_data.join("covers");
    fs::create_dir_all(&covers_dir).map_err(|e| e.to_string())?;

    let dir = std::path::Path::new(&path);
    if !dir.exists() {
        return Err("Directory does not exist".to_string());
    }

    scanner::scan_directory(dir, &covers_dir)
}

#[tauri::command]
fn update_media_metadata(
    state: tauri::State<'_, MediaState>,
    title: String,
    artist: String,
    album: String,
    thumbnail_path: String,
    duration: f64,
) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(controls) = guard.as_mut() {
        media::update_metadata(controls, &title, &artist, &album, &thumbnail_path, duration);
    }
    Ok(())
}

#[tauri::command]
fn set_playback_status(
    state: tauri::State<'_, MediaState>,
    status: String,
    position: f64,
) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(controls) = guard.as_mut() {
        media::update_playback(controls, &status, position);
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_app_data_path,
            import_folder,
            load_state,
            save_state,
            update_media_metadata,
            set_playback_status,
        ])
        .setup(|app| {
            let show_hide = MenuItemBuilder::with_id("show_hide", "Show/Hide").build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "Quit mplay").build(app)?;
            let menu = MenuBuilder::new(app)
                .item(&show_hide)
                .separator()
                .item(&quit)
                .build()?;

            TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("mplay")
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "show_hide" => {
                            if let Some(window) = app.get_webview_window("main") {
                                if window.is_visible().unwrap_or(false) {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            app.manage(MediaState(Mutex::new(media::create_media_controls(app.handle()))));

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|_app_handle, event| {
        if let tauri::RunEvent::Ready = event {
            if let Ok(path) = _app_handle.path().app_data_dir() {
                let _ = fs::create_dir_all(&path);
                let _ = fs::create_dir_all(path.join("covers"));
            }
        }
    });
}
