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

// Total number of available avatar images in public/avatars
const AVATAR_COUNT = 30;

// Avatar colors (fallback if no image)
const AVATAR_COLORS = [
    '#e91e63', '#2196f3', '#4caf50', '#ff9800', '#9c27b0',
    '#00bcd4', '#ff5722', '#607d8b', '#795548', '#3f51b5',
];

export interface FakeBet {
    id: string;
    name: string;
    maskedName: string;
    avatar: string;
    avatarImage?: string;
    avatarColor: string;
    amount: number;
    targetMultiplier: number;
    cashedOut: boolean;
    cashoutMultiplier?: number;
    winAmount: number | null;
    avatarNum: number; // 1-30 for local avatar files
}

// Generate truly random bet amount between min and max
function generateRandomAmount(): number {
    // Different ranges with different probabilities
    const rand = Math.random();

    if (rand < 0.15) {
        // 15% chance: very high bets (2,000,000 - 3,500,000)
        return Math.floor(2000000 + Math.random() * 1500000);
    } else if (rand < 0.35) {
        // 20% chance: high bets (1,000,000 - 2,000,000)
        return Math.floor(1000000 + Math.random() * 1000000);
    } else if (rand < 0.60) {
        // 25% chance: medium bets (500,000 - 1,000,000)
        return Math.floor(500000 + Math.random() * 500000);
    } else if (rand < 0.85) {
        // 25% chance: small-medium bets (100,000 - 500,000)
        return Math.floor(100000 + Math.random() * 400000);
    } else {
        // 15% chance: small bets (10,000 - 100,000)
        return Math.floor(10000 + Math.random() * 90000);
    }
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

        // Mask name like "2***1" based on random numbers
        const firstNum = Math.floor(Math.random() * 10);
        const lastNum = Math.floor(Math.random() * 10);
        const maskedName = `${firstNum}***${lastNum}`;

        // Generate truly random bet amount
        const amount = generateRandomAmount();

        // Random target multiplier
        let targetMultiplier: number;
        if (Math.random() < 0.25) {
            // 25% chance: high multiplier target (won't often be reached)
            targetMultiplier = 5 + Math.random() * 10;
        } else if (Math.random() < 0.4) {
            // 15% chance: medium-high multiplier
            targetMultiplier = 3 + Math.random() * 2;
        } else {
            // 60% chance: normal multiplier range
            targetMultiplier = 1.2 + Math.random() * 2.8;
        }

        const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
        const avatarNum = Math.floor(Math.random() * AVATAR_COUNT) + 1; // 1-30

        bets.push({
            id: `fake-${i}-${Date.now()}-${Math.random()}`,
            name,
            maskedName,
            avatar: name.charAt(0).toUpperCase(),
            avatarNum,
            avatarColor,
            amount,
            targetMultiplier: parseFloat(targetMultiplier.toFixed(2)),
            cashedOut: false,
            winAmount: null,
        });
    }

    return bets;
}

