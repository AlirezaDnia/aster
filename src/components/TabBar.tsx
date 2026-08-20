import React, { useState, useRef } from "react";
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
    const isDragging = useRef(false);

    const handlePointerDown = (index: number) => {
        setDraggedIndex(index);
        isDragging.current = false;
    };

    const handlePointerEnter = (index: number) => {
        if (draggedIndex !== null && draggedIndex !== index) {
            isDragging.current = true;
            setDragOverIndex(index);
        }
    };

    const handlePointerUp = () => {
        if (
            draggedIndex !== null &&
            dragOverIndex !== null &&
            draggedIndex !== dragOverIndex
        ) {
            onReorderTabs(draggedIndex, dragOverIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
        setTimeout(() => {
            isDragging.current = false;
        }, 50);
    };

    return (
        <div
            className="flex items-center bg-slate-950 px-2 pt-1.5 gap-1 overflow-x-auto no-scrollbar border-b border-slate-800/80 select-none"
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            <div
                className="flex items-center justify-center px-2.5 py-1.5 bg-slate-900/40 rounded-t-lg text-indigo-400 font-bold text-xs cursor-default mr-1 border-t border-x border-slate-800/40"
                title="Aster Browser"
            >
                <span>✱</span>
            </div>

            {tabs.map((tab, index) => {
                const isActive = tab.id === activeTabId;
                const isBeingDragged = draggedIndex === index;
                const isOver = dragOverIndex === index;

                return (
                    <div
                        key={tab.id}
                        onPointerDown={() => handlePointerDown(index)}
                        onPointerEnter={() => handlePointerEnter(index)}
                        onClick={() => {
                            if (!isDragging.current) {
                                onSelectTab(tab.id);
                            }
                        }}
                        className={`group relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-t-lg cursor-grab active:cursor-grabbing max-w-[200px] min-w-[130px] transition-all duration-150 border-t border-x overflow-hidden ${
                            isActive
                                ? "bg-slate-900 text-slate-100 border-slate-800/90 shadow-sm"
                                : "bg-transparent text-slate-400 border-transparent hover:bg-slate-900/50 hover:text-slate-200"
                        } ${isBeingDragged ? "opacity-40 scale-95" : ""} ${
                            isOver ? "border-b-2 border-b-indigo-500" : ""
                        }`}
                    >
                        {tab.favicon ? (
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

                        <span className="truncate flex-1 pointer-events-none text-[11px]">
                            {tab.title || "New Tab"}
                        </span>

                        {tabs.length > 1 && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCloseTab(tab.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 hover:bg-slate-800 p-0.5 rounded text-slate-400 hover:text-slate-100 transition-opacity"
                            >
                                ✕
                            </button>
                        )}

                        {/* پروگرس‌بار اختصاصی تب در ضلع پایینی */}
                        <ProgressBar isLoading={Boolean(tab.isLoading)} />
                    </div>
                );
            })}

            <button
                type="button"
                onClick={onNewTab}
                className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 rounded-md transition-colors ml-0.5"
                title="New Tab"
            >
                +
            </button>
        </div>
    );
}
