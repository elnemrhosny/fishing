import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { getDb } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();

router.get('/', async (req, res) => {
  const db = getDb();
  const result = await db.execute('SELECT * FROM categories ORDER BY name_en');
  res.json(result.rows);
});

router.post('/',
  requireAuth, requireAdmin,
  body('name_en').trim().isLength({ min: 1 }),
  body('name_ar').trim().isLength({ min: 1 }),
  body('slug').trim().isLength({ min: 1 }).matches(/^[a-z0-9-]+$/),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name_en, name_ar, slug } = req.body;
    const db = getDb();
    const id = uuidv4();
    try {
      await db.execute({
        sql: 'INSERT INTO categories (id, name_en, name_ar, slug) VALUES (?, ?, ?, ?)',
        args: [id, name_en, name_ar, slug],
      });
      res.status(201).json({ id, name_en, name_ar, slug });
    } catch (err) {
      if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Slug already exists' });
      throw err;
    }
  }
);

router.put('/:id',
  requireAuth, requireAdmin,
  body('name_en').trim().isLength({ min: 1 }),
  body('name_ar').trim().isLength({ min: 1 }),
  body('slug').trim().isLength({ min: 1 }).matches(/^[a-z0-9-]+$/),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name_en, name_ar, slug } = req.body;
    const db = getDb();
    try {
      await db.execute({
        sql: 'UPDATE categories SET name_en = ?, name_ar = ?, slug = ? WHERE id = ?',
        args: [name_en, name_ar, slug, req.params.id],
      });
      res.json({ id: req.params.id, name_en, name_ar, slug });
    } catch (err) {
      if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Slug already exists' });
      throw err;
    }
  }
);

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM categories WHERE id = ?', args: [req.params.id] });
  res.json({ ok: true });
});

export default router;
