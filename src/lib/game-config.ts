/**
 * Game Engine Mode Configuration
 * 
 * 'user' - Game runs client-side (when users are on site)
 *          Free, no VPS needed
 * 
 * 'machine' - Game runs on server via WebSocket
 *             Requires VPS or paid hosting
 */

export type GameEngineMode = 'user' | 'machine';

// Change this to switch modes
export const GAME_ENGINE_MODE: GameEngineMode = 'user';

// WebSocket URL for 'machine' mode (set in .env for production)
export const GAME_WS_URL = process.env.NEXT_PUBLIC_GAME_WS_URL || 'http://localhost:3001';
