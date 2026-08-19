import { useState, useEffect } from "react";
import { Tab, AISettings } from "./types";
import { TabBar } from "./components/TabBar";
import { NavigationBar } from "./components/NavigationBar";
import { AIPanel } from "./components/AIPanel";
import "./App.css";

export function App() {
    const [tabs, setTabs] = useState<Tab[]>([
        { id: "1", title: "New Tab", url: "", isLoading: false },
    ]);
    const [activeTabId, setActiveTabId] = useState<string>("1");
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

    // Local Storage for AI Credentials
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

    const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

    const handleSelectTab = (id: string) => setActiveTabId(id);

    const handleNewTab = () => {
        const newId = Date.now().toString();
        const newTab: Tab = {
            id: newId,
            title: "New Tab",
            url: "",
            isLoading: false,
        };
        setTabs([...tabs, newTab]);
        setActiveTabId(newId);
    };

    const handleCloseTab = (id: string) => {
        if (tabs.length === 1) return;
        const filtered = tabs.filter((t) => t.id !== id);
        setTabs(filtered);
        if (activeTabId === id) {
            setActiveTabId(filtered[filtered.length - 1].id);
        }
    };

    const handleNavigate = (url: string) => {
        setTabs((prev) =>
            prev.map((tab) => {
                if (tab.id === activeTabId) {
                    let title = url;
                    try {
                        const parsed = new URL(url);
                        title = parsed.hostname.replace("www.", "");
                    } catch {
                        title = url;
                    }
                    return { ...tab, url, title };
                }
                return tab;
            }),
        );
    };

    return (
        <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
            <TabBar
                tabs={tabs}
                activeTabId={activeTabId}
                onSelectTab={handleSelectTab}
                onCloseTab={handleCloseTab}
                onNewTab={handleNewTab}
            />

            <NavigationBar
                currentUrl={activeTab?.url || ""}
                onNavigate={handleNavigate}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                isSidebarOpen={isSidebarOpen}
            />

            <div className="flex flex-1 overflow-hidden relative">
                <main className="flex-1 bg-slate-900 flex items-center justify-center p-6">
                    {activeTab?.url ? (
                        <iframe
                            src={activeTab.url}
                            className="h-full w-full rounded-lg border border-slate-800 bg-white"
                            title="Browser View"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-center">
                            <h2 className="text-xl font-bold text-slate-300">
                                Aster Browser
                            </h2>
                            <p className="text-xs text-slate-500 max-w-sm">
                                Enter a URL or search query in the address bar
                                above to begin browsing.
                            </p>
                        </div>
                    )}
                </main>

                {isSidebarOpen && (
                    <AIPanel
                        settings={aiSettings}
                        onSaveSettings={(newSettings) =>
                            setAiSettings(newSettings)
                        }
                    />
                )}
            </div>
        </div>
    );
}

export default App;
