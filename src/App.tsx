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
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const { viewportRef } = useWebviewBounds(activeTabId, activeTab?.url);

    // دریافت درخواست ساخت تب جدید از نیتیو وب‌ویو
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
                    activeTabId={activeTabId} // 👈 اضافه شد
                    onNewTab={() => handleNewTab("")} // 👈 اضافه شد
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
