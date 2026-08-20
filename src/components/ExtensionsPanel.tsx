import React from "react";
import { X, Moon, AlignRight, Type } from "lucide-react";
import { ExtensionStates } from "../App";

interface ExtensionsPanelProps {
    activeTabId: string | null;
    tabExtensions: ExtensionStates;
    onUpdateExtension: (
        tabId: string,
        key: keyof ExtensionStates,
        value: boolean,
    ) => void;
    onClose: () => void;
}

export const ExtensionsPanel: React.FC<ExtensionsPanelProps> = ({
    activeTabId,
    tabExtensions,
    onUpdateExtension,
    onClose,
}) => {
    if (!activeTabId) return null;

    return (
        <aside className="w-80 h-full bg-slate-900 border-l border-slate-800 p-4 flex flex-col gap-4 text-slate-100 z-20 select-none">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                    Extensions
                </h2>
                <button
                    onClick={onClose}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                    title="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Extensions List */}
            <div className="flex flex-col gap-3">
                {/* Dark Mode */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800/60 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                        <Moon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-200">
                            Dark Mode
                        </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={tabExtensions.dark}
                            onChange={(e) =>
                                onUpdateExtension(
                                    activeTabId,
                                    "dark",
                                    e.target.checked,
                                )
                            }
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* RTL Layout */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800/60 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                        <AlignRight className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-200">
                            RTL Layout
                        </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={tabExtensions.rtl}
                            onChange={(e) =>
                                onUpdateExtension(
                                    activeTabId,
                                    "rtl",
                                    e.target.checked,
                                )
                            }
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Vazir Font */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800/60 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                        <Type className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-200">
                            Vazir Font
                        </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={tabExtensions.vazir}
                            onChange={(e) =>
                                onUpdateExtension(
                                    activeTabId,
                                    "vazir",
                                    e.target.checked,
                                )
                            }
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>
        </aside>
    );
};
