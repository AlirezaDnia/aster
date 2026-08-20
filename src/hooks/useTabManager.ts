import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Tab } from "../types";

export function useTabManager() {
    const [tabs, setTabs] = useState<Tab[]>([
        { id: "1", title: "New Tab", url: "", isLoading: false },
    ]);
    const [activeTabId, setActiveTabId] = useState<string>("1");

    const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

    const handleSelectTab = useCallback((id: string) => {
        setActiveTabId((prevId) => {
            if (prevId !== id) {
                invoke("hide_tab_webview", { label: `tab_${prevId}` }).catch(
                    () => {},
                );
            }
            return id;
        });
    }, []);

    const handleNewTab = useCallback((initialUrl: string = "") => {
        setActiveTabId((currentActive) => {
            invoke("hide_tab_webview", { label: `tab_${currentActive}` }).catch(
                () => {},
            );
            return currentActive;
        });

        const newId = Date.now().toString();
        const newTab: Tab = {
            id: newId,
            title: initialUrl ? initialUrl : "New Tab",
            url: initialUrl,
            isLoading: false,
        };

        setTabs((prev) => [...prev, newTab]);
        setActiveTabId(newId);
        return newId;
    }, []);

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
            if (!/^https?:\/\//i.test(targetUrl)) {
                targetUrl =
                    targetUrl.includes(".") && !targetUrl.includes(" ")
                        ? `https://${targetUrl}`
                        : `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`;
            }

            setTabs((prev) =>
                prev.map((tab) =>
                    tab.id === activeTabId ? { ...tab, url: targetUrl } : tab,
                ),
            );
        },
        [activeTabId],
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
    };
}
