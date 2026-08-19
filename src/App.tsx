import { Sparkles } from "lucide-react";
import "./App.css";

export function App() {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white select-none">
            <div className="flex items-center gap-3 rounded-xl bg-slate-800/80 p-6 shadow-2xl border border-slate-700/50 backdrop-blur-md">
                <Sparkles className="h-8 w-8 text-indigo-400 animate-pulse" />
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Aster Browser
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        v1.0.0 • Powered by Tauri 2.0 & Rust
                    </p>
                </div>
            </div>
        </div>
    );
}

export default App;
