import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
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

    const viewportRef = useRef<HTMLDivElement>(null);

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

    // آپدیت ابعاد و وضعیت Webview
    const updateWebviewBounds = (tabId: string, url: string) => {
        if (!viewportRef.current) return;

        if (!url) {
            invoke("hide_tab_webview", { label: `tab_${tabId}` }).catch(
                () => {},
            );
            return;
        }

        setTimeout(() => {
            if (!viewportRef.current) return;
            const rect = viewportRef.current.getBoundingClientRect();
            invoke("create_or_show_tab_webview", {
                label: `tab_${tabId}`,
                url: url,
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
            }).catch(console.error);
        }, 50);
    };

    // لیسنر دریافت رویداد Open in New Tab
    useEffect(() => {
        const unlisten = listen<string>("open-new-tab", (event) => {
            const targetUrl = event.payload;
            if (!targetUrl) return;

            const newId = Date.now().toString();
            let title = targetUrl;
            try {
                title = new URL(targetUrl).hostname.replace("www.", "");
            } catch {}

            const newTab: Tab = {
                id: newId,
                title: title,
                url: targetUrl,
                isLoading: false,
            };

            setTabs((prev) => [...prev, newTab]);
        });

        return () => {
            unlisten.then((fn) => fn());
        };
    }, []);

    useEffect(() => {
        if (activeTab && activeTab.url) {
            updateWebviewBounds(activeTab.id, activeTab.url);
        }
    }, [isSidebarOpen, activeTabId]);

    // اکشن‌های دکمه‌های پیمایش مرورگر
    const handleGoBack = () => {
        if (activeTabId) {
            invoke("webview_go_back", { label: `tab_${activeTabId}` }).catch(
                console.error,
            );
        }
    };

    const handleGoForward = () => {
        if (activeTabId) {
            invoke("webview_go_forward", { label: `tab_${activeTabId}` }).catch(
                console.error,
            );
        }
    };

    const handleReload = () => {
        if (activeTabId) {
            invoke("webview_reload", { label: `tab_${activeTabId}` }).catch(
                console.error,
            );
        }
    };

    const handleSelectTab = (id: string) => {
        if (activeTabId && activeTabId !== id) {
            invoke("hide_tab_webview", { label: `tab_${activeTabId}` }).catch(
                () => {},
            );
        }

        setActiveTabId(id);
        const targetTab = tabs.find((t) => t.id === id);
        if (targetTab && targetTab.url) {
            updateWebviewBounds(id, targetTab.url);
        }
    };

    const handleNewTab = () => {
        if (activeTab && activeTab.url) {
            invoke("hide_tab_webview", { label: `tab_${activeTab.id}` }).catch(
                () => {},
            );
        }

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

        invoke("close_tab_webview", { label: `tab_${id}` }).catch(
            console.error,
        );

        setTabs((prev) => {
            const filtered = prev.filter((t) => t.id !== id);
            if (activeTabId === id) {
                const nextActive = filtered[filtered.length - 1];
                setActiveTabId(nextActive.id);
                if (nextActive.url) {
                    updateWebviewBounds(nextActive.id, nextActive.url);
                }
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
                targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`;
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

        updateWebviewBounds(activeTabId, targetUrl);
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
                onGoBack={handleGoBack}
                onGoForward={handleGoForward}
                onReload={handleReload}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
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
