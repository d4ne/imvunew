# Running and hosting Xanoty (imvuweb)

## 1. Running locally

### Requirements

- **Node.js** 18+ (20 LTS recommended)
- **npm** 9+

### One-time setup

```bash
# From project root
npm install
cd server && npm install && cd ..
```

### Environment files

**Root `.env`** (frontend – used at build time):

```env
# Development: API on port 3000
VITE_API_URL=http://localhost:3000
```

**`server/.env`** (backend – copy from `server/.env.example` if you have one, or use this):

- `PORT=3000`
- `NODE_ENV=development`
- `IMVU_USER_ID`, `IMVU_AUTH_TOKEN` – required for IMVU API (or set via headers)
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` – from [Discord Developer Portal](https://discord.com/developers/applications)
- `DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback`
- `FRONTEND_URL=http://localhost:5173`
- `JWT_SECRET` – at least 32 characters (use a long random string in production)
- **Role-gated access:** `DISCORD_GUILD_ID`, `DISCORD_ACCESS_ROLE_ID` (see below)
- **Login webhook (optional):** `DISCORD_LOGIN_WEBHOOK_URL` – full Discord webhook URL; the app posts a short “user logged in” embed when someone signs in

In Discord Developer Portal → OAuth2 → Redirects, add exactly:

`http://localhost:3000/api/auth/discord/callback`

### Run in development

**Terminal 1 – API:**

```bash
cd server
npm run dev
```

**Terminal 2 – Frontend:**

```bash
npm run dev
```

- App: http://localhost:5173  
- API: http://localhost:3000  
- Vite proxies `/api` to the backend, so login and API calls work.

### Role-gated access (Discord server + role)

Only users who are in a specific Discord server **and** have a specific role can log in. When both IDs are set, the app requests the `guilds.members.read` OAuth scope and checks the user’s roles after they authorize.

**Step 1 – Enable Developer Mode (required to see IDs)**  
- Open Discord (desktop or web).  
- Click the **gear** next to your username (User Settings).  
- Go to **App Settings** → **Advanced**.  
- Turn **Developer Mode** **On**.

**Step 2 – Get `DISCORD_GUILD_ID` (your server ID)**  
- In the left sidebar, **right‑click the icon of your server** (the one whose members should be gated).  
- Click **Copy Server ID**.  
- That long number (e.g. `1234567890123456789`) is `DISCORD_GUILD_ID`.

**Step 3 – Get `DISCORD_ACCESS_ROLE_ID` (the role that gets access)**  
- Click your server name at the top → **Server Settings**.  
- In the left menu, open **Roles**.  
- Either:
  - **Right‑click the role** that should have access → **Copy Role ID**, or  
  - **Click the role** → scroll down; some clients show a “Role ID” field you can copy.  
- That number is `DISCORD_ACCESS_ROLE_ID`.

**Step 4 – Put them in `server/.env`**  
- Open `server/.env` and set (use your real numbers):

  ```env
  DISCORD_GUILD_ID=1234567890123456789
  DISCORD_ACCESS_ROLE_ID=9876543210987654321
  ```

- Restart the server so it picks up the new env vars.

**Notes**  
- No bot is required. The app uses OAuth2 and will request `guilds.members.read` when both vars are set.  
- The user must be a **member** of that server; only users who **have that role** will pass. Others are redirected to login with `?error=access_denied`.

---

## 2. Hosting on Ubuntu

### Assumptions

- Ubuntu 22.04 (or similar)
- Domain (e.g. `app.example.com`) pointing to the server
- You will use **nginx** as reverse proxy and **PM2** to run the Node API

### Step 1: Install Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # should be v20.x
```

### Step 2: Clone/copy project and install deps

```bash
# e.g. clone or rsync/scp your project to /var/www/imvuweb (or your path)
cd /var/www/imvuweb
npm ci
cd server && npm ci && cd ..
```

### Step 3: Build frontend and backend

Set the API URL for production. If the site and API are on the **same domain** (recommended), use an empty value so the app uses relative URLs (e.g. `/api/me`):

```bash
# Root .env for production build
echo 'VITE_API_URL=' > .env
npm run build
```

This creates `dist/` with the static frontend.

Build the server:

```bash
cd server
npm run build
cd ..
```

### Step 4: Production env for the server

Create or edit `server/.env` on the server (do **not** commit secrets):

```env
PORT=3000
NODE_ENV=production

