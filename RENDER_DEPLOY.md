# Render Deployment Guide

## Game Engine как Background Worker

### Шаг 1: Подключи репозиторий
1. Зайди на [render.com](https://render.com)
2. Dashboard → New → **Background Worker**
3. Подключи свой GitHub репозиторий

### Шаг 2: Настрой сервис
| Поле | Значение |
|------|----------|
| **Name** | aviator-game-engine |
| **Region** | Ближайший к тебе |
| **Branch** | main |
| **Build Command** | `npm install` |
| **Start Command** | `npm run game-engine` |
| **Instance Type** | Free |

### Шаг 3: Добавь Environment Variables
В разделе "Environment" добавь:
```
NEXT_PUBLIC_SUPABASE_URL = твой_url
SUPABASE_SERVICE_ROLE_KEY = твой_ключ
NEXT_PUBLIC_APP_URL = https://твой-сайт.vercel.app
```

### Шаг 4: Деплой
Нажми "Create Background Worker"

---

## Next.js сайт в Vercel
Деплой сайт обычным способом в Vercel.

**Важно:** Укажи `NEXT_PUBLIC_GAME_WS_URL` в Vercel:
```
NEXT_PUBLIC_GAME_WS_URL = wss://aviator-game-engine.onrender.com
```

И обнови клиент для использования этого URL.
