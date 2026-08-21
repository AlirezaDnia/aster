import { Settings, Shield, Sliders, Moon } from "lucide-react";

export function SettingsPage() {
    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <Settings className="h-6 w-6 text-indigo-400" />
                <h1 className="text-2xl font-bold">Settings</h1>
            </div>

            <div className="grid gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-indigo-400" />
                        <div>
                            <h3 className="font-medium text-sm text-slate-200">
                                Built-in Extension Rules
                            </h3>
                            <p className="text-xs text-slate-500">
                                Auto-RTL for AI platforms and Vazirmatn Persian
                                fonts injection
                            </p>
                        </div>
                    </div>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full">
                        Active
                    </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Moon className="h-5 w-5 text-indigo-400" />
                        <div>
                            <h3 className="font-medium text-sm text-slate-200">
                                Theme Preference
                            </h3>
                            <p className="text-xs text-slate-500">
                                Aster UI default theme
                            </p>
                        </div>
                    </div>
                    <span className="text-xs text-slate-400">
                        Dark System Mode
                    </span>
                </div>
            </div>
        </div>
    );
}
