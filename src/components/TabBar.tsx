import { Plus, X, Globe, Shield } from "lucide-react";
import { Tab } from "../types";

interface TabBarProps {
    tabs: Tab[];
    activeTabId: string;
    onSelectTab: (id: string) => void;
    onCloseTab: (id: string) => void;
    onNewTab: () => void;
}

export function TabBar({
    tabs,
    activeTabId,
    onSelectTab,
    onCloseTab,
    onNewTab,
}: TabBarProps) {
    return (
        <div className="flex h-10 w-full items-center bg-slate-950 px-2 pt-1.5 gap-1 select-none border-b border-slate-800/60">
            <div className="flex items-center gap-1.5 px-2 text-indigo-400 font-bold text-xs tracking-wider uppercase">
                <Shield className="h-4 w-4" />
                <span>Aster</span>
            </div>

            <div className="flex flex-1 items-center gap-1 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTabId;
                    return (
                        <div
                            key={tab.id}
                            onClick={() => onSelectTab(tab.id)}
                            className={`group flex h-8 max-w-[200px] min-w-[120px] flex-1 items-center justify-between rounded-t-lg px-3 text-xs transition-all cursor-pointer ${
                                isActive
                                    ? "bg-slate-900 text-slate-100 font-medium shadow-sm border-t border-x border-slate-800"
                                    : "bg-slate-950/50 text-slate-400 hover:bg-slate-900/50 hover:text-slate-300"
                            }`}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Globe
                                    className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500"}`}
                                />
                                <span className="truncate">
                                    {tab.title || "New Tab"}
                                </span>
                            </div>

                            {tabs.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCloseTab(tab.id);
                                    }}
                                    className="rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-slate-800 hover:text-slate-200 transition-all"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    );
                })}

                <button
                    onClick={onNewTab}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
