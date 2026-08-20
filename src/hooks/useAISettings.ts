import { useState, useEffect } from "react";
import { AISettings } from "../types";

export function useAISettings() {
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

    return { aiSettings, setAiSettings };
}