# IMVU (if you use those endpoints)
IMVU_USER_ID=...
IMVU_AUTH_TOKEN=...
IMVU_API_BASE_URL=http://client-dynamic.imvu.com

# Discord OAuth – use your production URL
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_REDIRECT_URI=https://app.example.com/api/auth/discord/callback
FRONTEND_URL=https://app.example.com

# Required in production: long random string (min 32 chars)
JWT_SECRET=your-very-long-random-secret-at-least-32-chars

# Role-gated access: only users in this server with this role can log in (see “Role-gated access” in DEPLOY.md)
DISCORD_GUILD_ID=1234567890123456789
DISCORD_ACCESS_ROLE_ID=9876543210987654321
```

In **Discord Developer Portal** → OAuth2 → Redirects, add:

`https://app.example.com/api/auth/discord/callback`

(Replace `app.example.com` with your real domain.)

### Step 5: Run API with PM2

```bash
sudo npm install -g pm2
cd /var/www/imvuweb/server
pm2 start dist/server.js --name xanoty-api
pm2 save
pm2 startup   # follow the command it prints to enable on boot
```

Check:

```bash
pm2 status
curl http://localhost:3000/api/health
```

### Step 6: Nginx as reverse proxy

Install nginx:

```bash
sudo apt update
sudo apt install nginx -y
```

Create a site config (replace `app.example.com` and path):

```bash
sudo nano /etc/nginx/sites-available/xanoty
```

Paste (adjust `server_name` and `root` if needed):

```nginx
server {
    listen 80;
    server_name app.example.com;
    root /var/www/imvuweb/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cookie_path / "/; HTTPOnly; Secure; SameSite=Lax";
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/xanoty /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d app.example.com
```

Use the prompts to get a certificate and redirect HTTP → HTTPS. Certbot will update your nginx config.

After that, ensure your production `.env` uses `https://` in `DISCORD_REDIRECT_URI` and `FRONTEND_URL`, and that the same redirect URL is in the Discord Developer Portal.

### Step 8: Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Updating the app (pull on VPS)

After you push changes from your machine, on the VPS:

```bash
cd /var/www/imvuweb   # or your project path

git pull

# Reinstall deps if package.json / server/package.json changed
npm ci
cd server && npm ci && cd ..

# Rebuild frontend (root .env already has VITE_API_URL for prod)
npm run build

# Rebuild and restart the API
cd server
npm run build
pm2 restart xanoty-api
cd ..
```

If you didn’t change dependencies, you can skip the `npm ci` steps and only run `npm run build`, `cd server && npm run build`, and `pm2 restart xanoty-api`.

---

## Checklist

| Item | Local | Ubuntu production |
|------|--------|-------------------|
| Node 18+ | ✓ | ✓ (Node 20 LTS) |
| `npm install` (root + server) | ✓ | ✓ (`npm ci`) |
| Root `.env` with `VITE_API_URL` | `http://localhost:3000` | `` (empty for same-origin) |
| `server/.env` with Discord, JWT, etc. | ✓ | ✓ (use `https://` URLs) |
| Discord redirect in Dev Portal | `http://localhost:3000/...` | `https://app.example.com/...` |
| Role-gated access | `DISCORD_GUILD_ID` + `DISCORD_ACCESS_ROLE_ID` in `server/.env` | same |
| `npm run build` (frontend) | optional | ✓ |
| `cd server && npm run build` | optional | ✓ |
| Run API | `npm run dev` in server | PM2 `dist/server.js` |
| Serve frontend | Vite dev server | nginx `root` = `dist/` |
| Proxy `/api` to Node | Vite proxy | nginx `location /api` |
| SSL | — | certbot + nginx |

---

## Optional: serve frontend from Express

If you prefer not to use nginx for static files, you can serve the Vite build from Express in production and proxy through nginx only to a single Node port (or expose Node directly). That would require adding something like this in `server/src/app.ts` (only when `NODE_ENV === 'production'` and a `dist` path exists):

- `app.use(express.static(path.join(process.cwd(), '..', 'dist')));`
- and a catch-all `app.get('*', ...)` that sends `index.html` for non-API routes.

The nginx setup above is the recommended approach so nginx handles static files and only `/api` hits Node.
