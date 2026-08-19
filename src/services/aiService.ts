import { AISettings } from "../types";

export async function sendAIPrompt(
    prompt: string,
    settings: AISettings,
): Promise<string> {
    if (!settings.apiKey) {
        throw new Error(
            "API Key missing. Please configure your API key in the settings panel.",
        );
    }

    let endpoint = "https://openrouter.ai/api/v1/chat/completions";
    if (settings.provider === "openai") {
        endpoint = "https://api.openai.com/v1/chat/completions";
    }

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${settings.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://asterbrowser.app",
            "X-Title": "Aster Browser",
        },
        body: JSON.stringify({
            model: settings.model || "google/gemini-2.5-flash",
            messages: [
                {
                    role: "system",
                    content:
                        "You are Aster AI, an intelligent native browser assistant built with Tauri 2.0, Rust, and React.",
                },
                { role: "user", content: prompt },
            ],
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            errorData.error?.message ||
                `API request failed with status code ${response.status}`,
        );
    }

    const data = await response.json();
    return (
        data.choices[0]?.message?.content || "No response received from model."
    );
}
