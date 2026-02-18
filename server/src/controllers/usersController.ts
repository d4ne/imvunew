import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';

/**
 * Search users - without database returns empty.
 * Set DATABASE_URL and use Prisma to enable user search from scanner data.
 */
export const searchUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const q = (req.query.q as string)?.trim() || '';
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const offset = Number(req.query.offset) || 0;

  // No database in this minimal backend - return empty. Add Prisma + database service to enable.
  res.status(200).json({
    success: true,
    data: [],
    pagination: { offset, limit, total: 0 },
    message: 'User search requires database. Configure DATABASE_URL and run Prisma migrations to enable.',
  });
});