// Format amount with commas
const formatAmount = (value: number): string => {
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

interface BetsPanelProps {
    bets: FakeBet[];
    gameState: 'waiting' | 'flying' | 'crashed';
    currentMultiplier?: number;
}

type TabType = 'bets' | 'previous' | 'top';

// Memoized list component to prevent re-renders when multiplier changes
const BetsList = React.memo(({ bets }: { bets: FakeBet[] }) => {
    // Sort: cashed out first (wins), then by amount
    const sortedBets = useMemo(() => [...bets].sort((a, b) => {
        if (a.cashedOut && !b.cashedOut) return -1;
        if (!a.cashedOut && b.cashedOut) return 1;
        if (a.cashedOut && b.cashedOut) {
            return (b.winAmount || 0) - (a.winAmount || 0);
        }
        return b.amount - a.amount;
    }), [bets]);

    return (
        <div className="min-w-[360px]">
            {sortedBets.length === 0 ? (
                <div className="text-gray-500 text-center py-8 text-[11px]">
                    Tikishlar kutilmoqda...
                </div>
            ) : (
                <div>
                    {sortedBets.map((bet) => (
                        <div
                            key={bet.id}
                            className={`grid grid-cols-4 items-center px-2 py-1.5 border-b border-gray-800/20 transition-colors ${bet.cashedOut
                                ? 'bg-[#1a2e1a] border-l-2 border-l-green-500/50'
                                : 'hover:bg-gray-800/20'
                                }`}
                        >
                            {/* Avatar + Name */}
                            <div className="flex items-center gap-1.5">
                                <img
                                    src={`/avatars/avatar_${bet.avatarNum}.jpg`}
                                    alt=""
                                    className="w-5 h-5 rounded-full object-cover"
                                />
                                <span className={`text-[11px] ${bet.cashedOut ? 'text-green-400' : 'text-gray-400'}`}>
                                    {bet.maskedName}
                                </span>
                            </div>

                            {/* Bet Amount */}
                            <div className="text-right">
                                <span className={`text-[11px] ${bet.cashedOut ? 'text-green-300' : 'text-white'}`}>
                                    {formatAmount(bet.amount)}
                                </span>
                            </div>

                            {/* Multiplier - colored based on value like game counter */}
                            <div className="text-center">
                                {bet.cashedOut && bet.cashoutMultiplier ? (
                                    <span
                                        className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${bet.cashoutMultiplier >= 100
                                                ? 'text-pink-400 bg-pink-500/10'
                                                : bet.cashoutMultiplier >= 10
                                                    ? 'text-purple-400 bg-purple-500/10'
                                                    : bet.cashoutMultiplier >= 2
                                                        ? 'text-blue-400 bg-blue-500/10'
                                                        : 'text-green-400 bg-green-500/10'
                                            }`}
                                    >
                                        {bet.cashoutMultiplier.toFixed(2)}x
                                    </span>
                                ) : null}
                            </div>

                            {/* Win Amount */}
                            <div className="text-right">
                                {bet.cashedOut && bet.winAmount ? (
                                    <span className="text-green-400 text-[11px] font-semibold">
                                        {formatAmount(bet.winAmount)}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

export default function BetsPanel({ bets, gameState, currentMultiplier = 1 }: BetsPanelProps) {
    const [activeTab, setActiveTab] = useState<TabType>('bets');

    // Calculate totals - active players (not cashed out) / total players
    const totalPlayers = bets.length;
    const activePlayers = bets.filter(bet => !bet.cashedOut).length;

    // Total winnings: potential winnings for active players + actual winnings for cashed out
    const totalWinnings = useMemo(() => {
        // Only calculate for active bets if game is flying
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
                    className={`flex-1 py-2 text-[11px] font-medium transition-colors ${activeTab === 'bets'
                        ? 'bg-[#2d2d2d] text-white rounded-tl-xl'
                        : 'text-gray-500 hover:text-gray-300'
                        }`}
                >
                    Pul tikishlar
                </button>
                <button
                    onClick={() => setActiveTab('previous')}
                    className={`flex-1 py-2 text-[11px] font-medium transition-colors ${activeTab === 'previous'
                        ? 'bg-[#2d2d2d] text-white'
                        : 'text-gray-500 hover:text-gray-300'
                        }`}
                >
                    Oldingi
                </button>
                <button
                    onClick={() => setActiveTab('top')}
                    className={`flex-1 py-2 text-[11px] font-medium transition-colors ${activeTab === 'top'
                        ? 'bg-[#2d2d2d] text-white rounded-tr-xl'
                        : 'text-gray-500 hover:text-gray-300'
                        }`}
                >
                    Eng yuqori
                </button>
            </div>

            {/* Stats Header */}
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-800 bg-[#0e0e0e]">
                <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1.5">
                        {/* Show top 3 highest bets avatars */}
                        {[...bets]
                            .sort((a, b) => b.amount - a.amount)
                            .slice(0, 3)
                            .map((bet, index) => (
                                <img
                                    key={bet.id}
                                    src={`/avatars/avatar_${bet.avatarNum}.jpg`}
                                    alt=""
                                    className="w-5 h-5 rounded-full border-2 border-[#1a1a1a] object-cover"
                                    style={{ zIndex: 3 - index }}
                                />
                            ))
                        }
                        {bets.length === 0 && (
                            <>
                                <div className="w-5 h-5 rounded-full bg-gray-700 border-2 border-[#1a1a1a]" />
                                <div className="w-5 h-5 rounded-full bg-gray-600 border-2 border-[#1a1a1a]" />
                                <div className="w-5 h-5 rounded-full bg-gray-500 border-2 border-[#1a1a1a]" />
                            </>
                        )}
                    </div>
                    <span className="text-gray-400 text-[10px]">{activePlayers}/{totalPlayers} Pul tikishlar</span>
                </div>
                <div className="text-right">
                    <p className="text-white font-bold text-[11px]">{formatAmount(totalWinnings)}</p>
                    <p className="text-gray-500 text-[10px]">Jami yutuq UZS</p>
                </div>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-4 px-2 py-1 text-gray-500 text-[10px] border-b border-gray-800">
                <span>O&apos;yinchi</span>
                <span className="text-right">Pul tikish UZS</span>
                <span className="text-center">X</span>
                <span className="text-right">Yutish UZS</span>
            </div>

            {/* Bets List */}
            <div className="flex-1 overflow-y-auto overflow-x-auto max-h-[500px] lg:max-h-[calc(100vh-200px)] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                <BetsList bets={bets} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-2 py-1.5 border-t border-gray-800 bg-[#0e0e0e]">
                <div className="flex items-center gap-1 text-gray-500 text-[10px]">
                    <span className="w-2.5 h-2.5 rounded-full border border-gray-500" />
                    Provably Fair Game
                </div>
                <span className="text-gray-600 text-[10px]">Powered by <span className="text-gray-400">SPRIBE</span></span>
            </div>
        </div>
    );
}

BetsList.displayName = 'BetsList';

