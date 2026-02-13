'use client';

import AviatorCanvas from '@/components/AviatorCanvas';
import BetsPanel, { generateFakeBets, FakeBet } from '@/components/BetsPanel';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Loader2, X, Shield, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGameSync } from '@/hooks/useGameSync';

// Import local components
import { GameHeader, HistoryBar, SideDrawer, BettingCard, WithdrawModal, ProfileModal, TafsilotModal, ErrorModal, SuccessModal } from './components';

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
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
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

    // Admin State
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();

    // Ref to prevent duplicate saves
    const lastSavedMultiplier = useRef<number | null>(null);

    // Sync with server (Supabase Realtime)
    const syncState = useGameSync();
    const useSyncMode = syncState.isConnected && syncState.roundId > 0;

    // Sync state from server when connected
    useEffect(() => {
        if (useSyncMode) {
            setGameState(syncState.gameState);
            setCurrentMultiplier(syncState.currentMultiplier);
            setCountdownSeconds(syncState.countdownSeconds);
            setCountdownProgress(syncState.countdownProgress);

            // Sync history from server
            if (syncState.history.length > 0) {
                setMultiplierHistory(syncState.history);
            }
        }
    }, [useSyncMode, syncState]);

    // Redirect to home if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

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

    // Check admin status
    useEffect(() => {
        const checkAdminStatus = async () => {
            if (user?.id) {
                try {
                    const response = await fetch('/api/admin/check', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            authId: user.id,  // UUID to lookup user_id from profiles
                            userId: userId     // 6-digit for admins table check
                        })
                    });
                    const data = await response.json();
                    setIsAdmin(data.isAdmin === true);
                } catch (err) {
                    setIsAdmin(false);
                }
            }
        };
        checkAdminStatus();
    }, [user, userId]);

    // Save game round to database
    const saveGameRound = useCallback(async (multiplier: number) => {
        try {
            await supabase
                .from('game_rounds')
                .insert({ multiplier: multiplier });
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

    // Generate fake bets gradually when game starts waiting (50-130 players)
    useEffect(() => {
        if (gameState !== 'waiting') return;

        // Clear previous bets and prepare new ones
        const targetCount = 50 + Math.floor(Math.random() * 81); // 50 to 130 (reduced for performance)
        const allBets = generateFakeBets(targetCount);

        // Start with empty array
        setFakeBets([]);

        // Gradually add bets over 5 seconds in 5 steps (fewer updates = smoother)
        let currentIndex = 0;
        const steps = 5;
        const betsPerStep = Math.ceil(targetCount / steps);

        const interval = setInterval(() => {
            if (currentIndex >= targetCount) {
                clearInterval(interval);
                return;
            }

            const endIndex = Math.min(currentIndex + betsPerStep, targetCount);
            setFakeBets(allBets.slice(0, endIndex));
            currentIndex = endIndex;
        }, 1000); // Every 1 second (5 steps in 5 seconds - less frequent updates)

        return () => clearInterval(interval);
    }, [gameState]);

    // Simulate cashouts during flying phase (optimized - less frequent checks)
    useEffect(() => {
        if (gameState !== 'flying') return;

        // Process cashouts as multiplier increases
        const cashoutInterval = setInterval(() => {
            setFakeBets(prevBets => {
                // Check if any bets need to cash out
                const needsUpdate = prevBets.some(bet => !bet.cashedOut && currentMultiplier >= bet.targetMultiplier);
                if (!needsUpdate) return prevBets; // No state change = no re-render

                // Find bets that should cash out at current multiplier
                return prevBets.map(bet => {
                    if (!bet.cashedOut && currentMultiplier >= bet.targetMultiplier) {
                        return {
                            ...bet,
                            cashedOut: true,
                            cashoutMultiplier: bet.targetMultiplier,
                            winAmount: Math.floor(bet.amount * bet.targetMultiplier)
                        };
                    }
                    return bet;
                });
            });
        }, 200); // Check every 200ms instead of 100ms (less CPU usage)

        return () => clearInterval(cashoutInterval);
    }, [gameState, currentMultiplier]);



    // Game Loop (Local Mode Only - skipped when using sync mode)
    useEffect(() => {
        // Skip local game loop if using server sync
        if (useSyncMode) return;

        let isActive = true;
        let countdownInterval: NodeJS.Timeout | null = null;
        let flyInterval: NodeJS.Timeout | null = null;
        let restartTimeout: NodeJS.Timeout | null = null;

        // Generate random multiplier
        const generateMultiplier = () => {
            // Weighted random distribution to mimic real game behavior across large sample size
            const rand = Math.random() * 100;
            if (rand < 3) return 1.00; // Instant crash (3%)
            if (rand < 18) return 1.01 + Math.random() * 0.49; // 1.01x - 1.50x (15%)
            if (rand < 43) return 1.5 + Math.random() * 0.5; // 1.50x - 2.00x (25%)
            if (rand < 68) return 2 + Math.random() * 1; // 2.00x - 3.00x (25%)
            if (rand < 83) return 3 + Math.random() * 2; // 3.00x - 5.00x (15%)
            if (rand < 93) return 5 + Math.random() * 5; // 5.00x - 10.00x (10%)
            if (rand < 98) return 10 + Math.random() * 40; // 10.00x - 50.00x (5%)
            return 50 + Math.random() * 50; // 50.00x - 100.00x (2%)
        };

        const runGame = () => {
            if (!isActive) return;

            // 1. Waiting Phase
            setGameState('waiting');
            setCurrentMultiplier(1.00);

            // Generate next target
            let targetValue = parseFloat(generateMultiplier().toFixed(2));
            setTargetMultiplier(targetValue);

            // Note: Signal is sent from game-loop.js in sync mode

            let countdown = 5;
            setCountdownSeconds(countdown);
            setCountdownProgress(100);

            countdownInterval = setInterval(() => {
                if (!isActive) return;
                countdown -= 1;
                setCountdownSeconds(Math.max(0, countdown));
                setCountdownProgress((countdown / 5) * 100);

                if (countdown <= 0) {
                    if (countdownInterval) clearInterval(countdownInterval);

                    // 2. Flying Phase
                    setGameState('flying');

                    // Start flying loop
                    let currentMult = 1.00;
                    flyInterval = setInterval(() => {
                        if (!isActive) return;

                        // Variable speed: slow until 5x, then accelerate
                        let increment: number;
                        if (currentMult < 5) {
                            // Very slow: 0.006 per tick = ~0.2x per second
                            increment = 0.006;
                        } else {
                            // Accelerate after 5x: starts at 0.03, grows progressively
                            increment = 0.03 + (currentMult - 5) * 0.002;
                        }
                        currentMult += increment;

                        // Check if we hit target
                        if (currentMult >= targetValue) {
                            currentMult = targetValue;
                            if (flyInterval) clearInterval(flyInterval);

                            // 3. Crashed Phase
                            setGameState('crashed');
                            setCurrentMultiplier(targetValue);

                            // Finalize fake bets (process cashouts for any who won)
                            setFakeBets(prevBets => prevBets.map(bet => {
                                if (!bet.cashedOut && targetValue >= bet.targetMultiplier) {
                                    return {
                                        ...bet,
                                        cashedOut: true,
                                        cashoutMultiplier: bet.targetMultiplier,
                                        winAmount: Math.floor(bet.amount * bet.targetMultiplier)
                                    };
                                }
                                return bet;
                            }));

                            // Save history if new
                            if (lastSavedMultiplier.current !== targetValue) {
                                lastSavedMultiplier.current = targetValue;
                                setMultiplierHistory(h => [targetValue, ...h.slice(0, 29)]);
                                // Fire and forget save
                                supabase.from('game_rounds').insert({ multiplier: targetValue }).then();
                            }

                            // Schedule restart
                            restartTimeout = setTimeout(() => {
                                runGame();
                            }, 3000);

                        } else {
                            // Update multiplier state
                            setCurrentMultiplier(parseFloat(currentMult.toFixed(2)));
                        }
                    }, 30); // 30ms = ~33 FPS
                }
            }, 1000);
        };

        // Start the game loop
        runGame();

        // Cleanup function
        return () => {
            isActive = false;
            if (countdownInterval) clearInterval(countdownInterval);
            if (flyInterval) clearInterval(flyInterval);
            if (restartTimeout) clearTimeout(restartTimeout);
        };
    }, [useSyncMode]);

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
        setIsSubmittingPayment(false);
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
        if (numericValue) {
            const formatted = parseInt(numericValue).toLocaleString('uz-UZ').replace(/,/g, ' ');
            setAmount(formatted);
        } else {
            setAmount('');
        }
    };

    const selectQuickAmount = (value: number) => {
        setAmount(value.toLocaleString('uz-UZ').replace(/,/g, ' '));
    };

    const proceedToConfirm = async () => {
        if (!selectedPayment) return;

        // Validate amount is not empty
        if (!amount || amount.trim() === '') {
            setErrorMessage("Summani kiriting!");
            setShowErrorModal(true);
            return;
        }

        const numAmount = parseInt(amount.replace(/\s/g, ''));
        if (isNaN(numAmount) || numAmount < selectedPayment.minAmount || numAmount > selectedPayment.maxAmount) {
            setErrorMessage(`Miqdor ${formatAmount(selectedPayment.minAmount)} dan ${formatAmount(selectedPayment.maxAmount)} gacha bo'lishi kerak`);
            setShowErrorModal(true);
            return;
        }

        setIsCreatingRequest(true);
        try {
            // One active deposit request per user: pending or awaiting confirmation.
            const { data: existingRequests, error: checkError } = await supabase
                .from('payment_requests')
                .select('*')
                .eq('user_id', user?.id)
                .in('status', ['pending', 'awaiting_review', 'awaiting_confirmation'])
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1);

            if (!checkError && existingRequests && existingRequests.length > 0) {
                // Resume existing payment request
                const existingRequest = existingRequests[0];
                const existingMethod = paymentMethods.find((method) => method.id === existingRequest.method);
                const expiresAt = new Date(existingRequest.expires_at).getTime();
                const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
                if (existingMethod) {
                    setSelectedPayment(existingMethod);
                }
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
        if (!currentPaymentRequest || !selectedPayment || isSubmittingPayment) return;
        if (currentPaymentRequest.status === 'awaiting_confirmation' || currentPaymentRequest.status === 'awaiting_review') {
            return;
        }

        setIsSubmittingPayment(true);
        try {
            const formData = new FormData();
            formData.append('userId', userId);
            formData.append('method', selectedPayment.id);
            formData.append('amount', currentPaymentRequest.amount.toString());
            formData.append('paymentRequestId', currentPaymentRequest.id);
            if (uploadedFile) {
                formData.append('file', uploadedFile);
            }

            const response = await fetch('/api/telegram/payment', {
                method: 'POST',
                body: formData
            });

            const rawResponseText = await response.text();
            let result: any = {};
            try {
                result = rawResponseText ? JSON.parse(rawResponseText) : {};
            } catch {
                result = {};
            }

            if (!response.ok || !result?.success) {
                if (response.status === 413) {
                    throw new Error("Fayl juda katta: server limiti oshib ketdi (413). Admin bilan bog'laning.");
                }

                const isHtmlErrorPage = rawResponseText.trim().startsWith('<');
                if (isHtmlErrorPage && (response.status === 502 || response.status === 503 || response.status === 504)) {
                    throw new Error(
                        `Server/proxy xatosi (HTTP ${response.status}). Odatda bu nginx proxy yoki upstream timeout muammosi.`
                    );
                }

                const fallbackText = rawResponseText && !rawResponseText.trim().startsWith('<')
                    ? rawResponseText.trim()
                    : '';

                throw new Error(result?.error || fallbackText || `Telegramga yuborishda xatolik (HTTP ${response.status})`);
            }

            const nextExpiresAt = typeof result?.expiresAt === 'string' ? result.expiresAt : currentPaymentRequest.expires_at;
            const nextRemaining = Math.max(0, Math.floor((new Date(nextExpiresAt).getTime() - Date.now()) / 1000));
            setCurrentPaymentRequest(prev => prev ? { ...prev, status: 'awaiting_review', expires_at: nextExpiresAt } : prev);
            setTimeRemaining(nextRemaining);
            setShowSuccessModal(true);
            closeDepositModal();
        } catch (err) {
            console.error('Error confirming payment:', err);
            const message = err instanceof Error ? err.message : "Xatolik yuz berdi. Qayta urinib ko'ring.";
            setErrorMessage(message);
            setShowErrorModal(true);
            closeDepositModal();
        } finally {
            setIsSubmittingPayment(false);
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

    // Show loading while redirecting unauthenticated users
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#181818] to-[#010101] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
        );
    }

    const isAwaitingReview =
        currentPaymentRequest?.status === 'awaiting_confirmation' ||
        currentPaymentRequest?.status === 'awaiting_review';

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
                                {/* Soft radial glow behind multiplier - cross-browser compatible */}
                                <div
                                    className="absolute w-48 h-48 rounded-full opacity-30"
                                    style={{
                                        background: currentMultiplier >= 100
                                            ? 'radial-gradient(circle, #ec4899 0%, transparent 70%)'
                                            : currentMultiplier >= 10
                                                ? 'radial-gradient(circle, #a855f7 0%, transparent 70%)'
                                                : currentMultiplier >= 2
                                                    ? 'radial-gradient(circle, #3b82f6 0%, transparent 70%)'
                                                    : 'radial-gradient(circle, #5ce85c 0%, transparent 70%)'
                                    }}
                                />
                                <div className={`text-6xl sm:text-7xl font-bold transition-colors duration-300 ${currentMultiplier >= 100 ? 'text-[#ec4899]' :
                                    currentMultiplier >= 10 ? 'text-[#a855f7]' :
                                        currentMultiplier >= 2 ? 'text-[#3b82f6]' :
                                            'text-[#5ce85c]'
                                    }`}
                                    style={{
                                        textShadow: currentMultiplier >= 100
                                            ? '0 0 30px rgba(236,72,153,0.6)'
                                            : currentMultiplier >= 10
                                                ? '0 0 30px rgba(168,85,247,0.6)'
                                                : currentMultiplier >= 2
                                                    ? '0 0 30px rgba(59,130,246,0.6)'
                                                    : '0 0 30px rgba(92,232,92,0.6)'
                                    }}>
                                    {currentMultiplier.toFixed(2)}x
                                </div>
                            </div>
                        )}

                        {/* Crashed State */}
                        {gameState === 'crashed' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                {/* Soft radial glow behind multiplier - cross-browser compatible */}
                                <div
                                    className="absolute w-48 h-48 rounded-full opacity-30"
                                    style={{
                                        background: currentMultiplier >= 100
                                            ? 'radial-gradient(circle, #ec4899 0%, transparent 70%)'
                                            : currentMultiplier >= 10
                                                ? 'radial-gradient(circle, #a855f7 0%, transparent 70%)'
                                                : currentMultiplier >= 2
                                                    ? 'radial-gradient(circle, #3b82f6 0%, transparent 70%)'
                                                    : 'radial-gradient(circle, #5ce85c 0%, transparent 70%)'
                                    }}
                                />
                                <p className="text-white text-lg mb-2 font-medium">Uchib ketti</p>
                                <div className={`text-6xl sm:text-7xl font-bold ${currentMultiplier >= 100 ? 'text-[#ec4899]' :
                                    currentMultiplier >= 10 ? 'text-[#a855f7]' :
                                        currentMultiplier >= 2 ? 'text-[#3b82f6]' :
                                            'text-[#5ce85c]'
                                    }`}
                                    style={{
                                        textShadow: currentMultiplier >= 100
                                            ? '0 0 30px rgba(236,72,153,0.6)'
                                            : currentMultiplier >= 10
                                                ? '0 0 30px rgba(168,85,247,0.6)'
                                                : currentMultiplier >= 2
                                                    ? '0 0 30px rgba(59,130,246,0.6)'
                                                    : '0 0 30px rgba(92,232,92,0.6)'
                                    }}>
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
                            formatAmount={formatAmount}
                            showAddButton={!showSecondBet}
                            onAdd={() => setShowSecondBet(true)}
                            userBalance={userBalance}
                            userId={user?.id || ''}
                            gameState={gameState}
                            currentMultiplier={currentMultiplier}
                            onBalanceUpdate={(newBalance) => setUserBalance(newBalance)}
                            onInsufficientBalance={() => {
                                setErrorMessage("Balansingiz yetarli emas! Iltimos, hisobingizni to'ldiring.");
                                setShowErrorModal(true);
                            }}
                        />

                        {showSecondBet && (
                            <BettingCard
                                betAmount={betAmount2}
                                setBetAmount={setBetAmount2}
                                betType={betType2}
                                setBetType={setBetType2}
                                formatAmount={formatAmount}
                                showRemoveButton
                                onRemove={() => setShowSecondBet(false)}
                                userBalance={userBalance}
                                userId={user?.id || ''}
                                gameState={gameState}
                                currentMultiplier={currentMultiplier}
                                onBalanceUpdate={(newBalance) => setUserBalance(newBalance)}
                                onInsufficientBalance={() => {
                                    setErrorMessage("Balansingiz yetarli emas! Iltimos, hisobingizni to'ldiring.");
                                    setShowErrorModal(true);
                                }}
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
                isAdmin={isAdmin}
                onProfileClick={() => {
                    setIsDrawerOpen(false);
                    setIsProfileModalOpen(true);
                }}
                onDepositClick={openDepositModal}
                onWithdrawClick={openWithdrawModal}
                onHistoryClick={openHistoryModal}
                onAdminClick={() => {
                    setIsDrawerOpen(false);
                    router.push('/admin');
                }}
                onUsersClick={() => {
                    setIsDrawerOpen(false);
                    router.push('/admin-users');
                }}
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
                                        {isAwaitingReview
                                            ? "Sizning so'rovingiz allaqachon yuborilgan va tekshirilmoqda. Iltimos kuting."
                                            : "So'rov muvaffaqiyatli qabul qilindi. Belgilangan miqdorni ko'rsatilgan kartaga o'tkazing."}
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
                                    {!isAwaitingReview && (
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
                                    )}

                                    {/* Timer Field */}
                                    <div className="border border-gray-200 rounded-lg p-4 mb-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-gray-400 text-xs mb-1">
                                                    {isAwaitingReview ? 'So&apos;rovingiz tekshirilmoqda' : 'Sizning transferingizni kutamiz'}
                                                </p>
                                                <p className="text-[#1a1a4e] text-lg font-bold">{formatTimeRemaining(timeRemaining)}</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-[#27b82c] animate-spin" />
                                        </div>
                                    </div>

                                    {/* Confirm Button */}
                                    {isAwaitingReview ? (
                                        <button
                                            disabled
                                            className="w-full py-4 bg-gray-400 text-white rounded-full font-semibold text-lg uppercase cursor-not-allowed"
                                        >
                                            So&apos;rov tekshirilmoqda...
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                if (!uploadedFile) {
                                                    setErrorMessage("To'lov chekini yuklang!");
                                                    setShowErrorModal(true);
                                                    return;
                                                }
                                                confirmPayment();
                                            }}
                                            disabled={isSubmittingPayment}
                                            className="w-full py-4 bg-[#27b82c] hover:bg-[#2ed134] text-white rounded-full font-semibold text-lg transition-colors uppercase disabled:opacity-70 flex items-center justify-center gap-2"
                                        >
                                            {isSubmittingPayment ? <><Loader2 size={20} className="animate-spin" /> Yuborilmoqda...</> : "To'landi"}
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Error Modal */}
            <ErrorModal
                isOpen={showErrorModal}
                message={errorMessage}
                onClose={() => setShowErrorModal(false)}
                onDepositClick={() => {
                    setIsDrawerOpen(true);
                }}
            />

            {/* Withdraw Modal */}
            <WithdrawModal
                isOpen={isWithdrawModalOpen}
                onClose={() => setIsWithdrawModalOpen(false)}
                userBalance={userBalance}
                userId={user?.id || ''}
                onSuccess={() => setShowSuccessModal(true)}
                onError={(msg) => {
                    setErrorMessage(msg);
                    setShowErrorModal(true);
                }}
            />

            {/* Profile Modal */}
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                userId={userId}
                userPhone={userPhone}
                userEmail={userEmail}
                balances={balances}
                onDepositClick={openDepositModal}
                onWithdrawClick={openWithdrawModal}
            />

            {/* Tafsilot Modal */}
            <TafsilotModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                userId={user?.id || ''}
            />

            {/* Success Modal */}
            <SuccessModal isOpen={showSuccessModal} onClose={closeSuccessModal} />
        </div>
    );
}
