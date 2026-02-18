import express from 'express';
import { listFeatures, updateFeatureStatus } from '../controllers/featuresController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.get('/', listFeatures);
router.patch('/:slug', requireAuth, requireAdmin, updateFeatureStatus);

export default router;
