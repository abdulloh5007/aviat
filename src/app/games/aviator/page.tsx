'use client';

import AviatorCanvas from '@/components/AviatorCanvas';
import BetsPanel, { generateFakeBets, FakeBet } from '@/components/BetsPanel';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Loader2, X, Shield, Copy, Check } from 'lucide-react';

// Import local components
import { GameHeader, HistoryBar, SideDrawer, BettingCard, ErrorModal, SuccessModal } from './components';

// Import constants and types
import {
    paymentMethods,
    withdrawMethods,
    quickAmounts,
    formatAmount,
    formatTimeRemaining,
    PaymentMethod,
    WithdrawMethod,
    PaymentRequest
} from './constants';

export default function AviatorGamePage() {
    const { user, loading, signOut } = useAuth();

    // UI State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

    // User State
    const [userId, setUserId] = useState<string>('000000');
    const [userBalance, setUserBalance] = useState<number>(0);
    const [userPhone, setUserPhone] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userName, setUserName] = useState('');
    const [userBirthday, setUserBirthday] = useState('');
    const [userCountry, setUserCountry] = useState('UZ');
    const [selectedCurrency, setSelectedCurrency] = useState('UZS');
    const [balances, setBalances] = useState({ UZS: 0, USD: 0, RUB: 0 });

    // Deposit Modal State
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [depositStep, setDepositStep] = useState<'select' | 'amount' | 'confirm'>('select');
    const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
    const [amount, setAmount] = useState('');
    const [currentPaymentRequest, setCurrentPaymentRequest] = useState<PaymentRequest | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [copied, setCopied] = useState(false);
    const [isCreatingRequest, setIsCreatingRequest] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    // Withdraw Modal State
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [withdrawStep, setWithdrawStep] = useState<'select' | 'amount' | 'card'>('select');
    const [selectedWithdrawMethod, setSelectedWithdrawMethod] = useState<WithdrawMethod | null>(null);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');

    // Profile & History Modal State
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyFilter, setHistoryFilter] = useState<'all' | 'deposit' | 'withdraw'>('all');
    const [userTransactions, setUserTransactions] = useState<PaymentRequest[]>([]);

    // Alert Modals
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Game State
    const [gameState, setGameState] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
    const [countdownSeconds, setCountdownSeconds] = useState(5);
    const [countdownProgress, setCountdownProgress] = useState(100);
    const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
    const [targetMultiplier, setTargetMultiplier] = useState(1.00);
    const [multiplierHistory, setMultiplierHistory] = useState<number[]>([]);

    // Betting State
    const [showSecondBet, setShowSecondBet] = useState(false);
    const [betAmount1, setBetAmount1] = useState(10000);
    const [betType1, setBetType1] = useState<'manual' | 'auto'>('manual');
    const [isBetting1, setIsBetting1] = useState(false);
    const [betAmount2, setBetAmount2] = useState(10000);
    const [betType2, setBetType2] = useState<'manual' | 'auto'>('manual');
    const [isBetting2, setIsBetting2] = useState(false);

    // Fake Bets State
    const [fakeBets, setFakeBets] = useState<FakeBet[]>([]);

    // Ref to prevent duplicate saves
    const lastSavedMultiplier = useRef<number | null>(null);

    // Load game history
    useEffect(() => {
        const loadGameHistory = async () => {
            try {
                const { data, error } = await supabase
                    .from('game_rounds')
                    .select('multiplier')
                    .order('created_at', { ascending: false })
                    .limit(30);

                if (data && !error) {
                    setMultiplierHistory(data.map(r => parseFloat(r.multiplier)));
                }
            } catch (err) {
                console.error('Error loading game history:', err);
            }
        };

        loadGameHistory();
    }, []);

    // Save game round to database and send signal
    const saveGameRound = useCallback(async (multiplier: number) => {
        try {
            // Save to database
            await supabase
                .from('game_rounds')
                .insert({ multiplier: multiplier });

            // Send signal to Telegram
            fetch('/api/telegram/game-signal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ multiplier })
            }).catch(err => console.error('Error sending signal:', err));
        } catch (err) {
            console.error('Error saving game round:', err);
        }
    }, []);

    // Load user profile
    useEffect(() => {
        const loadUserProfile = async () => {
            if (user) {
                const metadataUserId = user.user_metadata?.user_id;
                const metadataPhone = user.user_metadata?.phone;
                const metadataEmail = user.user_metadata?.email;
                const metadataCountry = user.user_metadata?.country;

                if (metadataUserId) setUserId(metadataUserId);
                if (metadataPhone) setUserPhone(metadataPhone);
                if (metadataEmail) setUserEmail(metadataEmail);
                if (metadataCountry) setUserCountry(metadataCountry);

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setUserId(profile.user_id || metadataUserId || '000000');
                    setUserBalance(profile.balance || 0);
                    setBalances({
                        UZS: profile.balance || 0,
                        USD: profile.balance_usd || 0,
                        RUB: profile.balance_rub || 0
                    });
                    if (profile.name) setUserName(profile.name);
                    if (profile.birthday) setUserBirthday(profile.birthday);
                    if (profile.phone) setUserPhone(profile.phone);
                    if (profile.email) setUserEmail(profile.email);
                }
            }
        };

        loadUserProfile();
    }, [user]);

    // Payment timer countdown
    useEffect(() => {
        if (timeRemaining <= 0) return;

        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    // Mark payment as expired when timer ends
                    if (currentPaymentRequest) {
                        supabase
                            .from('payment_requests')
                            .update({ status: 'expired' })
                            .eq('id', currentPaymentRequest.id)
                            .then(() => {
                                setErrorMessage("Vaqt tugadi! To'lov bekor qilindi.");
                                setShowErrorModal(true);
                                closeDepositModal();
                            });
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeRemaining, currentPaymentRequest]);

    // Generate fake bets gradually when game starts waiting (50-300 players)
    useEffect(() => {
        if (gameState !== 'waiting') return;

        const targetCount = 50 + Math.floor(Math.random() * 251); // 50 to 300
        const allBets = generateFakeBets(targetCount);

        // Start with small number
        const initialCount = Math.floor(targetCount * 0.05); // 5% initially
        setFakeBets(allBets.slice(0, initialCount));

        // Gradually add players over 4.5 seconds (leaving 0.5s before game starts)
        let currentIndex = initialCount;
        const steps = 10; // Number of steps
        const stepInterval = 450; // 450ms between steps = 4.5 seconds total

        const interval = setInterval(() => {
            if (currentIndex >= targetCount) {
                clearInterval(interval);
                return;
            }

            // Add random batch of players (10-30% of remaining)
            const remaining = targetCount - currentIndex;
            const batchSize = Math.max(1, Math.floor(remaining * (0.1 + Math.random() * 0.25)));
            currentIndex = Math.min(targetCount, currentIndex + batchSize);

            setFakeBets(allBets.slice(0, currentIndex));
        }, stepInterval);

        return () => clearInterval(interval);
    }, [gameState]);

    // Process fake bet cashouts during flying
    useEffect(() => {
        if (gameState !== 'flying') return;
        setFakeBets(prevBets =>
            prevBets.map(bet => {
                if (!bet.cashedOut && currentMultiplier >= bet.targetMultiplier) {
                    return {
                        ...bet,
                        cashedOut: true,
                        cashoutMultiplier: bet.targetMultiplier,
                        winAmount: Math.floor(bet.amount * bet.targetMultiplier)
                    };
                }
                return bet;
            })
        );
    }, [gameState, currentMultiplier]);

    // Connect to WebSocket server for game state updates
    useEffect(() => {
        // Dynamic import socket.io-client
        import('socket.io-client').then(({ io }) => {
            const wsUrl = process.env.NEXT_PUBLIC_GAME_WS_URL || 'http://localhost:3001';
            const socket = io(wsUrl);

            socket.on('connect', () => {
                console.log('🔌 Connected to game server');
            });

            socket.on('gameState', (state: {
                game_state: 'waiting' | 'flying' | 'crashed';
                current_multiplier: number;
                target_multiplier: number;
                countdown_seconds: number;
                round_id: number;
            }) => {
                // Update game state
                setGameState(state.game_state);
                setCurrentMultiplier(state.current_multiplier);
                setTargetMultiplier(state.target_multiplier);
                setCountdownSeconds(state.countdown_seconds);
                setCountdownProgress(state.countdown_seconds * 20);

                // When game crashes, save to local history
                if (state.game_state === 'crashed') {
                    if (lastSavedMultiplier.current !== state.target_multiplier) {
                        lastSavedMultiplier.current = state.target_multiplier;
                        setMultiplierHistory(h => [state.target_multiplier, ...h.slice(0, 29)]);
                    }
                }
            });

            socket.on('disconnect', () => {
                console.log('❌ Disconnected from game server');
            });

            // Cleanup on unmount
            return () => {
                socket.disconnect();
            };
        });
    }, []);

    // Modal handlers
    const openDepositModal = useCallback(() => {
        setIsDepositModalOpen(true);
        setIsDrawerOpen(false);
        setDepositStep('select');
    }, []);

    const closeDepositModal = useCallback(() => {
        setIsDepositModalOpen(false);
        setDepositStep('select');
        setSelectedPayment(null);
        setAmount('');
        setCurrentPaymentRequest(null);
        setUploadedFile(null);
    }, []);

    const openWithdrawModal = useCallback(() => {
        setIsWithdrawModalOpen(true);
        setIsDrawerOpen(false);
        setWithdrawStep('select');
    }, []);

    const closeWithdrawModal = useCallback(() => {
        setIsWithdrawModalOpen(false);
        setWithdrawStep('select');
        setSelectedWithdrawMethod(null);
        setWithdrawAmount('');
        setCardNumber('');
        setCardExpiry('');
    }, []);

    const openHistoryModal = useCallback(() => {
        setIsHistoryModalOpen(true);
        setIsDrawerOpen(false);
    }, []);

    const closeHistoryModal = useCallback(() => {
        setIsHistoryModalOpen(false);
    }, []);

    const closeSuccessModal = useCallback(() => {
        setShowSuccessModal(false);
    }, []);

    // Payment handlers
    const selectPaymentMethod = (method: PaymentMethod) => {
        setSelectedPayment(method);
        setDepositStep('amount');
    };

    const handleAmountChange = (value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        setAmount(numericValue);
    };

    const selectQuickAmount = (value: number) => {
        setAmount(value.toString());
    };

    const proceedToConfirm = async () => {
        if (!selectedPayment) return;

        // Validate amount is not empty
        if (!amount || amount.trim() === '') {
            setErrorMessage("Summani kiriting!");
            setShowErrorModal(true);
            return;
        }

        const numAmount = parseInt(amount);
        if (isNaN(numAmount) || numAmount < selectedPayment.minAmount || numAmount > selectedPayment.maxAmount) {
            setErrorMessage(`Miqdor ${formatAmount(selectedPayment.minAmount)} dan ${formatAmount(selectedPayment.maxAmount)} gacha bo'lishi kerak`);
            setShowErrorModal(true);
            return;
        }

        setIsCreatingRequest(true);
        try {
            // Check for existing pending payment request for this method
            const { data: existingRequests, error: checkError } = await supabase
                .from('payment_requests')
                .select('*')
                .eq('user_id', user?.id)
                .eq('method', selectedPayment.id)
                .eq('status', 'pending')
                .gt('expires_at', new Date().toISOString())
                .limit(1);

            if (!checkError && existingRequests && existingRequests.length > 0) {
                // Resume existing payment request
                const existingRequest = existingRequests[0];
                const expiresAt = new Date(existingRequest.expires_at).getTime();
                const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
                setCurrentPaymentRequest(existingRequest);
                setTimeRemaining(remaining);
                setDepositStep('confirm');
                setIsCreatingRequest(false);
                return;
            }

            // Create new payment request
            const { data, error } = await supabase
                .from('payment_requests')
                .insert({
                    user_id: user?.id,
                    method: selectedPayment.id,
                    amount: numAmount,
                    card_number: selectedPayment.cardNumber,
                    status: 'pending',
                    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            setCurrentPaymentRequest(data);
            setTimeRemaining(15 * 60);
            setDepositStep('confirm');
        } catch (err) {
            console.error('Error creating payment request:', err);
            setErrorMessage("Xatolik yuz berdi. Qayta urinib ko'ring.");
            setShowErrorModal(true);
        } finally {
            setIsCreatingRequest(false);
        }
    };

    const copyCardNumber = () => {
        if (currentPaymentRequest) {
            navigator.clipboard.writeText(currentPaymentRequest.card_number.replace(/\s/g, ''));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Confirm payment and send to Telegram
    const confirmPayment = async () => {
        if (!currentPaymentRequest || !selectedPayment) return;

        try {
            const formData = new FormData();
            formData.append('userId', userId);
            formData.append('method', selectedPayment.id);
            formData.append('amount', currentPaymentRequest.amount.toString());
            if (uploadedFile) {
                formData.append('file', uploadedFile);
            }

            await fetch('/api/telegram/payment', {
                method: 'POST',
                body: formData
            });

            setShowSuccessModal(true);
            closeDepositModal();
        } catch (err) {
            console.error('Error confirming payment:', err);
            closeDepositModal();
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#181818] to-[#010101] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#181818] to-[#010101] flex flex-col">
            {/* Header */}
            <GameHeader
                userBalance={userBalance}
                onDepositClick={openDepositModal}
                onMenuClick={() => setIsDrawerOpen(!isDrawerOpen)}
            />

            {/* Multiplier History Bar */}
            <HistoryBar
                multiplierHistory={multiplierHistory}
                isExpanded={isHistoryExpanded}
                onToggleExpand={() => setIsHistoryExpanded(!isHistoryExpanded)}
            />

            {/* Main Game Layout with Bets Panel */}
            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
                {/* Bets Panel - Left Side on Desktop */}
                <div className="hidden lg:block w-80 flex-shrink-0 p-2 border-r border-gray-800 bg-[#0e0e0e] lg:h-screen lg:overflow-y-auto">
                    <BetsPanel bets={fakeBets} gameState={gameState} currentMultiplier={currentMultiplier} />
                </div>

                {/* Right Side: Game + Betting stacked */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Game Area - 70% on large screens */}
                    <div className="relative bg-[#0e0e0e] overflow-hidden min-h-[250px] lg:h-[50vh] lg:max-h-none max-h-[350px]">
                        {/* Radial sunburst background */}
                        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                            <div
                                className={`w-[200%] h-[200%] pointer-events-none ${gameState === 'flying' ? 'animate-spin-slow' : ''}`}
                                style={{
                                    background: 'repeating-conic-gradient(from 0deg, rgba(20,20,20,1) 0deg 10deg, rgba(10,10,10,1) 10deg 20deg)',
                                    opacity: 0.5,
                                }}
                            />
                        </div>

                        {/* Waiting/Countdown State */}
                        {gameState === 'waiting' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                {/* Partners Section */}
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-red-500 font-black text-2xl tracking-tight">UFC</span>
                                    <div className="w-px h-6 bg-gray-500" />
                                    <div className="flex items-center gap-1">
                                        <Image src="/AviatorWinn_files/plane.png" alt="Aviator" width={24} height={16} className="h-4 w-auto object-contain" />
                                        <span className="text-red-500 font-bold text-sm italic">Aviator</span>
                                    </div>
                                </div>
                                <p className="text-gray-400 text-xs tracking-widest mb-4">OFFICIAL PARTNERS</p>

                                {/* Progress Bar - Above SPRIBE card, centered */}
                                <div className="w-40 mb-4">
                                    <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-500 transition-all duration-1000 ease-linear"
                                            style={{ width: `${countdownProgress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* SPRIBE Official Badge */}
                                <div className="bg-[#1a1a1a]/80 border border-gray-700 rounded-xl px-8 py-4 flex flex-col items-center backdrop-blur-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">S</span>
                                        </div>
                                        <span className="text-white font-bold text-base">SPRIBE</span>
                                    </div>
                                    <div className="border border-green-500/60 rounded px-4 py-1 mb-2 bg-[#0a0a0a]">
                                        <span className="text-green-400 text-sm flex items-center gap-1">
                                            Official Game <span className="text-green-500">✓</span>
                                        </span>
                                    </div>
                                    <span className="text-gray-500 text-xs">Since 2018</span>
                                </div>

                                {/* Small plane decoration on left */}
                                <div className="absolute left-4 bottom-8">
                                    <Image src="/AviatorWinn_files/plane.png" alt="" width={60} height={30} className="h-8 w-auto opacity-60" />
                                </div>
                            </div>
                        )}

                        {/* Flying State - Center Multiplier Display */}
                        {gameState === 'flying' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                                {/* Soft circular glow behind multiplier */}
                                <div className={`absolute w-32 h-32 rounded-full blur-3xl opacity-40 transition-colors duration-500 ${currentMultiplier >= 100 ? 'bg-[#ec4899]' :
                                    currentMultiplier >= 10 ? 'bg-[#a855f7]' :
                                        currentMultiplier >= 2 ? 'bg-[#3b82f6]' :
                                            'bg-[#5ce85c]'
                                    }`} />
                                <div className={`text-6xl sm:text-7xl font-bold transition-colors duration-500 ${currentMultiplier >= 100 ? 'text-[#ec4899] drop-shadow-[0_0_30px_rgba(236,72,153,0.5)]' :
                                    currentMultiplier >= 10 ? 'text-[#a855f7] drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]' :
                                        currentMultiplier >= 2 ? 'text-[#3b82f6] drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]' :
                                            'text-[#5ce85c] drop-shadow-[0_0_30px_rgba(92,232,92,0.5)]'
                                    }`}>
                                    {currentMultiplier.toFixed(2)}x
                                </div>
                            </div>
                        )}

                        {/* Crashed State */}
                        {gameState === 'crashed' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                {/* Soft circular glow behind multiplier - same color as flying */}
                                <div className={`absolute w-32 h-32 rounded-full blur-3xl opacity-40 ${currentMultiplier >= 100 ? 'bg-[#ec4899]' :
                                    currentMultiplier >= 10 ? 'bg-[#a855f7]' :
                                        currentMultiplier >= 2 ? 'bg-[#3b82f6]' :
                                            'bg-[#5ce85c]'
                                    }`} />
                                <p className="text-white text-lg mb-2 font-medium">Uchib ketti</p>
                                <div className={`text-6xl sm:text-7xl font-bold transition-colors duration-500 ${currentMultiplier >= 100 ? 'text-[#ec4899] drop-shadow-[0_0_30px_rgba(236,72,153,0.5)]' :
                                    currentMultiplier >= 10 ? 'text-[#a855f7] drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]' :
                                        currentMultiplier >= 2 ? 'text-[#3b82f6] drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]' :
                                            'text-[#5ce85c] drop-shadow-[0_0_30px_rgba(92,232,92,0.5)]'
                                    }`}>
                                    {currentMultiplier.toFixed(2)}x
                                </div>
                            </div>
                        )}

                        {/* Canvas Game Layer */}
                        <div className="absolute inset-0 z-0">
                            <AviatorCanvas gameState={gameState} currentMultiplier={currentMultiplier} />
                        </div>
                    </div>

                    {/* Betting Interface - 30% on large screens */}
                    <div className="p-4 space-y-3">
                        <BettingCard
                            betAmount={betAmount1}
                            setBetAmount={setBetAmount1}
                            betType={betType1}
                            setBetType={setBetType1}
                            isBetting={isBetting1}
                            setIsBetting={setIsBetting1}
                            formatAmount={formatAmount}
                            showAddButton={!showSecondBet}
                            onAdd={() => setShowSecondBet(true)}
                        />

                        {showSecondBet && (
                            <BettingCard
                                betAmount={betAmount2}
                                setBetAmount={setBetAmount2}
                                betType={betType2}
                                setBetType={setBetType2}
                                isBetting={isBetting2}
                                setIsBetting={setIsBetting2}
                                formatAmount={formatAmount}
                                showRemoveButton
                                onRemove={() => setShowSecondBet(false)}
                            />
                        )}
                    </div>

                    {/* Bets Panel - Mobile Only */}
                    <div className="lg:hidden px-4 pb-4">
                        <BetsPanel bets={fakeBets} gameState={gameState} currentMultiplier={currentMultiplier} />
                    </div>
                </div>
            </div>

            {/* Drawer Overlay */}
            {isDrawerOpen && (
                <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsDrawerOpen(false)} />
            )}

            {/* Side Drawer */}
            <SideDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                userId={userId}
                userBalance={userBalance}
                onProfileClick={() => {
                    setIsDrawerOpen(false);
                    setIsProfileModalOpen(true);
                }}
                onDepositClick={openDepositModal}
                onWithdrawClick={openWithdrawModal}
                onHistoryClick={openHistoryModal}
                onSignOut={signOut}
            />

            {/* Deposit Modal */}
            {isDepositModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        {/* Step 1: Select Payment Method */}
                        {depositStep === 'select' && (
                            <>
                                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                                    <h2 className="text-[#1a1a4e] text-xl font-bold">Pul kirgizish</h2>
                                    <button onClick={closeDepositModal} className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100">
                                        <X size={18} className="text-gray-600" />
                                    </button>
                                </div>
                                <div className="p-5">
                                    <h3 className="text-gray-800 font-semibold mb-1">Hisob to&apos;ldirish usullari</h3>
                                    <p className="text-gray-400 text-sm mb-4">Regioningizda mavjud bo&apos;lgan hisob to&apos;ldirish usullari</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {paymentMethods.map((method) => (
                                            <button key={method.id} onClick={() => selectPaymentMethod(method)} className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:border-[#1a1a4e] hover:bg-[#1a1a4e]/5 transition-all">
                                                <div className="h-10 flex items-center justify-center mb-2">
                                                    <Image src={method.logo} alt={method.name} width={80} height={32} className="max-h-8 w-auto object-contain" />
                                                </div>
                                                <span className="text-gray-600 text-xs">{method.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Step 2: Enter Amount */}
                        {depositStep === 'amount' && selectedPayment && (
                            <>
                                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                                    <h2 className="text-[#1a1a4e] text-xl font-bold">ID #{userId}</h2>
                                    <button onClick={closeDepositModal} className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100">
                                        <X size={18} className="text-gray-600" />
                                    </button>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center justify-between border border-gray-200 rounded-lg p-3 mb-4">
                                        <div className="flex items-center gap-3">
                                            <Image src={selectedPayment.logo} alt={selectedPayment.name} width={48} height={24} className="max-h-6 w-auto object-contain" />
                                            <div>
                                                <p className="text-gray-800 font-semibold text-sm">{selectedPayment.cardLabel}</p>
                                                <p className="text-gray-400 text-xs">{selectedPayment.transferLabel}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setDepositStep('select')} className="text-[#00bcd4] font-semibold text-sm hover:underline">O&apos;zgartirish</button>
                                    </div>

                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[#00bcd4] text-sm">To&apos;ldirish uchun minimal miqdor</span>
                                        <span className="text-[#00bcd4] text-sm">UZS {formatAmount(selectedPayment.minAmount)}</span>
                                    </div>

                                    <div className="mb-3">
                                        <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3">
                                            <span className="font-bold text-gray-800 mr-2">UZS</span>
                                            <span className="text-gray-300">|</span>
                                            <input type="text" value={amount} onChange={(e) => handleAmountChange(e.target.value)} placeholder="0" className="flex-1 ml-2 outline-none text-gray-800 text-lg font-medium" />
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mb-6">
                                        {quickAmounts.map((qa) => (
                                            <button key={qa.value} onClick={() => selectQuickAmount(qa.value)} className="flex-1 py-2 px-2 border border-gray-200 rounded-full text-xs text-gray-600 hover:border-[#1a1a4e] hover:bg-[#1a1a4e]/5 transition-colors">
                                                {qa.label}
                                            </button>
                                        ))}
                                    </div>

                                    <button onClick={proceedToConfirm} disabled={isCreatingRequest} className="w-full py-4 bg-[#27b82c] hover:bg-[#2ed134] text-white rounded-full font-semibold text-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                                        {isCreatingRequest ? <><Loader2 size={20} className="animate-spin" /> Loading...</> : 'Keyingi'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Step 3: Confirm Payment */}
                        {depositStep === 'confirm' && selectedPayment && currentPaymentRequest && (
                            <>
                                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                                    <h2 className="text-[#1a1a4e] text-xl font-bold">Deposit</h2>
                                    <button onClick={closeDepositModal} className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100">
                                        <X size={18} className="text-gray-600" />
                                    </button>
                                </div>
                                <div className="p-5">
                                    {/* Success Message */}
                                    <p className="text-gray-600 text-sm mb-4">
                                        So&apos;rov muvaffaqiyatli qabul qilind. Belgilangan miqdorni ko&apos;rsatilgan kartaga o&apos;tkazing
                                    </p>

                                    {/* Guarantee Badge */}
                                    <div className="flex items-start gap-3 bg-[#e8f5e9] rounded-lg p-3 mb-4">
                                        <Shield size={24} className="text-[#27b82c] flex-shrink-0 mt-0.5" />
                                        <p className="text-[#27b82c] text-sm">
                                            <span className="font-semibold">O&apos;tkazma kafolatlangan</span> ushbu o&apos;tkazma mablag&apos;larning AviatorWinn sizning hisobingizga o&apos;tkazilishini kafolatlaydi
                                        </p>
                                    </div>

                                    {/* Method Display */}
                                    <div className="flex items-center justify-between border border-gray-200 rounded-lg p-3 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Shield size={20} className="text-gray-400" />
                                            <span className="text-gray-600 text-sm">Method</span>
                                        </div>
                                        <span className="text-[#1a1a4e] font-semibold">{selectedPayment.name}</span>
                                    </div>

                                    {/* Info Text */}
                                    <p className="text-gray-500 text-xs mb-4">
                                        Quyidagi maydonda ko&apos;rsatilgan aniq miqdorni nusxalang. Ushbu miqdorga asoslanib, biz sizning to&apos;lovingizni aniqlaymiz va uni avtomatik ravishda hisobingizga tushiramiz.
                                    </p>

                                    {/* Amount Field */}
                                    <div className="border border-gray-200 rounded-lg p-4 mb-3">
                                        <p className="text-gray-400 text-xs mb-1">O&apos;tkazish summa miqdori</p>
                                        <div className="flex justify-between items-center">
                                            <p className="text-[#1a1a4e] text-lg font-bold">UZS {formatAmount(currentPaymentRequest.amount)},00</p>
                                            <button onClick={() => navigator.clipboard.writeText(currentPaymentRequest.amount.toString())} className="text-gray-400 hover:text-gray-600">
                                                <Copy size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Card Number Field */}
                                    <div className="border border-gray-200 rounded-lg p-4 mb-3">
                                        <p className="text-gray-400 text-xs mb-1">O&apos;tkazma uchun karta raqami</p>
                                        <div className="flex justify-between items-center">
                                            <p className="text-[#1a1a4e] text-lg font-bold">{currentPaymentRequest.card_number}</p>
                                            <button onClick={copyCardNumber} className="text-gray-400 hover:text-gray-600">
                                                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* File Upload Field */}
                                    <div className="border border-gray-200 rounded-lg p-4 mb-3">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Shield size={18} className="text-gray-400" />
                                                <span className="text-gray-600 text-sm">To&apos;lov chekini yuklang</span>
                                            </div>
                                            <label className="cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            // Check 20MB limit
                                                            if (file.size > 20 * 1024 * 1024) {
                                                                setErrorMessage("Fayl hajmi 20 MB dan oshmasligi kerak!");
                                                                setShowErrorModal(true);
                                                                return;
                                                            }
                                                            setUploadedFile(file);
                                                        }
                                                    }}
                                                />
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${uploadedFile ? 'bg-green-500' : 'bg-[#27b82c]'}`}>
                                                    {uploadedFile ? <Check size={16} className="text-white" /> : <Copy size={16} className="text-white rotate-180" />}
                                                </div>
                                            </label>
                                        </div>
                                        {uploadedFile && (
                                            <p className="text-green-500 text-xs mt-2">{uploadedFile.name}</p>
                                        )}
                                    </div>

                                    {/* Timer Field */}
                                    <div className="border border-gray-200 rounded-lg p-4 mb-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-gray-400 text-xs mb-1">Sizning transferingizni kutamiz</p>
                                                <p className="text-[#1a1a4e] text-lg font-bold">{formatTimeRemaining(timeRemaining)}</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-[#27b82c] animate-spin" />
                                        </div>
                                    </div>

                                    {/* Confirm Button */}
                                    <button
                                        onClick={() => {
                                            if (!uploadedFile) {
                                                setErrorMessage("To'lov chekini yuklang!");
                                                setShowErrorModal(true);
                                                return;
                                            }
                                            confirmPayment();
                                        }}
                                        className="w-full py-4 bg-[#27b82c] hover:bg-[#2ed134] text-white rounded-full font-semibold text-lg transition-colors uppercase"
                                    >
                                        To&apos;landi
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Error Modal */}
            <ErrorModal isOpen={showErrorModal} message={errorMessage} onClose={() => setShowErrorModal(false)} />

            {/* Success Modal */}
            <SuccessModal isOpen={showSuccessModal} onClose={closeSuccessModal} />
        </div>
    );
}
