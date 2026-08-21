import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Tab } from "../types";

interface TabStatePayload {
    label: string;
    url: string;
    title: string;
    favicon?: string;
    isLoading?: boolean;
}

// تابع کمکی برای تشخیص و فرمت‌دهی URLهای ورودی
function parseInputUrl(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return "";

    // ۱. پشتیبانی از آدرس‌های اختصاصی آستر (Internal Pages)
    if (trimmed.startsWith("aster://")) {
        return trimmed;
    }

    // ۲. آدرس‌های دارای پروتکل استاندارد
    if (
        /^https?:\/\//i.test(trimmed) ||
        trimmed.startsWith("about:") ||
        trimmed.startsWith("file://")
    ) {
        return trimmed;
    }

    // ۳. دامنه‌های بدون پروتکل (مثل google.com)
    const isDomain = trimmed.includes(".") && !trimmed.includes(" ");
    if (isDomain) {
        return `https://${trimmed}`;
    }

    // ۴. عبارات جستجو -> گوگل
    return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

export function useTabManager() {
    const [tabs, setTabs] = useState<Tab[]>([
        { id: "1", title: "New Tab", url: "", isLoading: false },
    ]);
    const [activeTabId, setActiveTabId] = useState<string>("1");

    const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

    useEffect(() => {
        const unlistenPromise = listen<TabStatePayload>(
            "tab-state-changed",
            (event) => {
                const { label, url, title, favicon, isLoading } = event.payload;
                const tabId = label.replace("tab_", "");

                setTabs((prev) =>
                    prev.map((tab) => {
                        if (tab.id !== tabId) return tab;

                        const updatedTitle =
                            title && title.trim() !== "" ? title : tab.title;
                        const updatedFavicon = favicon || tab.favicon;
                        const updatedUrl = url || tab.url;
                        const updatedLoading =
                            typeof isLoading === "boolean"
                                ? isLoading
                                : tab.isLoading;

                        if (
                            tab.title === updatedTitle &&
                            tab.favicon === updatedFavicon &&
                            tab.url === updatedUrl &&
                            tab.isLoading === updatedLoading
                        ) {
                            return tab;
                        }

                        return {
                            ...tab,
                            title: updatedTitle,
                            favicon: updatedFavicon,
                            url: updatedUrl,
                            isLoading: updatedLoading,
                        };
                    }),
                );
            },
        );

        return () => {
            unlistenPromise.then((fn) => fn());
        };
    }, []);

    const handleSelectTab = useCallback(
        (id: string) => {
            const targetTab = tabs.find((t) => t.id === id);
            // اگر تب آدرس داخلی یا خالی داشت، وب‌ویو نیتیو را مخفی کن
            if (
                targetTab &&
                (!targetTab.url ||
                    targetTab.url === "about:blank" ||
                    targetTab.url.startsWith("aster://"))
            ) {
                invoke("hide_tab_webview", {
                    label: `tab_${activeTabId}`,
                }).catch(() => {});
            }
            setActiveTabId(id);
        },
        [tabs, activeTabId],
    );

    const handleNewTab = useCallback(
        (initialUrl: string = "") => {
            if (activeTabId) {
                invoke("hide_tab_webview", {
                    label: `tab_${activeTabId}`,
                }).catch(() => {});
            }

            const newId = Date.now().toString();
            const formattedUrl = parseInputUrl(initialUrl);

            // محاسبه عنوان اولیه تب
            let initialTitle = "New Tab";
            if (formattedUrl.startsWith("aster://")) {
                const pageName = formattedUrl.replace("aster://", "");
                initialTitle =
                    pageName.charAt(0).toUpperCase() + pageName.slice(1);
            } else if (formattedUrl) {
                initialTitle = "Loading...";
            }

            const newTab: Tab = {
                id: newId,
                title: initialTitle,
                url: formattedUrl,
                isLoading:
                    Boolean(formattedUrl) &&
                    !formattedUrl.startsWith("aster://"),
            };

            setTabs((prev) => [...prev, newTab]);
            setActiveTabId(newId);
            return newId;
        },
        [activeTabId],
    );

    const handleCloseTab = useCallback((id: string) => {
        invoke("close_tab_webview", { label: `tab_${id}` }).catch(
            console.error,
        );

        setTabs((prev) => {
            if (prev.length === 1) return prev;
            const filtered = prev.filter((t) => t.id !== id);

            setActiveTabId((currentActive) => {
                if (currentActive === id) {
                    const nextTab = filtered[filtered.length - 1];
                    return nextTab.id;
                }
                return currentActive;
            });

            return filtered;
        });
    }, []);

    const handleNavigate = useCallback(
        (input: string) => {
            const targetUrl = parseInputUrl(input);
            if (!targetUrl) return;

            const isInternal = targetUrl.startsWith("aster://");

            // اگر به صفحه داخلی انتقال می‌یابیم، وب‌ویوی فعلی Rust را مخفی می‌کنیم
            if (isInternal) {
                invoke("hide_tab_webview", {
                    label: `tab_${activeTabId}`,
                }).catch(() => {});
            }

            setTabs((prev) =>
                prev.map((tab) => {
                    if (tab.id === activeTabId) {
                        let title = "Loading...";
                        if (isInternal) {
                            const pageName = targetUrl.replace("aster://", "");
                            title =
                                pageName.charAt(0).toUpperCase() +
                                pageName.slice(1);
                        }

                        return {
                            ...tab,
                            url: targetUrl,
                            title: title,
                            isLoading: !isInternal, // برای صفحات داخلی نیازی به حالت Loading لایو نیست
                        };
                    }
                    return tab;
                }),
            );
        },
        [activeTabId],
    );

    const reorderTabs = useCallback(
        (draggedIndex: number, targetIndex: number) => {
            setTabs((prevTabs) => {
                const result = Array.from(prevTabs);
                const [removed] = result.splice(draggedIndex, 1);
                result.splice(targetIndex, 0, removed);
                return result;
            });
        },
        [],
    );

    return {
        tabs,
        setTabs,
        activeTabId,
        setActiveTabId,
        activeTab,
        handleSelectTab,
        handleNewTab,
        handleCloseTab,
        handleNavigate,
        reorderTabs,
    };
}
