'use client';

import React, { useState, useMemo } from 'react';

// Fake user names list
export const FAKE_NAMES = [
    'Sardor', 'Jasur', 'Bobur', 'Shoxrux', 'Aziz', 'Javlon', 'Nodir', 'Dilshod',
    'Bekzod', 'Ulugbek', 'Temur', 'Jamshid', 'Sanjar', 'Alisher', 'Farhod', 'Anvar',
    'Rustam', 'Davron', 'Eldor', 'Mirza', 'Otabek', 'Islom', 'Akmal', 'Sherzod',
    'Abdulla', 'Baxtiyor', 'Farrux', 'Husanboy', 'Ibrohim', 'Jahongir', 'Kamron',
    'Laziz', 'Mansur', 'Navro\'z', 'Oybek', 'Pulat', 'Qodir', 'Ravshan', 'Samandar',
    'Tohir', 'Umid', 'Vali', 'Xurshid', 'Yusuf', 'Zafar', 'Abbos', 'Botir', 'Doniyor',
    'Elbek', 'Farxod', 'Gʻayrat', 'Hasan', 'Ilhom', 'Jamol', 'Komil', 'Lochin',
    'Malik', 'Nabi', 'Orif', 'Parvin', 'Quvonch', 'Rahim', 'Saidakbar', 'Timur',
];

// Avatar colors
const AVATAR_COLORS = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
    'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500', 'bg-cyan-500',
];

export interface FakeBet {
    id: string;
    name: string;
    maskedName: string;
    avatar: string;
    avatarColor: string;
    amount: number;
    targetMultiplier: number;
    cashedOut: boolean;
    cashoutMultiplier?: number;
    winAmount: number | null;
}

// Generate random bets for a round
export function generateFakeBets(count: number): FakeBet[] {
    const bets: FakeBet[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < count; i++) {
        let name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
        while (usedNames.has(name) && usedNames.size < FAKE_NAMES.length) {
            name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
        }
        usedNames.add(name);

        // Mask name like "4***7" based on first and last char
        const firstChar = name.charAt(0);
        const lastChar = name.charAt(name.length - 1);
        const maskedName = `${firstChar}***${lastChar}`;

        // Random bet amount
        const amounts = [10000, 50000, 100000, 250000, 500000, 900000, 1500000, 2500000];
        const amount = amounts[Math.floor(Math.random() * amounts.length)];

        // Random target multiplier
        let targetMultiplier: number;
        if (Math.random() < 0.3) {
            targetMultiplier = 100 + Math.random() * 900;
        } else {
            targetMultiplier = 1.1 + Math.random() * 3.9;
        }

        const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

        bets.push({
            id: `fake-${i}-${Date.now()}`,
            name,
            maskedName,
            avatar: name.charAt(0).toUpperCase(),
            avatarColor,
            amount,
            targetMultiplier: parseFloat(targetMultiplier.toFixed(2)),
            cashedOut: false,
            winAmount: null,
        });
    }

    return bets;
}

