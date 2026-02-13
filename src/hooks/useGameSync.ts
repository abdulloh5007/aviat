'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface GameState {
    id: string;
    round_id: number;
    phase: 'waiting' | 'flying' | 'crashed';
    multiplier: number;
    crash_point: number;
    phase_start_at: string;
    updated_at: string;
}

interface UseGameSyncReturn {
    gameState: 'waiting' | 'flying' | 'crashed';
    currentMultiplier: number;
    crashPoint: number;
    roundId: number;
    isConnected: boolean;
    countdownSeconds: number;
    countdownProgress: number;
    history: number[];
}

export function useGameSync(): UseGameSyncReturn {
    const [serverState, setServerState] = useState<GameState | null>(null);
    const [localMultiplier, setLocalMultiplier] = useState(1.00);
    const [isConnected, setIsConnected] = useState(false);
    const [countdownSeconds, setCountdownSeconds] = useState(5);
    const [countdownProgress, setCountdownProgress] = useState(100);
    const [history, setHistory] = useState<number[]>([]);

    const channelRef = useRef<RealtimeChannel | null>(null);
    const animationRef = useRef<number | null>(null);
    const phaseStartRef = useRef<number>(0);
    const lastRoundRef = useRef<number>(0);
    const lastCrashHistoryRoundRef = useRef<number>(0);
    const historyReloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const serverClockOffsetRef = useRef<number>(0);

    const updateServerClockOffset = useCallback((serverTimestamp?: string) => {
        if (!serverTimestamp) return;
        const serverMs = new Date(serverTimestamp).getTime();
        if (Number.isNaN(serverMs)) return;
        serverClockOffsetRef.current = Date.now() - serverMs;
    }, []);

    const getSyncedNow = useCallback(() => {
        return Date.now() - serverClockOffsetRef.current;
    }, []);

    // Загрузка истории из БД
    const loadHistory = useCallback(async () => {
        try {
            const { data } = await supabase
                .from('game_rounds')
                .select('multiplier')
                .order('created_at', { ascending: false })
                .limit(30);

            if (data && data.length > 0) {
                setHistory(data.map(r => r.multiplier));
            }
        } catch {
            // Silent fail
        }
    }, []);

    const scheduleHistoryReload = useCallback((delayMs = 300) => {
        if (historyReloadTimerRef.current) {
            clearTimeout(historyReloadTimerRef.current);
        }
        historyReloadTimerRef.current = setTimeout(() => {
            loadHistory();
            historyReloadTimerRef.current = null;
        }, delayMs);
    }, [loadHistory]);

    // Получение текущего состояния с сервера
    const fetchState = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('game_state')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();

            if (data && !error) {
                setServerState(data as GameState);
                setIsConnected(true);

                // Если раунд изменился, обновляем историю
                if (data.round_id !== lastRoundRef.current) {
                    lastRoundRef.current = data.round_id;
                    scheduleHistoryReload(0);
                }
            }
        } catch {
            console.warn('Game state not available');
        }
    }, [scheduleHistoryReload]);

    // Обработка изменения состояния
    useEffect(() => {
        if (!serverState) return;

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        if (serverState.phase === 'flying') {
            phaseStartRef.current = new Date(serverState.phase_start_at).getTime();

            const animate = () => {
                const elapsed = Math.max(0, (getSyncedNow() - phaseStartRef.current) / 1000);
                const newMultiplier = Math.pow(1.06, elapsed);

                if (serverState.crash_point && newMultiplier >= serverState.crash_point) {
                    setLocalMultiplier(serverState.crash_point);
                } else {
                    setLocalMultiplier(Math.round(newMultiplier * 100) / 100);
                }

                animationRef.current = requestAnimationFrame(animate);
            };

            animationRef.current = requestAnimationFrame(animate);
        } else {
            if (serverState.phase === 'crashed') {
                setLocalMultiplier(serverState.crash_point || serverState.multiplier);
            } else if (serverState.phase === 'waiting') {
                setLocalMultiplier(1.00);
            }
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        };
    }, [serverState, getSyncedNow]);

    // Countdown для waiting фазы
    useEffect(() => {
        if (!serverState || serverState.phase !== 'waiting') {
            return;
        }

        const startTime = new Date(serverState.phase_start_at).getTime();
        const waitDuration = 5000;

        const updateCountdown = () => {
            const elapsed = getSyncedNow() - startTime;
            const remaining = Math.max(0, waitDuration - elapsed);
            const seconds = Math.ceil(remaining / 1000);
            const progress = (remaining / waitDuration) * 100;

            setCountdownSeconds(seconds);
            setCountdownProgress(progress);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 100);

        return () => clearInterval(interval);
    }, [serverState?.phase, serverState?.phase_start_at, getSyncedNow]);

    // Пересинхронизация при возвращении на вкладку
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Пользователь вернулся - пересинхронизировать
                fetchState();
            }
        };

        const handleFocus = () => {
            // При фокусе тоже пересинхронизировать
            fetchState();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchState]);

    // Подписка на Realtime
    useEffect(() => {
        fetchState();
        loadHistory();

        channelRef.current = supabase
            .channel('game_sync_' + Math.random())
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'game_state'
                },
                (payload) => {
                    const commitTimestamp = (payload as { commit_timestamp?: string }).commit_timestamp;
                    updateServerClockOffset(commitTimestamp);

                    const newState = payload.new as GameState;
                    if (newState) {
                        if (newState.round_id !== lastRoundRef.current) {
                            lastRoundRef.current = newState.round_id;
                            // Delay a bit so round insert in game_rounds has time to commit.
                            scheduleHistoryReload(350);
                        }

                        if (newState.phase === 'crashed' && newState.round_id !== lastCrashHistoryRoundRef.current) {
                            lastCrashHistoryRoundRef.current = newState.round_id;
                            const crashMultiplier = newState.crash_point || newState.multiplier;
                            if (crashMultiplier) {
                                setHistory(h => [crashMultiplier, ...h.slice(0, 29)]);
                            }
                        }

                        setServerState(newState);
                    }
                }
            )
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED');
            });

        return () => {
            if (historyReloadTimerRef.current) {
                clearTimeout(historyReloadTimerRef.current);
                historyReloadTimerRef.current = null;
            }
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [fetchState, loadHistory, scheduleHistoryReload, updateServerClockOffset]);

    return {
        gameState: serverState?.phase || 'waiting',
        currentMultiplier: localMultiplier,
        crashPoint: serverState?.crash_point || 0,
        roundId: serverState?.round_id || 0,
        isConnected,
        countdownSeconds,
        countdownProgress,
        history
    };
}
