use serde::Serialize;
use tauri::{
    webview::{NewWindowResponse, PageLoadEvent},
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

    // ۱. اگر وب‌ویو نیتیو از قبل وجود دارد
    if let Some(webview) = app.get_webview(&label) {
        if is_internal_page {
            // برای صفحات داخلی، وب‌ویو نیتیو را مخفی می‌کنیم تا UI اصلی (React) دیده شود
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

        // مخفی‌سازی سایر تب‌ها
        for (name, other_webview) in app.webviews() {
            if name.starts_with("tab_") && name != label {
                let _ = other_webview.hide();
            }
        }
    }
    // ۲. اگر وب‌ویو وجود ندارد و آدرس یک وب‌سایت واقعی (غیر داخلی) است
    else if !is_internal_page {
        let parsed_url = Url::parse(&url).map_err(|e| e.to_string())?;
        let app_handle = app.clone();
        let app_handle_new = app.clone();

        // اسکریپت اکستنشن‌های داخلی پیش‌فرض (RTL هوشمند و فونت فارسی)
        let builtin_extensions_script = r#"
            (function() {
                function applyBuiltinExtensions() {
                    const host = window.location.hostname;

                    // اکستنشن ۱: اصلاح جهت متن RTL برای ChatGPT و سیستم‌های هوش مصنوعی
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

                    // اکستنشن ۲: تزریق فونت فارسی استاندارد (Vazirmatn) برای خوانایی بهتر
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
        // برای صفحات aster:// مخفی‌سازی بقیه وب‌ویوها کافی است
        for (name, other_webview) in app.webviews() {
            if name.starts_with("tab_") {
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
