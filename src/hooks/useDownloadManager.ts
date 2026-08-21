import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

export interface DownloadItem {
    id: string;
    fileName: string;
    totalBytes: number;
    downloadedBytes: number;
    state: "downloading" | "paused" | "completed" | "failed" | "cancelled";
    path?: string;
    startTime: number;
}

export function useDownloadManager() {
    const [downloads, setDownloads] = useState<DownloadItem[]>([]);
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        // 1. شنیدن درخواست دانلود از WebView
        const unlistenTrigger = listen<{ url: string; fileName: string }>(
            "trigger-custom-download",
            (event) => {
                const { url, fileName } = event.payload;
                invoke("start_custom_download", { url, fileName }).catch(
                    console.error,
                );
            },
        );

        // 2. بروزرسانی زنده درصد و حجم دانلود
        const unlistenProgress = listen<{
            id: string;
            fileName: string;
            downloadedBytes: number;
            totalBytes: number;
        }>("download-progress", (event) => {
            const data = event.payload;
            setHasUnread(true);

            setDownloads((prev) => {
                const index = prev.findIndex((item) => item.id === data.id);
                if (index !== -1) {
                    const updated = [...prev];
                    updated[index] = {
                        ...updated[index],
                        downloadedBytes: data.downloadedBytes,
                        totalBytes: data.totalBytes,
                        state: "downloading",
                    };
                    return updated;
                } else {
                    return [
                        {
                            id: data.id,
                            fileName: data.fileName,
                            totalBytes: data.totalBytes,
                            downloadedBytes: data.downloadedBytes,
                            state: "downloading",
                            startTime: Date.now(),
                        },
                        ...prev,
                    ];
                }
            });
        });

        // 3. تکمیل یا شکست دانلود
        const unlistenFinished = listen<{
            id: string;
            fileName: string;
            state: "completed" | "failed" | "cancelled";
            path?: string;
        }>("download-finished", (event) => {
            const data = event.payload;
            setDownloads((prev) =>
                prev.map((item) =>
                    item.id === data.id
                        ? {
                              ...item,
                              state: data.state,
                              path: data.path || item.path,
                          }
                        : item,
                ),
            );
        });

        return () => {
            unlistenTrigger.then((u) => u());
            unlistenProgress.then((u) => u());
            unlistenFinished.then((u) => u());
        };
    }, []);

    const markAsRead = () => setHasUnread(false);

    const openInFolder = (path?: string) => {
        if (path) {
            invoke("show_in_folder", { path }).catch(console.error);
        }
    };

    const cancelDownload = (id: string) => {
        invoke("cancel_download", { id }).catch(console.error);
    };

    return {
        downloads,
        hasUnread,
        markAsRead,
        openInFolder,
        cancelDownload,
    };
}
