import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import { TabBar } from "./components/TabBar";
import { NavigationBar } from "./components/NavigationBar";
import { MainViewport } from "./components/MainViewport";
import { AIPanel } from "./components/AIPanel";
import { MenuSidebar } from "./components/MenuSidebar";
import { ExtensionsPanel } from "./components/ExtensionsPanel";

import { useTabManager } from "./hooks/useTabManager";
import { useWebviewBounds } from "./hooks/useWebviewBounds";
import { useAISettings } from "./hooks/useAISettings";
import { useDownloadManager } from "./hooks/useDownloadManager";

import {
    ExtensionStates,
    DEFAULT_EXTENSION_STATES,
    buildScript,
} from "./utils/extensionInjectedScript";

export function App() {
    const {
        tabs,
        activeTabId,
        activeTab,
        handleSelectTab,
        handleNewTab,
        handleCloseTab,
        handleNavigate,
        reorderTabs,
    } = useTabManager();

    const { aiSettings, setAiSettings } = useAISettings();
    const { downloads, hasUnread, markAsRead, openInFolder } =
        useDownloadManager();

    const isDownloading = downloads.some(
        (item) => item.state === "downloading",
    );

    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [isExtensionsOpen, setIsExtensionsOpen] = useState<boolean>(false);

    const [extensionsMap, setExtensionsMap] = useState<
        Record<string, ExtensionStates>
    >({});

    // تابع مدیریت باز کردن صفحه دانلودها (جلوگیری از ساخت تب تکراری)
    const handleOpenDownloads = useCallback(() => {
        markAsRead();
        const existingDownloadTab = tabs.find(
            (tab) => tab.url === "aster://downloads",
        );

        if (existingDownloadTab) {
            handleSelectTab(existingDownloadTab.id);
        } else {
            handleNewTab("aster://downloads");
        }
    }, [tabs, markAsRead, handleSelectTab, handleNewTab]);

    // 🔥 ذخیره آخرین رفرنس توابع جهت جلوگیری از Re-register شدن Event Listener
    const handleNewTabRef = useRef(handleNewTab);
    const handleOpenDownloadsRef = useRef(handleOpenDownloads);

    useEffect(() => {
        handleNewTabRef.current = handleNewTab;
        handleOpenDownloadsRef.current = handleOpenDownloads;
    }, [handleNewTab, handleOpenDownloads]);

    // 🔥 پیاده‌سازی نیتیو و استاندارد Tauri Listener (فقط ۱ بار در لایف‌سایکل رندر می‌شود)
    useEffect(() => {
        let unlisten: (() => void) | null = null;
        let isMounted = true;

        listen<string>("open-new-tab", (event) => {
            if (!event.payload) return;

            if (event.payload === "aster://downloads") {
                handleOpenDownloadsRef.current();
            } else {
                handleNewTabRef.current(event.payload);
            }
        }).then((unlistenFn) => {
            if (isMounted) {
                unlisten = unlistenFn;
            } else {
                unlistenFn(); // اگر کامپوننت قبل از حل شدن پرامیس unmount شد
            }
        });

        return () => {
            isMounted = false;
            if (unlisten) {
                unlisten();
            }
        };
    }, []); // dependency خالی تضمین می‌کند listener فقط ۱ بار ثبت شود

    const applyExtensionScript = useCallback(
        (tabId: string, states: ExtensionStates) => {
            if (!tabId) return;
            const script = buildScript(states);

            invoke("eval_webview_script", {
                label: `tab_${tabId}`,
                script,
            }).catch((err) => {
                console.warn(
                    `[Extension System] Eval failed on tab_${tabId}:`,
                    err,
                );
            });
        },
        [],
    );

    const handleUpdateExtension = useCallback(
        (tabId: string, key: keyof ExtensionStates, value: boolean) => {
            if (!tabId) return;

            setExtensionsMap((prev) => {
                const current = prev[tabId] || { ...DEFAULT_EXTENSION_STATES };
                const updated = { ...current, [key]: value };

                applyExtensionScript(tabId, updated);

                return { ...prev, [tabId]: updated };
            });
        },
        [applyExtensionScript],
    );

    useEffect(() => {
        if (!activeTabId) return;

        setExtensionsMap((prev) => ({
            ...prev,
            [activeTabId]: { ...DEFAULT_EXTENSION_STATES },
        }));
    }, [activeTabId, activeTab?.url]);

    const { viewportRef } = useWebviewBounds(
        activeTabId,
        activeTab?.url,
        isSidebarOpen,
        isMenuOpen,
        isExtensionsOpen,
    );

    const activeUrl = activeTab?.url || "";

    return (
        <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
            <header className="flex flex-col z-10">
                <TabBar
                    tabs={tabs}
                    activeTabId={activeTabId}
                    onSelectTab={handleSelectTab}
                    onCloseTab={handleCloseTab}
                    onNewTab={() => handleNewTab("aster://newtab")}
                    onReorderTabs={reorderTabs}
                />

                <NavigationBar
                    currentUrl={activeUrl}
                    activeTabId={activeTabId}
                    onNewTab={(url) => handleNewTab(url || "aster://newtab")}
                    onNavigate={handleNavigate}
                    onGoBack={() =>
                        invoke("webview_go_back", {
                            label: `tab_${activeTabId}`,
                        })
                    }
                    onGoForward={() =>
                        invoke("webview_go_forward", {
                            label: `tab_${activeTabId}`,
                        })
                    }
                    onReload={() =>
                        invoke("webview_reload", {
                            label: `tab_${activeTabId}`,
                        })
                    }
                    onToggleSidebar={() => {
                        setIsSidebarOpen((prev) => !prev);
                        if (isMenuOpen) setIsMenuOpen(false);
                        if (isExtensionsOpen) setIsExtensionsOpen(false);
                    }}
                    isSidebarOpen={isSidebarOpen}
                    onToggleExtensionsSidebar={() => {
                        setIsExtensionsOpen((prev) => !prev);
                        if (isSidebarOpen) setIsSidebarOpen(false);
                        if (isMenuOpen) setIsMenuOpen(false);
                    }}
                    isExtensionsOpen={isExtensionsOpen}
                    onToggleMenu={() => {
                        setIsMenuOpen((prev) => !prev);
                        if (isSidebarOpen) setIsSidebarOpen(false);
                        if (isExtensionsOpen) setIsExtensionsOpen(false);
                    }}
                    isMenuOpen={isMenuOpen}
                    hasUnreadDownloads={hasUnread}
                    isDownloading={isDownloading}
                    onOpenDownloads={handleOpenDownloads}
                />
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                <MainViewport
                    viewportRef={viewportRef}
                    activeUrl={activeUrl}
                    activeTabId={activeTabId}
                    downloads={downloads}
                    onNavigate={handleNavigate}
                    onOpenFolder={openInFolder}
                />

                {isMenuOpen && (
                    <MenuSidebar
                        onClose={() => setIsMenuOpen(false)}
                        onNewTab={(url) => {
                            if (url === "aster://downloads") {
                                handleOpenDownloads();
                            } else {
                                handleNewTab(url || "aster://newtab");
                            }
                        }}
                        activeTabId={activeTabId}
                        activeTabUrl={activeTab?.url}
                    />
                )}

                {isExtensionsOpen && (
                    <ExtensionsPanel
                        activeTabId={activeTabId}
                        tabExtensions={
                            activeTabId && extensionsMap[activeTabId]
                                ? extensionsMap[activeTabId]
                                : DEFAULT_EXTENSION_STATES
                        }
                        onUpdateExtension={handleUpdateExtension}
                        onClose={() => setIsExtensionsOpen(false)}
                    />
                )}

                {isSidebarOpen && (
                    <AIPanel
                        settings={aiSettings}
                        onSaveSettings={setAiSettings}
                    />
                )}
            </div>
        </div>
    );
}

export default App;
