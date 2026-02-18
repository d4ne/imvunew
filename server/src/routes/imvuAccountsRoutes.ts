import express from 'express';
import { list, create, update, remove, tryLogin } from '../controllers/imvuAccountsController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, list);
router.post('/', requireAuth, requireAdmin, create);
router.post('/try-login', requireAuth, requireAdmin, tryLogin);
router.patch('/:id', requireAuth, requireAdmin, update);
router.delete('/:id', requireAuth, requireAdmin, remove);

export default router;
