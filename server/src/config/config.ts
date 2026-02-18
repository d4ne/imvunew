import dotenv from 'dotenv';
import { AppConfig } from '../types/index.js';

dotenv.config();

const validateEnv = (): void => {
  const required = ['IMVU_USER_ID', 'IMVU_AUTH_TOKEN'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`Warning: Missing env: ${missing.join(', ')}. Set via headers/query if needed.`);
  }
};

validateEnv();

const config: AppConfig = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  imvu: {
    baseUrl: process.env.IMVU_API_BASE_URL || 'http://client-dynamic.imvu.com',
    userId: process.env.IMVU_USER_ID || '',
    authToken: process.env.IMVU_AUTH_TOKEN || '',
    cookie: process.env.IMVU_COOKIE || '',
    version: '551.6',
    os: 'Windows',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    // Must match exactly what you add in Discord Developer Portal → OAuth2 → Redirects (no trailing slash)
    redirectUri: (process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/discord/callback').replace(/\/+$/, ''),
    frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, ''),
    // Optional: require Discord role to log in. Bot must be in the guild. Enable guilds.members.read in Discord Portal.
    guildId: process.env.DISCORD_GUILD_ID || undefined,
    accessRoleId: process.env.DISCORD_ACCESS_ROLE_ID || undefined,
    loginWebhookUrl: process.env.DISCORD_LOGIN_WEBHOOK_URL || undefined,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    cookieName: 'xanoty_session',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  database: process.env.DATABASE_URL ? { url: process.env.DATABASE_URL } : undefined,
};

export default config;
