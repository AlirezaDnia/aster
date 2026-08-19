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
