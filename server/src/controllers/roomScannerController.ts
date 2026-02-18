import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { getScannerConfig, updateScannerConfig, RoomScannerConfig } from '../services/scannerConfigService.js';

/** GET /api/room-scanner/config – get room scanner config (auth) */
export const getConfig = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const config = await getScannerConfig();
  res.status(200).json({ success: true, config });
});

/** PATCH /api/room-scanner/config – update room scanner config (admin) */
export const updateConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Partial<RoomScannerConfig>;
  const config = await updateScannerConfig({
    maxPages: body.maxPages,
    pageSize: body.pageSize,
    delayMs: body.delayMs,
    keywords: body.keywords,
    roomType: body.roomType,
    hashtags: body.hashtags,
    language: body.language,
    autoScanEnabled: body.autoScanEnabled,
    autoScanIntervalMinutes: body.autoScanIntervalMinutes,
  });
  res.status(200).json({ success: true, config });
});
