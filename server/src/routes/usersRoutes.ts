import express from 'express';
import { searchUsers } from '../controllers/usersController.js';
import { validateQuery } from '../middleware/requestValidator.js';
import { userSearchSchema } from '../validators/schemas.js';

const router = express.Router();
router.get('/search', validateQuery(userSearchSchema), searchUsers);
export default router;
