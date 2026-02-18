# Xanoty – Dashboard & API

Professional dashboard and backend for IMVU tools. **Discord login** for the dashboard; **no Discord bot** – API only.

- **Frontend:** React 18 + TypeScript + Vite. Dark theme, sidebar nav, Services page (Free / Plus / Premium).
- **Backend:** Express + TypeScript. IMVU API (rooms, avatar, users), Discord OAuth (login only), JWT sessions.

## Quick start

### 1. Backend (API)

```bash
cd server
cp .env.example .env
# Edit .env: set DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, JWT_SECRET, and optionally IMVU_* for IMVU features.
npm install
npm run dev
```

Runs at **http://localhost:3000**.

### 2. Discord app (for login)

1. [Discord Developer Portal](https://discord.com/developers/applications) → New Application.
2. OAuth2 → Redirects: add `http://localhost:3000/api/auth/discord/callback`.
3. Copy **Client ID** and **Client Secret** into `server/.env` as `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`.

### 3. Frontend

```bash
# from repo root
cp .env.example .env
# Set VITE_API_URL=http://localhost:3000 so login and API calls use the backend (and cookies work).
npm install
npm run dev
```

Runs at **http://localhost:5173**. Open it → sign in with Discord → you’re in.

## Env summary

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_API_URL` | root `.env` | Frontend: API base URL (e.g. `http://localhost:3000`) so cookies are sent. |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | `server/.env` | Discord OAuth for dashboard login. |
| `DISCORD_REDIRECT_URI` | `server/.env` | Must match Discord app redirect (e.g. `http://localhost:3000/api/auth/discord/callback`). |
| `FRONTEND_URL` | `server/.env` | Where to redirect after login (e.g. `http://localhost:5173`). |
| `JWT_SECRET` | `server/.env` | Session signing; use a long random string in production. |
| `IMVU_USER_ID` / `IMVU_AUTH_TOKEN` | `server/.env` | Optional; for Room List, Avatar, etc. |

## API (no Discord bot)

- `GET /api/health` – health check  
- `GET /api/me` – current user (requires Discord login cookie)  
- `GET /api/auth/discord` – redirect to Discord OAuth  
- `GET /api/auth/discord/callback` – OAuth callback (sets cookie, redirects to frontend)  
- `POST /api/auth/discord/logout` – clear session  
- `GET /api/rooms`, `GET /api/rooms/all`, `GET /api/rooms/:roomId/users`, etc.  
- `GET /api/avatar/:cid`, `POST /api/avatar/batch`, `GET /api/avatar/actions`  
- `GET /api/users/search?q=...` (returns empty without a database; add Prisma + `DATABASE_URL` to enable)

## Project layout

```
imvuweb/
├── src/                 # Vite React app
│   ├── components/
│   ├── contexts/
│   ├── lib/
│   └── pages/
├── server/              # Express API (no Discord bot)
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       └── validators/
├── package.json
└── README.md
```

## Build

```bash
npm run build          # frontend
cd server && npm run build   # backend
```

Production: set `FRONTEND_URL` and `DISCORD_REDIRECT_URI` to your real domains, use a strong `JWT_SECRET`, and serve the frontend (e.g. from the same host as the API or behind a reverse proxy with correct CORS/origin).
