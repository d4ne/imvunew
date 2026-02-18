import express from 'express';
import {
  getLoginConfig,
  setCredentials,
  validateCredentials,
} from '../controllers/authController.js';
import {
  redirectToDiscord,
  discordCallback,
  logout,
} from '../controllers/discordAuthController.js';
import { validateBody } from '../middleware/requestValidator.js';
import { setCredentialsSchema } from '../validators/schemas.js';

const router = express.Router();

router.get('/login-config', getLoginConfig);
router.post('/credentials', validateBody(setCredentialsSchema), setCredentials);
router.get('/validate', validateCredentials);

router.get('/discord', redirectToDiscord);
router.get('/discord/callback', discordCallback);
router.post('/discord/logout', logout);

export default router;
