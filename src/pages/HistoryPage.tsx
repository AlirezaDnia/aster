import { useEffect, useState } from "react";
import { History, Search } from "lucide-react";

interface HistoryItem {
    url: string;
    title: string;
    visitedAt: string;
}

export function HistoryPage({
    onNavigate,
}: {
    onNavigate: (url: string) => void;
}) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        try {
            const data = JSON.parse(
                localStorage.getItem("browser_history") || "[]",
            );
            setHistory(data);
        } catch {
            setHistory([]);
        }
    }, []);

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem("browser_history");
    };

    const filtered = history.filter(
        (h) =>
            h.title.toLowerCase().includes(search.toLowerCase()) ||
            h.url.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                    <History className="h-6 w-6 text-indigo-400" />
                    <h1 className="text-2xl font-bold">History</h1>
                </div>
                {history.length > 0 && (
                    <button
                        onClick={clearHistory}
                        className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/20 transition-colors"
                    >
                        Clear History
                    </button>
                )}
            </div>

            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search history..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                />
            </div>

            <div className="flex flex-col gap-2">
                {filtered.length === 0 ? (
                    <p className="text-slate-500 text-sm">
                        No browsing history found.
                    </p>
                ) : (
                    filtered.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => onNavigate(item.url)}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:bg-slate-800/60 hover:border-slate-700 cursor-pointer transition-colors"
                        >
                            <div className="flex flex-col gap-0.5 truncate">
                                <span className="font-medium text-slate-200 text-sm truncate">
                                    {item.title || item.url}
                                </span>
                                <span className="text-xs text-slate-500 truncate">
                                    {item.url}
                                </span>
                            </div>
                            <span className="text-[10px] text-slate-600 shrink-0">
                                {new Date(item.visitedAt).toLocaleDateString()}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
