import express from 'express';
import {
  upload,
  uploadMiddleware,
  serve,
  list,
  getHits,
  remove,
} from '../controllers/imageLoggerController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

// Public: when someone opens this URL we log IP and serve the image
router.get('/serve/:slug', serve);

router.get('/', requireAuth, requireAdmin, list);
router.get('/:id/hits', requireAuth, requireAdmin, getHits);
router.delete('/:id', requireAuth, requireAdmin, remove);
router.post('/', requireAuth, requireAdmin, uploadMiddleware.single('image'), upload);

export default router;
