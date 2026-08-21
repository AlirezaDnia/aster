import React, { useState, useEffect, useRef } from "react";
import {
    ArrowLeft,
    ArrowRight,
    RotateCw,
    Sparkles,
    SlidersHorizontal,
    MoreVertical,
    Puzzle,
    Download,
} from "lucide-react";

interface NavigationBarProps {
    currentUrl: string;
    activeTabId: string | null;
    onNewTab: (url?: string) => void; // <--- ورودی URL اضافه شد
    onNavigate: (url: string) => void;
    onGoBack: () => void;
    onGoForward: () => void;
    onReload: () => void;
    onToggleSidebar: () => void;
    isSidebarOpen: boolean;
    onToggleExtensionsSidebar: () => void;
    isExtensionsOpen: boolean;
    onToggleMenu: () => void;
    isMenuOpen: boolean;
    hasUnreadDownloads?: boolean;
    isDownloading?: boolean; // <--- حالت لودینگ دانلود
    onOpenDownloads?: () => void;
}

export function NavigationBar({
    currentUrl,
    activeTabId,
    onNewTab,
    onNavigate,
    onGoBack,
    onGoForward,
    onReload,
    onToggleSidebar,
    isSidebarOpen,
    onToggleExtensionsSidebar,
    isExtensionsOpen,
    onToggleMenu,
    isMenuOpen,
    hasUnreadDownloads,
    isDownloading,
    onOpenDownloads,
}: NavigationBarProps) {
    const [inputUrl, setInputUrl] = useState(currentUrl);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const formatUrlForDisplay = (url: string) => {
        if (!url) return "";
        if (url.startsWith("aster://")) {
            return url;
        }
        return url.replace(/^https?:\/\//i, "");
    };

    useEffect(() => {
        if (!isFocused) {
            setInputUrl(formatUrlForDisplay(currentUrl));
        }
    }, [currentUrl, isFocused]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        inputRef.current?.blur();
        const query = inputUrl.trim();
        if (!query) return;

        if (query.startsWith("aster://")) {
            onNavigate(query);
            return;
        }

        let targetUrl = query;
        const isUrlPattern =
            /^https?:\/\//i.test(query) ||
            (query.includes(".") && !query.includes(" "));

        if (!isUrlPattern) {
            targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        } else if (!/^https?:\/\//i.test(query)) {
            targetUrl = `https://${query}`;
        }

        onNavigate(targetUrl);
    };

    const handleFocus = () => {
        setIsFocused(true);
        setInputUrl(currentUrl);
        setTimeout(() => inputRef.current?.select(), 10);
    };

    // کلیک روی دکمه دانلود: باز کردن تب جدید با آدرس دانلودها
    const handleDownloadClick = () => {
        if (onOpenDownloads) {
            onOpenDownloads();
        }
        onNewTab("aster://downloads");
    };

    return (
        <div className="relative flex h-11 w-full items-center gap-2 bg-slate-950 px-3 border-b border-slate-800/80 select-none">
            <div className="flex items-center gap-0.5 text-slate-400">
                <button
                    type="button"
                    onClick={onGoBack}
                    className="rounded-full p-1.5 hover:bg-slate-800/80 hover:text-slate-100 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={onGoForward}
                    className="rounded-full p-1.5 hover:bg-slate-800/80 hover:text-slate-100 transition-colors"
                >
                    <ArrowRight className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={onReload}
                    className="rounded-full p-1.5 hover:bg-slate-800/80 hover:text-slate-100 transition-colors"
                >
                    <RotateCw className="h-4 w-4" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 items-center">
                <div
                    className={`flex h-8 w-full items-center gap-2 rounded-full bg-slate-900 px-3 border transition-all duration-150 ${
                        isFocused
                            ? "border-indigo-500/80 bg-slate-900/90 shadow-sm shadow-indigo-500/10"
                            : "border-slate-800/80 hover:border-slate-700"
                    }`}
                >
                    <button
                        type="button"
                        className="text-slate-400 hover:text-slate-200"
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                    </button>

                    <input
                        ref={inputRef}
                        type="text"
                        value={inputUrl}
                        onFocus={handleFocus}
                        onBlur={() => {
                            setIsFocused(false);
                            setInputUrl(formatUrlForDisplay(currentUrl));
                        }}
                        onChange={(e) => setInputUrl(e.target.value)}
                        placeholder="Search Google or type a URL (e.g. aster://downloads)"
                        className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none font-normal"
                    />
                </div>
            </form>

            <div className="flex items-center gap-1.5">
                {/* دکمه دانلود با لودینگ چرخان دور آن */}
                <div className="relative flex items-center justify-center">
                    {isDownloading && (
                        <span className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin pointer-events-none" />
                    )}

                    <button
                        type="button"
                        onClick={handleDownloadClick}
                        className={`relative rounded-full p-1.5 transition-colors ${
                            isDownloading
                                ? "text-indigo-400 bg-indigo-500/10"
                                : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                        }`}
                        title="Downloads"
                    >
                        <Download className="h-4 w-4 relative z-10" />

                        {!isDownloading && hasUnreadDownloads && (
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                        )}
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onToggleExtensionsSidebar}
                    className={`rounded-full p-1.5 transition-colors ${
                        isExtensionsOpen
                            ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    }`}
                    title="Built-in Extensions"
                >
                    <Puzzle className="h-4 w-4" />
                </button>

                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        isSidebarOpen
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                            : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white"
                    }`}
                >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Aster AI</span>
                </button>

                <button
                    type="button"
                    onClick={onToggleMenu}
                    className={`rounded-full p-1.5 transition-colors ${
                        isMenuOpen
                            ? "bg-slate-800 text-slate-100"
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    }`}
                >
                    <MoreVertical className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
