# EVA — Virtual Companion App

Интерактивное веб-приложение с AI-спутницами. Пользователь создаёт девушку, общается с ней в чате, получает фото и видео.

**Продакшен**: [https://your-virtual-cutie.ru/](https://your-virtual-cutie.ru/)

---

## Быстрый старт (локально)

```bash
cp .env.example .env   # заполни API-ключи
cd backend && npm install && npm run start:dev
cd frontend && npm install && npm run dev
```

---

## Продакшен-деплой

Сервер: `root@85.198.67.207`, проект в `/opt/eva`.

### 1. Залить код

```bash
ssh -i ~/.ssh/beget root@85.198.67.207 "cd /opt/eva && git pull origin ver0.2"
```

### 2. Пересобрать контейнеры

```bash
ssh -i ~/.ssh/beget root@85.198.67.207 "cd /opt/eva && docker-compose -f docker-compose.prod.yml up -d --build"
```

### 3. Проверить

```bash
docker ps --filter "name=eva-prod"
curl https://your-virtual-cutie.ru/health   # → {"status":"ok"}
```

---

## Сервисы (docker-compose.prod.yml)

| Сервис | Порт (host) | Порт (контейнер) |
|---|---|---|
| `eva-prod-db` | — | 5432 |
| `eva-prod-backend` | `127.0.0.1:3002` | 3000 |
| `eva-prod-frontend` | `127.0.0.1:8080` | 80 |

---

## Nginx (системный на хосте)

Конфиг: `/etc/nginx/sites-enabled/your-virtual-cutie.ru`

- `:80` → редирект на HTTPS
- `:443` → SSL (Let's Encrypt), проксирует:
  - `/` → `127.0.0.1:8080` (фронтенд)
  - `/uploads/`, `/auth/`, `/users/`, `/chat/*`, `/health` → `127.0.0.1:3002` (бэкенд)

---

## Переменные окружения (.env)

```env
DB_HOST=eva-db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=...
DB_DATABASE=eva_db

JWT_SECRET=...
DEEPSEEK_API_KEY=...
FAL_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://your-virtual-cutie.ru/auth/google/callback

NODE_ENV=production
PORT=3000
```

---

## Цены (кредиты)

| Услуга | Кредитов |
|---|---|
| 💬 Текст (чат) | Бесплатно |
| 🖼️ Генерация фото | **5** |
| 🎬 Генерация видео | **30** |

1 кредит = 1 рубль. Стартовый баланс нового пользователя — 100 кредитов.

---

## API Endpoints

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/google`
- `GET /auth/google/callback`

### Chat
- `POST /chat/send` — отправить сообщение
- `GET /chat/send-stream` — стриминг
- `POST /chat/detect-intent` — определить намерение
- `POST /chat/generate-image` — генерация фото
- `POST /chat/generate-video` — генерация видео
- `POST /chat/generate-video-from-image` — видео из картинки
- `POST /chat/create-girl` — создать спутницу

### Users
- `GET /users/profile`
- `PUT /users/profile`
- `GET /users/girls`
- `PUT /users/girls/:id`
- `DELETE /users/girls/:id`

---

## Tech Stack

- **Backend**: NestJS, TypeORM, PostgreSQL
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **AI**: DeepSeek (чат), Fal.ai (изображения / видео)
- **Auth**: JWT + Google OAuth
- **Инфраструктура**: Docker, Nginx, Let's Encrypt

---

## Бэкап

```bash
# База
ssh -i ~/.ssh/beget root@85.198.67.207 "docker exec eva-prod-db pg_dump -U postgres eva_db" > backup_$(date +%Y%m%d).sql

# Загрузки
ssh -i ~/.ssh/beget root@85.198.67.207 "docker exec eva-prod-backend tar -czf - /app/uploads" > uploads_backup.tar.gz