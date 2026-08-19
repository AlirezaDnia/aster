import React, { useState } from "react";
import { Search, Sparkles, Globe, Shield, ArrowRight } from "lucide-react";

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
        { title: "Wikipedia", url: "https://en.m.wikipedia.org" },
        { title: "DuckDuckGo", url: "https://html.duckduckgo.com/html" },
        { title: "Bing", url: "https://www.bing.com" },
        { title: "Hacker News", url: "https://news.ycombinator.com" },
    ];

    return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-slate-950 px-4 text-slate-100 select-none">
            <div className="flex max-w-lg w-full flex-col items-center gap-6 text-center">
                {/* Brand Header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shadow-xl shadow-indigo-500/10">
                        <Sparkles className="h-6 w-6 animate-pulse" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
                        Aster Browser
                    </h1>
                </div>

                {/* Search Input Box */}
                <form onSubmit={handleSubmit} className="w-full">
                    <div className="relative flex items-center w-full rounded-xl bg-slate-900 border border-slate-800 p-1.5 focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all shadow-2xl">
                        <Search className="h-4 w-4 text-slate-400 ml-3 shrink-0" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search the web or enter URL..."
                            className="w-full bg-transparent px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
                        />
                        <button
                            type="submit"
                            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors shrink-0"
                        >
                            <span>Search</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </form>

                {/* Quick Access Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mt-2">
                    {quickLinks.map((link) => (
                        <button
                            key={link.title}
                            onClick={() => onSearch(link.url)}
                            className="flex items-center gap-2 rounded-xl bg-slate-900/60 border border-slate-800/80 p-3 text-xs text-slate-300 hover:bg-slate-800 hover:border-slate-700 hover:text-white transition-all text-left"
                        >
                            <Globe className="h-4 w-4 text-indigo-400 shrink-0" />
                            <span className="truncate font-medium">
                                {link.title}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Features Footer */}
                <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 border-t border-slate-900 pt-4 w-full">
                    <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3 text-emerald-400" /> Safe
                        Browsing
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-indigo-400" />{" "}
                        Multi-Model AI Hub
                    </span>
                </div>
            </div>
        </div>
    );
}
