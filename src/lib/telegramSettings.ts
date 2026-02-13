import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SETTINGS_ROW_ID = 1;

type TelegramChannel = 'payments' | 'analysis';

export interface TelegramSettings {
    paymentsChatId: string;
    analysisChatId: string;
    updatedAt: string | null;
}

const normalizeChatId = (value: string) => value.trim();

export const isValidTelegramChatId = (value: string) => /^-?\d+$/.test(value);

export async function getTelegramSettings(): Promise<TelegramSettings | null> {
    const { data, error } = await supabase
        .from('telegram_settings')
        .select('payments_chat_id, analysis_chat_id, updated_at')
        .eq('id', SETTINGS_ROW_ID)
        .maybeSingle();

    if (error) {
        console.error('Error fetching telegram settings:', error);
        return null;
    }

    return {
        paymentsChatId: data?.payments_chat_id?.trim() || '',
        analysisChatId: data?.analysis_chat_id?.trim() || '',
        updatedAt: data?.updated_at || null
    };
}

export async function saveTelegramSettings(input: {
    paymentsChatId: string;
    analysisChatId: string;
    updatedBy?: string | null;
}): Promise<TelegramSettings | null> {
    const { data, error } = await supabase
        .from('telegram_settings')
        .upsert(
            {
                id: SETTINGS_ROW_ID,
                payments_chat_id: normalizeChatId(input.paymentsChatId),
                analysis_chat_id: normalizeChatId(input.analysisChatId),
                updated_by: input.updatedBy || null,
                updated_at: new Date().toISOString()
            },
            { onConflict: 'id' }
        )
        .select('payments_chat_id, analysis_chat_id, updated_at')
        .single();

    if (error) {
        console.error('Error saving telegram settings:', error);
        return null;
    }

    return {
        paymentsChatId: data?.payments_chat_id?.trim() || '',
        analysisChatId: data?.analysis_chat_id?.trim() || '',
        updatedAt: data?.updated_at || null
    };
}

export async function getTelegramChatId(channel: TelegramChannel): Promise<string | null> {
    const settings = await getTelegramSettings();
    if (!settings) return null;

    const chatId = channel === 'analysis' ? settings.analysisChatId : settings.paymentsChatId;
    return chatId || null;
}
