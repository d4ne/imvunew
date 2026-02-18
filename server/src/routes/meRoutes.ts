import express from 'express';
import { getMe } from '../controllers/meController.js';
import { optionalAuth } from '../middleware/requireAuth.js';

const router = express.Router();
router.get('/', optionalAuth, getMe);
export default router;
