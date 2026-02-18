import express, { Request, Response } from 'express';
import authRoutes from './authRoutes.js';
import meRoutes from './meRoutes.js';
import roomsRoutes from './roomsRoutes.js';
import avatarRoutes from './avatarRoutes.js';
import usersRoutes from './usersRoutes.js';
import blacklistRoutes from './blacklistRoutes.js';
import imageLoggerRoutes from './imageLoggerRoutes.js';
import docsRoutes from './docsRoutes.js';
import featuresRoutes from './featuresRoutes.js';
import roomScannerRoutes from './roomScannerRoutes.js';
import imvuAccountsRoutes from './imvuAccountsRoutes.js';

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
      blacklist: '/api/blacklist/*',
      imageLogger: '/api/image-logger/*',
      docs: '/api/docs/*',
      features: '/api/features/*',
      roomScanner: '/api/room-scanner/*',
      imvuAccounts: '/api/imvu-accounts/*',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/me', meRoutes);
router.use('/rooms', roomsRoutes);
router.use('/avatar', avatarRoutes);
router.use('/users', usersRoutes);
router.use('/blacklist', blacklistRoutes);
router.use('/image-logger', imageLoggerRoutes);
router.use('/docs', docsRoutes);
router.use('/features', featuresRoutes);
router.use('/room-scanner', roomScannerRoutes);
router.use('/imvu-accounts', imvuAccountsRoutes);

export default router;
