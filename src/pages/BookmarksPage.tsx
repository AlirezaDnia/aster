import { useEffect, useState } from "react";
import { Bookmark, Trash2, ExternalLink } from "lucide-react";

interface BookmarkItem {
    url: string;
    title: string;
    addedAt: string;
}

export function BookmarksPage({
    onNavigate,
}: {
    onNavigate: (url: string) => void;
}) {
    const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

    useEffect(() => {
        try {
            const data = JSON.parse(
                localStorage.getItem("browser_bookmarks") || "[]",
            );
            setBookmarks(data);
        } catch {
            setBookmarks([]);
        }
    }, []);

    const removeBookmark = (url: string) => {
        const updated = bookmarks.filter((b) => b.url !== url);
        setBookmarks(updated);
        localStorage.setItem("browser_bookmarks", JSON.stringify(updated));
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <Bookmark className="h-6 w-6 text-indigo-400" />
                <h1 className="text-2xl font-bold">Bookmarks</h1>
            </div>

            {bookmarks.length === 0 ? (
                <p className="text-slate-500 text-sm">
                    No bookmarks saved yet.
                </p>
            ) : (
                <div className="flex flex-col gap-2">
                    {bookmarks.map((item) => (
                        <div
                            key={item.url}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-colors"
                        >
                            <div className="flex flex-col gap-0.5 truncate pr-4">
                                <span className="font-medium text-slate-200 text-sm truncate">
                                    {item.title}
                                </span>
                                <span className="text-xs text-slate-500 truncate">
                                    {item.url}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => onNavigate(item.url)}
                                    className="p-2 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => removeBookmark(item.url)}
                                    className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
