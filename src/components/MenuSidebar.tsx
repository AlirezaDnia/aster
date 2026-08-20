import { useState } from "react";
import {
    Plus,
    RotateCw,
    Download,
    History,
    Settings,
    ShieldAlert,
    ZoomIn,
    ZoomOut,
    Maximize,
    Bookmark,
    Star,
    ChevronRight,
    X,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface MenuSidebarProps {
    onClose: () => void;
    onNewTab: () => void;
    activeTabId: string | null;
}

export function MenuSidebar({
    onClose,
    onNewTab,
    activeTabId,
}: MenuSidebarProps) {
    const [zoomLevel, setZoomLevel] = useState<number>(100);
    const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

    const handleReload = () => {
        if (activeTabId) {
            invoke("webview_reload", { label: `tab_${activeTabId}` });
        }
    };

    const handleZoomChange = (delta: number) => {
        setZoomLevel((prev) => {
            const newZoom = Math.min(Math.max(prev + delta, 25), 500);
            // در صورت نیاز فراخوانی متد زوم نیتیو
            return newZoom;
        });
    };

    return (
        <aside className="w-80 h-full bg-slate-900 border-l border-slate-800 flex flex-col p-3 text-xs select-none justify-between">
            <div className="flex flex-col gap-2 overflow-y-auto">
                {/* سربرگ سایدبار */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-semibold text-slate-300 text-sm">
                        Menu
                    </span>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* هشدار امنیت رمزمشابه کروم */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span className="text-[11px] font-medium">
                        Found 10 compromised passwords
                    </span>
                </div>

                {/* اکشن‌های اصلی */}
                <button
                    onClick={() => {
                        onNewTab();
                        onClose();
                    }}
                    className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-800 text-slate-200 transition-colors"
                >
                    <span className="flex items-center gap-2.5">
                        <Plus className="h-4 w-4 text-slate-400" /> New tab
                    </span>
                    <span className="text-[10px] text-slate-500">Ctrl+T</span>
                </button>

                <button
                    onClick={handleReload}
                    className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-800 text-slate-200 transition-colors"
                >
                    <span className="flex items-center gap-2.5">
                        <RotateCw className="h-4 w-4 text-slate-400" /> Reload
                    </span>
                    <span className="text-[10px] text-slate-500">Ctrl+R</span>
                </button>

                <div className="h-px bg-slate-800 my-1" />

                {/* پروفایل کاربر */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                            A
                        </div>
                        <span className="font-medium text-slate-200">
                            Alireza
                        </span>
                    </div>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-medium">
                        Signed in
                    </span>
                </div>

                <div className="h-px bg-slate-800 my-1" />

                {/* قابلیت افزودن بوک‌مارک */}
                <button
                    onClick={() => setIsBookmarked((prev) => !prev)}
                    className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-800 text-slate-200 transition-colors"
                >
                    <span className="flex items-center gap-2.5">
                        <Star
                            className={`h-4 w-4 ${
                                isBookmarked
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-slate-400"
                            }`}
                        />
                        {isBookmarked ? "Bookmarked" : "Bookmark this tab"}
                    </span>
                    <span className="text-[10px] text-slate-500">Ctrl+D</span>
                </button>

                <button className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-800 text-slate-200 transition-colors">
                    <span className="flex items-center gap-2.5">
                        <Bookmark className="h-4 w-4 text-slate-400" />{" "}
                        Bookmarks & lists
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                </button>

                <div className="h-px bg-slate-800 my-1" />

                {/* کنترل زوم */}
                <div className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-800 rounded-xl transition-colors">
                    <span className="flex items-center gap-2.5 text-slate-200">
                        <ZoomIn className="h-4 w-4 text-slate-400" /> Zoom
                    </span>
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                        <button
                            onClick={() => handleZoomChange(-10)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <ZoomOut className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[10px] text-slate-300 px-1.5 min-w-[36px] text-center font-mono">
                            {zoomLevel}%
                        </span>
                        <button
                            onClick={() => handleZoomChange(10)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <ZoomIn className="h-3.5 w-3.5" />
                        </button>
                        <button className="ml-1 text-slate-400 hover:text-white transition-colors border-l border-slate-800 pl-1.5">
                            <Maximize className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                <div className="h-px bg-slate-800 my-1" />

                <button className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-800 text-slate-200 transition-colors">
                    <span className="flex items-center gap-2.5">
                        <History className="h-4 w-4 text-slate-400" /> History
                    </span>
                    <span className="text-[10px] text-slate-500">Ctrl+H</span>
                </button>

                <button className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-800 text-slate-200 transition-colors">
                    <span className="flex items-center gap-2.5">
                        <Download className="h-4 w-4 text-slate-400" />{" "}
                        Downloads
                    </span>
                    <span className="text-[10px] text-slate-500">Ctrl+J</span>
                </button>

                <button className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-800 text-slate-200 transition-colors">
                    <span className="flex items-center gap-2.5">
                        <Settings className="h-4 w-4 text-slate-400" /> Settings
                    </span>
                </button>
            </div>
        </aside>
    );
}
