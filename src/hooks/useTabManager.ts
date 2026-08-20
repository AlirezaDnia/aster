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

export function useTabManager() {
    const [tabs, setTabs] = useState<Tab[]>([
        { id: "1", title: "New Tab", url: "", isLoading: false },
    ]);
    const [activeTabId, setActiveTabId] = useState<string>("1");

    const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

    // دریافت مستقیم event و بروزرسانی هوشمند State بدون Rerender اضافه
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
            if (
                targetTab &&
                (!targetTab.url || targetTab.url === "about:blank")
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

            let formattedUrl = initialUrl.trim();
            if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
                formattedUrl =
                    formattedUrl.includes(".") && !formattedUrl.includes(" ")
                        ? `https://${formattedUrl}`
                        : `https://www.google.com/search?q=${encodeURIComponent(formattedUrl)}`;
            }

            const newTab: Tab = {
                id: newId,
                title: formattedUrl ? "Loading..." : "New Tab",
                url: formattedUrl,
                isLoading: Boolean(formattedUrl),
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
            let targetUrl = input.trim();
            if (!targetUrl) return;

            if (!/^https?:\/\//i.test(targetUrl)) {
                targetUrl =
                    targetUrl.includes(".") && !targetUrl.includes(" ")
                        ? `https://${targetUrl}`
                        : `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`;
            }

            setTabs((prev) =>
                prev.map((tab) => {
                    if (tab.id === activeTabId) {
                        return {
                            ...tab,
                            url: targetUrl,
                            title: "Loading...",
                            isLoading: true,
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
