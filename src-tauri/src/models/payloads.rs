use serde::Serialize;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TabStatePayload<'a> {
    pub label: &'a str,
    pub url: &'a str,
    pub title: &'a str,
    pub favicon: &'a str,
    pub is_loading: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgressPayload {
    pub id: String,
    pub file_name: String,
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub state: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadFinishedPayload {
    pub id: String,
    pub file_name: String,
    pub state: String,
    pub path: Option<String>,
}
