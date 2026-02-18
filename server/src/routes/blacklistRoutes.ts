import express from 'express';
import {
  listBlacklist,
  addToBlacklist,
  removeFromBlacklist,
  checkBlacklist,
} from '../controllers/blacklistController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, listBlacklist);
router.post('/', requireAuth, requireAdmin, addToBlacklist);
router.delete('/:id', requireAuth, requireAdmin, removeFromBlacklist);
router.get('/check', checkBlacklist);

export default router;
