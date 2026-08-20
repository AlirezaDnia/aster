import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { TabBar } from "./components/TabBar";
import { NavigationBar } from "./components/NavigationBar";
import { AIPanel } from "./components/AIPanel";
import { MenuSidebar } from "./components/MenuSidebar";
import { ExtensionsPanel } from "./components/ExtensionsPanel";
import { StartPage } from "./components/StartPage";
import { useTabManager } from "./hooks/useTabManager";
import { useWebviewBounds } from "./hooks/useWebviewBounds";
import { useAISettings } from "./hooks/useAISettings";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
export interface ExtensionStates {
    rtl: boolean;
    vazir: boolean;
    dark: boolean;
}

const DEFAULT_EXTENSION_STATES: ExtensionStates = {
    rtl: false,
    vazir: false,
    dark: false,
};

// ----------------------------------------------------------------------
// Pure Native Injection Script Generator
// ----------------------------------------------------------------------
function buildScript(states: ExtensionStates): string {
    const isRtl = Boolean(states.rtl);
    const isVazir = Boolean(states.vazir);
    const isDark = Boolean(states.dark);

    return `
(function() {
    try {
        const docHead = document.head || document.documentElement;

        // 1. RTL / Direction Extension
        const rtlId = '__ext_rtl_style__';
        let rtlEl = document.getElementById(rtlId);
        if (${isRtl}) {
            if (!rtlEl) {
                rtlEl = document.createElement('style');
                rtlEl.id = rtlId;
                rtlEl.textContent = \`
                    html, body, p, span, h1, h2, h3, h4, h5, h6, input, textarea, button, a, li, div, td, th {
                        direction: rtl !important;
                        text-align: right !important;
                    }
                \`;
                docHead.appendChild(rtlEl);
                document.documentElement.setAttribute('dir', 'rtl');
            }
        } else {
            if (rtlEl) {
                rtlEl.remove();
            }
            if (document.documentElement.getAttribute('dir') === 'rtl') {
                document.documentElement.removeAttribute('dir');
            }
        }

        // 2. Vazir Font Extension
        const vazirId = '__ext_vazir_style__';
        let vazirEl = document.getElementById(vazirId);
        if (${isVazir}) {
            if (!vazirEl) {
                vazirEl = document.createElement('style');
                vazirEl.id = vazirId;
                vazirEl.textContent = \`
                    @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');
                    *:not(i):not(.fa):not(.fas):not(.far):not(.material-icons) {
                        font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                    }
                \`;
                docHead.appendChild(vazirEl);
            }
        } else {
            if (vazirEl) {
                vazirEl.remove();
            }
        }

        // 3. Dark Mode Extension (Isolated from direction)
        const darkId = '__ext_dark_style__';
        let darkEl = document.getElementById(darkId);
        if (${isDark}) {
            if (!darkEl) {
                darkEl = document.createElement('style');
                darkEl.id = darkId;
                darkEl.textContent = \`
                    html {
                        filter: invert(0.92) hue-rotate(180deg) !important;
                        background-color: #121212 !important;
                    }
                    img, video, canvas, svg, iframe, [style*="background-image"], embed, object {
                        filter: invert(1.08) hue-rotate(180deg) !important;
                    }
                \`;
                docHead.appendChild(darkEl);
            }
        } else {
            if (darkEl) {
                darkEl.remove();
            }
        }
    } catch (err) {
        console.error('[Extension System] Injection error:', err);
    }
})();
    `;
}

// ----------------------------------------------------------------------
// Main Application
// ----------------------------------------------------------------------
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

    // Sidebars State
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [isExtensionsOpen, setIsExtensionsOpen] = useState<boolean>(false);

    // Extensions Map per Tab
    const [extensionsMap, setExtensionsMap] = useState<
        Record<string, ExtensionStates>
    >({});

    // متد تزریق اسکریپت اکستنشن به وب‌ویو
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

    // مدیریت آپدیت وضعیت اکستنشن
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

    // با تغییر URL یا رفرش صفحه، استیت اکستنشن‌های آن تب به حالت اولیه (غیرفعال) بازنشانی می‌شود
    useEffect(() => {
        if (!activeTabId) return;

        setExtensionsMap((prev) => ({
            ...prev,
            [activeTabId]: { ...DEFAULT_EXTENSION_STATES },
        }));
    }, [activeTabId, activeTab?.url]);

    // محاسبه اندازه نیتیو وب‌ویو با هوک
    const { viewportRef } = useWebviewBounds(
        activeTabId,
        activeTab?.url,
        isSidebarOpen,
        isMenuOpen,
        isExtensionsOpen,
    );

    // شنونده باز شدن تب جدید از سمت Tauri
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

    return (
        <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
            {/* TabBar & NavigationBar */}
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
                    activeTabId={activeTabId}
                    onNewTab={() => handleNewTab("")}
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
                />
            </header>

            {/* Viewport Area */}
            <div className="flex flex-1 overflow-hidden relative">
                <main
                    ref={viewportRef}
                    className="flex-1 bg-slate-900 flex items-center justify-center overflow-hidden"
                >
                    {(!activeTab?.url || activeTab.url === "about:blank") && (
                        <StartPage onSearch={handleNavigate} />
                    )}
                </main>

                {/* Sidebars */}
                {isMenuOpen && (
                    <MenuSidebar
                        onClose={() => setIsMenuOpen(false)}
                        onNewTab={() => handleNewTab("")}
                        activeTabId={activeTabId}
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
