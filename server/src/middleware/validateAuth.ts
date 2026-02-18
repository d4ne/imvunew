import { Request, Response, NextFunction } from 'express';
import imvuApiClient from '../services/imvuApiClient.js';
import logger from '../config/logger.js';

const validateAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const userId = (req.headers['x-imvu-userid'] as string) || (req.query.userId as string);
  const authToken = (req.headers['x-imvu-auth'] as string) || (req.query.authToken as string);
  if (userId && authToken) {
    imvuApiClient.setCredentials(userId, authToken);
    logger.info(`Using custom credentials for request: User ID ${userId}`);
  }
  next();
};

export default validateAuth;
