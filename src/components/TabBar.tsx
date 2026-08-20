import React, { useState, useRef } from "react";
import { Tab } from "../types";

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
            className="flex items-center bg-slate-950 px-2 pt-2 gap-1 overflow-x-auto no-scrollbar border-b border-slate-800 select-none"
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* تب برند Aster */}
            <div
                className="flex items-center justify-center px-3 py-2 bg-slate-900/60 rounded-t-lg border-t border-x border-slate-800/50 text-indigo-400 font-bold text-sm cursor-default select-none mr-1"
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
                        className={`group relative flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-t-lg cursor-grab active:cursor-grabbing max-w-[200px] min-w-[120px] transition-all duration-150 border-t border-x ${
                            isActive
                                ? "bg-slate-900 text-slate-100 border-slate-800"
                                : "bg-slate-950 text-slate-400 border-transparent hover:bg-slate-900/50 hover:text-slate-200"
                        } ${isBeingDragged ? "opacity-50 scale-95" : ""} ${
                            isOver ? "border-b-2 border-b-indigo-500" : ""
                        }`}
                    >
                        {/* Favicon */}
                        {tab.favicon ? (
                            <img
                                src={tab.favicon}
                                alt=""
                                className="w-4 h-4 rounded-sm flex-shrink-0 pointer-events-none"
                            />
                        ) : (
                            <div className="w-4 h-4 rounded-full bg-slate-700 flex-shrink-0 pointer-events-none" />
                        )}

                        {/* Title */}
                        <span className="truncate flex-1 pointer-events-none">
                            {tab.title || "New Tab"}
                        </span>

                        {/* Close Button */}
                        {tabs.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCloseTab(tab.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 hover:bg-slate-800 p-0.5 rounded text-slate-400 hover:text-slate-100 transition-opacity"
                            >
                                ✕
                            </button>
                        )}

                        {/* پروگرس بار تک بارگذاری */}
                        {tab.isLoading && (
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-800/80 overflow-hidden rounded-b-md pointer-events-none">
                                <div className="w-full h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 animate-progress-line" />
                            </div>
                        )}
                    </div>
                );
            })}

            {/* New Tab Button */}
            <button
                onClick={onNewTab}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded-lg transition-colors ml-1 select-none"
                title="New Tab"
            >
                +
            </button>
        </div>
    );
}
