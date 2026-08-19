import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Sparkles, Lock } from "lucide-react";

interface NavigationBarProps {
    currentUrl: string;
    onNavigate: (url: string) => void;
    onGoBack: () => void;
    onGoForward: () => void;
    onReload: () => void;
    onToggleSidebar: () => void;
    isSidebarOpen: boolean;
}

export function NavigationBar({
    currentUrl,
    onNavigate,
    onGoBack,
    onGoForward,
    onReload,
    onToggleSidebar,
    isSidebarOpen,
}: NavigationBarProps) {
    const [inputUrl, setInputUrl] = useState(currentUrl);

    useEffect(() => {
        setInputUrl(currentUrl);
    }, [currentUrl]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const query = inputUrl.trim();
        if (!query) return;

        let targetUrl = query;

        // بررسی اینکه ورودی URL است یا کلمه برای سرچ
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

    return (
        <div className="flex h-12 w-full items-center gap-2 bg-slate-900 px-3 border-b border-slate-800 select-none">
            <div className="flex items-center gap-1 text-slate-400">
                <button
                    type="button"
                    onClick={onGoBack}
                    className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-slate-200 transition-colors outline-none focus:outline-none focus:ring-0"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={onGoForward}
                    className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-slate-200 transition-colors outline-none focus:outline-none focus:ring-0"
                >
                    <ArrowRight className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={onReload}
                    className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-slate-200 transition-colors outline-none focus:outline-none focus:ring-0"
                >
                    <RotateCw className="h-4 w-4" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 items-center">
                <div className="flex h-8 w-full items-center gap-2 rounded-lg bg-slate-950 px-3 border border-slate-800/80 focus-within:border-indigo-500/50 transition-colors">
                    <Lock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <input
                        type="text"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        placeholder="Search with Google or enter address"
                        className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none focus:outline-none focus:ring-0"
                    />
                </div>
            </form>

            <button
                type="button"
                onClick={onToggleSidebar}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all outline-none focus:outline-none focus:ring-0 ${
                    isSidebarOpen
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
            >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Aster AI</span>
            </button>
        </div>
    );
}
