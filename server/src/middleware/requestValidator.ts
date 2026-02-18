import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../types/index.js';

export const validateBody = <T>(schema: ZodSchema<T>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new ValidationError(message));
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = <T>(schema: ZodSchema<T>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as Request['query'];
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new ValidationError(message));
      } else {
        next(error);
      }
    }
  };
};

export const validateParams = <T>(schema: ZodSchema<T>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as Request['params'];
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new ValidationError(message));
      } else {
        next(error);
      }
    }
  };
};
