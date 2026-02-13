import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WAITING_DURATION_MS = 5000;

const GAME_STATE_SELECT = `
    id,
    round_id,
    phase,
    multiplier,
    crash_point,
    phase_start_at,
    updated_at
`;

// Генерация crash point по формуле Aviator
function generateCrashPoint(): number {
    const e = 2 ** 32;
    const h = Math.floor(Math.random() * e);

    // 3% шанс мгновенного краша
    if (h % 33 === 0) {
        return 1.0;
    }

    // Формула распределения
    const result = Math.floor((100 * e - h) / (e - h)) / 100;
    return Math.max(1.0, Math.min(result, 1000)); // Лимит 1000x
}

// GET - получить текущее состояние
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('game_state')
            .select(GAME_STATE_SELECT)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ state: data });
    } catch {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// POST - управление раундом
export async function POST(request: NextRequest) {
    try {
        const { action, adminKey } = await request.json();

        // Простая проверка (в продакшене использовать лучшую защиту)
        if (adminKey !== process.env.GAME_ADMIN_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Получить текущее состояние
        const { data: current } = await supabase
            .from('game_state')
            .select(GAME_STATE_SELECT)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (!current) {
            // Создать начальное состояние
            const { data: newState } = await supabase
                .from('game_state')
                .insert({
                    round_id: 1,
                    phase: 'waiting',
                    multiplier: 1.00,
                    crash_point: generateCrashPoint(),
                    phase_start_at: new Date().toISOString()
                })
                .select()
                .single();

            return NextResponse.json({ state: newState });
        }

        let update: Record<string, unknown> = { updated_at: new Date().toISOString() };

        switch (action) {
            case 'start':
                // Начать полёт
                if (current.phase !== 'waiting') {
                    return NextResponse.json({ state: current });
                }

                // Protect waiting phase duration: never allow early start.
                // This prevents shortened countdown if multiple loop workers run.
                const waitingElapsed = Date.now() - new Date(current.phase_start_at).getTime();
                if (waitingElapsed < WAITING_DURATION_MS) {
                    return NextResponse.json({ state: current });
                }

                update = {
                    ...update,
                    phase: 'flying',
                    multiplier: 1.00,
                    crash_point: current.crash_point || generateCrashPoint(),
                    phase_start_at: new Date().toISOString()
                };
                break;

            case 'tick':
                // Обновить множитель (вызывается часто).
                // Чтобы снизить egress, не пишем в БД каждый тик во время полёта:
                // UI интерполирует множитель локально по phase_start_at.
                if (current.phase === 'flying') {
                    const elapsed = (Date.now() - new Date(current.phase_start_at).getTime()) / 1000;
                    const newMultiplier = Math.pow(1.06, elapsed); // ~6% в секунду

                    if (newMultiplier >= current.crash_point) {
                        // Краш!
                        update = {
                            ...update,
                            phase: 'crashed',
                            multiplier: current.crash_point,
                            phase_start_at: new Date().toISOString()
                        };
                    } else {
                        return NextResponse.json({
                            state: {
                                ...current,
                                multiplier: Math.round(newMultiplier * 100) / 100,
                                updated_at: new Date().toISOString()
                            }
                        });
                    }
                } else {
                    return NextResponse.json({ state: current });
                }
                break;

            case 'next':
                // Начать новый раунд (ожидание)
                update = {
                    ...update,
                    round_id: current.round_id + 1,
                    phase: 'waiting',
                    multiplier: 1.00,
                    crash_point: generateCrashPoint(),
                    phase_start_at: new Date().toISOString()
                };
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const { data: updated, error } = await supabase
            .from('game_state')
            .update(update)
            .eq('id', current.id)
            .select(GAME_STATE_SELECT)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ state: updated });
    } catch {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
