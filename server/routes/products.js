import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { getDb } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();

async function getProductWithImages(db, id) {
  const p = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] });
  if (p.rows.length === 0) return null;
  const imgs = await db.execute({
    sql: 'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order',
    args: [id],
  });
  return { ...p.rows[0], images: imgs.rows };
}

router.get('/', async (req, res) => {
  const { category, search, page = 1, limit = 12 } = req.query;
  const db = getDb();
  const offset = (Number(page) - 1) * Number(limit);
  let sql = 'SELECT p.*, c.name_en as category_name_en, c.name_ar as category_name_ar FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
  const args = [];

  if (category) { sql += ' AND p.category_id = ?'; args.push(category); }
  if (search) { sql += ' AND (p.name_en LIKE ? OR p.name_ar LIKE ?)'; args.push(`%${search}%`, `%${search}%`); }

  const countResult = await db.execute({ sql: sql.replace('SELECT p.*, c.name_en as category_name_en, c.name_ar as category_name_ar', 'SELECT COUNT(*) as total'), args });
  const total = Number(countResult.rows[0].total);

  sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  args.push(Number(limit), offset);

  const result = await db.execute({ sql, args });
  res.json({ products: result.rows, total, page: Number(page), limit: Number(limit) });
});

router.get('/:id', async (req, res) => {
  const db = getDb();
  const product = await getProductWithImages(db, req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

const productValidation = [
  body('name_en').trim().isLength({ min: 1 }),
  body('name_ar').trim().isLength({ min: 1 }),
  body('price').isFloat({ min: 0 }),
  body('main_image_url').trim().isLength({ min: 1 }),
];

router.post('/', requireAuth, requireAdmin, ...productValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name_en, name_ar, description_en = '', description_ar = '', category_id, price, main_image_url, images = [] } = req.body;
  const db = getDb();
  const id = uuidv4();

  await db.execute({
    sql: 'INSERT INTO products (id, name_en, name_ar, description_en, description_ar, category_id, price, main_image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id, name_en, name_ar, description_en, description_ar, category_id || null, price, main_image_url],
  });

  for (let i = 0; i < images.length; i++) {
    await db.execute({
      sql: 'INSERT INTO product_images (id, product_id, url, sort_order) VALUES (?, ?, ?, ?)',
      args: [uuidv4(), id, images[i], i],
    });
  }

  const product = await getProductWithImages(db, id);
  res.status(201).json(product);
});

router.put('/:id', requireAuth, requireAdmin, ...productValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name_en, name_ar, description_en = '', description_ar = '', category_id, price, main_image_url, images = [] } = req.body;
  const db = getDb();

  await db.execute({
    sql: 'UPDATE products SET name_en=?, name_ar=?, description_en=?, description_ar=?, category_id=?, price=?, main_image_url=? WHERE id=?',
    args: [name_en, name_ar, description_en, description_ar, category_id || null, price, main_image_url, req.params.id],
  });

  await db.execute({ sql: 'DELETE FROM product_images WHERE product_id = ?', args: [req.params.id] });
  for (let i = 0; i < images.length; i++) {
    await db.execute({
      sql: 'INSERT INTO product_images (id, product_id, url, sort_order) VALUES (?, ?, ?, ?)',
      args: [uuidv4(), req.params.id, images[i], i],
    });
  }

  const product = await getProductWithImages(db, req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [req.params.id] });
  res.json({ ok: true });
});

export default router;
