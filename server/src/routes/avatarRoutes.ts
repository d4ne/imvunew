import express from 'express';
import {
  getAvatarCard,
  getAvatarActions,
  getAvatarCardsBatch,
} from '../controllers/avatarController.js';
import { validateParams, validateQuery, validateBody } from '../middleware/requestValidator.js';
import {
  avatarCardParamSchema,
  avatarCardQuerySchema,
  batchAvatarSchema,
} from '../validators/schemas.js';

const router = express.Router();

router.get('/actions', getAvatarActions);
router.post('/batch', validateBody(batchAvatarSchema), getAvatarCardsBatch);
router.get(
  '/:cid',
  validateParams(avatarCardParamSchema),
  validateQuery(avatarCardQuerySchema),
  getAvatarCard
);

export default router;
