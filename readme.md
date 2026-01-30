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

The application uses PostgreSQL with Docker. The database is automatically created when you run `docker-compose up`.

For local development without Docker:

```bash
# Install PostgreSQL and create database
createdb eva_db

# Run TypeORM migrations (if needed)
cd backend
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
docker compose up --build
```

This will start:
- PostgreSQL database on port 5432 (internal)
- Backend API on port 3001 (localhost only)
- Frontend on port 8080 (localhost only)

## Production Deployment

### 1. Server Requirements

- **Ubuntu/Debian** or similar Linux distribution
- **Docker** and **Docker Compose** installed
- **Domain name** pointing to your server
- **SSL certificate** (Let's Encrypt recommended)

### 2. Server Setup

```bash
# Clone repository
git clone https://github.com/your-username/eva.git
cd eva

# Copy environment file
cp .env.example .env

# Edit .env with your production values
nano .env
```

### 3. Environment Variables for Production

```env
# Database
DB_HOST=eva-db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_secure_db_password_here
DB_DATABASE=eva_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# AI APIs
DEEPSEEK_API_KEY=your_deepseek_api_key_here
KIE_API_KEY=your_kie_api_key_here
RUNPOD_API_KEY=your_runpod_api_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback

# Production settings
NODE_ENV=production
PORT=3000
```

### 4. Deploy with Docker

```bash
# Build and start production containers
docker compose -f docker-compose.prod.yml up --build -d

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Run database migrations (if needed)
docker compose -f docker-compose.prod.yml exec backend npm run migration:run
```

### 5. Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend (EVA on port 8080)
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API (EVA on port 3001)
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # EVA Backend routes
    location /auth/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /users/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /chat/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6. SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Certificates will be auto-renewed
```

### 7. Monitoring

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend

# Restart services
docker compose -f docker-compose.prod.yml restart
```

### 8. Backup

```bash
# Backup database
docker compose -f docker-compose.prod.yml exec db pg_dump -U postgres eva_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup uploads
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz backend/uploads/
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