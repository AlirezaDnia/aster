use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::task::JoinHandle;

#[derive(Default, Clone)]
pub struct DownloadState {
    pub tasks: Arc<Mutex<HashMap<String, JoinHandle<()>>>>,
}
