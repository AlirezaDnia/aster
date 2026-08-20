import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { TabBar } from "./components/TabBar";
import { NavigationBar } from "./components/NavigationBar";
import { AIPanel } from "./components/AIPanel";
import { StartPage } from "./components/StartPage";
import { useTabManager } from "./hooks/useTabManager";
import { useWebviewBounds } from "./hooks/useWebviewBounds";
import { useAISettings } from "./hooks/useAISettings";

interface TabStatePayload {
    label: string;
    url: string;
    title: string;
    favicon: string;
    isLoading: boolean;
}

export function App() {
    const {
        tabs,
        setTabs,
        activeTabId,
        activeTab,
        handleSelectTab,
        handleNewTab,
        handleCloseTab,
        handleNavigate,
        reorderTabs,
    } = useTabManager();

    const { aiSettings, setAiSettings } = useAISettings();
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const { viewportRef } = useWebviewBounds(activeTabId, activeTab?.url);

    // ۱. دریافت درخواست ساخت تب جدید
    useEffect(() => {
        const unlistenPromise = listen<string>("open-new-tab", (event) => {
            if (event.payload) {
                handleNewTab(event.payload);
            }
        });

        return () => {
            unlistenPromise.then((fn) => fn());
        };
    }, [handleNewTab]);

    // ۲. دریافت تغییرات وضعیت وب‌ویو (حل قطعی مشکل پروگرس بار)
    useEffect(() => {
        const unlistenPromise = listen<TabStatePayload>(
            "tab-state-changed",
            (event) => {
                const { label, url, title, favicon, isLoading } = event.payload;

                // دریافت Label وب‌ویو و استخراج ID واقعی تب (مثلاً تبدیل tab_123 به 123)
                const tabId = label.startsWith("tab_")
                    ? label.replace("tab_", "")
                    : label;

                setTabs((prevTabs) =>
                    prevTabs.map((tab) => {
                        if (tab.id === tabId) {
                            // جلوگیری از رندر مجدد در صورتی که دیتای جدید با دیتای فعلی دقیقا یکسان باشد
                            if (
                                tab.url === url &&
                                tab.title === title &&
                                tab.favicon === favicon &&
                                tab.isLoading === isLoading
                            ) {
                                return tab;
                            }

                            return {
                                ...tab,
                                url: url || tab.url,
                                title:
                                    title && title !== "Loading..."
                                        ? title
                                        : tab.title,
                                favicon: favicon || tab.favicon,
                                isLoading: isLoading,
                            };
                        }
                        return tab;
                    }),
                );
            },
        );

        return () => {
            unlistenPromise.then((fn) => fn());
        };
    }, [setTabs]);

    return (
        <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
            <header className="flex flex-col z-10">
                <TabBar
                    tabs={tabs}
                    activeTabId={activeTabId}
                    onSelectTab={handleSelectTab}
                    onCloseTab={handleCloseTab}
                    onNewTab={() => handleNewTab("")}
                    onReorderTabs={reorderTabs}
                />

                <NavigationBar
                    currentUrl={activeTab?.url || ""}
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
                    onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
                    isSidebarOpen={isSidebarOpen}
                />
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                <main
                    ref={viewportRef}
                    className="flex-1 bg-slate-900 flex items-center justify-center overflow-hidden"
                >
                    {(!activeTab?.url || activeTab.url === "about:blank") && (
                        <StartPage onSearch={handleNavigate} />
                    )}
                </main>

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
