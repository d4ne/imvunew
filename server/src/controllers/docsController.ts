import { Request, Response } from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import { getPrisma } from '../lib/db.js';

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'doc';
}

/** GET /api/docs – list all docs (public) */
export const listDocs = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const db = getPrisma();
  if (!db) {
    res.status(503).json({
      success: false,
      error: { message: 'Database not configured.' },
    });
    return;
  }
  const docs = await db.doc.findMany({
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, slug: true, createdAt: true, updatedAt: true },
  });
  res.status(200).json({
    success: true,
    docs: docs.map((d) => ({
      id: d.id,
      title: d.title,
      slug: d.slug,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
  });
});

/** GET /api/docs/:slug – get one doc by slug (public) */
export const getDocBySlug = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const db = getPrisma();
  if (!db) {
    res.status(503).json({
      success: false,
      error: { message: 'Database not configured.' },
    });
    return;
  }
  const slug = (req.params.slug ?? '').trim();
  if (!slug) {
    res.status(400).json({ success: false, error: { message: 'slug is required' } });
    return;
  }
  const doc = await db.doc.findUnique({ where: { slug } });
  if (!doc) {
    res.status(404).json({ success: false, error: { message: 'Doc not found' } });
    return;
  }
  res.status(200).json({
    success: true,
    doc: {
      id: doc.id,
      title: doc.title,
      slug: doc.slug,
      content: doc.content,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    },
  });
});

/** POST /api/docs – create doc (admin) */
export const createDoc = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const db = getPrisma();
  if (!db) {
    res.status(503).json({
      success: false,
      error: { message: 'Database not configured.' },
    });
    return;
  }
  const title = (req.body?.title ?? '').trim();
  const slug = (req.body?.slug ?? '').trim() || slugify(title);
  const content = typeof req.body?.content === 'string' ? req.body.content : '';
  if (!title) {
    res.status(400).json({ success: false, error: { message: 'title is required' } });
    return;
  }
  const finalSlug = slug || slugify(title);
  if (!finalSlug) {
    res.status(400).json({ success: false, error: { message: 'slug could not be generated from title' } });
    return;
  }
  const existing = await db.doc.findUnique({ where: { slug: finalSlug } });
  if (existing) {
    res.status(409).json({ success: false, error: { message: 'A doc with this slug already exists' } });
    return;
  }
  const doc = await db.doc.create({
    data: { title, slug: finalSlug, content },
  });
  res.status(201).json({
    success: true,
    doc: {
      id: doc.id,
      title: doc.title,
      slug: doc.slug,
      content: doc.content,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    },
  });
});

/** PUT /api/docs/:id – update doc (admin) */
export const updateDoc = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const db = getPrisma();
  if (!db) {
    res.status(503).json({
      success: false,
      error: { message: 'Database not configured.' },
    });
    return;
  }
  const id = (req.params.id ?? '').trim();
  if (!id) {
    res.status(400).json({ success: false, error: { message: 'id is required' } });
    return;
  }
  const title = (req.body?.title ?? '').trim();
  const slug = (req.body?.slug ?? '').trim();
  const content = typeof req.body?.content === 'string' ? req.body.content : undefined;
  const doc = await db.doc.findUnique({ where: { id } });
  if (!doc) {
    res.status(404).json({ success: false, error: { message: 'Doc not found' } });
    return;
  }
  const finalSlug = slug || (title ? slugify(title) : doc.slug);
  if (finalSlug !== doc.slug) {
    const existing = await db.doc.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      res.status(409).json({ success: false, error: { message: 'A doc with this slug already exists' } });
      return;
    }
  }
  const updated = await db.doc.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(finalSlug && { slug: finalSlug }),
      ...(content !== undefined && { content }),
    },
  });
  res.status(200).json({
    success: true,
    doc: {
      id: updated.id,
      title: updated.title,
      slug: updated.slug,
      content: updated.content,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
});

/** DELETE /api/docs/:id – delete doc (admin) */
export const deleteDoc = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const db = getPrisma();
  if (!db) {
    res.status(503).json({
      success: false,
      error: { message: 'Database not configured.' },
    });
    return;
  }
  const id = (req.params.id ?? '').trim();
  if (!id) {
    res.status(400).json({ success: false, error: { message: 'id is required' } });
    return;
  }
  await db.doc.deleteMany({ where: { id } });
  res.status(200).json({ success: true, removed: true });
});
