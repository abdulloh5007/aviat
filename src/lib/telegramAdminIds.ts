import { promises as fs } from 'fs';
import path from 'path';

const TELEGRAM_ADMINS_FILE_PATH = path.join(process.cwd(), 'data', 'telegram-admins.json');

export interface TelegramAdminIdsSettings {
    telegramAdminIds: string[];
    telegramAdminIdsUpdatedAt: string | null;
}

interface TelegramAdminIdsFilePayload {
    telegramAdminIds?: unknown;
    telegramAdminIdsUpdatedAt?: unknown;
    updatedBy?: unknown;
}

export const isValidTelegramAdminId = (value: string): boolean => /^\d+$/.test(value.trim());

export function parseTelegramAdminIds(value: unknown): string[] {
    const rawValues: string[] = [];

    if (Array.isArray(value)) {
        for (const item of value) {
            if (typeof item === 'string') {
                rawValues.push(item);
            }
        }
    } else if (typeof value === 'string') {
        rawValues.push(...value.split(/[\n,;]+/));
    }

    const unique = new Set<string>();
    for (const raw of rawValues) {
        const trimmed = raw.trim();
        if (trimmed) {
            unique.add(trimmed);
        }
    }

    return Array.from(unique);
}

function normalizeValidAdminIds(adminIds: string[]): string[] {
    const unique = new Set<string>();

    for (const id of adminIds) {
        const trimmed = id.trim();
        if (trimmed && isValidTelegramAdminId(trimmed)) {
            unique.add(trimmed);
        }
    }

    return Array.from(unique);
}

function getEnvFallbackAdminIds(): string[] {
    const fallback = process.env.ADMIN_ID?.trim() || '';
    if (!fallback || !isValidTelegramAdminId(fallback)) {
        return [];
    }
    return [fallback];
}

export async function getTelegramAdminIdsSettings(): Promise<TelegramAdminIdsSettings> {
    try {
        const fileContent = await fs.readFile(TELEGRAM_ADMINS_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent) as TelegramAdminIdsFilePayload;
        const parsedIds = Array.isArray(parsed?.telegramAdminIds)
            ? parseTelegramAdminIds(parsed.telegramAdminIds)
            : [];

        return {
            telegramAdminIds: normalizeValidAdminIds(parsedIds),
            telegramAdminIdsUpdatedAt: typeof parsed?.telegramAdminIdsUpdatedAt === 'string'
                ? parsed.telegramAdminIdsUpdatedAt
                : null
        };
    } catch (error) {
        const err = error as NodeJS.ErrnoException;
        if (err?.code !== 'ENOENT') {
            console.error('Failed to read telegram admin ids settings:', error);
        }

        return {
            telegramAdminIds: getEnvFallbackAdminIds(),
            telegramAdminIdsUpdatedAt: null
        };
    }
}

export async function saveTelegramAdminIdsSettings(input: {
    telegramAdminIds: string[];
    updatedBy?: string | null;
}): Promise<TelegramAdminIdsSettings | null> {
    try {
        const normalizedIds = normalizeValidAdminIds(input.telegramAdminIds);
        const updatedAt = new Date().toISOString();

        const payload = {
            telegramAdminIds: normalizedIds,
            telegramAdminIdsUpdatedAt: updatedAt,
            updatedBy: input.updatedBy || null
        };

        await fs.mkdir(path.dirname(TELEGRAM_ADMINS_FILE_PATH), { recursive: true });
        await fs.writeFile(TELEGRAM_ADMINS_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');

        return {
            telegramAdminIds: normalizedIds,
            telegramAdminIdsUpdatedAt: updatedAt
        };
    } catch (error) {
        console.error('Failed to save telegram admin ids settings:', error);
        return null;
    }
}

export async function isAllowedTelegramAdmin(telegramUserId: string | undefined): Promise<boolean> {
    if (!telegramUserId) {
        return false;
    }

    const settings = await getTelegramAdminIdsSettings();
    return settings.telegramAdminIds.includes(telegramUserId.trim());
}

