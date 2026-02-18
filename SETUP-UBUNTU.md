# Full Ubuntu setup guide – Git pull, env, PostgreSQL, deploy

**For local development** (your machine), use [LOCAL.md](LOCAL.md) instead.

Use this **exact order** on Ubuntu (VPS or VM). Replace placeholders:

- **YOUR_IP_OR_DOMAIN** → e.g. `87.106.23.37` or `app.example.com` (no `https://` in FRONTEND_URL/DISCORD_REDIRECT_URI for HTTP)
- **YOUR_DB_PASSWORD** → password for the PostgreSQL user
- **YOUR_DISCORD_CLIENT_ID** / **YOUR_DISCORD_CLIENT_SECRET** → from [Discord Developer Portal](https://discord.com/developers/applications)
- **YOUR_JWT_SECRET** → long random string (32+ characters)
- **YOUR_REPO_URL** → e.g. `https://github.com/yourusername/imvunew.git`

---

## 1. Install Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

---

## 2. Install PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Create database and user (replace `YOUR_DB_PASSWORD` with a strong password):

```bash
sudo -u postgres psql -c "CREATE USER xanoty WITH PASSWORD 'YOUR_DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE xanoty OWNER xanoty;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE xanoty TO xanoty;"
```

---

## 3. Clone the project (or git pull if already cloned)

**First time – clone:**

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone YOUR_REPO_URL imvuweb
sudo chown -R $USER:$USER imvuweb
cd imvuweb
```

**Already have the repo – pull latest and install:**

```bash
cd /var/www/imvuweb
git pull
npm ci
cd server && npm ci && cd ..
```

---

## 4. Edit root `.env` (frontend)

For same-origin (app and API on one host), leave the API URL empty:

```bash
cd /var/www/imvuweb
nano .env
```

Contents:

```env
VITE_API_URL=
```

Save: `Ctrl+O`, Enter, `Ctrl+X`.

---

## 5. Edit `server/.env` (backend + database)

```bash
nano server/.env
```

**If using HTTP (e.g. IP like 87.106.23.37):**

```env
PORT=3000
NODE_ENV=production

DISCORD_CLIENT_ID=YOUR_DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET=YOUR_DISCORD_CLIENT_SECRET
DISCORD_REDIRECT_URI=http://YOUR_IP_OR_DOMAIN/api/auth/discord/callback
FRONTEND_URL=http://YOUR_IP_OR_DOMAIN

JWT_SECRET=YOUR_JWT_SECRET

DATABASE_URL=postgresql://xanoty:YOUR_DB_PASSWORD@localhost:5432/xanoty
```

**If using HTTPS (e.g. domain with SSL):**

```env
PORT=3000
NODE_ENV=production

DISCORD_CLIENT_ID=YOUR_DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET=YOUR_DISCORD_CLIENT_SECRET
DISCORD_REDIRECT_URI=https://YOUR_IP_OR_DOMAIN/api/auth/discord/callback
FRONTEND_URL=https://YOUR_IP_OR_DOMAIN

JWT_SECRET=YOUR_JWT_SECRET

DATABASE_URL=postgresql://xanoty:YOUR_DB_PASSWORD@localhost:5432/xanoty
```

Optional (see DEPLOY.md): `IMVU_USER_ID`, `IMVU_AUTH_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_ACCESS_ROLE_ID`.

Save: `Ctrl+O`, Enter, `Ctrl+X`.

---

## 6. Discord redirect URI

1. Open [Discord Developer Portal](https://discord.com/developers/applications) → your application.
2. **OAuth2** → **Redirects** → add:
   - HTTP: `http://YOUR_IP_OR_DOMAIN/api/auth/discord/callback`
   - HTTPS: `https://YOUR_IP_OR_DOMAIN/api/auth/discord/callback` (if using SSL)
3. Save.

---

## 7. Prisma – generate client and create tables

```bash
cd /var/www/imvuweb/server
npm run db:generate
npm run db:push
cd ..
```

---

## 8. Build frontend and backend

```bash
cd /var/www/imvuweb
npm run build
cd server
npm run build
cd ..
```

---

## 9. Run API with PM2

```bash
sudo npm install -g pm2
cd /var/www/imvuweb/server
pm2 start dist/server.js --name xanoty-api
pm2 save
pm2 startup
```

Run the command that `pm2 startup` prints (the line with `sudo env PATH=...`).

Check:

```bash
pm2 status
curl http://localhost:3000/api/health
```

---

## 10. Nginx – reverse proxy and static files

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/xanoty
```

Paste (replace `YOUR_IP_OR_DOMAIN` with your IP or domain):

```nginx
server {
    listen 80;
    server_name YOUR_IP_OR_DOMAIN;
    root /var/www/imvuweb/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Image logger: track clicks and serve image (must proxy to Node, not SPA)
    location /i/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Save, then:

```bash
sudo ln -sf /etc/nginx/sites-available/xanoty /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 11. Firewall (optional)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 12. Done

Open in browser: **http://YOUR_IP_OR_DOMAIN** (or https if you use SSL). Sign in with Discord.

---

## Troubleshooting: works on localhost, broken on Ubuntu

**FAQ or IMVU Accounts (or other API pages) don’t load / show errors on production**

1. **Wrong API URL in the frontend build**  
   The production build must use the same origin for API calls. On the server, before running `npm run build`, ensure the **root** `.env` has an empty API URL:
   ```bash
   cd /var/www/imvuweb
   echo 'VITE_API_URL=' > .env
   npm run build
   ```
   Then redeploy (copy new `dist/` or run your usual deploy). If you had `VITE_API_URL=http://localhost:3000` when building, the browser would try to call localhost from the user’s machine and fail.

2. **Not logged in on the production URL**  
   IMVU Accounts (and other admin/authenticated routes) need a session. Log in with Discord **on the production site** (e.g. `http://87.106.23.37`), not on localhost. The cookie is per-origin.

3. **Check what the server returns**  
   In the browser: DevTools → Network, open FAQ or IMVU Accounts, then check the failing request (e.g. `api/docs` or `api/imvu-accounts`):
   - **401** → Not logged in on this origin, or cookie not sent. Log in again on the production URL; ensure `FRONTEND_URL` in `server/.env` is exactly that URL (no trailing slash).
   - **503** → Database not configured or tables missing. Set `DATABASE_URL` in `server/.env`, run `npm run db:push` in `server/`, then `pm2 restart xanoty-api`.
   - **500** → See `pm2 logs xanoty-api` for the stack trace.

4. **`/user-lookup`, `/admin/room-scanner`, `/admin/imvu-accounts` don’t work on Ubuntu**

   These routes need the API and a valid session (admin for the two admin routes). Check:

   - **Frontend build**  
     If the app was built with `VITE_API_URL=http://localhost:3000`, the browser will call localhost from your PC and fail. On the server, set an empty API URL and rebuild:
     ```bash
     cd /var/www/imvuweb
     echo 'VITE_API_URL=' > .env
     npm run build
     ```
     Then reload the site (hard refresh or clear cache).

   - **Log in on the production URL**  
     Open **http://YOUR_IP_OR_DOMAIN** (e.g. http://87.106.23.37), click Login, and complete Discord OAuth. The session cookie is per-origin; logging in on localhost doesn’t count.

   - **Admin routes (room-scanner, imvu-accounts)**  
     Your Discord user must have the role whose ID is in `DISCORD_ADMIN_ROLE_ID` in `server/.env`. If you don’t have that role, you’ll get 403. Ensure `DISCORD_ADMIN_ROLE_ID` is set and your user has that role in the guild.

   - **Cookie not sent**  
     In DevTools → Application → Cookies, check that the site (e.g. http://87.106.23.37) has a cookie like `xanoty_session`. If not, log in again on that URL. If you use nginx and added `proxy_cookie_path` with `Secure` while the site is HTTP, remove the `Secure` part or the whole line and reload nginx.

5. **Tables “already in sync” but app still says table missing**  
   Force-recreate tables (this **wipes DB data**):
   ```bash
   cd /var/www/imvuweb/server
   npx prisma db push --force-reset
   pm2 restart xanoty-api
   ```
   Only use this if you’re sure the DB can be reset.

---

## Updating after `git pull`

```bash
cd /var/www/imvuweb
git fetch origin
git reset --hard origin/main
npm ci
cd server && npm ci && cd ..
npm run build
cd server && npm run build && pm2 restart xanoty-api
cd ..
```

- **If you get "Your local changes would be overwritten by merge"** (e.g. `package-lock.json` changed on the server): use `git fetch origin` and `git reset --hard origin/main` as above so the server always matches the repo; then run the rest. Your `server/.env` is not in git, so it won’t be touched.
- Use `npm run db:push` (in `server/`) if the Prisma schema changed; otherwise skip it.
- If only frontend or API code changed, you can skip `npm run db:push`.
