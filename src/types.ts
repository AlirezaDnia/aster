export interface Tab {
    id: string;
    title: string;
    url: string;
    favicon?: string;
    isLoading: boolean;
}

export type AIProvider = "openrouter" | "openai" | "gemini";

export interface AISettings {
    provider: AIProvider;
    apiKey: string;
    model: string;
}

export interface ChatMessage {
    id: string;
    sender: "user" | "ai";
    text: string;
    timestamp: string;
}
