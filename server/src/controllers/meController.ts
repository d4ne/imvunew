import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';

export const getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
    return;
  }
  res.status(200).json({
    success: true,
    user: {
      id: user.sub,
      username: user.username,
      avatar: user.avatar,
      discriminator: user.discriminator,
      tier: user.tier,
    },
  });
});
