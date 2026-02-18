import { getPrisma } from '../lib/db.js';

export interface ImvuAccountCredentials {
  userId: string;
  authToken: string;
  cookie: string;
}

/** Get the active IMVU account from DB (isActive = true). Returns null if none or no DB. */
export async function getActiveImvuAccount(): Promise<{
  id: string;
  label: string;
  imvuUserId: string | null;
  imvuAuthToken: string | null;
  imvuCookie: string | null;
} | null> {
  const db = getPrisma();
  if (!db || typeof (db as { imvuAccount?: unknown }).imvuAccount === 'undefined') return null;
  const account = await db.imvuAccount.findFirst({
    where: { isActive: true },
    select: {
      id: true,
      label: true,
      imvuUserId: true,
      imvuAuthToken: true,
      imvuCookie: true,
    },
  });
  return account;
}

/** Get credentials for the scanner: active account from DB, or null (caller uses env). */
export async function getActiveImvuCredentials(): Promise<ImvuAccountCredentials | null> {
  const account = await getActiveImvuAccount();
  if (!account?.imvuUserId?.trim() || !account?.imvuAuthToken?.trim()) return null;
  return {
    userId: account.imvuUserId.trim(),
    authToken: account.imvuAuthToken.trim(),
    cookie: account.imvuCookie?.trim() ?? '',
  };
}
