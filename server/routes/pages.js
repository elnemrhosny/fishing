import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { getDb } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();

router.get('/:key', async (req, res) => {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM page_content WHERE page_key = ?',
    args: [req.params.key],
  });
  if (result.rows.length === 0) return res.status(404).json({ error: 'Page not found' });
  res.json(result.rows[0]);
});

router.put('/:key',
  requireAuth, requireAdmin,
  body('content_en').isString(),
  body('content_ar').isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { content_en, content_ar } = req.body;
    const db = getDb();
    await db.execute({
      sql: "UPDATE page_content SET content_en = ?, content_ar = ?, updated_at = datetime('now') WHERE page_key = ?",
      args: [content_en, content_ar, req.params.key],
    });
    res.json({ ok: true });
  }
);

export default router;
