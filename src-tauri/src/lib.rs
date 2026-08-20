use serde::Serialize;
use tauri::{
    webview::NewWindowResponse, AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, Url,
    WebviewBuilder, WebviewUrl,
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

    if let Some(webview) = app.get_webview(&label) {
        webview.set_position(pos).map_err(|e| e.to_string())?;
        webview.set_size(size).map_err(|e| e.to_string())?;

        if !url.is_empty() && url != "about:blank" {
            if let Ok(current_url) = webview.url() {
                let current_str = current_url.as_str().trim_end_matches('/');
                let target_str = url.trim_end_matches('/');

                if current_str != target_str {
                    if let Ok(parsed_url) = Url::parse(&url) {
                        let _ = webview.navigate(parsed_url);
                    }
                }
            }
        }

        let _ = webview.show();
        let _ = webview.set_focus();

        for (name, other_webview) in app.webviews() {
            if name.starts_with("tab_") && name != label {
                let _ = other_webview.hide();
            }
        }
    } else if !url.is_empty() && url != "about:blank" {
        let parsed_url = Url::parse(&url).map_err(|e| e.to_string())?;
        let app_handle = app.clone();
        let app_handle_new = app.clone();
        let tab_label = label.clone();

        let builder = WebviewBuilder::new(&label, WebviewUrl::External(parsed_url))
            .on_navigation(move |nav_url| {
                let domain = nav_url.host_str().unwrap_or("").to_string();
                let favicon = format!("https://www.google.com/s2/favicons?domain={}&sz=32", domain);
                let app = app_handle.clone();
                let label_clone = tab_label.clone();
                let url_str = nav_url.as_str().to_string();

                // ۱. شروع لودینگ با عنوان موقت (دامنه)
                let _ = app.emit(
                    "tab-state-changed",
                    TabStatePayload {
                        label: &label_clone,
                        url: &url_str,
                        title: if domain.is_empty() {
                            "Loading..."
                        } else {
                            &domain
                        },
                        favicon: &favicon,
                        is_loading: true,
                    },
                );

                // ۲. پایان لودینگ پس از ۱.۵ ثانیه
                let app_finish = app.clone();
                let label_finish = label_clone.clone();
                let url_finish = url_str.clone();
                let domain_finish = domain.clone();
                let favicon_finish = favicon.clone();

                tauri::async_runtime::spawn(async move {
                    tauri::async_runtime::spawn_blocking(|| {
                        std::thread::sleep(std::time::Duration::from_millis(1500));
                    })
                    .await
                    .ok();

                    let final_title = if !domain_finish.is_empty() {
                        domain_finish
                    } else {
                        "New Tab".to_string()
                    };

                    let _ = app_finish.emit(
                        "tab-state-changed",
                        TabStatePayload {
                            label: &label_finish,
                            url: &url_finish,
                            title: &final_title,
                            favicon: &favicon_finish,
                            is_loading: false,
                        },
                    );
                });

                true
            })
            .on_new_window(move |url, _| {
                let _ = app_handle_new.emit("open-new-tab", url.as_str());
                NewWindowResponse::Deny
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
            webview_reload
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
