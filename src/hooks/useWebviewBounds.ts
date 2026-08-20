import { useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

export function useWebviewBounds(activeTabId: string, activeUrl?: string) {
    const viewportRef = useRef<HTMLDivElement>(null);

    const updateBounds = useCallback(() => {
        if (!viewportRef.current || !activeTabId) return;

        // اگر تب روی صفحه اصلی (StartPage) باشد یا URL نداشته باشد، وب‌ویو مخفی می‌شود
        if (!activeUrl || activeUrl === "about:blank") {
            invoke("hide_tab_webview", { label: `tab_${activeTabId}` }).catch(
                () => {},
            );
            return;
        }

        const rect = viewportRef.current.getBoundingClientRect();

        // محاسبه دقیق موقعیت با لایوت واقعی مرورگر
        invoke("create_or_show_tab_webview", {
            label: `tab_${activeTabId}`,
            url: activeUrl,
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
        }).catch(console.error);
    }, [activeTabId, activeUrl]);

    // اجرای بهینه‌سازی ابعاد هنگام تغییر تب یا آدرس
    useEffect(() => {
        updateBounds();
    }, [updateBounds]);

    // شنیدن تغییرات سایز Element (مثل باز و بسته‌شدن AIPanel)
    useEffect(() => {
        if (!viewportRef.current) return;

        let animationFrameId: number;

        const observer = new ResizeObserver(() => {
            // استفاده از requestAnimationFrame برای همگام‌سازی با رندر GPU و حذف پرپر زدن
            animationFrameId = requestAnimationFrame(updateBounds);
        });

        observer.observe(viewportRef.current);

        return () => {
            observer.disconnect();
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [updateBounds]);

    // شنیدن تغییر ابعاد کل پنجره برنامه (Window Resize)
    useEffect(() => {
        const handleWindowResize = () => {
            requestAnimationFrame(updateBounds);
        };

        window.addEventListener("resize", handleWindowResize);
        return () => {
            window.removeEventListener("resize", handleWindowResize);
        };
    }, [updateBounds]);

    return { viewportRef, updateBounds };
}
