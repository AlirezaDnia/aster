import {
    FolderOpen,
    ArrowDown,
    CheckCircle,
    AlertCircle,
    FileText,
    XCircle,
    RotateCcw,
} from "lucide-react";
import { DownloadItem, useDownloadManager } from "../hooks/useDownloadManager";

interface DownloadsPageProps {
    downloads?: DownloadItem[];
    onOpenFolder?: (path?: string) => void;
}

function formatBytes(bytes: number, decimals = 1): string {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function DownloadsPage({
    downloads: propsDownloads,
    onOpenFolder,
}: DownloadsPageProps) {
    const {
        downloads: hookDownloads = [],
        openInFolder: hookOpenInFolder,
        cancelDownload,
    } = useDownloadManager();

    const downloadsList = propsDownloads ?? hookDownloads;
    const handleOpenFolder = onOpenFolder ?? hookOpenInFolder;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 text-slate-100">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
                <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                    <ArrowDown className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Downloads</h1>
                    <p className="text-xs text-slate-400">
                        Manage downloaded files and active transfers
                    </p>
                </div>
            </div>

            {/* Empty State */}
            {downloadsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                    <FileText className="h-12 w-12 stroke-[1.5] text-slate-600" />
                    <p className="text-sm font-medium">No downloads yet</p>
                </div>
            ) : (
                /* Downloads List */
                <div className="flex flex-col gap-3">
                    {downloadsList.map((item) => {
                        const progress = item.totalBytes
                            ? Math.min(
                                  100,
                                  Math.round(
                                      (item.downloadedBytes / item.totalBytes) *
                                          100,
                                  ),
                              )
                            : 0;

                        return (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl transition-all"
                            >
                                <div className="flex items-center gap-4 min-w-0 flex-1 mr-4">
                                    {/* State Icons */}
                                    {item.state === "completed" && (
                                        <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
                                    )}
                                    {item.state === "downloading" && (
                                        <ArrowDown className="h-5 w-5 shrink-0 text-indigo-400 animate-bounce" />
                                    )}
                                    {item.state === "paused" && (
                                        <ArrowDown className="h-5 w-5 shrink-0 text-amber-400" />
                                    )}
                                    {(item.state === "failed" ||
                                        item.state === "cancelled") && (
                                        <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-semibold text-slate-200 truncate">
                                            {item.fileName}
                                        </h3>

                                        {/* Subtitle / Status Text */}
                                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 truncate">
                                            <span>
                                                {item.state === "downloading" &&
                                                    "Downloading..."}
                                                {item.state === "paused" &&
                                                    "Paused"}
                                                {item.state === "completed" &&
                                                    (item.path || "Completed")}
                                                {item.state === "failed" &&
                                                    "Failed"}
                                                {item.state === "cancelled" &&
                                                    "Cancelled"}
                                            </span>

                                            {/* Size display */}
                                            {(item.state === "downloading" ||
                                                item.state === "paused") && (
                                                <span className="text-slate-500 text-[11px]">
                                                    (
                                                    {formatBytes(
                                                        item.downloadedBytes,
                                                    )}{" "}
                                                    /{" "}
                                                    {item.totalBytes
                                                        ? formatBytes(
                                                              item.totalBytes,
                                                          )
                                                        : "Unknown"}
                                                    )
                                                </span>
                                            )}
                                        </div>

                                        {/* Progress Bar */}
                                        {(item.state === "downloading" ||
                                            item.state === "paused") && (
                                            <div className="mt-2 flex items-center gap-3 max-w-sm">
                                                <div
                                                    className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden"
                                                    role="progressbar"
                                                    aria-valuenow={progress}
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                >
                                                    <div
                                                        className={`h-full transition-all duration-300 ${
                                                            item.state ===
                                                            "paused"
                                                                ? "bg-amber-500"
                                                                : "bg-indigo-500"
                                                        }`}
                                                        style={{
                                                            width: `${progress}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-[11px] text-slate-400 font-mono">
                                                    {progress}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Cancel during download */}
                                    {item.state === "downloading" && (
                                        <button
                                            onClick={() =>
                                                cancelDownload(item.id)
                                            }
                                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 transition-colors"
                                            title="Cancel Download"
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </button>
                                    )}

                                    {/* Show in folder when completed */}
                                    {item.state === "completed" &&
                                        handleOpenFolder && (
                                            <button
                                                onClick={() =>
                                                    handleOpenFolder(item.path)
                                                }
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium transition-colors text-slate-200"
                                            >
                                                <FolderOpen className="h-4 w-4 text-slate-400" />
                                                Show in Folder
                                            </button>
                                        )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
