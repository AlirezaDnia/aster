import React from "react";
import { InternalPageViewer } from "./InternalPageViewer";
import { StartPage } from "../pages/StartPage";
import { DownloadItem } from "../hooks/useDownloadManager";

interface MainViewportProps {
    viewportRef: React.RefObject<HTMLElement | null>;
    activeUrl: string;
    activeTabId: string | null;
    downloads: DownloadItem[];
    onNavigate: (url: string) => void;
    onOpenFolder?: (path?: string) => void;
}

export function MainViewport({
    viewportRef,
    activeUrl,
    activeTabId,
    downloads,
    onNavigate,
    onOpenFolder,
}: MainViewportProps) {
    const isInternalPage = activeUrl.startsWith("aster://");

    return (
        <main
            ref={viewportRef}
            className="flex-1 bg-slate-950 flex items-center justify-center overflow-hidden"
        >
            {isInternalPage && activeTabId ? (
                <InternalPageViewer
                    url={activeUrl}
                    onNavigate={onNavigate}
                    downloads={downloads}
                    onOpenFolder={onOpenFolder}
                />
            ) : (
                <StartPage onNavigate={onNavigate} />
            )}
        </main>
    );
}
