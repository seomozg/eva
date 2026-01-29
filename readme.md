# EVA - Virtual Companion App

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://eva.test-domain.ru/auth/google/callback` (production)
   - `http://localhost:3000/auth/google/callback` (development)
7. Copy Client ID and Client Secret to your `.env` file

### 3. Database Setup

```bash
# Install PostgreSQL and create database
createdb eva_db

# Run migrations
npm run migration:run
```

### 4. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 5. Start Services

#### Development (recommended for development)
```bash
# Backend (from backend directory)
npm run start:dev

# Frontend (from frontend directory)
npm run dev
```

#### Production with Docker
```bash
# From project root
docker-compose up --build
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 3000
- Frontend on port 80

## Production Deployment

### Environment Variables for Production

Make sure your production environment has:

```env
GOOGLE_CALLBACK_URL=http://eva.test-domain.ru/auth/google/callback
# ... other variables
```

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name eva.test-domain.ru;

    location / {
        proxy_pass http://localhost:5173;  # Frontend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3000;  # Backend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/google` - Google OAuth initiation
- `GET /auth/google/callback` - Google OAuth callback

### Chat
- `POST /chat/send` - Send message
- `GET /chat/send-stream` - Streaming chat
- `POST /chat/generate-image` - Generate image
- `POST /chat/generate-video` - Generate video
- `POST /chat/create-girl` - Create virtual companion

### Users
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `GET /users/girls` - Get user's companions
- `PUT /users/girls/:id` - Update companion
- `DELETE /users/girls/:id` - Delete companion

## Features

- 🤖 AI-powered virtual companions
- 🎨 Customizable appearance and personality
- 📹 Video generation from images
- 💬 Real-time chat with streaming
- 🔐 Google OAuth authentication
- 💰 Credit-based payment system
- 📱 Responsive design

## Tech Stack

- **Backend**: NestJS, TypeORM, PostgreSQL, Passport.js
- **Frontend**: React, TypeScript, Tailwind CSS
- **AI**: DeepSeek, Kie.ai, RunPod
- **Authentication**: JWT + Google OAuth