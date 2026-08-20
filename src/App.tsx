import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { AISettings } from "./types";
import { TabBar } from "./components/TabBar";
import { NavigationBar } from "./components/NavigationBar";
import { AIPanel } from "./components/AIPanel";
import { StartPage } from "./components/StartPage";
import { useTabManager } from "./hooks/useTabManager";
import { useWebviewBounds } from "./hooks/useWebviewBounds";

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
    } = useTabManager();

    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const { viewportRef } = useWebviewBounds(activeTabId, activeTab?.url);

    const [aiSettings, setAiSettings] = useState<AISettings>(() => {
        const saved = localStorage.getItem("aster_ai_settings");
        return saved
            ? JSON.parse(saved)
            : {
                  provider: "openrouter",
                  apiKey: "",
                  model: "google/gemini-2.5-flash",
              };
    });

    useEffect(() => {
        localStorage.setItem("aster_ai_settings", JSON.stringify(aiSettings));
    }, [aiSettings]);

    // شنیدن تغییرات State وب‌ویو
    useEffect(() => {
        const unlistenPromise = listen<{
            label: string;
            url: string;
            title: string;
        }>("tab-state-changed", (event) => {
            const { label, url, title } = event.payload;
            const tabId = label.replace("tab_", "");

            setTabs((prev) =>
                prev.map((tab) => {
                    if (tab.id === tabId) {
                        return {
                            ...tab,
                            url: url || tab.url,
                            title:
                                title && title.trim() !== ""
                                    ? title
                                    : tab.title,
                        };
                    }
                    return tab;
                }),
            );
        });

        return () => {
            unlistenPromise.then((fn) => fn());
        };
    }, [setTabs]);

    // شنیدن رویداد باز شدن تب جدید از سمت Rust
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
            <TabBar
                tabs={tabs}
                activeTabId={activeTabId}
                onSelectTab={handleSelectTab}
                onCloseTab={handleCloseTab}
                onNewTab={() => handleNewTab("")}
            />

            <NavigationBar
                currentUrl={activeTab?.url || ""}
                onNavigate={handleNavigate}
                onGoBack={() =>
                    invoke("webview_go_back", { label: `tab_${activeTabId}` })
                }
                onGoForward={() =>
                    invoke("webview_go_forward", {
                        label: `tab_${activeTabId}`,
                    })
                }
                onReload={() =>
                    invoke("webview_reload", { label: `tab_${activeTabId}` })
                }
                onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
                isSidebarOpen={isSidebarOpen}
            />

            <div className="flex flex-1 overflow-hidden relative">
                <main
                    ref={viewportRef}
                    className="flex-1 bg-slate-900 flex items-center justify-center overflow-hidden"
                >
                    {!activeTab?.url && <StartPage onSearch={handleNavigate} />}
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
