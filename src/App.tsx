import { useState, useEffect } from "react";
import { Tab, AISettings } from "./types";
import { TabBar } from "./components/TabBar";
import { NavigationBar } from "./components/NavigationBar";
import { AIPanel } from "./components/AIPanel";
import { StartPage } from "./components/StartPage";

export function App() {
    const [tabs, setTabs] = useState<Tab[]>([
        { id: "1", title: "New Tab", url: "", isLoading: false },
    ]);
    const [activeTabId, setActiveTabId] = useState<string>("1");
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

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
        setTabs((prev) => [...prev, newTab]);
        setActiveTabId(newId);
    };

    const handleCloseTab = (id: string) => {
        if (tabs.length === 1) return;
        setTabs((prev) => {
            const filtered = prev.filter((t) => t.id !== id);
            if (activeTabId === id) {
                setActiveTabId(filtered[filtered.length - 1].id);
            }
            return filtered;
        });
    };

    const handleNavigate = (input: string) => {
        let targetUrl = input.trim();

        if (!/^https?:\/\//i.test(targetUrl)) {
            if (targetUrl.includes(".") && !targetUrl.includes(" ")) {
                targetUrl = `https://${targetUrl}`;
            } else {
                targetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(targetUrl)}`;
            }
        }

        setTabs((prev) =>
            prev.map((tab) => {
                if (tab.id === activeTabId) {
                    let title = targetUrl;
                    try {
                        const parsed = new URL(targetUrl);
                        title = parsed.hostname.replace("www.", "");
                    } catch {
                        title = targetUrl;
                    }
                    return { ...tab, url: targetUrl, title };
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
                <main className="flex-1 bg-slate-900 flex items-center justify-center overflow-hidden">
                    {activeTab?.url ? (
                        <iframe
                            key={activeTab.id + activeTab.url}
                            src={activeTab.url}
                            className="h-full w-full border-none bg-white"
                            title="Browser Workspace"
                        />
                    ) : (
                        <StartPage onSearch={handleNavigate} />
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