// Format amount with spaces
const formatAmount = (value: number): string => {
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

interface BetsPanelProps {
    bets: FakeBet[];
    gameState: 'waiting' | 'flying' | 'crashed';
    currentMultiplier?: number;
}

type TabType = 'bets' | 'previous' | 'top';

export default function BetsPanel({ bets, gameState, currentMultiplier = 1 }: BetsPanelProps) {
    const [activeTab, setActiveTab] = useState<TabType>('bets');

    // Sort: cashed out first (wins), then by amount
    const sortedBets = useMemo(() => [...bets].sort((a, b) => {
        if (a.cashedOut && !b.cashedOut) return -1;
        if (!a.cashedOut && b.cashedOut) return 1;
        if (a.cashedOut && b.cashedOut) {
            return (b.winAmount || 0) - (a.winAmount || 0);
        }
        return b.amount - a.amount;
    }), [bets]);

    // Calculate totals - active players (not cashed out) / total players
    const totalPlayers = bets.length;
    const activePlayers = bets.filter(bet => !bet.cashedOut).length;

    // Total winnings: potential winnings for active players + actual winnings for cashed out
    const totalWinnings = useMemo(() => {
        const activeBetsWinnings = bets
            .filter(bet => !bet.cashedOut)
            .reduce((sum, bet) => sum + (bet.amount * currentMultiplier), 0);
        const cashedOutWinnings = bets
            .filter(bet => bet.cashedOut && bet.winAmount)
            .reduce((sum, bet) => sum + (bet.winAmount || 0), 0);
        return activeBetsWinnings + cashedOutWinnings;
    }, [bets, currentMultiplier]);

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-800">
                <button
                    onClick={() => setActiveTab('bets')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === 'bets'
                        ? 'bg-[#2d2d2d] text-white rounded-tl-xl'
                        : 'text-gray-500 hover:text-gray-300'
                        }`}
                >
                    Pul tikishlar
                </button>
                <button
                    onClick={() => setActiveTab('previous')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === 'previous'
                        ? 'bg-[#2d2d2d] text-white'
                        : 'text-gray-500 hover:text-gray-300'
                        }`}
                >
                    Oldingi
                </button>
                <button
                    onClick={() => setActiveTab('top')}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === 'top'
                        ? 'bg-[#2d2d2d] text-white rounded-tr-xl'
                        : 'text-gray-500 hover:text-gray-300'
                        }`}
                >
                    Eng yuqori
                </button>
            </div>

            {/* Stats Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 bg-[#0e0e0e]">
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                        <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-[#1a1a1a]" />
                        <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-[#1a1a1a]" />
                    </div>
                    <span className="text-gray-400 text-xs">{activePlayers}/{totalPlayers} Pul tikishlar</span>
                </div>
                <div className="text-right">
                    <p className="text-white font-bold text-sm">{formatAmount(totalWinnings)}</p>
                    <p className="text-gray-500 text-xs">Jami yutuq UZS</p>
                </div>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-4 px-3 py-1.5 text-gray-500 text-xs border-b border-gray-800">
                <span>O&apos;yinchi</span>
                <span className="text-right">Pul tikish UZS</span>
                <span className="text-center">X</span>
                <span className="text-right">Yutish UZS</span>
            </div>

            {/* Bets List */}
            <div className="flex-1 overflow-y-auto overflow-x-auto max-h-[500px] lg:max-h-[calc(100vh-200px)] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                <div className="min-w-[400px]">
                    {sortedBets.length === 0 ? (
                        <div className="text-gray-500 text-center py-8 text-sm">
                            Tikishlar kutilmoqda...
                        </div>
                    ) : (
                        <div>
                            {sortedBets.map((bet) => (
                                <div
                                    key={bet.id}
                                    className={`grid grid-cols-4 items-center px-3 py-2 border-b border-gray-800/30 ${bet.cashedOut ? 'bg-green-500/5' : ''
                                        }`}
                                >
                                    {/* Avatar + Name */}
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full ${bet.avatarColor} flex items-center justify-center text-white text-xs font-bold`}>
                                            {bet.avatar}
                                        </div>
                                        <span className="text-gray-400 text-sm">{bet.maskedName}</span>
                                    </div>

                                    {/* Bet Amount */}
                                    <div className="text-right">
                                        <span className="text-white text-sm">{formatAmount(bet.amount)}</span>
                                    </div>

                                    {/* Multiplier */}
                                    <div className="text-center">
                                        {bet.cashedOut && bet.cashoutMultiplier && (
                                            <span className="text-purple-400 text-sm font-medium">
                                                {bet.cashoutMultiplier.toFixed(2)}x
                                            </span>
                                        )}
                                    </div>

                                    {/* Win Amount */}
                                    <div className="text-right">
                                        {bet.cashedOut && bet.winAmount && (
                                            <span className="text-green-400 text-sm font-medium">
                                                {formatAmount(bet.winAmount)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-800 bg-[#0e0e0e]">
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <span className="w-3 h-3 rounded-full border border-gray-500" />
                    Provably Fair Game
                </div>
                <span className="text-gray-600 text-xs">Powered by <span className="text-gray-400">SPRIBE</span></span>
            </div>
        </div>
    );
}
