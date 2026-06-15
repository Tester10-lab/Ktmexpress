# Ktmexpress Logistics — Production Setup

## Stack
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Frontend**: React (Vite), TailwindCSS, Axios
- **Auth**: JWT (access token 15m + refresh token 7d via httpOnly cookie)

## Quick Start (Local Dev)
```bash
# Backend
cd backend && cp .env.example .env   # Fill in your values
npm install && npm run dev

# Frontend
cd frontend && cp .env.example .env  # Fill in VITE_API_URL
npm install && npm run dev
```

## Cloud Deployment Options

### Option A — Render (Backend) + Vercel (Frontend) [Recommended for beginners]
1. Push to GitHub
2. Connect backend repo to Render → set env vars from .env.example
3. Connect frontend repo to Vercel → set VITE_API_URL to your Render URL

### Option B — VPS/Ubuntu with Docker
```bash
git clone <repo> && cd ktmexpress
cp backend/.env.example backend/.env   # Fill values
docker-compose up -d --build
```

### Option C — Railway
1. Push to GitHub
2. Import project in Railway
3. Add env vars from .env.example
4. Deploy — Railway auto-detects Node.js

## Health Check
GET /api/health → returns 200 OK with uptime and environment

## Environment Variables
See `backend/.env.example` and `frontend/.env.example`
