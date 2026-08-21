use crate::models::payloads::TabStatePayload;
use crate::services::download::execute_download;
use crate::state::DownloadState;
use tauri::{
    webview::{DownloadEvent, NewWindowResponse, PageLoadEvent},
    AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, Url, WebviewBuilder, WebviewUrl,
};

#[tauri::command]
pub async fn create_or_show_tab_webview(
    app: AppHandle,
    state: tauri::State<'_, DownloadState>,
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
        let download_state = state.inner().clone();

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
            .on_download(move |_webview, event| match event {
                DownloadEvent::Requested { url, destination } => {
                    let file_name = destination
                        .file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("download")
                        .to_string();

                    let download_url = url.as_str().to_string();
                    let app_inner = _webview.app_handle().clone();
                    let state_inner = download_state.clone();

                    tauri::async_runtime::spawn(async move {
                        let _ =
                            execute_download(app_inner, state_inner, download_url, file_name).await;
                    });

                    false
                }
                _ => true,
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
pub async fn hide_tab_webview(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&label) {
        webview.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn close_tab_webview(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&label) {
        webview.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn webview_go_back(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&label) {
        let _ = webview.eval("window.history.back()");
    }
    Ok(())
}

#[tauri::command]
pub async fn webview_go_forward(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&label) {
        let _ = webview.eval("window.history.forward()");
    }
    Ok(())
}

#[tauri::command]
pub async fn webview_reload(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&label) {
        let _ = webview.eval("window.location.reload()");
    }
    Ok(())
}

#[tauri::command]
pub async fn webview_stop(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&label) {
        let _ = webview.eval("window.stop()");
    }
    Ok(())
}

#[tauri::command]
pub async fn set_webview_zoom(app: AppHandle, label: String, factor: f64) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&label) {
        let js = format!("document.body.style.zoom = '{}';", factor);
        let _ = webview.eval(&js);
    }
    Ok(())
}

#[tauri::command]
pub async fn eval_webview_script(
    app: AppHandle,
    label: String,
    script: String,
) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&label) {
        let _ = webview.eval(&script);
    }
    Ok(())
}
