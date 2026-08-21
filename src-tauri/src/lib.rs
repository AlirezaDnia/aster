use serde::Serialize;
use tauri::{
    webview::{DownloadEvent, NewWindowResponse, PageLoadEvent},
    AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, Url, WebviewBuilder, WebviewUrl,
};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct TabStatePayload<'a> {
    label: &'a str,
    url: &'a str,
    title: &'a str,
    favicon: &'a str,
    is_loading: bool,
}

#[tauri::command]
async fn create_or_show_tab_webview(
    app: AppHandle,
    label: String,
    url: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let main_window = app.get_window("main").ok_or("Main window not found")?;
    let pos = LogicalPosition::new(x, y);
    let size = LogicalSize::new(width, height);

    let is_internal_page = url.starts_with("aster://") || url.is_empty() || url == "about:blank";

    if let Some(webview) = app.get_webview(&label) {
        if is_internal_page {
            let _ = webview.hide();
        } else {
            let _ = webview.set_position(pos);
            let _ = webview.set_size(size);

            if let Ok(current_url) = webview.url() {
                let current_str = current_url.as_str().trim_end_matches('/');
                let target_str = url.trim_end_matches('/');

                if current_str != target_str {
                    if let Ok(parsed_url) = Url::parse(&url) {
                        let _ = webview.navigate(parsed_url);
                    }
                }
            }

            let _ = webview.show();
            let _ = webview.set_focus();
        }

        for (name, other_webview) in app.webviews() {
            if name.starts_with("tab_") && name != label {
                let _ = other_webview.hide();
            }
        }
    } else if !is_internal_page {
        let parsed_url = Url::parse(&url).map_err(|e| e.to_string())?;
        let app_handle = app.clone();
        let app_handle_new = app.clone();
        let app_handle_download = app.clone();

        let builtin_extensions_script = r#"
            (function() {
                function applyBuiltinExtensions() {
                    const host = window.location.hostname;
                    const isAIAssistant = host.includes("chatgpt.com") || host.includes("openai.com") || host.includes("claude.ai");
                    if (isAIAssistant && !document.getElementById("builtin-ext-rtl")) {
                        const style = document.createElement("style");
                        style.id = "builtin-ext-rtl";
                        style.innerHTML = `
                            [data-message-author-role], #prompt-textarea, .markdown, article {
                                direction: auto !important;
                                text-align: start !important;
                            }
                        `;
                        document.head.appendChild(style);
                    }

                    if (!document.getElementById("builtin-ext-farsi-font")) {
                        const fontStyle = document.createElement("style");
                        fontStyle.id = "builtin-ext-farsi-font";
                        fontStyle.innerHTML = `
                            @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');
                            :lang(fa), [lang="fa"] {
                                font-family: 'Vazirmatn', sans-serif !important;
                            }
                        `;
                        document.head.appendChild(fontStyle);
                    }
                }

                window.addEventListener('DOMContentLoaded', applyBuiltinExtensions);
                const observer = new MutationObserver(applyBuiltinExtensions);
                observer.observe(document, { childList: true, subtree: true });
            })();
        "#;

        let builder = WebviewBuilder::new(&label, WebviewUrl::External(parsed_url))
            .initialization_script(builtin_extensions_script)
            .on_page_load(move |webview, payload| {
                let app = app_handle.clone();
                let label = webview.label().to_string();
                let current_url = webview
                    .url()
                    .map(|u| u.as_str().to_string())
                    .unwrap_or_default();
                let domain = webview
                    .url()
                    .ok()
                    .and_then(|u| u.host_str().map(|s| s.to_string()))
                    .unwrap_or_default();
                let favicon = format!("https://www.google.com/s2/favicons?domain={}&sz=32", domain);

                match payload.event() {
                    PageLoadEvent::Started => {
                        let _ = app.emit(
                            "tab-state-changed",
                            TabStatePayload {
                                label: &label,
                                url: &current_url,
                                title: if domain.is_empty() {
                                    "Loading..."
                                } else {
                                    &domain
                                },
                                favicon: &favicon,
                                is_loading: true,
                            },
                        );
                    }
                    PageLoadEvent::Finished => {
                        let title = if !domain.is_empty() {
                            domain.clone()
                        } else {
                            "New Tab".to_string()
                        };
                        let _ = app.emit(
                            "tab-state-changed",
                            TabStatePayload {
                                label: &label,
                                url: &current_url,
                                title: &title,
                                favicon: &favicon,
                                is_loading: false,
                            },
                        );
                    }
                }
            })
            .on_new_window(move |url, _| {
                let _ = app_handle_new.emit("open-new-tab", url.as_str());
                NewWindowResponse::Deny
            })
            .on_download(move |_webview, event| {
                let app = app_handle_download.clone();
                match event {
                    DownloadEvent::Requested { url, destination } => {
                        let file_name = destination
                            .file_name()
                            .and_then(|n| n.to_str())
                            .unwrap_or("download")
                            .to_string();

                        let _ = app.emit(
                            "download-progress",
                            serde_json::json!({
                                "id": url.as_str(),
                                "file_name": file_name,
                                "downloaded_bytes": 0,
                                "total_bytes": 0,
                                "state": "downloading"
                            }),
                        );
                        true
                    }
                    DownloadEvent::Finished { url, path, success } => {
                        let path_str = path.as_ref().map(|p| p.to_string_lossy().to_string());
                        let file_name = path
                            .as_ref()
                            .and_then(|p| p.file_name())
                            .and_then(|n| n.to_str())
                            .unwrap_or("download")
                            .to_string();

                        let _ = app.emit(
                            "download-finished",
                            serde_json::json!({
                                "id": url.as_str(),
                                "file_name": file_name,
                                "state": if success { "completed" } else { "failed" },
                                "path": path_str
                            }),
                        );
                        true
                    }
                    _ => true,
                }
            });

        let webview = main_window
            .add_child(builder, pos, size)
            .map_err(|e| e.to_string())?;

        let _ = webview.show();
        let _ = webview.set_focus();

        for (name, other_webview) in app.webviews() {
            if name.starts_with("tab_") && name != label {
                let _ = other_webview.hide();
            }
        }
    } else {
        for (name, other_webview) in app.webviews() {
            if name.starts_with("tab_") {
                let _ = other_webview.hide();
            }
        }
    }

    Ok(())
}

