import { PrismaClient } from '@prisma/client';
import config from '../config/config.js';

let prisma: PrismaClient | null = null;

/** Returns Prisma client when DATABASE_URL is set; otherwise null. Run `npm run db:generate` and `npm run db:push` (or migrate) after setting DATABASE_URL. */
export function getPrisma(): PrismaClient | null {
  if (!config.database?.url) return null;
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}
