import { useState, useEffect } from "react";
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
import { getCurrentWindow } from "@tauri-apps/api/window";

interface MenuSidebarProps {
    onClose: () => void;
    onNewTab: (url?: string) => void;
    activeTabId: string | null;
    activeTabUrl?: string;
}

export function MenuSidebar({
    onClose,
    onNewTab,
    activeTabId,
    activeTabUrl = "",
}: MenuSidebarProps) {
    const [zoomLevel, setZoomLevel] = useState<number>(100);
    const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

    // بررسی وضعیت بوک‌مارک بودن URL جاری
    useEffect(() => {
        if (!activeTabUrl) return;
        try {
            const savedBookmarks = JSON.parse(
                localStorage.getItem("browser_bookmarks") || "[]",
            );
            const exists = savedBookmarks.some(
                (item: { url: string }) => item.url === activeTabUrl,
            );
            setIsBookmarked(exists);
        } catch {
            setIsBookmarked(false);
        }
    }, [activeTabUrl]);

    // ۱. ریفریش تب جاری
    const handleReload = () => {
        if (activeTabId) {
            invoke("webview_reload", { label: `tab_${activeTabId}` }).catch(
                console.error,
            );
        }
        onClose();
    };

    // ۲. مدیریت زوم وب‌ویو با تزریق اسکریپت
    const handleZoomChange = (delta: number) => {
        setZoomLevel((prev) => {
            const newZoom = Math.min(Math.max(prev + delta, 30), 300);
            if (activeTabId) {
                const zoomFactor = newZoom / 100;
                const script = `document.body.style.zoom = '${zoomFactor}';`;
                invoke("eval_webview_script", {
                    label: `tab_${activeTabId}`,
                    script,
                }).catch(console.error);
            }
            return newZoom;
        });
    };

    // ۳. حالت تمام‌صفحه (Fullscreen)
    const handleToggleFullscreen = async () => {
        try {
            const appWindow = getCurrentWindow();
            const isFull = await appWindow.isFullscreen();
            await appWindow.setFullscreen(!isFull);
        } catch (err) {
            console.error("Failed to toggle fullscreen:", err);
        }
        onClose();
    };

    // ۴. افزودن/حذف بوک‌مارک
    const handleToggleBookmark = () => {
        if (!activeTabUrl || activeTabUrl === "about:blank") return;

        try {
            const savedBookmarks = JSON.parse(
                localStorage.getItem("browser_bookmarks") || "[]",
            );

            if (isBookmarked) {
                const updated = savedBookmarks.filter(
                    (item: { url: string }) => item.url !== activeTabUrl,
                );
                localStorage.setItem(
                    "browser_bookmarks",
                    JSON.stringify(updated),
                );
                setIsBookmarked(false);
            } else {
                const updated = [
                    ...savedBookmarks,
                    {
                        url: activeTabUrl,
                        title: activeTabUrl,
                        addedAt: new Date().toISOString(),
                    },
                ];
                localStorage.setItem(
                    "browser_bookmarks",
                    JSON.stringify(updated),
                );
                setIsBookmarked(true);
            }
        } catch (err) {
            console.error("Bookmark operation failed:", err);
        }
    };

    // ۵. باز کردن صفحات داخلی مرورگر با پروتکل aster://
    const handleOpenInternalPage = (internalUrl: string) => {
        onNewTab(internalUrl);
        onClose();
    };

    return (
        <aside className="w-80 h-full bg-slate-900 border-l border-slate-800 flex flex-col p-3 text-xs select-none justify-between z-20">
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

                {/* هشدار امنیت رمز */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span className="text-[11px] font-medium">
                        Found 10 compromised passwords
                    </span>
                </div>

                {/* اکشن‌های اصلی */}
                <button
                    onClick={() => {
                        onNewTab("aster://newtab");
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

                {/* افزودن بوک‌مارک */}
                <button
                    onClick={handleToggleBookmark}
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

                <button
                    onClick={() => handleOpenInternalPage("aster://bookmarks")}
                    className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-800 text-slate-200 transition-colors"
                >
                    <span className="flex items-center gap-2.5">
                        <Bookmark className="h-4 w-4 text-slate-400" />{" "}
                        Bookmarks & lists
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                </button>

                <div className="h-px bg-slate-800 my-1" />

                {/* کنترل زوم و فول‌اسکرین */}
                <div className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-800 rounded-xl transition-colors">
                    <span className="flex items-center gap-2.5 text-slate-200">
                        <ZoomIn className="h-4 w-4 text-slate-400" /> Zoom
                    </span>
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                        <button
                            onClick={() => handleZoomChange(-10)}
                            className="text-slate-400 hover:text-white transition-colors"
                            title="Zoom Out"
                        >
                            <ZoomOut className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[10px] text-slate-300 px-1.5 min-w-[36px] text-center font-mono">
                            {zoomLevel}%
                        </span>
                        <button
                            onClick={() => handleZoomChange(10)}
                            className="text-slate-400 hover:text-white transition-colors"
                            title="Zoom In"
                        >
                            <ZoomIn className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={handleToggleFullscreen}
                            className="ml-1 text-slate-400 hover:text-white transition-colors border-l border-slate-800 pl-1.5"
                            title="Toggle Fullscreen"
                        >
                            <Maximize className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                <div className="h-px bg-slate-800 my-1" />

                {/* تاریخچه، دانلودها و تنظیمات با لینک‌های aster:// */}
                <button
                    onClick={() => handleOpenInternalPage("aster://history")}
                    className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-800 text-slate-200 transition-colors"
                >
                    <span className="flex items-center gap-2.5">
                        <History className="h-4 w-4 text-slate-400" /> History
                    </span>
                    <span className="text-[10px] text-slate-500">Ctrl+H</span>
                </button>

                <button
                    onClick={() => handleOpenInternalPage("aster://downloads")}
                    className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-800 text-slate-200 transition-colors"
                >
                    <span className="flex items-center gap-2.5">
                        <Download className="h-4 w-4 text-slate-400" />{" "}
                        Downloads
                    </span>
                    <span className="text-[10px] text-slate-500">Ctrl+J</span>
                </button>

                <button
                    onClick={() => handleOpenInternalPage("aster://settings")}
                    className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-800 text-slate-200 transition-colors"
                >
                    <span className="flex items-center gap-2.5">
                        <Settings className="h-4 w-4 text-slate-400" /> Settings
                    </span>
                </button>
            </div>
        </aside>
    );
}
