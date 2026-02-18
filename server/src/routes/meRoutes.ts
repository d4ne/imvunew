import express from 'express';
import { getMe } from '../controllers/meController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();
router.get('/', requireAuth, getMe);
export default router;
