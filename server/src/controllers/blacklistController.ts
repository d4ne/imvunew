import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { getPrisma } from '../lib/db.js';

export const listBlacklist = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const db = getPrisma();
  if (!db) {
    res.status(503).json({
      success: false,
      error: { message: 'Database not configured. Set DATABASE_URL and run db:push.' },
    });
    return;
  }
  const entries = await db.blacklistEntry.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({
    success: true,
    blacklist: entries.map((e) => ({
      id: e.id,
      identifier: e.identifier,
      reason: e.reason,
      addedById: e.addedById,
      createdAt: e.createdAt.toISOString(),
    })),
  });
});

export const addToBlacklist = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const db = getPrisma();
  if (!db) {
    res.status(503).json({
      success: false,
      error: { message: 'Database not configured. Set DATABASE_URL and run db:push.' },
    });
    return;
  }
  const identifier = (req.body?.identifier ?? req.query?.identifier) as string | undefined;
  const reason = (req.body?.reason ?? req.query?.reason) as string | undefined;
  const trimmed = identifier?.trim();
  if (!trimmed) {
    res.status(400).json({
      success: false,
      error: { message: 'identifier is required' },
    });
    return;
  }
  const addedById = req.user?.sub ?? null;
  const entry = await db.blacklistEntry.upsert({
    where: { identifier: trimmed },
    create: { identifier: trimmed, reason: reason?.trim() || null, addedById },
    update: { reason: reason?.trim() || null, addedById },
  });
  res.status(201).json({
    success: true,
    entry: {
      id: entry.id,
      identifier: entry.identifier,
      reason: entry.reason,
      addedById: entry.addedById,
      createdAt: entry.createdAt.toISOString(),
    },
  });
});

export const removeFromBlacklist = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const db = getPrisma();
  if (!db) {
    res.status(503).json({
      success: false,
      error: { message: 'Database not configured. Set DATABASE_URL and run db:push.' },
    });
    return;
  }
  const id = req.params.id as string;
  if (!id) {
    res.status(400).json({ success: false, error: { message: 'id is required' } });
    return;
  }
  await db.blacklistEntry.deleteMany({ where: { id } });
  res.status(200).json({ success: true, removed: true });
});

/** Check if an identifier (username/cid) is blacklisted. No auth required if you want public check; optionally require auth. */
export const checkBlacklist = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const db = getPrisma();
  if (!db) {
    res.status(200).json({ success: true, blacklisted: false });
    return;
  }
  const identifier = (req.query?.identifier ?? req.query?.q) as string | undefined;
  const trimmed = identifier?.trim();
  if (!trimmed) {
    res.status(400).json({
      success: false,
      error: { message: 'identifier or q query is required' },
    });
    return;
  }
  const entry = await db.blacklistEntry.findUnique({
    where: { identifier: trimmed },
  });
  res.status(200).json({
    success: true,
    blacklisted: !!entry,
    entry: entry
      ? {
          id: entry.id,
          identifier: entry.identifier,
          reason: entry.reason,
          createdAt: entry.createdAt.toISOString(),
        }
      : null,
  });
});
