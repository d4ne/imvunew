import { Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import asyncHandler from '../middleware/asyncHandler.js';
import logger from '../config/logger.js';
import { JwtPayload } from '../types/index.js';

const DISCORD_API = 'https://discord.com/api/v10';

export const redirectToDiscord = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const { clientId, redirectUri } = config.discord;
  if (!clientId || !redirectUri) {
    res.status(500).json({ success: false, error: { message: 'Discord OAuth not configured' } });
    return;
  }
  const scopes = ['identify', 'email'];
  if (config.discord.guildId && config.discord.accessRoleId) {
    scopes.push('guilds.members.read');
  }
  const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes.join('%20')}`;
  res.redirect(url);
});

export const discordCallback = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { code } = req.query;
  const { clientId, clientSecret, redirectUri, frontendUrl } = config.discord;
  const { secret, cookieName, maxAge } = config.jwt;

  if (!code || typeof code !== 'string') {
    res.redirect(`${frontendUrl}/login?error=missing_code`);
    return;
  }
  if (!clientId || !clientSecret || !redirectUri) {
    res.redirect(`${frontendUrl}/login?error=server_config`);
    return;
  }

  const form = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const tokenRes = await axios.post(
    `${DISCORD_API}/oauth2/token`,
    form.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  ).catch((e) => {
    logger.error(`Discord token exchange failed: ${e.response?.data || e.message}`);
    return null;
  });

  if (!tokenRes?.data?.access_token) {
    res.redirect(`${frontendUrl}/login?error=token_exchange`);
    return;
  }

  const userRes = await axios.get(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
  }).catch(() => null);

  if (!userRes?.data?.id) {
    res.redirect(`${frontendUrl}/login?error=user_fetch`);
    return;
  }

  const discordUser = userRes.data;
  const accessToken = tokenRes.data.access_token as string;

  // Require Discord role if configured (guild + role ID). Bot must be in the guild.
  const { guildId, accessRoleId } = config.discord;
  if (guildId && accessRoleId) {
    const memberRes = await axios.get(
      `${DISCORD_API}/users/@me/guilds/${guildId}/member`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    ).catch((e) => {
      logger.warn(`Discord guild member fetch failed: ${e.response?.status} ${e.response?.data?.message || e.message}`);
      return null;
    });
    const roles: string[] = memberRes?.data?.roles ?? [];
    if (!roles.includes(accessRoleId)) {
      logger.info(`Login denied: user ${discordUser.id} missing required role ${accessRoleId}`);
      res.redirect(`${frontendUrl}/login?error=access_denied`);
      return;
    }
  }
  const avatarHash = discordUser.avatar;
  const avatarUrl = avatarHash
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${avatarHash}.png`
    : undefined;

  const payload: JwtPayload = {
    sub: discordUser.id,
    username: discordUser.username || 'User',
    avatar: avatarUrl,
    discriminator: discordUser.discriminator,
    tier: 'free',
  };

  const token = jwt.sign(payload, secret, { expiresIn: maxAge });
  const isProduction = config.server.env === 'production';
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: maxAge * 1000,
    path: '/',
  });

  // Notify Discord webhook on login (fire-and-forget; don't block redirect)
  const webhookUrl = config.discord.loginWebhookUrl;
  if (webhookUrl) {
    const displayName = discordUser.global_name || discordUser.username || 'User';
    const username = discordUser.username || 'User';
    axios
      .post(webhookUrl, {
        content: null,
        embeds: [
          {
            title: '🔐 User logged in',
            color: 0x5865f2,
            fields: [
              { name: 'Username', value: username, inline: true },
              { name: 'Display name', value: displayName, inline: true },
              { name: 'Discord ID', value: discordUser.id, inline: false },
            ],
            thumbnail: avatarUrl ? { url: avatarUrl } : undefined,
            footer: { text: 'Xanoty' },
            timestamp: new Date().toISOString(),
          },
        ],
      })
      .catch((e) => logger.warn(`Login webhook failed: ${e.response?.data?.message || e.message}`));
  }

  const separator = frontendUrl.includes('?') ? '&' : '?';
  res.redirect(`${frontendUrl}${separator}auth=callback`);
});

export const logout = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie(config.jwt.cookieName, { path: '/' });
  res.status(200).json({ success: true });
});
