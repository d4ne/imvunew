import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { JwtPayload } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[config.jwt.cookieName];
  if (!token) {
    res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.clearCookie(config.jwt.cookieName, { path: '/' });
    res.status(401).json({ success: false, error: { message: 'Invalid or expired session' } });
  }
}
