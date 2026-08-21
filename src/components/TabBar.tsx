import React, { useState } from "react";
import { Tab } from "../types";
import { ProgressBar } from "./ProgressBar";

interface TabBarProps {
    tabs: Tab[];
    activeTabId: string;
    onSelectTab: (id: string) => void;
    onCloseTab: (id: string) => void;
    onNewTab: () => void;
    onReorderTabs: (draggedIndex: number, targetIndex: number) => void;
}

export function TabBar({
    tabs,
    activeTabId,
    onSelectTab,
    onCloseTab,
    onNewTab,
    onReorderTabs,
}: TabBarProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // مدیریت شروع درگ HTML5
    const handleDragStart = (
        e: React.DragEvent<HTMLDivElement>,
        index: number,
    ) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // تنظیم تصویر شفاف یا داتا جهت بهبود بصری هنگام درگ
        if (e.dataTransfer.setDragImage && e.currentTarget) {
            e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
        }
    };

    const handleDragOver = (
        e: React.DragEvent<HTMLDivElement>,
        index: number,
    ) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDrop = (
        e: React.DragEvent<HTMLDivElement>,
        targetIndex: number,
    ) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== targetIndex) {
            onReorderTabs(draggedIndex, targetIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // بستن تب با کلیک وسط (Middle Click)
    const handleAuxClick = (
        e: React.MouseEvent<HTMLDivElement>,
        tabId: string,
    ) => {
        if (e.button === 1 && tabs.length > 1) {
            e.preventDefault();
            onCloseTab(tabId);
        }
    };

    return (
        <div className="flex items-center bg-slate-950 px-2 pt-1.5 gap-1 overflow-x-auto no-scrollbar border-b border-slate-800/80 select-none">
            {/* Logo / Brand Icon */}
            <div
                className="flex items-center justify-center px-2.5 py-1.5 bg-slate-900/40 rounded-t-lg text-indigo-400 font-bold text-xs cursor-default mr-1 border-t border-x border-slate-800/40 shrink-0"
                title="Aster Browser"
            >
                <span>✱</span>
            </div>

            {/* Tab List */}
            {tabs.map((tab, index) => {
                const isActive = tab.id === activeTabId;
                const isBeingDragged = draggedIndex === index;
                const isOver = dragOverIndex === index;

                return (
                    <div
                        key={tab.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onSelectTab(tab.id)}
                        onAuxClick={(e) => handleAuxClick(e, tab.id)}
                        className={`group relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-t-lg cursor-pointer max-w-[200px] min-w-[130px] transition-all duration-150 border-t border-x overflow-hidden ${
                            isActive
                                ? "bg-slate-900 text-slate-100 border-slate-800/90 shadow-sm"
                                : "bg-transparent text-slate-400 border-transparent hover:bg-slate-900/50 hover:text-slate-200"
                        } ${isBeingDragged ? "opacity-30" : ""} ${
                            isOver && draggedIndex !== index
                                ? "border-b-2 border-b-indigo-500 bg-slate-800/40"
                                : ""
                        }`}
                    >
                        {/* Favicon or Loading Spinner */}
                        {tab.isLoading ? (
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin flex-shrink-0" />
                        ) : tab.favicon ? (
                            <img
                                src={tab.favicon}
                                alt=""
                                className="w-3.5 h-3.5 rounded-sm flex-shrink-0 pointer-events-none"
                                onError={(e) => {
                                    (e.target as HTMLElement).style.display =
                                        "none";
                                }}
                            />
                        ) : (
                            <div className="w-3.5 h-3.5 rounded-full bg-slate-700/60 flex-shrink-0 pointer-events-none" />
                        )}

                        {/* Title */}
                        <span className="truncate flex-1 pointer-events-none text-[11px]">
                            {tab.title || "New Tab"}
                        </span>

                        {/* Close Button */}
                        {tabs.length > 1 && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCloseTab(tab.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 hover:bg-slate-800 p-0.5 rounded text-slate-400 hover:text-slate-100 transition-opacity shrink-0"
                                title="Close tab"
                            >
                                ✕
                            </button>
                        )}

                        {/* Progress Bar Component */}
                        <ProgressBar isLoading={Boolean(tab.isLoading)} />
                    </div>
                );
            })}

            {/* New Tab Button */}
            <button
                type="button"
                onClick={onNewTab}
                className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 rounded-md transition-colors ml-0.5 shrink-0"
                title="New Tab"
            >
                +
            </button>
        </div>
    );
}
