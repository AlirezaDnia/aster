pub mod models {
    pub mod payloads;
}
pub mod services {
    pub mod download;
    pub mod webview;
}
pub mod state;

use services::download::*;
use services::webview::*;
use state::DownloadState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(DownloadState::default())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            create_or_show_tab_webview,
            hide_tab_webview,
            close_tab_webview,
            webview_go_back,
            webview_go_forward,
            webview_reload,
            set_webview_zoom,
            eval_webview_script,
            show_in_folder,
            start_custom_download,
            cancel_download,
            pause_download,
            resume_download,
            update_tab_title,
            webview_stop,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
