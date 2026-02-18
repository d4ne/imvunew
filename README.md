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
| `DATABASE_URL` | `server/.env` | Optional; for Blacklist and future features. See [Database](#database) below. |

## Database

The app uses **Prisma** with **PostgreSQL** (recommended) or **SQLite** for storing data like the **Blacklist**.

- **PostgreSQL** (recommended for production): robust, good for multiple features later.  
  - On Ubuntu: `sudo apt install postgresql`, create a DB and user, then set  
    `DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/xanoty"` in `server/.env`.  
  - Run once: `cd server && npm run db:generate && npm run db:push`.
- **SQLite** (easiest, single file): no separate server.  
  - In `server/prisma/schema.prisma` set `provider = "sqlite"` and `url = "file:./dev.db"`.  
  - Set `DATABASE_URL="file:./dev.db"` (or leave Prisma’s default).  
  - Run: `cd server && npm run db:generate && npm run db:push`.

Without `DATABASE_URL`, the app still runs; Blacklist API returns 503 until a database is configured.

## API (no Discord bot)

- `GET /api/health` – health check  
- `GET /api/me` – current user (requires Discord login cookie)  
- `GET /api/auth/discord` – redirect to Discord OAuth  
- `GET /api/auth/discord/callback` – OAuth callback (sets cookie, redirects to frontend)  
- `POST /api/auth/discord/logout` – clear session  
- `GET /api/rooms`, `GET /api/rooms/all`, `GET /api/rooms/:roomId/users`, etc.  
- `GET /api/avatar/:cid`, `POST /api/avatar/batch`, `GET /api/avatar/actions`  
- `GET /api/users/search?q=...` (returns empty without a database; add Prisma + `DATABASE_URL` to enable)
- `GET /api/blacklist` – list blacklist entries (auth required)
- `POST /api/blacklist` – add entry `{ "identifier": "username", "reason": "optional" }` (auth required)
- `DELETE /api/blacklist/:id` – remove entry (auth required)
- `GET /api/blacklist/check?identifier=...` – check if identifier is blacklisted (no auth)

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

## Troubleshooting

- **Cross-Origin-Opener-Policy (COOP) warning in console**  
  The server does not send COOP when it would be ignored (e.g. over plain HTTP from a non-localhost origin). To avoid the warning, use **HTTPS** or open the app from **localhost**. For production, serve over HTTPS.

- **`api/me` returns 401 (Unauthorized)**  
  This is normal when you are **not logged in**. The app treats it as “no user” and shows the login flow. If you have already signed in with Discord and still see 401, ensure `VITE_API_URL` in the frontend `.env` matches the API origin (e.g. `http://localhost:3000`) so the session cookie is sent, and that `FRONTEND_URL` in `server/.env` matches where the frontend runs (e.g. `http://localhost:5173`) for CORS and redirects.

## Build

```bash
npm run build          # frontend
cd server && npm run build   # backend
```

Production: set `FRONTEND_URL` and `DISCORD_REDIRECT_URI` to your real domains, use a strong `JWT_SECRET`, and serve the frontend (e.g. from the same host as the API or behind a reverse proxy with correct CORS/origin).
