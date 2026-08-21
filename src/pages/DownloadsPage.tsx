import { Download, File } from "lucide-react";

export function DownloadsPage() {
    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <Download className="h-6 w-6 text-indigo-400" />
                <h1 className="text-2xl font-bold">Downloads</h1>
            </div>

            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
                <File className="h-12 w-12 stroke-[1.5]" />
                <p className="text-sm">No recent downloads</p>
            </div>
        </div>
    );
}
