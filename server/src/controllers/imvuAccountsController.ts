import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { getPrisma } from '../lib/db.js';
import axios from 'axios';

function getImvuAccountDb() {
  const db = getPrisma();
  if (!db) return { db: null, error: 'Database not configured' };
  if (typeof (db as { imvuAccount?: unknown }).imvuAccount === 'undefined') {
    return { db: null, error: 'Prisma client missing imvuAccount model. Run: npx prisma generate' };
  }
  return { db, error: null };
}

/** GET /api/imvu-accounts – list all IMVU accounts (admin) */
export const list = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const { db, error } = getImvuAccountDb();
  if (!db) {
    res.status(503).json({ success: false, error: { message: error ?? 'Database not configured' } });
    return;
  }
  const accounts = await db.imvuAccount.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      label: true,
      email: true,
      imvuUserId: true,
      imvuAuthToken: true,
      imvuCookie: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  res.status(200).json({ success: true, accounts });
});

/** POST /api/imvu-accounts – create account (admin) */
export const create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { db, error } = getImvuAccountDb();
  if (!db) {
    res.status(503).json({ success: false, error: { message: error ?? 'Database not configured' } });
    return;
  }
  const body = req.body as { label?: string; email?: string; imvuUserId?: string; imvuAuthToken?: string; imvuCookie?: string; isActive?: boolean };
  const label = (body.label ?? '').trim();
  if (!label) {
    res.status(400).json({ success: false, error: { message: 'label is required' } });
    return;
  }
  if (body.isActive === true) {
    await db.imvuAccount.updateMany({ data: { isActive: false } });
  }
  const account = await db.imvuAccount.create({
    data: {
      label,
      email: (body.email ?? '').trim() || undefined,
      imvuUserId: (body.imvuUserId ?? '').trim() || undefined,
      imvuAuthToken: (body.imvuAuthToken ?? '').trim() || undefined,
      imvuCookie: (body.imvuCookie ?? '').trim() || undefined,
      isActive: body.isActive === true,
    },
  });
  res.status(201).json({ success: true, account });
});

/** PATCH /api/imvu-accounts/:id – update account (admin) */
export const update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { db, error } = getImvuAccountDb();
  if (!db) {
    res.status(503).json({ success: false, error: { message: error ?? 'Database not configured' } });
    return;
  }
  const id = (req.params.id ?? '').trim();
  if (!id) {
    res.status(400).json({ success: false, error: { message: 'id required' } });
    return;
  }
  const body = req.body as { label?: string; email?: string; imvuUserId?: string; imvuAuthToken?: string; imvuCookie?: string; isActive?: boolean };
  if (body.isActive === true) {
    await db.imvuAccount.updateMany({ data: { isActive: false } });
  }
  const account = await db.imvuAccount.update({
    where: { id },
    data: {
      ...(body.label !== undefined && { label: String(body.label).trim() || undefined }),
      ...(body.email !== undefined && { email: String(body.email).trim() || null }),
      ...(body.imvuUserId !== undefined && { imvuUserId: String(body.imvuUserId).trim() || null }),
      ...(body.imvuAuthToken !== undefined && { imvuAuthToken: String(body.imvuAuthToken).trim() || null }),
      ...(body.imvuCookie !== undefined && { imvuCookie: String(body.imvuCookie).trim() || null }),
      ...(body.isActive !== undefined && { isActive: body.isActive === true }),
    },
  });
  res.status(200).json({ success: true, account });
});

/** DELETE /api/imvu-accounts/:id – delete account (admin) */
export const remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { db, error } = getImvuAccountDb();
  if (!db) {
    res.status(503).json({ success: false, error: { message: error ?? 'Database not configured' } });
    return;
  }
  const id = (req.params.id ?? '').trim();
  if (!id) {
    res.status(400).json({ success: false, error: { message: 'id required' } });
    return;
  }
  await db.imvuAccount.delete({ where: { id } });
  res.status(200).json({ success: true });
});

/** POST /api/imvu-accounts/try-login – POST to api.imvu.com/login (same headers/body as browser), return cookies (admin) */
export const tryLogin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const body = req.body as { username?: string; password?: string };
  const username = (body.username ?? '').trim();
  const password = body.password ?? '';
  if (!username || !password) {
    res.status(400).json({ success: false, error: { message: 'username and password are required' } });
    return;
  }

  const loginUrl = 'https://api.imvu.com/login';
  const results: { url: string; status?: number; cookies: string[]; cookieString?: string; body?: unknown; error?: string }[] = [];

  try {
    const ax = await axios({
      method: 'POST',
      url: loginUrl,
      timeout: 10000,
      maxRedirects: 0,
      validateStatus: () => true,
      headers: {
        'Accept': 'application/json; charset=utf-8',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-imvu-application': 'welcome/1',
        'Origin': 'https://secure.imvu.com',
        'Referer': 'https://secure.imvu.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
      },
      data: { username, password, gdpr_cookie_acceptance: true },
    });
    const setCookie = ax.headers['set-cookie'];
    const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
    const cookieString = cookies.length ? cookies.map((c: string) => c.split(';')[0].trim()).join('; ') : undefined;
    results.push({
      url: loginUrl,
      status: ax.status,
      cookies,
      cookieString,
      body: ax.data,
    });

    const message = ax.status === 201
      ? 'Login succeeded (201). Copy "cookieString" or "cookies" into the account form below and set as active.'
      : 'Login returned status ' + ax.status + '. Check credentials or use "Get auth from browser" if needed.';

    res.status(200).json({ success: true, message, results });
  } catch (err: unknown) {
    results.push({
      url: loginUrl,
      cookies: [],
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(200).json({
      success: true,
      message: 'Request failed. Use "Get auth from browser" to copy credentials from a logged-in IMVU tab.',
      results,
    });
  }
});
