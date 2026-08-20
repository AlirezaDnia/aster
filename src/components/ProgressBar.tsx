// src/components/ProgressBar.tsx

export function ProgressBar({ isLoading }: { isLoading: boolean }) {
    if (!isLoading) return null;

    return (
        <div className="w-full h-[2px] bg-transparent overflow-hidden relative">
            <div className="w-full h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 animate-progress-line origin-left" />
        </div>
    );
}
