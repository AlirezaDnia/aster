use crate::models::payloads::{DownloadFinishedPayload, DownloadProgressPayload};
use crate::state::DownloadState;
use futures_util::StreamExt;
use reqwest::header::RANGE;
use tauri::{AppHandle, Emitter};
use tokio::io::AsyncWriteExt;

pub async fn execute_download(
    app: AppHandle,
    state: DownloadState,
    url: String,
    file_name: String,
) -> Result<(), String> {
    let downloads_dir = dirs::download_dir().ok_or("Could not find Downloads folder")?;
    let save_path = downloads_dir.join(&file_name);
    let id = url.clone();

    let app_handle = app.clone();
    let tasks = state.tasks.clone();

    // اگر تسکی از قبل بود abort میکنیم
    let mut tasks_guard = tasks.lock().await;
    if let Some(existing_task) = tasks_guard.remove(&id) {
        existing_task.abort();
    }

    let task = tokio::spawn(async move {
        // محاسبه میزان بایتی که قبلا دانلود شده (برای Resume)
        let downloaded_bytes = if save_path.exists() {
            tokio::fs::metadata(&save_path)
                .await
                .map(|m| m.len())
                .unwrap_or(0)
        } else {
            0
        };

        let client = reqwest::Client::new();
        let mut req = client.get(&url);

        if downloaded_bytes > 0 {
            req = req.header(RANGE, format!("bytes={}-", downloaded_bytes));
        }

        let res = match req.send().await {
            Ok(r) => r,
            Err(_) => {
                let _ = app_handle.emit(
                    "download-finished",
                    DownloadFinishedPayload {
                        id: url.clone(),
                        file_name: file_name.clone(),
                        state: "failed".into(),
                        path: None,
                    },
                );
                return;
            }
        };

        // محاسبه سایز کل (اگر کد پاسخ 206 Partial Content باشد، Content-Length فقط اندازه باقی‌مانده است)
        let total_bytes = if res.status() == reqwest::StatusCode::PARTIAL_CONTENT {
            downloaded_bytes + res.content_length().unwrap_or(0)
        } else {
            res.content_length().unwrap_or(0)
        };

        // باز کردن فایل در حالت Append (ادامه) یا Create (شروع از 0)
        let mut file = match tokio::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&save_path)
            .await
        {
            Ok(f) => f,
            Err(_) => {
                let _ = app_handle.emit(
                    "download-finished",
                    DownloadFinishedPayload {
                        id: url.clone(),
                        file_name: file_name.clone(),
                        state: "failed".into(),
                        path: None,
                    },
                );
                return;
            }
        };

        let mut stream = res.bytes_stream();
        let mut current_downloaded = downloaded_bytes;
        let mut last_emit = std::time::Instant::now();

        let _ = app_handle.emit(
            "download-progress",
            DownloadProgressPayload {
                id: url.clone(),
                file_name: file_name.clone(),
                downloaded_bytes: current_downloaded,
                total_bytes,
                state: "downloading".into(),
            },
        );

        while let Some(item) = stream.next().await {
            match item {
                Ok(chunk) => {
                    if file.write_all(&chunk).await.is_err() {
                        let _ = app_handle.emit(
                            "download-finished",
                            DownloadFinishedPayload {
                                id: url.clone(),
                                file_name: file_name.clone(),
                                state: "failed".into(),
                                path: None,
                            },
                        );
                        return;
                    }
                    current_downloaded += chunk.len() as u64;

                    if last_emit.elapsed().as_millis() > 100 || current_downloaded == total_bytes {
                        let _ = app_handle.emit(
                            "download-progress",
                            DownloadProgressPayload {
                                id: url.clone(),
                                file_name: file_name.clone(),
                                downloaded_bytes: current_downloaded,
                                total_bytes,
                                state: "downloading".into(),
                            },
                        );
                        last_emit = std::time::Instant::now();
                    }
                }
                Err(_) => {
                    let _ = app_handle.emit(
                        "download-finished",
                        DownloadFinishedPayload {
                            id: url.clone(),
                            file_name: file_name.clone(),
                            state: "failed".into(),
                            path: None,
                        },
                    );
                    return;
                }
            }
        }

        let _ = app_handle.emit(
            "download-finished",
            DownloadFinishedPayload {
                id: url,
                file_name,
                state: "completed".into(),
                path: Some(save_path.to_string_lossy().to_string()),
            },
        );
    });

    tasks_guard.insert(id, task);
    Ok(())
}

#[tauri::command]
pub async fn start_custom_download(
    app: AppHandle,
    state: tauri::State<'_, DownloadState>,
    url: String,
    file_name: String,
) -> Result<(), String> {
    execute_download(app, state.inner().clone(), url, file_name).await
}

#[tauri::command]
pub async fn pause_download(
    app: AppHandle,
    state: tauri::State<'_, DownloadState>,
    id: String,
    file_name: Option<String>,
) -> Result<(), String> {
    let mut tasks = state.tasks.lock().await;
    if let Some(task) = tasks.remove(&id) {
        task.abort();
    }

    // محاسبه حجم دانلود شده تا این لحظه از روی فایل
    let downloaded_bytes = if let Some(ref fname) = file_name {
        if let Some(downloads_dir) = dirs::download_dir() {
            let save_path = downloads_dir.join(fname);
            tokio::fs::metadata(&save_path)
                .await
                .map(|m| m.len())
                .unwrap_or(0)
        } else {
            0
        }
    } else {
        0
    };

    // به جای ارسال download-progress با مقادیر 0، ایونت state-changed ارسال کنید
    let _ = app.emit(
        "download-state-changed",
        serde_json::json!({
            "id": id,
            "state": "paused",
            "downloadedBytes": downloaded_bytes
        }),
    );

    Ok(())
}

#[tauri::command]
pub async fn resume_download(
    app: AppHandle,
    state: tauri::State<'_, DownloadState>,
    id: String,
    file_name: String,
) -> Result<(), String> {
    execute_download(app, state.inner().clone(), id, file_name).await
}

#[tauri::command]
pub async fn cancel_download(
    app: AppHandle,
    state: tauri::State<'_, DownloadState>,
    id: String,
) -> Result<(), String> {
    let mut tasks = state.tasks.lock().await;
    if let Some(task) = tasks.remove(&id) {
        task.abort();
    }

    let _ = app.emit(
        "download-finished",
        DownloadFinishedPayload {
            id,
            file_name: "".into(),
            state: "cancelled".into(),
            path: None,
        },
    );
    Ok(())
}

#[tauri::command]
pub async fn show_in_folder(path: String) -> Result<(), String> {
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
