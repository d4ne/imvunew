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

## Updating after `git pull`

```bash
cd /var/www/imvuweb
git pull
npm ci
cd server && npm ci && cd ..
npm run build
cd server && npm run build && npm run db:push && pm2 restart xanoty-api
cd ..
```

- Use `npm run db:push` if the Prisma schema (e.g. `server/prisma/schema.prisma`) changed; otherwise you can skip it.
- If only frontend or API code changed, you can skip `npm run db:push`.
