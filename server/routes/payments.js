import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { getDb } from '../db/client.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_SECRET_KEY = process.env.PAYMOB_SECRET_KEY;
const PAYMOB_PUBLIC_KEY = process.env.PAYMOB_PUBLIC_KEY;
const PAYMOB_CARD_INTEGRATION_ID = process.env.PAYMOB_CARD_INTEGRATION_ID;
const PAYMOB_WALLET_INTEGRATION_ID = process.env.PAYMOB_WALLET_INTEGRATION_ID;
const PAYMOB_BASE_URL = 'https://accept.paymob.com/v1';

// POST /api/payments/initiate  { order_id, method }
router.post('/initiate', optionalAuth, async (req, res) => {
  const { order_id, method } = req.body;
  if (!order_id || !method) return res.status(400).json({ error: 'order_id and method required' });
  if (!['card', 'wallet'].includes(method)) return res.status(400).json({ error: 'Invalid payment method' });

  const db = getDb();

  // Load order
  const orderResult = await db.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [order_id] });
  if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
  const order = orderResult.rows[0];

  // Authorization check
  if (order.user_id && req.user?.id !== order.user_id && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Idempotency: check if a pending payment already exists
  const existingPayment = await db.execute({
    sql: "SELECT * FROM payments WHERE order_id = ? AND method = ? AND status = 'pending'",
    args: [order_id, method],
  });

  if (existingPayment.rows.length > 0 && existingPayment.rows[0].paymob_intention_id) {
    // Return existing intention
    return res.json({ 
      client_secret: existingPayment.rows[0].paymob_intention_id,
      public_key: PAYMOB_PUBLIC_KEY,
    });
  }

  const integrationId = method === 'card' ? PAYMOB_CARD_INTEGRATION_ID : PAYMOB_WALLET_INTEGRATION_ID;

  try {
    // Create Paymob Intention
    const intentionResponse = await fetch(`${PAYMOB_BASE_URL}/intention/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${PAYMOB_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(order.total * 100), // in piastres
        currency: 'EGP',
        payment_methods: [parseInt(integrationId)],
        items: [],
        billing_data: {
          first_name: order.shipping_name.split(' ')[0] || 'Customer',
          last_name: order.shipping_name.split(' ').slice(1).join(' ') || 'Customer',
          email: order.guest_email || 'no-email@fishing.com',
          phone_number: order.shipping_phone,
          apartment: 'N/A',
          floor: 'N/A',
          street: order.shipping_address,
          building: 'N/A',
          shipping_method: 'PKG',
          postal_code: '00000',
          city: order.shipping_city,
          country: 'EG',
          state: order.shipping_city,
        },
        customer: {
          first_name: order.shipping_name.split(' ')[0] || 'Customer',
          last_name: order.shipping_name.split(' ').slice(1).join(' ') || 'Customer',
          email: order.guest_email || 'no-email@fishing.com',
        },
        extras: { order_id },
      }),
    });

    if (!intentionResponse.ok) {
      const errorData = await intentionResponse.text();
      console.error('Paymob intention error:', errorData);
      return res.status(502).json({ error: 'Payment gateway error', details: errorData });
    }

    const intentionData = await intentionResponse.json();
    const clientSecret = intentionData.client_secret;
    const intentionId = intentionData.id?.toString();

    // Store payment record
    const paymentId = uuidv4();
    await db.execute({
      sql: 'INSERT INTO payments (id, order_id, paymob_intention_id, method, status, amount) VALUES (?, ?, ?, ?, ?, ?)',
      args: [paymentId, order_id, intentionId, method, 'pending', order.total],
    });

    res.json({ client_secret: clientSecret, public_key: PAYMOB_PUBLIC_KEY });
  } catch (err) {
    console.error('Payment initiation error:', err);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// POST /api/payments/callback  (Paymob webhook)
router.post('/callback', async (req, res) => {
  try {
    const payload = req.body;
    
    // Verify HMAC signature
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
    if (hmacSecret) {
      const receivedHmac = payload.hmac;
      // Paymob HMAC concatenation for transaction callback
      const obj = payload.obj || {};
      const fields = [
        obj.amount_cents,
        obj.created_at,
        obj.currency,
        obj.error_occured,
        obj.has_parent_transaction,
        obj.id,
        obj.integration_id,
        obj.is_3d_secure,
        obj.is_auth,
        obj.is_capture,
        obj.is_refunded,
        obj.is_standalone_payment,
        obj.is_voided,
        obj.order?.id,
        obj.owner,
        obj.pending,
        obj.source_data?.pan,
        obj.source_data?.sub_type,
        obj.source_data?.type,
        obj.success,
      ].map(v => (v === null || v === undefined ? '' : String(v)));
      
      const concatenated = fields.join('');
      const computedHmac = crypto.createHmac('sha512', hmacSecret).update(concatenated).digest('hex');
      
      if (computedHmac !== receivedHmac) {
        console.error('Invalid Paymob HMAC');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    }

    const obj = payload.obj || {};
    const success = obj.success === true || obj.success === 'true';
    const intentionId = obj.order?.id?.toString();
    const orderId = obj.order?.merchant_order_id || obj.extra?.order_id;

    const db = getDb();

    // Find payment by intention ID or order ID
    let payment;
    if (intentionId) {
      const result = await db.execute({
        sql: 'SELECT * FROM payments WHERE paymob_intention_id = ?',
        args: [intentionId],
      });
      payment = result.rows[0];
    }
    if (!payment && orderId) {
      const result = await db.execute({
        sql: 'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
        args: [orderId],
      });
      payment = result.rows[0];
    }

    if (!payment) {
      console.error('Payment not found for callback:', { intentionId, orderId });
      return res.status(200).json({ received: true }); // Always 200 to Paymob
    }

    // Idempotency: skip if already processed
    if (payment.status === 'paid') {
      return res.status(200).json({ received: true });
    }

    const newStatus = success ? 'paid' : (obj.pending ? 'pending' : 'failed');
    
    await db.execute({
      sql: 'UPDATE payments SET status = ?, callback_payload = ? WHERE id = ?',
      args: [newStatus, JSON.stringify(payload), payment.id],
    });

    if (success) {
      await db.execute({
        sql: "UPDATE orders SET payment_status = 'paid', status = 'processing' WHERE id = ?",
        args: [payment.order_id],
      });
    } else if (newStatus === 'failed') {
      await db.execute({
        sql: "UPDATE orders SET payment_status = 'failed' WHERE id = ?",
        args: [payment.order_id],
      });
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Callback error:', err);
    res.status(200).json({ received: true }); // Always 200 to Paymob
  }
});

// GET /api/payments/status/:order_id (poll after redirect)
router.get('/status/:order_id', optionalAuth, async (req, res) => {
  const db = getDb();
  const orderResult = await db.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [req.params.order_id] });
  if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
  const order = orderResult.rows[0];

  if (order.user_id && req.user?.id !== order.user_id && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json({ 
    order_id: order.id, 
    payment_status: order.payment_status, 
    status: order.status 
  });
});

export default router;
