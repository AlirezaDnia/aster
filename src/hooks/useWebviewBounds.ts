import { useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

export function useWebviewBounds(activeTabId: string, activeUrl?: string) {
    const viewportRef = useRef<HTMLDivElement>(null);

    const updateBounds = useCallback(() => {
        if (!viewportRef.current || !activeTabId) return;

        if (!activeUrl) {
            invoke("hide_tab_webview", { label: `tab_${activeTabId}` }).catch(
                () => {},
            );
            return;
        }

        const rect = viewportRef.current.getBoundingClientRect();
        invoke("create_or_show_tab_webview", {
            label: `tab_${activeTabId}`,
            url: activeUrl,
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
        }).catch(console.error);
    }, [activeTabId, activeUrl]);

    useEffect(() => {
        updateBounds();
    }, [updateBounds]);

    useEffect(() => {
        if (!viewportRef.current) return;

        const observer = new ResizeObserver(() => {
            requestAnimationFrame(updateBounds);
        });

        observer.observe(viewportRef.current);
        return () => observer.disconnect();
    }, [updateBounds]);

    return { viewportRef, updateBounds };
}
