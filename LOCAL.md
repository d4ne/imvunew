# Local development setup

Use this when developing on your machine (Windows, macOS, or Linux). For deploying on Ubuntu (VPS), see [SETUP-UBUNTU.md](SETUP-UBUNTU.md).

---

## 1. Clone and install

```bash
git clone <your-repo-url> imvuweb
cd imvuweb
npm install
cd server && npm install && cd ..
```

---

## 2. Environment – root (frontend)

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Point to your local API so login and API calls work
VITE_API_URL=http://localhost:3000
```

---

## 3. Environment – server (backend)

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with **local** values:

```env
PORT=3000
NODE_ENV=development

DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback
FRONTEND_URL=http://localhost:5173

JWT_SECRET=use-a-long-random-string-at-least-32-chars

# Optional: for Blacklist, Image Logger, etc.
# DATABASE_URL=postgresql://user:pass@localhost:5432/xanoty
# Or SQLite: DATABASE_URL=file:./dev.db (and set provider = "sqlite" in prisma/schema.prisma)
DATABASE_URL=
```

**Discord:** In [Developer Portal](https://discord.com/developers/applications) → your app → OAuth2 → Redirects, add:

`http://localhost:3000/api/auth/discord/callback`

Optional: set `DISCORD_GUILD_ID` and `DISCORD_ACCESS_ROLE_ID` for role-gated login; set `DISCORD_ADMIN_ROLE_ID` for admin features (Blacklist).

---

## 4. Database (optional, for Blacklist / Image Logger)

If you use a database locally:

```bash
cd server
npx prisma generate
npx prisma db push
cd ..
```

Leave `DATABASE_URL` unset if you don’t need Blacklist or Image Logger.

---

## 5. Run locally

**Terminal 1 – API:**

```bash
cd server
npm run dev
```

**Terminal 2 – Frontend:**

```bash
npm run dev
```

- Frontend: **http://localhost:5173**
- API: **http://localhost:3000**

Open the app, sign in with Discord, and use the dashboard.

---

## 6. Scripts summary

| Command        | Where   | Purpose                |
|----------------|---------|------------------------|
| `npm run dev`  | root    | Start Vite frontend    |
| `npm run build`| root    | Build frontend to `dist/` |
| `npm run dev`  | server  | Start Express API      |
| `npm run build`| server  | Compile TypeScript     |
| `npx prisma db:push` | server | Apply schema to DB |

---

## Differences from Ubuntu (production)

| Item           | Local development      | Ubuntu (production)        |
|----------------|------------------------|----------------------------|
| Frontend URL   | http://localhost:5173  | https://your-domain or IP  |
| API URL        | http://localhost:3000  | Same origin (e.g. /api)    |
| Root `.env`    | `VITE_API_URL=http://localhost:3000` | `VITE_API_URL=` (empty)   |
| Server `.env`  | localhost redirect/FRONTEND | Production URL, strong JWT |
| Run            | Two terminals (dev)    | PM2 + nginx, single build |
