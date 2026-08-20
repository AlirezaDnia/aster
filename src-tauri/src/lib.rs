use serde::Serialize;
use tauri::{
    webview::NewWindowResponse, AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, Url,
    WebviewBuilder, WebviewUrl,
};

#[derive(Clone, Serialize)]
struct TabStatePayload<'a> {
    label: &'a str,
    url: &'a str,
    title: &'a str,
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

    // مخفی‌سازی بقیه تب‌ها برای بهینه‌سازی GPU
    for (name, webview) in app.webviews() {
        if name.starts_with("tab_") && name != label {
            let _ = webview.hide();
        }
    }

    let pos = LogicalPosition::new(x, y);
    let size = LogicalSize::new(width, height);

    if let Some(webview) = app.get_webview(&label) {
        webview.set_position(pos).map_err(|e| e.to_string())?;
        webview.set_size(size).map_err(|e| e.to_string())?;

        if !url.is_empty() && url != "about:blank" {
            if let Ok(current_url) = webview.url() {
                if current_url.as_str() != url {
                    if let Ok(parsed_url) = Url::parse(&url) {
                        let _ = webview.navigate(parsed_url);
                    }
                }
            }
        }
        webview.show().map_err(|e| e.to_string())?;
    } else if !url.is_empty() {
        let parsed_url = Url::parse(&url).map_err(|e| e.to_string())?;
        let app_handle_nav = app.clone();
        let app_handle_new_window = app.clone();
        let tab_label = label.clone();

        let init_script = format!(
            r#"
            (function() {{
                const tabLabel = '{}';

                const origOpen = window.open;
                window.open = function(url, target, features) {{
                    if (url) {{
                        window.__TAURI_INTERNALS__.invoke('plugin:event|emit', {{
                            event: 'open-new-tab',
                            payload: new URL(url, window.location.href).href
                        }});
                        return null;
                    }}
                    return origOpen.apply(this, arguments);
                }};

                function sendState() {{
                    window.__TAURI_INTERNALS__.invoke('plugin:event|emit', {{
                        event: 'tab-state-changed',
                        payload: {{
                            label: tabLabel,
                            url: window.location.href,
                            title: document.title || window.location.hostname
                        }}
                    }});
                }}

                const titleObserver = new MutationObserver(() => sendState());
                if (document.querySelector('title')) {{
                    titleObserver.observe(document.querySelector('title'), {{ childList: true, characterData: true, subtree: true }});
                }}

                const origPushState = history.pushState;
                history.pushState = function() {{
                    origPushState.apply(this, arguments);
                    sendState();
                }};

                const origReplaceState = history.replaceState;
                history.replaceState = function() {{
                    origReplaceState.apply(this, arguments);
                    sendState();
                }};

                window.addEventListener('popstate', sendState);
                window.addEventListener('load', sendState);
                document.addEventListener('DOMContentLoaded', sendState);
            }})();
            "#,
            label
        );

        let builder = WebviewBuilder::new(&label, WebviewUrl::External(parsed_url))
            .initialization_script(&init_script)
            .on_navigation(move |nav_url| {
                let _ = app_handle_nav.emit(
                    "tab-state-changed",
                    TabStatePayload {
                        label: &tab_label,
                        url: nav_url.as_str(),
                        title: nav_url.host_str().unwrap_or("Loading..."),
                    },
                );
                true
            })
            .on_new_window(move |url, _| {
                let _ = app_handle_new_window.emit("open-new-tab", url.as_str());
                NewWindowResponse::Deny
            });

        let webview = main_window
            .add_child(builder, pos, size)
            .map_err(|e| e.to_string())?;

        webview.show().map_err(|e| e.to_string())?;
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
