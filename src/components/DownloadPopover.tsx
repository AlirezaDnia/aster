import {
    ArrowDown,
    CheckCircle,
    AlertCircle,
    FolderOpen,
    X,
} from "lucide-react";
import { DownloadItem, useDownloadManager } from "../hooks/useDownloadManager";

interface DownloadPopoverProps {
    downloads: DownloadItem[];
    onClose: () => void;
    onOpenDownloadsPage: () => void;
}

export function DownloadPopover({
    downloads,
    onClose,
    onOpenDownloadsPage,
}: DownloadPopoverProps) {
    const { openInFolder } = useDownloadManager();

    return (
        <div className="absolute top-12 right-12 z-50 w-80 rounded-2xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl text-slate-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-300">
                    Downloads
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onOpenDownloadsPage}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        Show all (`aster://downloads`)
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            <div className="mt-3 flex flex-col gap-2 max-h-80 overflow-y-auto">
                {downloads.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                        No recent downloads
                    </div>
                ) : (
                    downloads.slice(0, 5).map((item) => {
                        const progress = item.totalBytes
                            ? Math.round(
                                  (item.downloadedBytes / item.totalBytes) *
                                      100,
                              )
                            : 0;

                        return (
                            <div
                                key={item.id}
                                className="group flex items-center justify-between gap-3 rounded-xl bg-slate-800/40 p-2.5 hover:bg-slate-800/80 transition-all border border-slate-800/50"
                            >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    {item.state === "downloading" && (
                                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                                            <ArrowDown className="h-4 w-4 animate-bounce" />
                                        </div>
                                    )}
                                    {item.state === "completed" && (
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                                            <CheckCircle className="h-4 w-4" />
                                        </div>
                                    )}
                                    {item.state === "failed" && (
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                                            <AlertCircle className="h-4 w-4" />
                                        </div>
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium truncate text-slate-200">
                                            {item.fileName}
                                        </p>
                                        {item.state === "downloading" && (
                                            <div className="mt-1 flex items-center gap-2">
                                                <div className="h-1 flex-1 rounded-full bg-slate-700 overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 transition-all duration-300"
                                                        style={{
                                                            width: `${progress}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-slate-400">
                                                    {progress}%
                                                </span>
                                            </div>
                                        )}
                                        {item.state === "completed" && (
                                            <span className="text-[10px] text-slate-400">
                                                Completed
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {item.state === "completed" && item.path && (
                                    <button
                                        onClick={() => openInFolder(item.path)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                                        title="Show in folder"
                                    >
                                        <FolderOpen className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
