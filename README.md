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

## GitHub

This repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` that:

- Installs backend dependencies and runs backend tests (`npm test`).
- Installs frontend dependencies and builds the frontend (`npm run build`).

To enable CI and host the project on GitHub:

1. Create a new GitHub repository and push this project to it.
2. In the repository settings, enable GitHub Actions (it's enabled by default).
3. Add the required environment secrets (if needed) in the repository Settings → Secrets for the backend tests or deployments.

Quick commands to get started locally (from repo root):

```powershell
# Start both services via docker-compose
npm run docker:up

# Start local development (requires installing dev deps at root first):
npm install
npm run dev
```

## MongoDB Atlas

This project supports MongoDB Atlas out of the box. To use Atlas as your production database:

1. Create a free cluster at https://www.mongodb.com/cloud/atlas and follow the onboarding steps.
2. In Atlas, create a database user (give it a strong password) and note the username/password.
3. Under "Network Access" add an IP access list entry; for CI you can temporarily allow `0.0.0.0/0` or restrict to specific IPs.
4. Click "Connect" → "Connect your application" and copy the connection string (SRV) — it looks like:

	mongodb+srv://<user>:<password>@cluster0.abcd123.mongodb.net/ktmexpress?retryWrites=true&w=majority

5. Locally, set `MONGO_URI` in `backend/.env` using that connection string.

	Example `backend/.env` snippet:

	MONGO_URI=mongodb+srv://atlasUser:yourPassword@cluster0.abcd123.mongodb.net/ktmexpress?retryWrites=true&w=majority

6. For GitHub Actions, add the `MONGO_URI` value as a repository Secret named `MONGO_URI` (Repository Settings → Secrets → Actions). The CI workflow reads this secret to run backend tests.

Notes:
- If you prefer not to expose your Atlas cluster to the public internet, consider using a CI job that runs tests against `mongodb-memory-server` (already included in devDependencies) or configure a private network/proxy.
- The backend already reads `process.env.MONGO_URI` in `backend/config/db.js`.

