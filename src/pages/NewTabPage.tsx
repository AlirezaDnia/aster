import { useState } from "react";
import { Search, Compass, Globe, Bookmark, Clock } from "lucide-react";

interface PageProps {
    onNavigate: (url: string) => void;
}

export function NewTabPage({ onNavigate }: PageProps) {
    const [query, setQuery] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        const targetUrl =
            query.startsWith("http://") || query.startsWith("https://")
                ? query
                : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        onNavigate(targetUrl);
    };

    const topSites = [
        { title: "Google", url: "https://google.com", icon: "🌐" },
        { title: "GitHub", url: "https://github.com", icon: "🐙" },
        { title: "YouTube", url: "https://youtube.com", icon: "▶️" },
        { title: "ChatGPT", url: "https://chatgpt.com", icon: "🤖" },
    ];

    return (
        <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[80vh] gap-8">
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-indigo-500/30">
                    A
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
                    Aster Browser
                </h1>
            </div>

            <form onSubmit={handleSearch} className="w-full relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search with Google or enter web address..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 shadow-xl transition-all"
                />
            </form>

            <div className="grid grid-cols-4 gap-4 w-full">
                {topSites.map((site) => (
                    <button
                        key={site.url}
                        onClick={() => onNavigate(site.url)}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:bg-slate-800 hover:border-slate-700 transition-all group"
                    >
                        <span className="text-2xl group-hover:scale-110 transition-transform">
                            {site.icon}
                        </span>
                        <span className="text-xs font-medium text-slate-300">
                            {site.title}
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex gap-4 text-xs text-slate-500 mt-4">
                <button
                    onClick={() => onNavigate("aster://bookmarks")}
                    className="flex items-center gap-1.5 hover:text-slate-300 transition-colors"
                >
                    <Bookmark className="h-3.5 w-3.5" /> Bookmarks
                </button>
                <button
                    onClick={() => onNavigate("aster://history")}
                    className="flex items-center gap-1.5 hover:text-slate-300 transition-colors"
                >
                    <Clock className="h-3.5 w-3.5" /> History
                </button>
            </div>
        </div>
    );
}
