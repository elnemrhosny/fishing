import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/client.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();
const GUEST_CART_COOKIE = 'guest_cart';

function parseGuestCart(req) {
  try {
    const raw = req.cookies?.[GUEST_CART_COOKIE];
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

function setGuestCart(res, items) {
  res.cookie(GUEST_CART_COOKIE, JSON.stringify(items), {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
    sameSite: 'Lax',
  });
}

async function getOrCreateDbCart(db, userId) {
  let cart = await db.execute({ sql: 'SELECT * FROM carts WHERE user_id = ?', args: [userId] });
  if (cart.rows.length === 0) {
    const cartId = uuidv4();
    await db.execute({ sql: 'INSERT INTO carts (id, user_id) VALUES (?, ?)', args: [cartId, userId] });
    return cartId;
  }
  return cart.rows[0].id;
}

async function getDbCartItems(db, cartId) {
  const result = await db.execute({
    sql: `SELECT ci.id, ci.product_id, ci.quantity, p.name_en, p.name_ar, p.price, p.main_image_url
          FROM cart_items ci JOIN products p ON ci.product_id = p.id
          WHERE ci.cart_id = ?`,
    args: [cartId],
  });
  return result.rows;
}

async function enrichGuestCart(db, guestItems) {
  const enriched = [];
  for (const item of guestItems) {
    const p = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [item.product_id] });
    if (p.rows.length > 0) {
      enriched.push({ ...item, ...p.rows[0], quantity: item.quantity });
    }
  }
  return enriched;
}

// GET /api/cart
router.get('/', optionalAuth, async (req, res) => {
  const db = getDb();
  if (req.user) {
    const cartId = await getOrCreateDbCart(db, req.user.id);
    const items = await getDbCartItems(db, cartId);
    return res.json({ items });
  }
  const guestItems = parseGuestCart(req);
  const enriched = await enrichGuestCart(db, guestItems);
  res.json({ items: enriched });
});

// POST /api/cart/items  { product_id, quantity }
router.post('/items', optionalAuth, async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id required' });
  const db = getDb();

  // Validate product exists
  const p = await db.execute({ sql: 'SELECT id FROM products WHERE id = ?', args: [product_id] });
  if (p.rows.length === 0) return res.status(404).json({ error: 'Product not found' });

  const qty = Math.max(1, Math.min(99, parseInt(quantity) || 1));

  if (req.user) {
    const cartId = await getOrCreateDbCart(db, req.user.id);
    const existing = await db.execute({
      sql: 'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
      args: [cartId, product_id],
    });
    if (existing.rows.length > 0) {
      await db.execute({
        sql: 'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
        args: [qty, existing.rows[0].id],
      });
    } else {
      await db.execute({
        sql: 'INSERT INTO cart_items (id, cart_id, product_id, quantity) VALUES (?, ?, ?, ?)',
        args: [uuidv4(), cartId, product_id, qty],
      });
    }
    const items = await getDbCartItems(db, cartId);
    return res.json({ items });
  }

  // Guest
  const guestItems = parseGuestCart(req);
  const idx = guestItems.findIndex(i => i.product_id === product_id);
  if (idx >= 0) {
    guestItems[idx].quantity += qty;
  } else {
    guestItems.push({ product_id, quantity: qty });
  }
  setGuestCart(res, guestItems);
  const enriched = await enrichGuestCart(db, guestItems);
  res.json({ items: enriched });
});

// PUT /api/cart/items/:product_id  { quantity }
router.put('/items/:product_id', optionalAuth, async (req, res) => {
  const { product_id } = req.params;
  const qty = Math.max(0, parseInt(req.body.quantity) || 0);
  const db = getDb();

  if (req.user) {
    const cartId = await getOrCreateDbCart(db, req.user.id);
    if (qty === 0) {
      await db.execute({ sql: 'DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', args: [cartId, product_id] });
    } else {
      await db.execute({ sql: 'UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?', args: [qty, cartId, product_id] });
    }
    const items = await getDbCartItems(db, cartId);
    return res.json({ items });
  }

  const guestItems = parseGuestCart(req);
  const updated = qty === 0
    ? guestItems.filter(i => i.product_id !== product_id)
    : guestItems.map(i => i.product_id === product_id ? { ...i, quantity: qty } : i);
  setGuestCart(res, updated);
  const enriched = await enrichGuestCart(db, updated);
  res.json({ items: enriched });
});

// DELETE /api/cart/items/:product_id
router.delete('/items/:product_id', optionalAuth, async (req, res) => {
  const { product_id } = req.params;
  const db = getDb();

  if (req.user) {
    const cartId = await getOrCreateDbCart(db, req.user.id);
    await db.execute({ sql: 'DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', args: [cartId, product_id] });
    const items = await getDbCartItems(db, cartId);
    return res.json({ items });
  }

  const guestItems = parseGuestCart(req).filter(i => i.product_id !== product_id);
  setGuestCart(res, guestItems);
  const enriched = await enrichGuestCart(db, guestItems);
  res.json({ items: enriched });
});

// POST /api/cart/merge  (called after login to merge guest cart)
router.post('/merge', requireAuth, async (req, res) => {
  const db = getDb();
  const guestItems = parseGuestCart(req);

  if (guestItems.length > 0) {
    const cartId = await getOrCreateDbCart(db, req.user.id);
    for (const item of guestItems) {
      const p = await db.execute({ sql: 'SELECT id FROM products WHERE id = ?', args: [item.product_id] });
      if (p.rows.length === 0) continue;

      const existing = await db.execute({
        sql: 'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
        args: [cartId, item.product_id],
      });
      if (existing.rows.length > 0) {
        // Don't duplicate — keep whichever is higher
        const newQty = Math.max(existing.rows[0].quantity, item.quantity);
        await db.execute({
          sql: 'UPDATE cart_items SET quantity = ? WHERE id = ?',
          args: [newQty, existing.rows[0].id],
        });
      } else {
        await db.execute({
          sql: 'INSERT INTO cart_items (id, cart_id, product_id, quantity) VALUES (?, ?, ?, ?)',
          args: [uuidv4(), cartId, item.product_id, item.quantity],
        });
      }
    }
  }

  // Clear guest cookie
  res.clearCookie('guest_cart', { path: '/' });
  const cartId = await getOrCreateDbCart(db, req.user.id);
  const items = await getDbCartItems(db, cartId);
  res.json({ items });
});

export default router;
