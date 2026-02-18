import { z } from 'zod';

export const setCredentialsSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  authToken: z.string().min(1, 'Auth token is required'),
});

export const roomsQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  decode: z.string().optional().default('true').transform((val) => val !== 'false'),
});

export const roomSearchSchema = z.object({
  name: z.string().optional(),
  minUsers: z.coerce.number().int().min(0).optional(),
  maxUsers: z.coerce.number().int().min(0).optional(),
});

export const roomIdParamSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
});

export const avatarCardParamSchema = z.object({
  cid: z.string().min(1, 'Customer ID is required'),
});

export const avatarCardQuerySchema = z.object({
  viewerCid: z.string().optional(),
});

export const batchAvatarSchema = z.object({
  cids: z.array(z.string()).min(1).max(100),
});

export const userSearchSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
