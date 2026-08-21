import { useState, useEffect, useCallback } from "react";
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

    useEffect(() => {
        const unlistenPromise = listen<string>("open-new-tab", (event) => {
            if (event.payload) {
                handleNewTab(event.payload);
            }
        });

        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [handleNewTab]);

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
                    onOpenDownloads={() => {
                        markAsRead();
                        handleNewTab("aster://downloads");
                    }}
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
                        onNewTab={(url) =>
                            handleNewTab(url || "aster://newtab")
                        }
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
