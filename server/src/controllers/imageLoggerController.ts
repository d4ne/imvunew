import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import asyncHandler from '../middleware/asyncHandler.js';
import { getPrisma } from '../lib/db.js';
import config from '../config/config.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'image-logger');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const slug = crypto.randomBytes(10).toString('base64url');
    const ext = path.extname(file.originalname) || '.png';
    cb(null, slug + ext);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|gif|webp|bmp|svg\+xml)/i.test(file.mimetype);
    if (allowed) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

function getClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0]?.trim() ?? null;
  return req.ip ?? null;
}

export const upload = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const db = getPrisma();
  if (!db) {
    res.status(503).json({ success: false, error: { message: 'Database not configured' } });
    return;
  }
  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
    return;
  }
  const ext = path.extname(file.filename);
  const urlSlug = path.basename(file.filename, ext);
  const addedById = req.user?.sub ?? null;
  const record = await db.imageLoggerImage.create({
    data: {
      slug: urlSlug,
      filePath: file.filename,
      originalName: file.originalname || file.filename,
      mimeType: file.mimetype,
      addedById,
    },
  });
  const baseUrl = config.discord.frontendUrl || `http://localhost:${config.server.port}`;
  const trackingUrl = `${baseUrl}/i/${urlSlug}${ext}`;
  res.status(201).json({
    success: true,
    image: {
      id: record.id,
      slug: record.slug,
      originalName: record.originalName,
      trackingUrl,
      createdAt: record.createdAt.toISOString(),
    },
  });
});

/** Serves the image and logs the hit. Used by both GET /api/image-logger/serve/:slug and GET /i/:slug */
export const serve = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const db = getPrisma();
  const slugParam = req.params.slug as string;
  if (!slugParam) {
    res.status(404).send('Not found');
    return;
  }
  // URL may be /i/abc123.jpg or /i/abc123 — strip extension for DB lookup
  const slug = path.extname(slugParam) ? path.basename(slugParam, path.extname(slugParam)) : slugParam;
  const image = db
    ? await db.imageLoggerImage.findUnique({
        where: { slug },
        include: { _count: { select: { hits: true } } },
      })
    : null;
  if (!image) {
    res.status(404).send('Not found');
    return;
  }
  const filePath = path.join(UPLOAD_DIR, image.filePath);
  if (!fs.existsSync(filePath)) {
    res.status(404).send('Not found');
    return;
  }
  if (db) {
    await db.imageLoggerHit.create({
      data: {
        imageId: image.id,
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'] ?? null,
        referer: req.headers['referer'] ?? null,
      },
    });
  }
  res.setHeader('Content-Type', image.mimeType || 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  fs.createReadStream(filePath).pipe(res);
});

/** Same as serve; exported for the clean /i/:slug route in app.ts */
export const serveImageLogger = serve;

export const list = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const db = getPrisma();
  if (!db) {
    res.status(503).json({ success: false, error: { message: 'Database not configured' } });
    return;
  }
  const images = await db.imageLoggerImage.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { hits: true } } },
  });
  const baseUrl = config.discord.frontendUrl || `http://localhost:${config.server.port}`;
  res.status(200).json({
    success: true,
    images: images.map((img) => ({
      id: img.id,
      slug: img.slug,
      originalName: img.originalName,
      trackingUrl: `${baseUrl}/i/${img.slug}${path.extname(img.filePath)}`,
      hitCount: img._count.hits,
      createdAt: img.createdAt.toISOString(),
    })),
  });
});

export const getHits = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const db = getPrisma();
  if (!db) {
    res.status(503).json({ success: false, error: { message: 'Database not configured' } });
    return;
  }
  const id = req.params.id as string;
  const hits = await db.imageLoggerHit.findMany({
    where: { imageId: id },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  res.status(200).json({
    success: true,
    hits: hits.map((h) => ({
      id: h.id,
      ip: h.ip,
      userAgent: h.userAgent,
      referer: h.referer,
      createdAt: h.createdAt.toISOString(),
    })),
  });
});

export const remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const db = getPrisma();
  if (!db) {
    res.status(503).json({ success: false, error: { message: 'Database not configured' } });
    return;
  }
  const id = req.params.id as string;
  const image = await db.imageLoggerImage.findUnique({ where: { id } });
  if (!image) {
    res.status(404).json({ success: false, error: { message: 'Image not found' } });
    return;
  }
  const filePath = path.join(UPLOAD_DIR, image.filePath);
  if (fs.existsSync(filePath)) fs.promises.unlink(filePath).catch(() => {});
  await db.imageLoggerImage.delete({ where: { id } });
  res.status(200).json({ success: true, removed: true });
});
