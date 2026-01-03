'use client';

import { Plus, Minus, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BettingCardProps {
    betAmount: number;
    setBetAmount: (amount: number) => void;
    betType: 'manual' | 'auto';
    setBetType: (type: 'manual' | 'auto') => void;
    formatAmount: (amount: number) => string;
    showAddButton?: boolean;
    onAdd?: () => void;
    showRemoveButton?: boolean;
    onRemove?: () => void;
    userBalance: number;
    userId: string;
    gameState: 'waiting' | 'flying' | 'crashed';
    currentMultiplier: number;
    onBalanceUpdate: (newBalance: number) => void;
    onInsufficientBalance?: () => void;
    onBetPlaced?: (betId: string) => void;
    onBetLost?: (betId: string) => void;
}

interface ActiveBet {
    id: string;
    amount: number;
}

export default function BettingCard({
    betAmount, setBetAmount,
    betType, setBetType,
    formatAmount,
    showAddButton, onAdd,
    showRemoveButton, onRemove,
    userBalance,
    userId,
    gameState,
    currentMultiplier,
    onBalanceUpdate,
    onInsufficientBalance,
    onBetPlaced,
    onBetLost
}: BettingCardProps) {

    const [activeBet, setActiveBet] = useState<ActiveBet | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [potentialWin, setPotentialWin] = useState(0);

    // Bet validation states
    const [betError, setBetError] = useState<string | null>(null);
    const MIN_BET = 1000;
    const MAX_BET = 10000000;

    // Toast notifications - array for multiple toasts
    interface ToastItem {
        id: number;
        type: 'win' | 'lose';
        amount: number;
        multiplier?: number;
        isExiting?: boolean;
    }
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    let toastIdCounter = 0;

    const addToast = (type: 'win' | 'lose', amount: number, multiplier?: number) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, type, amount, multiplier }]);

        // Start exit animation after 1.7s, remove after 2s
        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, isExiting: true } : t));
        }, 1700);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 2000);
    };

    // Auto-bet and auto-cashout states
    const [autoBetEnabled, setAutoBetEnabled] = useState(false);
    const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(false);
    const [autoCashoutMultiplier, setAutoCashoutMultiplier] = useState('1.10');

    // Track if we cashed out this round (to prevent showing lose toast after win)
    const [cashedOutThisRound, setCashedOutThisRound] = useState(false);

    // Update potential win during flying
    useEffect(() => {
        if (activeBet && gameState === 'flying') {
            setPotentialWin(parseFloat((activeBet.amount * currentMultiplier).toFixed(2)));
        }
    }, [activeBet, gameState, currentMultiplier]);

    // Handle game crash - bet is lost (only if not already cashed out)
    useEffect(() => {
        if (gameState === 'crashed' && activeBet && !cashedOutThisRound) {
            // Mark bet as lost
            fetch('/api/game/crash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ betIds: [activeBet.id] })
            }).catch(console.error);

            // Show lose toast
            addToast('lose', activeBet.amount);

            if (onBetLost) onBetLost(activeBet.id);
            setActiveBet(null);
            setPotentialWin(0);
        }
    }, [gameState, activeBet, onBetLost, cashedOutThisRound]);

    // Track if we already placed auto-bet this round
    const [autoBetPlacedThisRound, setAutoBetPlacedThisRound] = useState(false);

    // Reset for new round
    useEffect(() => {
        if (gameState === 'waiting') {
            setActiveBet(null);
            setPotentialWin(0);
            setAutoBetPlacedThisRound(false);
            setCashedOutThisRound(false); // Reset cashout flag for new round
        }
    }, [gameState]);

    // Auto-bet: place bet ONCE when waiting starts
    useEffect(() => {
        if (
            gameState === 'waiting' &&
            autoBetEnabled &&
            betType === 'auto' &&
            !isProcessing &&
            !activeBet &&
            !autoBetPlacedThisRound
        ) {
            setAutoBetPlacedThisRound(true);
            handlePlaceBet();
        }
    }, [gameState, autoBetEnabled, betType, isProcessing, activeBet, autoBetPlacedThisRound]);

    // Auto-cashout: cash out when multiplier reaches target
    useEffect(() => {
        if (
            autoCashoutEnabled &&
            betType === 'auto' &&
            activeBet &&
            gameState === 'flying' &&
            !isProcessing
        ) {
            const targetMultiplier = parseFloat(autoCashoutMultiplier) || 1.10;
            if (currentMultiplier >= targetMultiplier) {
                handleCashout();
            }
        }
    }, [autoCashoutEnabled, betType, activeBet, gameState, currentMultiplier, autoCashoutMultiplier, isProcessing]);

    const handlePlaceBet = async () => {
        if (isProcessing || gameState !== 'waiting') return;

        // Check balance
        if (userBalance < betAmount) {
            if (onInsufficientBalance) onInsufficientBalance();
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch('/api/game/bet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    amount: betAmount,
                    gameState
                })
            });

            const data = await response.json();

            if (data.success) {
                setActiveBet({ id: data.betId, amount: betAmount });
                onBalanceUpdate(data.newBalance);
                if (onBetPlaced) onBetPlaced(data.betId);
            } else {
                console.error('Bet failed:', data.error);
                if (data.error === 'Insufficient balance' && onInsufficientBalance) {
                    onInsufficientBalance();
                }
            }
        } catch (err) {
            console.error('Error placing bet:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCashout = async () => {
        if (isProcessing || !activeBet || gameState !== 'flying') return;

        setIsProcessing(true);
        try {
            const response = await fetch('/api/game/cashout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    betId: activeBet.id,
                    multiplier: currentMultiplier,
                    gameState
                })
            });

            // OPTIMISTIC UPDATE: Immediately show result, don't wait for API
            const winAmount = parseFloat((activeBet.amount * currentMultiplier).toFixed(2));
            const newBalance = userBalance + winAmount;

            // Show win toast immediately + mark as cashed out
            setCashedOutThisRound(true);
            addToast('win', winAmount, currentMultiplier);
            onBalanceUpdate(newBalance);
            setActiveBet(null);
            setPotentialWin(0);
            setIsProcessing(false);

            // API confirmation in background
            const data = await response.json();
            if (!data.success) {
                console.error('Cashout API error:', data.error);
                // Could rollback here if needed
            }
        } catch (err) {
            console.error('Error cashing out:', err);
            setIsProcessing(false);
        }
    };

    const handleCancelBet = () => {
        // Can only cancel during waiting phase
        if (gameState !== 'waiting' || !activeBet) return;
        // Note: For simplicity, we don't refund cancelled bets
        // In a real system, you'd call an API to cancel and refund
        setActiveBet(null);
    };

    // Determine button state
    const getButtonContent = () => {
        if (activeBet) {
            if (gameState === 'flying') {
                return {
                    text: 'Chiqarish',
                    subtext: `${formatAmount(Math.floor(potentialWin))} UZS`,
                    className: 'bg-orange-500 hover:bg-orange-600 border-orange-700 shadow-orange-500/30',
                    onClick: handleCashout,
                    disabled: isProcessing
                };
            }
            if (gameState === 'waiting') {
                return {
                    text: 'Bekor qilish',
                    subtext: `${formatAmount(betAmount)} UZS`,
                    className: 'bg-red-500 hover:bg-red-600 border-red-700 shadow-red-500/30',
                    onClick: handleCancelBet,
                    disabled: isProcessing
                };
            }
            // Crashed - waiting for reset
            return {
                text: 'Kutish...',
                subtext: '',
                className: 'bg-gray-600 border-gray-700',
                onClick: () => { },
                disabled: true
            };
        }

        // No active bet
        if (gameState === 'waiting') {
            return {
                text: 'Pul tikish',
                subtext: `${formatAmount(betAmount)} UZS`,
                className: betError
                    ? 'bg-gray-600 border-gray-700 cursor-not-allowed'
                    : 'bg-[#27b82c] hover:bg-[#2ed134] border-[#1e9122] shadow-[0_0_20px_rgba(39,184,44,0.3)]',
                onClick: handlePlaceBet,
                disabled: isProcessing || !!betError
            };
        }

        // Game in progress, no bet placed
        return {
            text: 'Kutish...',
            subtext: 'Keyingi round',
            className: 'bg-gray-600 border-gray-700 cursor-not-allowed',
            onClick: () => { },
            disabled: true
        };
    };

    const buttonContent = getButtonContent();

    return (
        <>
            {/* Global Toast Notifications - Stacked at page top */}
            {toasts.length > 0 && (
                <div className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none gap-2 pt-4">
                    {toasts.map((t) => (
                        <div
                            key={t.id}
                            className={`px-6 py-2 rounded-lg shadow-lg transition-all duration-300 ease-out ${t.type === 'win'
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                                }`}
                            style={{
                                animation: t.isExiting ? 'slideUp 0.3s ease-out forwards' : 'slideDown 0.3s ease-out'
                            }}
                        >
                            {t.type === 'win' ? (
                                <span className="font-medium">
                                    Yutuq: +{formatAmount(Math.floor(t.amount))} UZS ({t.multiplier?.toFixed(2)}x)
                                </span>
                            ) : (
                                <span className="font-medium">
                                    Yo&apos;qotish: -{formatAmount(Math.floor(t.amount))} UZS
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

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

                <div className="flex gap-2 overflow-hidden">
                    {/* Left: Amount Controls */}
                    <div className="flex-1 min-w-0 space-y-2">
                        {/* Amount Input */}
                        <div className={`flex items-center gap-1 bg-black/60 rounded-lg p-1 border transition-colors ${betError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-700'}`}>
                            <button
                                className="shrink-0 w-8 h-8 flex items-center justify-center bg-[#2c2c2c] rounded-md text-gray-400 hover:text-white hover:bg-[#3d3d3d] transition-colors disabled:opacity-50"
                                onClick={() => {
                                    const newAmount = Math.max(MIN_BET, betAmount - 1000);
                                    setBetAmount(newAmount);
                                    setBetError(null);
                                }}
                                disabled={!!activeBet}
                            >
                                <Minus size={14} />
                            </button>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={formatAmount(betAmount)}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^\d]/g, '');
                                    const numValue = parseInt(value) || 0;

                                    // Always update the value to show what user typed
                                    setBetAmount(numValue);

                                    // Validate and show error
                                    if (numValue < MIN_BET) {
                                        setBetError(`Minimal stavka ${formatAmount(MIN_BET)} UZS`);
                                    } else if (numValue > MAX_BET) {
                                        setBetError(`Maksimal stavka ${formatAmount(MAX_BET)} UZS`);
                                    } else {
                                        setBetError(null);
                                    }
                                }}
                                disabled={!!activeBet}
                                className={`flex-1 min-w-0 text-center font-bold text-lg bg-transparent outline-none disabled:opacity-50 ${betError ? 'text-red-400' : 'text-white'}`}
                            />
                            <button
                                className="shrink-0 w-8 h-8 flex items-center justify-center bg-[#2c2c2c] rounded-md text-gray-400 hover:text-white hover:bg-[#3d3d3d] transition-colors disabled:opacity-50"
                                onClick={() => {
                                    const newAmount = Math.min(MAX_BET, betAmount + 1000);
                                    setBetAmount(newAmount);
                                    setBetError(null);
                                }}
                                disabled={!!activeBet}
                            >
                                <Plus size={14} />
                            </button>
                        </div>

                        {/* Error message */}
                        {betError && (
                            <div className="text-red-400 text-xs text-center py-0.5 px-1 bg-red-500/10 rounded border border-red-500/30 truncate">
                                {betError}
                            </div>
                        )}

                        {/* Presets */}
                        <div className="grid grid-cols-2 gap-1.5">
                            <button
                                onClick={() => !activeBet && setBetAmount(50000)}
                                className={`bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white text-xs py-1.5 rounded transition-colors border border-gray-800 ${activeBet ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!!activeBet}
                            >
                                50,000.00
                            </button>
                            <button
                                onClick={() => !activeBet && setBetAmount(100000)}
                                className={`bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white text-xs py-1.5 rounded transition-colors border border-gray-800 ${activeBet ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!!activeBet}
                            >
                                100,000.00
                            </button>
                            <button
                                onClick={() => !activeBet && setBetAmount(200000)}
                                className={`col-span-2 bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white text-xs py-1.5 rounded transition-colors border border-gray-800 ${activeBet ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!!activeBet}
                            >
                                200,000.00
                            </button>
                        </div>
                    </div>

                    {/* Right: Big Bet Button */}
                    <button
                        className={`flex flex-col items-center justify-center min-w-[140px] w-36 sm:w-44 md:w-48 shrink-0 rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all ${buttonContent.className}`}
                        onClick={buttonContent.onClick}
                        disabled={buttonContent.disabled}
                    >
                        <span className="text-white font-medium text-lg leading-tight uppercase">
                            {buttonContent.text}
                        </span>
                        {buttonContent.subtext && (
                            <span className="text-white/90 text-sm font-medium">
                                {buttonContent.subtext}
                            </span>
                        )}
                    </button>
                </div>

                {/* Active Bet Indicator */}
                {activeBet && gameState === 'flying' && (
                    <div className="mt-2 pt-2 border-t border-gray-800 text-center">
                        <span className="text-orange-400 text-sm">
                            Potensial yutug&apos;: <span className="font-bold">{formatAmount(Math.floor(potentialWin))} UZS</span>
                        </span>
                    </div>
                )}

                {/* Auto Panel (Only if Auto selected) */}
                {betType === 'auto' && (
                    <div className="mt-2 pt-2 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400 px-1">
                        <div className="flex items-center gap-2">
                            <span className={autoBetEnabled ? 'text-[#3b82f6]' : 'text-gray-500'}>Avto-tikish</span>
                            <button
                                onClick={() => setAutoBetEnabled(!autoBetEnabled)}
                                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${autoBetEnabled ? 'bg-[#3b82f6]' : 'bg-gray-700'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${autoBetEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={autoCashoutEnabled ? 'text-[#3b82f6]' : 'text-gray-500'}>Avto-chiqarish</span>
                            <button
                                onClick={() => {
                                    const willEnable = !autoCashoutEnabled;
                                    setAutoCashoutEnabled(willEnable);
                                    // Set default value if enabling and field is empty
                                    if (willEnable && (!autoCashoutMultiplier || autoCashoutMultiplier === '')) {
                                        setAutoCashoutMultiplier('1.10');
                                    }
                                }}
                                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${autoCashoutEnabled ? 'bg-[#3b82f6]' : 'bg-gray-700'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${autoCashoutEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </button>
                            <input
                                type="text"
                                value={autoCashoutMultiplier}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    // Allow empty, or numbers with max 2 decimal places, max 9999.99
                                    if (val === '' || /^\d{0,4}(\.\d{0,2})?$/.test(val)) {
                                        const num = parseFloat(val);
                                        if (val === '' || isNaN(num) || num <= 9999.99) {
                                            setAutoCashoutMultiplier(val);
                                        }
                                    }
                                }}
                                className="w-16 bg-[#1a1a1a] px-2 py-0.5 rounded border border-gray-700 text-white font-bold text-center text-xs"
                                placeholder="1.10"
                            />
                            <span className="text-gray-500">x</span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
