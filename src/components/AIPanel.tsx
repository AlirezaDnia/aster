import React, { useState } from "react";
import {
    Sparkles,
    Key,
    Settings,
    Check,
    Send,
    Bot,
    User,
    Loader2,
} from "lucide-react";
import { AISettings, AIProvider, ChatMessage } from "../types";
import { sendAIPrompt } from "../services/aiService";

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

    const [inputPrompt, setInputPrompt] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSaveSettings({ provider, apiKey, model });
        setShowConfig(false);
    };

    const handleSendPrompt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputPrompt.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: "user",
            text: inputPrompt,
            timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };

        setMessages((prev) => [...prev, userMessage]);
        const currentPrompt = inputPrompt;
        setInputPrompt("");
        setIsLoading(true);

        try {
            const responseText = await sendAIPrompt(currentPrompt, settings);
            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: "ai",
                text: responseText,
                timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (err: any) {
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: "ai",
                text: `Error: ${err.message}`,
                timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <aside className="w-80 border-l border-slate-800 bg-slate-950 p-3 flex flex-col justify-between h-full">
            <div className="flex flex-col gap-3 flex-1 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        <h3 className="text-sm font-semibold text-slate-200">
                            Aster AI Assistant
                        </h3>
                    </div>
                    <button
                        onClick={() => setShowConfig(!showConfig)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                        title="API Settings"
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
                            <span>API Credentials</span>
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
                                className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 mb-1">
                                Model Name
                            </label>
                            <input
                                type="text"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                placeholder="google/gemini-2.5-flash"
                                className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            className="mt-2 flex items-center justify-center gap-1.5 rounded bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-500 transition-colors"
                        >
                            <Check className="h-3.5 w-3.5" />
                            <span>Save Settings</span>
                        </button>
                    </form>
                ) : (
                    /* Chat Interface */
                    <div className="flex flex-col flex-1 overflow-hidden">
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 text-xs gap-2">
                                    <Bot className="h-8 w-8 text-indigo-400/50" />
                                    <p>
                                        Enter your prompt to start chatting with
                                        Aster AI.
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col gap-1 text-xs ${
                                            msg.sender === "user"
                                                ? "items-end"
                                                : "items-start"
                                        }`}
                                    >
                                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                            {msg.sender === "user" ? (
                                                <User className="h-3 w-3" />
                                            ) : (
                                                <Bot className="h-3 w-3 text-indigo-400" />
                                            )}
                                            <span>{msg.timestamp}</span>
                                        </div>
                                        <div
                                            className={`p-2.5 rounded-lg max-w-[90%] whitespace-pre-wrap leading-relaxed ${
                                                msg.sender === "user"
                                                    ? "bg-indigo-600 text-white rounded-br-none"
                                                    : "bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none"
                                            }`}
                                        >
                                            {msg.text}
                                        </div>
                                    </div>
                                ))
                            )}
                            {isLoading && (
                                <div className="flex items-center gap-2 text-xs text-indigo-400 p-2">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Generating response...</span>
                                </div>
                            )}
                        </div>

                        {/* Prompt Input Box */}
                        <form
                            onSubmit={handleSendPrompt}
                            className="mt-2 pt-2 border-t border-slate-800 flex gap-1.5"
                        >
                            <input
                                type="text"
                                value={inputPrompt}
                                onChange={(e) => setInputPrompt(e.target.value)}
                                placeholder="Ask Aster AI or type a prompt..."
                                disabled={isLoading}
                                className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !inputPrompt.trim()}
                                className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors shrink-0"
                            >
                                <Send className="h-3.5 w-3.5" />
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </aside>
    );
}
