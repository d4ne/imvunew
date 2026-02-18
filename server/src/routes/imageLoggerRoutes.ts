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

const router = express.Router();

// Public: when someone opens this URL we log IP and serve the image
router.get('/serve/:slug', serve);

router.get('/', requireAuth, list);
router.get('/:id/hits', requireAuth, getHits);
router.delete('/:id', requireAuth, remove);
router.post('/', requireAuth, uploadMiddleware.single('image'), upload);

export default router;
