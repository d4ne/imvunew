import express from 'express';
import {
  listDocs,
  getDocBySlug,
  createDoc,
  updateDoc,
  deleteDoc,
} from '../controllers/docsController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.get('/', listDocs);
router.get('/:slug', getDocBySlug);
router.post('/', requireAuth, requireAdmin, createDoc);
router.put('/:id', requireAuth, requireAdmin, updateDoc);
router.delete('/:id', requireAuth, requireAdmin, deleteDoc);

export default router;
