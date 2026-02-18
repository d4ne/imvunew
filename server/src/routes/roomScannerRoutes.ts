import express from 'express';
import { getConfig, updateConfig } from '../controllers/roomScannerController.js';
import {
  triggerScan,
  getScanProgress,
  getScanHistory,
  getUserHistory,
  getUserLookup,
  getScannerStats,
} from '../controllers/scannerController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.get('/config', requireAuth, getConfig);
router.patch('/config', requireAuth, requireAdmin, updateConfig);

router.post('/scan', requireAuth, requireAdmin, triggerScan);
router.get('/scan/status', requireAuth, getScanProgress);
router.get('/scan/history', requireAuth, getScanHistory);
router.get('/stats', requireAuth, getScannerStats);
router.get('/users/lookup', requireAuth, getUserLookup);
router.get('/users/:cid/history', requireAuth, getUserHistory);

export default router;
