import { Request, Response } from 'express';
import imvuApiClient from '../services/imvuApiClient.js';
import asyncHandler from '../middleware/asyncHandler.js';
import logger from '../config/logger.js';

export const getLoginConfig = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const config = await imvuApiClient.getLoginConfig();
  res.status(200).json({ success: true, data: config });
});

export const setCredentials = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId, authToken } = req.body;
  imvuApiClient.setCredentials(userId, authToken);
  logger.info(`Credentials set for user ID: ${userId}`);
  res.status(200).json({ success: true, message: 'Credentials updated', data: { userId } });
});

export const validateCredentials = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  await imvuApiClient.getAvatarActions();
  res.status(200).json({ success: true, message: 'Credentials are valid' });
});
