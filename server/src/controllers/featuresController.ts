import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { getPrisma } from '../lib/db.js';
import * as scannerService from '../services/scannerService.js';

const DEFAULT_FEATURES = [
  { slug: 'image-logger', name: 'Image Logger' },
  { slug: 'booter', name: 'Booter' },
  { slug: 'user-lookup', name: 'User lookup' },
];

const VALID_STATUSES = ['active', 'updating', 'disabled'] as const;

const SYSTEM_FEATURE_SLUGS = ['room-scanner'] as const;

/** GET /api/features – list all features (ensure defaults exist) + Room scanner with live status */
export const listFeatures = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const db = getPrisma();
  if (!db) {
    res.status(503).json({
      success: false,
      error: { message: 'Database not configured.' },
    });
    return;
  }
  for (const def of DEFAULT_FEATURES) {
    await db.feature.upsert({
      where: { slug: def.slug },
      create: { slug: def.slug, name: def.name, status: 'active' },
      update: {},
    });
  }
  const dbFeatures = await db.feature.findMany({
    orderBy: { slug: 'asc' },
  });
  const isScanning = scannerService.isCurrentlyScanning();
  const now = new Date().toISOString();
  const systemFeatures = [
    {
      id: 'sys-room-scanner',
      slug: 'room-scanner',
      name: 'Room scanner',
      status: (isScanning ? 'updating' : 'active') as 'active' | 'updating' | 'disabled',
      updatedAt: now,
    },
  ];
  const features = [
    ...dbFeatures.map((f) => ({
      id: f.id,
      slug: f.slug,
      name: f.name,
      status: f.status,
      updatedAt: f.updatedAt.toISOString(),
    })),
    ...systemFeatures,
  ];
  res.status(200).json({ success: true, features });
});

/** PATCH /api/features/:slug – update feature status (admin) */
export const updateFeatureStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const db = getPrisma();
  if (!db) {
    res.status(503).json({
      success: false,
      error: { message: 'Database not configured.' },
    });
    return;
  }
  const slug = (req.params.slug ?? '').trim();
  if (SYSTEM_FEATURE_SLUGS.includes(slug as (typeof SYSTEM_FEATURE_SLUGS)[number])) {
    res.status(400).json({
      success: false,
      error: { message: 'Cannot change status of system feature (room-scanner)' },
    });
    return;
  }
  const status = (req.body?.status ?? req.query?.status) as string | undefined;
  const normalized = status?.toLowerCase().trim();
  if (!slug) {
    res.status(400).json({ success: false, error: { message: 'slug is required' } });
    return;
  }
  if (!normalized || !VALID_STATUSES.includes(normalized as (typeof VALID_STATUSES)[number])) {
    res.status(400).json({
      success: false,
      error: { message: 'status must be one of: active, updating, disabled' },
    });
    return;
  }
  const def = DEFAULT_FEATURES.find((d) => d.slug === slug);
  const feature = await db.feature.upsert({
    where: { slug },
    create: { slug, name: def?.name ?? slug, status: normalized },
    update: { status: normalized },
  });
  res.status(200).json({
    success: true,
    feature: {
      id: feature.id,
      slug: feature.slug,
      name: feature.name,
      status: feature.status,
      updatedAt: feature.updatedAt.toISOString(),
    },
  });
});
