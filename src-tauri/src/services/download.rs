use crate::models::payloads::{DownloadFinishedPayload, DownloadProgressPayload};
use crate::state::DownloadState;
use futures_util::StreamExt;
use tauri::{AppHandle, Emitter};

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

    let mut tasks_guard = tasks.lock().await;
    if let Some(existing_task) = tasks_guard.remove(&id) {
        existing_task.abort();
    }

    let task = tokio::spawn(async move {
        let client = reqwest::Client::new();
        let res = match client.get(&url).send().await {
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

        let total_bytes = res.content_length().unwrap_or(0);
        let mut file = match tokio::fs::File::create(&save_path).await {
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
        let mut downloaded_bytes: u64 = 0;
        let mut last_emit = std::time::Instant::now();

        let _ = app_handle.emit(
            "download-progress",
            DownloadProgressPayload {
                id: url.clone(),
                file_name: file_name.clone(),
                downloaded_bytes: 0,
                total_bytes,
                state: "downloading".into(),
            },
        );

        while let Some(item) = stream.next().await {
            match item {
                Ok(chunk) => {
                    use tokio::io::AsyncWriteExt;
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
                    downloaded_bytes += chunk.len() as u64;

                    if last_emit.elapsed().as_millis() > 100 || downloaded_bytes == total_bytes {
                        let _ = app_handle.emit(
                            "download-progress",
                            DownloadProgressPayload {
                                id: url.clone(),
                                file_name: file_name.clone(),
                                downloaded_bytes,
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
