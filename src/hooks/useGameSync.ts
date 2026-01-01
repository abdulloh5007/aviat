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
    const phaseStartRef = useRef<number>(Date.now());
    const lastRoundRef = useRef<number>(0);

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
        } catch (err) {
            // Silent fail
        }
    }, []);

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
                    loadHistory();
                }
            }
        } catch (err) {
            console.warn('Game state not available');
        }
    }, [loadHistory]);

    // Локальная интерполяция множителя для плавности
    const interpolateMultiplier = useCallback(() => {
        if (!serverState || serverState.phase !== 'flying') {
            return;
        }

        const elapsed = (Date.now() - phaseStartRef.current) / 1000;
        const newMultiplier = Math.pow(1.06, elapsed);

        if (serverState.crash_point && newMultiplier >= serverState.crash_point) {
            setLocalMultiplier(serverState.crash_point);
        } else {
            setLocalMultiplier(Math.round(newMultiplier * 100) / 100);
        }

        animationRef.current = requestAnimationFrame(interpolateMultiplier);
    }, [serverState]);

    // Обработка изменения состояния
    useEffect(() => {
        if (!serverState) return;

        if (serverState.phase === 'flying') {
            phaseStartRef.current = new Date(serverState.phase_start_at).getTime();
            animationRef.current = requestAnimationFrame(interpolateMultiplier);
        } else {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }

            if (serverState.phase === 'crashed') {
                setLocalMultiplier(serverState.crash_point || serverState.multiplier);
                // Добавляем в историю при краше
                if (serverState.crash_point && serverState.round_id !== lastRoundRef.current) {
                    lastRoundRef.current = serverState.round_id;
                    setHistory(h => [serverState.crash_point, ...h.slice(0, 29)]);
                }
            } else if (serverState.phase === 'waiting') {
                setLocalMultiplier(1.00);
            }
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [serverState?.phase, serverState?.round_id, interpolateMultiplier]);

    // Countdown для waiting фазы
    useEffect(() => {
        if (!serverState || serverState.phase !== 'waiting') {
            return;
        }

        const startTime = new Date(serverState.phase_start_at).getTime();
        const waitDuration = 5000;

        const updateCountdown = () => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, waitDuration - elapsed);
            const seconds = Math.ceil(remaining / 1000);
            const progress = (remaining / waitDuration) * 100;

            setCountdownSeconds(seconds);
            setCountdownProgress(progress);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 100);

        return () => clearInterval(interval);
    }, [serverState?.phase, serverState?.phase_start_at]);

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
                    const newState = payload.new as GameState;
                    if (newState) {
                        setServerState(newState);
                    }
                }
            )
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED');
            });

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [fetchState, loadHistory]);

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
