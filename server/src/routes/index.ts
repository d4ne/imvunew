import express, { Request, Response } from 'express';
import authRoutes from './authRoutes.js';
import meRoutes from './meRoutes.js';
import roomsRoutes from './roomsRoutes.js';
import avatarRoutes from './avatarRoutes.js';
import usersRoutes from './usersRoutes.js';

const router = express.Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Xanoty API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Xanoty API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      me: 'GET /api/me',
      auth: '/api/auth/*',
      rooms: '/api/rooms/*',
      avatar: '/api/avatar/*',
      users: '/api/users/*',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/me', meRoutes);
router.use('/rooms', roomsRoutes);
router.use('/avatar', avatarRoutes);
router.use('/users', usersRoutes);

export default router;
