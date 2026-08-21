import React, { useState } from "react";
import {
    Search,
    Sparkles,
    ShieldCheck,
    Cpu,
    ArrowUpRight,
    Compass,
    Asterisk,
} from "lucide-react";

interface StartPageProps {
    onSearch: (query: string) => void;
}

export function StartPage({ onSearch }: StartPageProps) {
    const [query, setQuery] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    const quickLinks = [
        {
            title: "Google",
            url: "https://www.google.com",
            domain: "google.com",
        },
        { title: "GitHub", url: "https://github.com", domain: "github.com" },
        { title: "YouTube", url: "https://youtube.com", domain: "youtube.com" },
        {
            title: "Wikipedia",
            url: "https://en.wikipedia.org",
            domain: "wikipedia.org",
        },
        { title: "ChatGPT", url: "https://chatgpt.com", domain: "chatgpt.com" },
        {
            title: "Hacker News",
            url: "https://news.ycombinator.com",
            domain: "ycombinator.com",
        },
    ];

    return (
        <div className="relative flex h-full w-full flex-col items-center justify-center bg-slate-950 px-4 text-slate-100 select-none overflow-hidden">
            {/* پس‌زمینه نوری جادویی (Background Glow Effects) */}
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[600px] rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 h-96 w-[500px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex max-w-xl w-full flex-col items-center gap-8 text-center">
                {/* Brand Header */}
                <div className="flex flex-col items-center gap-3">
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-2xl shadow-indigo-500/30 ring-1 ring-white/20">
                        <Asterisk className="h-12 w-12" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                        Aster
                    </h1>
                    <p className="text-xs font-medium text-slate-400/80 tracking-wide">
                        NEXT-GEN AI POWERED BROWSER
                    </p>
                </div>

                {/* Search Input Box */}
                <form onSubmit={handleSubmit} className="w-full">
                    <div className="group relative flex items-center w-full rounded-2xl bg-slate-900/60 border border-slate-800/80 p-2 backdrop-blur-xl focus-within:border-indigo-500/60 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all shadow-2xl">
                        <Search className="h-5 w-5 text-slate-400 ml-3 shrink-0 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search with Google or type URL..."
                            className="w-full bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-normal"
                        />
                        <button
                            type="submit"
                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:opacity-90 active:scale-95 transition-all shrink-0"
                        >
                            <span>Search</span>
                            <ArrowUpRight className="h-4 w-4" />
                        </button>
                    </div>
                </form>

                {/* Quick Access Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 w-full">
                    {quickLinks.map((link) => (
                        <button
                            key={link.title}
                            onClick={() => onSearch(link.url)}
                            className="group flex flex-col items-center gap-2 rounded-2xl bg-slate-900/40 border border-slate-800/50 p-3 hover:bg-slate-800/60 hover:border-slate-700/80 hover:shadow-lg transition-all"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80 group-hover:bg-slate-700/80 transition-colors border border-slate-700/50">
                                <img
                                    src={`https://www.google.com/s2/favicons?domain=${link.domain}&sz=64`}
                                    alt={link.title}
                                    className="h-5 w-5 rounded object-contain"
                                    onError={(e) => {
                                        // آیکون رزرو در صورت خطا در لود favicon
                                        e.currentTarget.style.display = "none";
                                    }}
                                />
                            </div>
                            <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-100 transition-colors truncate w-full">
                                {link.title}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Footer Badges */}
                <div className="flex items-center justify-center gap-6 text-[11px] font-medium text-slate-500 border-t border-slate-900/80 pt-6 w-full">
                    <span className="flex items-center gap-1.5 hover:text-slate-400 transition-colors">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />{" "}
                        Isolated Sandbox
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 hover:text-slate-400 transition-colors">
                        <Cpu className="h-3.5 w-3.5 text-indigo-400" />{" "}
                        Multi-Engine AI
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 hover:text-slate-400 transition-colors">
                        <Compass className="h-3.5 w-3.5 text-violet-400" />{" "}
                        Private Browsing
                    </span>
                </div>
            </div>
        </div>
    );
}
