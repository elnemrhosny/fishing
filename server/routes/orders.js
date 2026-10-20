import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { getDb } from '../db/client.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();
const SHIPPING_FEE = 0; // can be made configurable

async function createOrder(db, { userId, guestEmail, items, shippingInfo, paymentMethod }) {
  // Re-fetch product prices from DB (never trust client prices)
  let subtotal = 0;
  const enrichedItems = [];
  for (const item of items) {
    const p = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [item.product_id] });
    if (p.rows.length === 0) throw new Error(`Product ${item.product_id} not found`);
    const product = p.rows[0];
    const qty = Math.max(1, parseInt(item.quantity) || 1);
    subtotal += product.price * qty;
    enrichedItems.push({ product, quantity: qty });
  }

  const total = subtotal + SHIPPING_FEE;
  const orderId = uuidv4();

  await db.execute({
    sql: `INSERT INTO orders (id, user_id, guest_email, payment_method, subtotal, shipping_fee, total, shipping_name, shipping_phone, shipping_address, shipping_city)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      orderId, userId || null, guestEmail || null, paymentMethod,
      subtotal, SHIPPING_FEE, total,
      shippingInfo.name, shippingInfo.phone, shippingInfo.address, shippingInfo.city,
    ],
  });

  for (const { product, quantity } of enrichedItems) {
    await db.execute({
      sql: `INSERT INTO order_items (id, order_id, product_id, name_en_snapshot, name_ar_snapshot, price_snapshot, quantity)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [uuidv4(), orderId, product.id, product.name_en, product.name_ar, product.price, quantity],
    });
  }

  return { orderId, total, subtotal };
}

// POST /api/orders/checkout
router.post('/checkout',
  optionalAuth,
  body('items').isArray({ min: 1 }),
  body('shipping.name').trim().isLength({ min: 2 }),
  body('shipping.phone').trim().isLength({ min: 6 }),
  body('shipping.address').trim().isLength({ min: 5 }),
  body('shipping.city').trim().isLength({ min: 2 }),
  body('payment_method').isIn(['cod', 'card', 'wallet']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { items, shipping, payment_method, guest_email } = req.body;
    const db = getDb();

    if (!req.user && payment_method !== 'cod') {
      // guests can only use COD unless we collect email
      if (!guest_email) return res.status(400).json({ error: 'guest_email required for online payment' });
    }

    try {
      const { orderId, total } = await createOrder(db, {
        userId: req.user?.id,
        guestEmail: guest_email || req.user?.email,
        items,
        shippingInfo: shipping,
        paymentMethod: payment_method,
      });

      // Clear user cart
      if (req.user) {
        const cart = await db.execute({ sql: 'SELECT id FROM carts WHERE user_id = ?', args: [req.user.id] });
        if (cart.rows.length > 0) {
          await db.execute({ sql: 'DELETE FROM cart_items WHERE cart_id = ?', args: [cart.rows[0].id] });
        }
      } else {
        res.clearCookie('guest_cart', { path: '/' });
      }

      if (payment_method === 'cod') {
        // Mark payment as COD pending
        await db.execute({
          sql: 'INSERT INTO payments (id, order_id, method, status, amount) VALUES (?, ?, ?, ?, ?)',
          args: [uuidv4(), orderId, 'cod', 'pending', total],
        });
        return res.status(201).json({ order_id: orderId, payment_method: 'cod', status: 'created' });
      }

      // For card/wallet, return order_id; client will call /api/payments/initiate
      res.status(201).json({ order_id: orderId, payment_method, status: 'awaiting_payment', total });
    } catch (err) {
      console.error('Checkout error:', err);
      res.status(500).json({ error: err.message || 'Checkout failed' });
    }
  }
);

// GET /api/orders  (auth required)
router.get('/', requireAuth, async (req, res) => {
  const db = getDb();
  let result;
  if (req.user.role === 'admin') {
    result = await db.execute('SELECT * FROM orders ORDER BY created_at DESC');
  } else {
    result = await db.execute({
      sql: 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      args: [req.user.id],
    });
  }
  res.json(result.rows);
});

// GET /api/orders/:id
router.get('/:id', optionalAuth, async (req, res) => {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [req.params.id] });
  if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

  const order = result.rows[0];
  // Authorization: owner or admin
  if (req.user?.role !== 'admin' && order.user_id !== req.user?.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const items = await db.execute({
    sql: 'SELECT * FROM order_items WHERE order_id = ?',
    args: [req.params.id],
  });
  const payment = await db.execute({
    sql: 'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
    args: [req.params.id],
  });

  res.json({ ...order, items: items.rows, payment: payment.rows[0] || null });
});

// PATCH /api/orders/:id/status  (admin only)
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const db = getDb();
  await db.execute({ sql: 'UPDATE orders SET status = ? WHERE id = ?', args: [status, req.params.id] });
  res.json({ ok: true });
});

export default router;
