import React, { useState } from "react";
import { Sparkles, Key, Settings, Check, Bot } from "lucide-react";
import { AISettings, AIProvider } from "../types";

interface AIPanelProps {
    settings: AISettings;
    onSaveSettings: (settings: AISettings) => void;
}

export function AIPanel({ settings, onSaveSettings }: AIPanelProps) {
    const [showConfig, setShowConfig] = useState(!settings.apiKey);
    const [provider, setProvider] = useState<AIProvider>(
        settings.provider || "openrouter",
    );
    const [apiKey, setApiKey] = useState(settings.apiKey || "");
    const [model, setModel] = useState(
        settings.model || "google/gemini-2.5-flash",
    );

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSaveSettings({ provider, apiKey, model });
        setShowConfig(false);
    };

    return (
        <aside className="w-80 border-l border-slate-800 bg-slate-950 p-4 flex flex-col justify-between h-full">
            <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        <h3 className="text-sm font-semibold text-slate-200">
                            Aster AI Assistant
                        </h3>
                    </div>
                    <button
                        onClick={() => setShowConfig(!showConfig)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                        title="AI Settings"
                    >
                        <Settings className="h-4 w-4" />
                    </button>
                </div>

                {/* Configuration View */}
                {showConfig ? (
                    <form
                        onSubmit={handleSave}
                        className="flex flex-col gap-3 text-xs"
                    >
                        <div className="flex items-center gap-1.5 text-indigo-400 font-medium">
                            <Key className="h-3.5 w-3.5" />
                            <span>API Settings</span>
                        </div>

                        <div>
                            <label className="block text-slate-400 mb-1">
                                Provider
                            </label>
                            <select
                                value={provider}
                                onChange={(e) =>
                                    setProvider(e.target.value as AIProvider)
                                }
                                className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                            >
                                <option value="openrouter">
                                    OpenRouter (Recommended)
                                </option>
                                <option value="openai">OpenAI</option>
                                <option value="gemini">Google Gemini</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-slate-400 mb-1">
                                API Key / Token
                            </label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-or-v1-..."
                                className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 mb-1">
                                Model ID
                            </label>
                            <input
                                type="text"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                placeholder="google/gemini-2.5-flash"
                                className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            className="mt-2 flex items-center justify-center gap-1.5 rounded bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-500 transition-colors"
                        >
                            <Check className="h-3.5 w-3.5" />
                            <span>Save Credentials</span>
                        </button>
                    </form>
                ) : (
                    /* Chat / Assistant View */
                    <div className="flex flex-col gap-3">
                        <div className="rounded border border-slate-800/80 bg-slate-900/50 p-3 text-xs">
                            <div className="flex items-center justify-between text-slate-400 mb-1">
                                <span className="font-medium text-slate-300">
                                    Active Provider:
                                </span>
                                <span className="capitalize text-indigo-400">
                                    {settings.provider}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                                <span className="font-medium text-slate-300">
                                    Model:
                                </span>
                                <span className="truncate max-w-[120px] text-slate-400">
                                    {settings.model}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 text-xs gap-2">
                            <Bot className="h-8 w-8 text-slate-600" />
                            <p>
                                AI Engine ready. Start prompting or ask
                                questions about the active tab.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="text-[10px] text-slate-600 border-t border-slate-900 pt-2 text-center">
                Keys are stored locally in your client environment.
            </div>
        </aside>
    );
}
