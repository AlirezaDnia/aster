use crate::state::DownloadState;
use tauri::AppHandle;

pub async fn execute_download(
    _app: AppHandle,
    state: DownloadState,
    url: String,
    file_name: String,
) -> Result<(), String> {
    let downloads_dir = dirs::download_dir().ok_or("Could not find Downloads folder")?;
    let _save_path = downloads_dir.join(&file_name);
    let id = url.clone();

    let tasks = state.tasks.clone();
    let mut tasks_guard = tasks.lock().await;

    if let Some(existing_task) = tasks_guard.remove(&id) {
        existing_task.abort();
    }

    let task = tokio::spawn(async move {
        // منطق دانلود
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
    state: tauri::State<'_, DownloadState>,
    id: String,
) -> Result<(), String> {
    let mut tasks = state.tasks.lock().await;
    if let Some(task) = tasks.remove(&id) {
        task.abort();
    }
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
    Ok(())
}
