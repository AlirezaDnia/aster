import { Sparkles } from "lucide-react";

export function App() {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
            <div className="flex items-center gap-3 rounded-xl bg-slate-800 p-6 shadow-2xl border border-slate-700">
                <Sparkles className="h-8 w-8 text-indigo-400 animate-pulse" />
                <h1 className="text-2xl font-bold tracking-tight">
                    Aster Browser v1.0
                </h1>
            </div>
        </div>
    );
}

export default App;
