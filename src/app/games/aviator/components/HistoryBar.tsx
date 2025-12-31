'use client';

import { X } from 'lucide-react';

interface HistoryBarProps {
    multiplierHistory: number[];
    isExpanded: boolean;
    onToggleExpand: () => void;
}

export default function HistoryBar({ multiplierHistory, isExpanded, onToggleExpand }: HistoryBarProps) {
    const getMultiplierColor = (multiplier: number) => {
        if (multiplier >= 100) return 'text-[#ec4899]';
        if (multiplier >= 10) return 'text-[#a855f7]';
        if (multiplier >= 2) return 'text-[#3b82f6]';
        return 'text-[#5ce85c]';
    };

    const getMultiplierBgColor = (multiplier: number) => {
        if (multiplier >= 100) return 'bg-[#ec4899]/10';
        if (multiplier >= 10) return 'bg-[#a855f7]/10';
        if (multiplier >= 2) return 'bg-[#3b82f6]/10';
        return 'bg-[#5ce85c]/10';
    };

    return (
        <div className="relative w-full bg-[#0e0e0e] z-40 border-b border-gray-800">
            <div className="flex items-center justify-between px-2 py-1 pr-12 relative h-12">
                {/* Horizontal Scroll List (Collapsed) */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide mask-fade-right w-full">
                    {multiplierHistory.slice(0, 15).map((multiplier, index) => (
                        <span
                            key={index}
                            className={`px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap bg-gray-800/50 ${getMultiplierColor(multiplier)}`}
                        >
                            {multiplier.toFixed(2)}x
                        </span>
                    ))}
                </div>

                {/* Fixed Menu Button */}
                <button
                    onClick={onToggleExpand}
                    className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center bg-[#1a1a1a] hover:bg-[#252525] border-l border-gray-700 transition-colors z-20"
                >
                    <div className="bg-gray-700 rounded-full p-1">
                        {isExpanded ? (
                            <X size={16} className="text-gray-300" />
                        ) : (
                            <div className="flex flex-col gap-0.5">
                                <div className="w-4 h-0.5 bg-gray-300 rounded-full"></div>
                                <div className="w-4 h-0.5 bg-gray-300 rounded-full"></div>
                                <div className="w-4 h-0.5 bg-gray-300 rounded-full"></div>
                            </div>
                        )}
                    </div>
                </button>
            </div>

            {/* Expanded History Overlay */}
            {isExpanded && (
                <div className="absolute top-12 left-0 right-0 bg-[#0e0e0e]/95 backdrop-blur-md border-b border-gray-700 p-4 shadow-2xl animate-in slide-in-from-top-2 duration-200 z-50">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-white text-sm font-medium">Round History</span>
                        <span className="text-xs text-gray-500">Last 30 rounds</span>
                    </div>
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                        {multiplierHistory.map((multiplier, index) => (
                            <div
                                key={index}
                                className={`px-2 py-1.5 rounded-lg text-center text-xs font-bold border border-white/5 ${getMultiplierColor(multiplier)} ${getMultiplierBgColor(multiplier)}`}
                            >
                                {multiplier.toFixed(2)}x
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
