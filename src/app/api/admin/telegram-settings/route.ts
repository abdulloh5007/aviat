import { NextRequest, NextResponse } from 'next/server';
import { checkAdminByAuthId } from '@/lib/adminCheck';
import {
    getTelegramSettings,
    isValidTelegramChatId,
    saveTelegramSettings
} from '@/lib/telegramSettings';

const parseText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

async function ensureAdmin(adminUserId: string): Promise<boolean> {
    if (!adminUserId) return false;
    return checkAdminByAuthId(adminUserId);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const adminUserId = parseText(body?.adminUserId);

        const isAdmin = await ensureAdmin(adminUserId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await getTelegramSettings();
        if (!settings) {
            return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
        }

        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Error loading telegram settings:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const adminUserId = parseText(body?.adminUserId);
        const paymentsChatId = parseText(body?.paymentsChatId);
        const analysisChatId = parseText(body?.analysisChatId);

        const isAdmin = await ensureAdmin(adminUserId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (paymentsChatId && !isValidTelegramChatId(paymentsChatId)) {
            return NextResponse.json({ error: 'Pul kiritish chat ID noto\'g\'ri formatda' }, { status: 400 });
        }

        if (analysisChatId && !isValidTelegramChatId(analysisChatId)) {
            return NextResponse.json({ error: 'Signal chat ID noto\'g\'ri formatda' }, { status: 400 });
        }

        const settings = await saveTelegramSettings({
            paymentsChatId,
            analysisChatId,
            updatedBy: adminUserId
        });

        if (!settings) {
            return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
        }

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        console.error('Error saving telegram settings:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