#[tauri::command]
async fn pause_download(app: AppHandle, id: String) -> Result<(), String> {
    let _ = app.emit(
        "download-state-changed",
        serde_json::json!({ "id": id, "state": "paused" }),
    );
    Ok(())
}

#[tauri::command]
async fn resume_download(app: AppHandle, id: String) -> Result<(), String> {
    let _ = app.emit(
        "download-state-changed",
        serde_json::json!({ "id": id, "state": "downloading" }),
    );
    Ok(())
}

#[tauri::command]
async fn cancel_download(app: AppHandle, id: String) -> Result<(), String> {
    let _ = app.emit(
        "download-finished",
        serde_json::json!({ "id": id, "state": "cancelled" }),
    );
    Ok(())
}

#[tauri::command]
async fn show_in_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        let path_obj = std::path::Path::new(&path);
        if let Some(parent) = path_obj.parent() {
            std::process::Command::new("xdg-open")
                .arg(parent)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
async fn hide_tab_webview(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&label) {
        webview.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn close_tab_webview(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&label) {
        webview.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn webview_go_back(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&label) {
        let _ = webview.eval("window.history.back()");
    }
    Ok(())
}

#[tauri::command]
async fn webview_go_forward(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&label) {
        let _ = webview.eval("window.history.forward()");
    }
    Ok(())
}

#[tauri::command]
async fn webview_reload(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&label) {
        let _ = webview.eval("window.location.reload()");
    }
    Ok(())
}

#[tauri::command]
async fn set_webview_zoom(app: AppHandle, label: String, factor: f64) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&label) {
        let js = format!("document.body.style.zoom = '{}';", factor);
        let _ = webview.eval(&js);
    }
    Ok(())
}

#[tauri::command]
async fn eval_webview_script(app: AppHandle, label: String, script: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&label) {
        let _ = webview.eval(&script);
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
            pause_download,
            resume_download,
            cancel_download,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
