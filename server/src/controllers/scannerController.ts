import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import * as scannerService from '../services/scannerService.js';

/** POST /api/room-scanner/scan – trigger a scan (admin) */
export const triggerScan = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  if (scannerService.isCurrentlyScanning()) {
    res.status(409).json({ success: false, error: { message: 'A scan is already in progress' } });
    return;
  }
  scannerService.runScan().catch((err) => {
    console.error('Scan error:', err);
  });
  res.status(202).json({ success: true, message: 'Scan started' });
});

/** GET /api/room-scanner/scan/status – current scan progress */
export const getScanProgress = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const progress = scannerService.getScanProgress();
  res.status(200).json({
    success: true,
    isScanning: scannerService.isCurrentlyScanning(),
    progress: progress ?? undefined,
  });
});

/** GET /api/room-scanner/scan/history – list of past scans */
export const getScanHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 50));
  const history = await scannerService.getScanHistory(limit);
  res.status(200).json({ success: true, count: history.length, data: history });
});

function formatUserHistoryResponse(user: Awaited<ReturnType<typeof scannerService.getUserHistory>>) {
  if (!user) return null;
  const byRoom = new Map<string, { roomId: string; roomName: string | null; visitCount: number; lastVisit: Date }>();
  for (const v of user.roomVisits) {
    const key = v.room.roomId;
    const existing = byRoom.get(key);
    if (!existing) {
      byRoom.set(key, {
        roomId: v.room.roomId,
        roomName: v.room.roomName,
        visitCount: 1,
        lastVisit: v.seenAt,
      });
    } else {
      existing.visitCount += 1;
      if (v.seenAt > existing.lastVisit) existing.lastVisit = v.seenAt;
    }
  }
  return {
    user: {
      cid: user.cid,
      username: user.username,
      avatarName: user.avatarName,
      lastSeen: user.lastSeen,
      firstSeen: user.createdAt,
    },
    totalVisits: user.roomVisits.length,
    uniqueRooms: byRoom.size,
    roomsVisited: Array.from(byRoom.values()),
    recentVisits: user.roomVisits.slice(0, 50).map((v) => ({
      roomId: v.room.roomId,
      roomName: v.room.roomName,
      seenAt: v.seenAt,
      userCount: v.userCount,
      scanId: v.scanId,
    })),
  };
}

/** GET /api/room-scanner/users/lookup?q= – user lookup by cid or username (case-insensitive) */
export const getUserLookup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const q = (req.query.q as string)?.trim();
  if (!q) {
    res.status(400).json({ success: false, error: { message: 'Query q required (cid or username)' } });
    return;
  }
  const user = await scannerService.getUserHistoryByIdentifier(q);
  if (!user) {
    res.status(404).json({ success: false, error: { message: 'User not found' } });
    return;
  }
  const data = formatUserHistoryResponse(user);
  res.status(200).json({ success: true, data });
});

/** GET /api/room-scanner/users/:cid/history – user lookup by cid (legacy) */
export const getUserHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const cid = req.params.cid?.trim();
  if (!cid) {
    res.status(400).json({ success: false, error: { message: 'cid required' } });
    return;
  }
  const user = await scannerService.getUserHistory(cid);
  if (!user) {
    res.status(404).json({ success: false, error: { message: 'User not found' } });
    return;
  }
  const data = formatUserHistoryResponse(user);
  res.status(200).json({ success: true, data });
});

/** GET /api/room-scanner/stats – scanner stats (totals, recent scans, top users/rooms) */
export const getScannerStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const data = await scannerService.getScannerStats();
  res.status(200).json({ success: true, data });
});
