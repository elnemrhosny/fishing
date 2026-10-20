import { Router } from 'express';
import { getDb } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/stats', async (req, res) => {
  const db = getDb();

  const totalOrders = await db.execute('SELECT COUNT(*) as count FROM orders');
  const totalRevenue = await db.execute("SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE payment_status = 'paid' OR payment_method = 'cod'");
  const totalProducts = await db.execute('SELECT COUNT(*) as count FROM products');
  const totalUsers = await db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");
  const recentOrders = await db.execute('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10');

  res.json({
    total_orders: Number(totalOrders.rows[0].count),
    total_revenue: Number(totalRevenue.rows[0].revenue),
    total_products: Number(totalProducts.rows[0].count),
    total_customers: Number(totalUsers.rows[0].count),
    recent_orders: recentOrders.rows,
  });
});

export default router;
