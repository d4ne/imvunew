import { Request, Response } from 'express';
import imvuApiClient from '../services/imvuApiClient.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const getAvatarCard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { cid } = req.params;
  const viewerCid = req.query.viewerCid as string | undefined;
  const card = await imvuApiClient.getAvatarCard(cid, viewerCid);
  res.status(200).json({ success: true, data: card });
});

export const getAvatarActions = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const actions = await imvuApiClient.getAvatarActions();
  res.status(200).json({ success: true, data: actions });
});

export const getAvatarCardsBatch = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { cids } = req.body;
  const results = await Promise.allSettled(
    cids.map((cid: string) => imvuApiClient.getAvatarCard(cid))
  );
  const data = results.map((r, i) =>
    r.status === 'fulfilled'
      ? { cid: cids[i], success: true, data: r.value }
      : { cid: cids[i], success: false, error: r.reason?.message || 'Unknown error' }
  );
  res.status(200).json({ success: true, count: data.length, data });
});
