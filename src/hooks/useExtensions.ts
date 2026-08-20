import { useState, useEffect } from "react";

export interface ExtensionSettings {
    autoRtl: boolean;
    customFont: boolean;
    forceDarkMode: boolean;
}

const DEFAULT_SETTINGS: ExtensionSettings = {
    autoRtl: true,
    customFont: true,
    forceDarkMode: false,
};

export function useExtensions() {
    const [extensions, setExtensions] = useState<ExtensionSettings>(() => {
        const saved = localStorage.getItem("browser_extensions");
        return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    });

    useEffect(() => {
        localStorage.setItem("browser_extensions", JSON.stringify(extensions));
    }, [extensions]);

    const toggleExtension = (key: keyof ExtensionSettings) => {
        setExtensions((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return { extensions, toggleExtension };
}
