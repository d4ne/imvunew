import { Request, Response, NextFunction } from 'express';
import { requireAuth } from './requireAuth.js';

/** Requires authenticated user with isAdmin. Use after requireAuth. Returns 403 if not admin. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
    return;
  }
  if (!req.user.isAdmin) {
    res.status(403).json({ success: false, error: { message: 'Admin access required' } });
    return;
  }
  next();
}
