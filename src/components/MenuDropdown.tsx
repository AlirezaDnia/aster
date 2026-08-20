import React, { useEffect, useRef } from "react";
import { Plus, RotateCw, Download, History, Settings } from "lucide-react";

interface MenuDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    onNewTab: () => void;
    onReload: () => void;
}

export function MenuDropdown({
    isOpen,
    onClose,
    onNewTab,
    onReload,
}: MenuDropdownProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={menuRef}
            className="absolute right-3 top-12 z-[9999] w-52 rounded-2xl bg-slate-900/95 border border-slate-800 text-slate-200 p-1.5 text-xs shadow-2xl backdrop-blur-xl select-none"
        >
            <button
                onClick={() => {
                    onNewTab();
                    onClose();
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors"
            >
                <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> New tab
                </span>
                <span className="text-[10px] text-slate-500">Ctrl+T</span>
            </button>
            <button
                onClick={() => {
                    onReload();
                    onClose();
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors"
            >
                <span className="flex items-center gap-2">
                    <RotateCw className="h-4 w-4" /> Reload
                </span>
                <span className="text-[10px] text-slate-500">Ctrl+R</span>
            </button>

            <div className="h-px bg-slate-800 my-1" />

            <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-800">
                <Download className="h-4 w-4" /> Downloads
            </button>
            <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-800">
                <History className="h-4 w-4" /> History
            </button>
            <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-800">
                <Settings className="h-4 w-4" /> Settings
            </button>
        </div>
    );
}
