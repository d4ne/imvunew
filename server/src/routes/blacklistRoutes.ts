import express from 'express';
import {
  listBlacklist,
  addToBlacklist,
  removeFromBlacklist,
  checkBlacklist,
} from '../controllers/blacklistController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.get('/', requireAuth, listBlacklist);
router.post('/', requireAuth, addToBlacklist);
router.delete('/:id', requireAuth, removeFromBlacklist);
router.get('/check', checkBlacklist);

export default router;
