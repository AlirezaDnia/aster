import { ReactNode } from "react";
import { NewTabPage } from "../pages/NewTabPage";
import { BookmarksPage } from "../pages/BookmarksPage";
import { HistoryPage } from "../pages/HistoryPage";
import { SettingsPage } from "../pages/SettingsPage";
import { DownloadsPage } from "../pages/DownloadsPage";

interface InternalPageViewerProps {
    url: string;
    onNavigate: (url: string) => void;
}

export function InternalPageViewer({
    url,
    onNavigate,
}: InternalPageViewerProps) {
    const pageRoute = url.replace("aster://", "").split("/")[0].toLowerCase();

    const renderContent = (): ReactNode => {
        switch (pageRoute) {
            case "newtab":
            case "":
                return <NewTabPage onNavigate={onNavigate} />;
            case "bookmarks":
                return <BookmarksPage onNavigate={onNavigate} />;
            case "history":
                return <HistoryPage onNavigate={onNavigate} />;
            case "settings":
                return <SettingsPage />;
            case "downloads":
                return <DownloadsPage />;
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <h1 className="text-2xl font-bold mb-2">
                            404 - Page Not Found
                        </h1>
                        <p className="text-sm">
                            The internal page{" "}
                            <code className="text-indigo-400">{url}</code> does
                            not exist.
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="w-full h-full bg-slate-950 text-slate-100 overflow-y-auto p-8 select-none">
            {renderContent()}
        </div>
    );
}
