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
        // ۱. شنیدن درخواست دانلود از WebView
        const unlistenTrigger = listen<{ url: string; fileName: string }>(
            "trigger-custom-download",
            (event) => {
                const { url, fileName } = event.payload;
                invoke("start_custom_download", { url, fileName }).catch(
                    console.error,
                );
            },
        );

        // ۲. بروزرسانی زنده درصد، حجم و وضعیت دانلود
        const unlistenProgress = listen<{
            id: string;
            fileName: string;
            downloadedBytes: number;
            totalBytes: number;
            state?: "downloading" | "paused";
        }>("download-progress", (event) => {
            const data = event.payload;
            setHasUnread(true);

            setDownloads((prev) => {
                const index = prev.findIndex((item) => item.id === data.id);
                if (index !== -1) {
                    const updated = [...prev];

                    // اگر وضعیت پوز است، مقادیر بایت‌ها را صفر نکن و از مقدار قبلی نگه‌دار
                    const isPaused =
                        updated[index].state === "paused" &&
                        data.downloadedBytes === 0;

                    updated[index] = {
                        ...updated[index],
                        downloadedBytes: isPaused
                            ? updated[index].downloadedBytes
                            : data.downloadedBytes,
                        totalBytes: isPaused
                            ? updated[index].totalBytes
                            : data.totalBytes || updated[index].totalBytes,
                        state:
                            data.state || updated[index].state || "downloading",
                    };
                    return updated;
                } else {
                    return [
                        {
                            id: data.id,
                            fileName: data.fileName,
                            totalBytes: data.totalBytes,
                            downloadedBytes: data.downloadedBytes,
                            state: data.state || "downloading",
                            startTime: Date.now(),
                        },
                        ...prev,
                    ];
                }
            });
        });

        // ۳. تغییر وضعیت‌های خاص
        const unlistenStateChanged = listen<{
            id: string;
            state:
                | "downloading"
                | "paused"
                | "completed"
                | "failed"
                | "cancelled";
        }>("download-state-changed", (event) => {
            const data = event.payload;
            setDownloads((prev) =>
                prev.map((item) =>
                    item.id === data.id ? { ...item, state: data.state } : item,
                ),
            );
        });

        // ۴. تکمیل یا شکست دانلود
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
            unlistenStateChanged.then((u) => u());
            unlistenFinished.then((u) => u());
        };
    }, []);

    const markAsRead = () => setHasUnread(false);

    const openInFolder = (path?: string) => {
        if (path) {
            invoke("show_in_folder", { path }).catch(console.error);
        }
    };

    const pauseDownload = (id: string) => {
        setDownloads((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, state: "paused" } : item,
            ),
        );
        invoke("pause_download", { id }).catch(console.error);
    };

    const resumeDownload = (id: string) => {
        const targetItem = downloads.find((item) => item.id === id);
        if (!targetItem) return;

        setDownloads((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, state: "downloading" } : item,
            ),
        );

        invoke("resume_download", {
            id,
            fileName: targetItem.fileName,
        }).catch(console.error);
    };

    const cancelDownload = (id: string) => {
        setDownloads((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, state: "cancelled" } : item,
            ),
        );
        invoke("cancel_download", { id }).catch(console.error);
    };

    return {
        downloads,
        hasUnread,
        markAsRead,
        openInFolder,
        pauseDownload,
        resumeDownload,
        cancelDownload,
    };
}
