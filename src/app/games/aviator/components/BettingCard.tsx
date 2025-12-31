'use client';

import { Plus, Minus, X } from 'lucide-react';

interface BettingCardProps {
    betAmount: number;
    setBetAmount: (amount: number) => void;
    betType: 'manual' | 'auto';
    setBetType: (type: 'manual' | 'auto') => void;
    isBetting: boolean;
    setIsBetting: (isBetting: boolean) => void;
    formatAmount: (amount: number) => string;
    showAddButton?: boolean;
    onAdd?: () => void;
    showRemoveButton?: boolean;
    onRemove?: () => void;
}

export default function BettingCard({
    betAmount, setBetAmount,
    betType, setBetType,
    isBetting, setIsBetting,
    formatAmount,
    showAddButton, onAdd,
    showRemoveButton, onRemove
}: BettingCardProps) {
    return (
        <div className="bg-[#0e0e0e] rounded-xl p-2 max-w-2xl mx-auto border border-gray-800 relative">

            {/* Action Buttons (Add/Remove) */}
            <div className="absolute top-2 right-2 flex gap-2 z-10">
                {showAddButton && (
                    <button
                        onClick={onAdd}
                        className="w-6 h-6 rounded-full bg-[#27b82c] text-white flex items-center justify-center hover:bg-[#2ed134] transition-colors shadow-lg border border-white/10"
                    >
                        <Plus size={14} />
                    </button>
                )}
                {showRemoveButton && (
                    <button
                        onClick={onRemove}
                        className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg border border-white/10"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-4 bg-black/40 p-1 rounded-full w-fit mx-auto">
                <button
                    className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${betType === 'manual' ? 'bg-[#2c2c2c] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    onClick={() => setBetType('manual')}
                >
                    Pul tikish
                </button>
                <button
                    className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${betType === 'auto' ? 'bg-[#2c2c2c] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    onClick={() => setBetType('auto')}
                >
                    Avto
                </button>
            </div>

            <div className="flex gap-2">
                {/* Left: Amount Controls */}
                <div className="flex-1 space-y-2">
                    {/* Amount Input */}
                    <div className="flex items-center gap-1 bg-black/60 rounded-lg p-1 border border-gray-700">
                        <button
                            className="w-8 h-8 flex items-center justify-center bg-[#2c2c2c] rounded-md text-gray-400 hover:text-white hover:bg-[#3d3d3d] transition-colors"
                            onClick={() => setBetAmount(Math.max(1000, betAmount - 1000))}
                        >
                            <Minus size={14} />
                        </button>
                        <div className="flex-1 text-center font-bold text-white text-lg">
                            {formatAmount(betAmount)}
                        </div>
                        <button
                            className="w-8 h-8 flex items-center justify-center bg-[#2c2c2c] rounded-md text-gray-400 hover:text-white hover:bg-[#3d3d3d] transition-colors"
                            onClick={() => setBetAmount(betAmount + 1000)}
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    {/* Presets */}
                    <div className="grid grid-cols-2 gap-1.5">
                        <button onClick={() => setBetAmount(50000)} className="bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white text-xs py-1.5 rounded transition-colors border border-gray-800">50,000.00</button>
                        <button onClick={() => setBetAmount(100000)} className="bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white text-xs py-1.5 rounded transition-colors border border-gray-800">100,000.00</button>
                        <button onClick={() => setBetAmount(200000)} className="col-span-2 bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white text-xs py-1.5 rounded transition-colors border border-gray-800">200,000.00</button>
                    </div>
                </div>

                {/* Right: Big Bet Button */}
                <button
                    className={`flex flex-col items-center justify-center w-36 sm:w-48 bg-[#27b82c] hover:bg-[#2ed134] rounded-xl border-b-4 border-[#1e9122] active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_20px_rgba(39,184,44,0.3)] ${isBetting ? 'bg-red-500 hover:bg-red-600 border-red-700 shadow-red-500/30' : ''}`}
                    onClick={() => setIsBetting(!isBetting)}
                >
                    <span className="text-white font-medium text-lg leading-tight uppercase">
                        {isBetting ? 'Bekor qilish' : 'Pul tikish'}
                    </span>
                    <span className="text-white/90 text-sm font-medium">
                        {formatAmount(betAmount)} UZS
                    </span>
                </button>
            </div>

            {/* Auto Panel (Only if Auto selected) */}
            {betType === 'auto' && (
                <div className="mt-2 pt-2 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400 px-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[#3b82f6]">Avto-tikish</span>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors bg-[#3b82f6]`}>
                            <div className="w-3 h-3 bg-white rounded-full shadow-sm translate-x-4"></div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[#3b82f6]">Avto-chiqarish</span>
                        <div className="bg-[#1a1a1a] px-2 py-0.5 rounded border border-gray-700 text-white font-bold">1.10x</div>
                    </div>
                </div>
            )}
        </div>
    );
}
