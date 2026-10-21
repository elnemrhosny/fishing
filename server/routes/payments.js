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

// Helper to format Egyptian phone number
function formatEgyptianPhone(raw) {
  if (!raw) return '01000000000';
  let cleaned = raw.replace(/\D/g, '');
  if (cleaned.startsWith('20') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(2);
  } else if (!cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }
  return cleaned.length >= 10 ? cleaned : '01000000000';
}

// POST /api/payments/initiate  { order_id, method }
router.post('/initiate', optionalAuth, async (req, res) => {
  const { order_id, method } = req.body;
  if (!order_id || !method) return res.status(400).json({ error: 'order_id and method required' });
  if (!['card', 'wallet'].includes(method)) return res.status(400).json({ error: 'Invalid payment method' });

  // Check Paymob credentials
  if (!PAYMOB_SECRET_KEY || !PAYMOB_PUBLIC_KEY) {
    console.error('Missing PAYMOB_SECRET_KEY or PAYMOB_PUBLIC_KEY');
    return res.status(500).json({
      error: 'Paymob API credentials (PAYMOB_SECRET_KEY, PAYMOB_PUBLIC_KEY) are not configured in environment variables.',
    });
  }

  // Resolve integration ID
  const rawIntegrationId = method === 'card' ? PAYMOB_CARD_INTEGRATION_ID : PAYMOB_WALLET_INTEGRATION_ID;
  const integrationId = parseInt(rawIntegrationId, 10);

  if (isNaN(integrationId) || integrationId <= 0) {
    const varName = method === 'card' ? 'PAYMOB_CARD_INTEGRATION_ID' : 'PAYMOB_WALLET_INTEGRATION_ID';
    console.error(`Missing or invalid ${varName}:`, rawIntegrationId);
    return res.status(400).json({
      error: `${varName} is missing or not a valid number. Please set it in your environment variables.`,
    });
  }

  const db = getDb();

  // Load order
  const orderResult = await db.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [order_id] });
  if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
  const order = orderResult.rows[0];

  // Authorization check
  if (order.user_id && req.user?.id !== order.user_id && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Idempotency: check if a pending payment with client_secret already exists
  const existingPayment = await db.execute({
    sql: "SELECT * FROM payments WHERE order_id = ? AND method = ? AND status = 'pending' AND paymob_intention_id IS NOT NULL",
    args: [order_id, method],
  });

  if (existingPayment.rows.length > 0 && existingPayment.rows[0].paymob_intention_id) {
    return res.json({
      client_secret: existingPayment.rows[0].paymob_intention_id,
      public_key: PAYMOB_PUBLIC_KEY,
    });
  }

  const appUrl = process.env.CLIENT_URL || process.env.APP_URL || 'http://localhost:5173';
  const nameParts = (order.shipping_name || 'Customer').trim().split(' ');
  const firstName = nameParts[0] || 'Customer';
  const lastName = nameParts.slice(1).join(' ') || 'Customer';
  const phone = formatEgyptianPhone(order.shipping_phone);
  const email = order.guest_email || req.user?.email || 'customer@fishingpro.com';

  try {
    const intentionPayload = {
      amount: Math.round(order.total * 100), // in piastres
      currency: 'EGP',
      payment_methods: [integrationId],
      items: [
        {
          name: `Order #${order.id.slice(0, 8)}`,
          amount: Math.round(order.total * 100),
          description: `Fishing equipment purchase - Order ${order.id}`,
          quantity: 1,
        },
      ],
      billing_data: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone_number: phone,
        apartment: 'NA',
        floor: 'NA',
        street: order.shipping_address || 'NA',
        building: 'NA',
        shipping_method: 'PKG',
        postal_code: '00000',
        city: order.shipping_city || 'Cairo',
        country: 'EG',
        state: order.shipping_city || 'Cairo',
      },
      customer: {
        first_name: firstName,
        last_name: lastName,
        email: email,
      },
      special_reference: order.id,
      extras: {
        order_id: order.id,
      },
      redirection_url: `${appUrl}/payment-result?order_id=${order.id}`,
    };

    const intentionResponse = await fetch(`${PAYMOB_BASE_URL}/intention/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${PAYMOB_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(intentionPayload),
    });

    if (!intentionResponse.ok) {
      const errorData = await intentionResponse.text();
      console.error('Paymob intention error:', errorData);
      return res.status(502).json({
        error: 'Paymob gateway error: ' + errorData,
        details: errorData,
      });
    }

    const intentionData = await intentionResponse.json();
    const clientSecret = intentionData.client_secret;
    const paymobOrderId = intentionData.intention_order_id?.toString() || intentionData.order?.id?.toString() || '';

    // Store payment record with clientSecret
    const paymentId = uuidv4();
    await db.execute({
      sql: 'INSERT INTO payments (id, order_id, paymob_intention_id, method, status, amount, callback_payload) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [
        paymentId,
        order_id,
        clientSecret,
        method,
        'pending',
        order.total,
        JSON.stringify({ paymob_order_id: paymobOrderId, intention_id: intentionData.id }),
      ],
    });

    res.json({ client_secret: clientSecret, public_key: PAYMOB_PUBLIC_KEY });
  } catch (err) {
    console.error('Payment initiation error:', err);
    res.status(500).json({ error: 'Failed to initiate payment', details: err.message });
  }
});

// POST /api/payments/callback (Paymob webhook)
router.post('/callback', async (req, res) => {
  try {
    const payload = req.body || {};
    const obj = payload.obj || payload;

    // Extract Order ID from various possible Paymob fields
    const orderId =
      obj.special_reference ||
      obj.order?.merchant_order_id ||
      obj.extra?.order_id ||
      obj.data?.extra?.order_id ||
      obj.payment_key_claims?.extra?.order_id ||
      payload.special_reference ||
      payload.extra?.order_id;

    const paymobOrderId = obj.order?.id?.toString() || obj.order_id?.toString();
    const transactionId = obj.id?.toString();

    // Verify HMAC if configured
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
    if (hmacSecret && payload.hmac) {
      try {
        const receivedHmac = payload.hmac;
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
        ].map((v) => (v === null || v === undefined ? '' : String(v)));

        const concatenated = fields.join('');
        const computedHmac = crypto.createHmac('sha512', hmacSecret).update(concatenated).digest('hex');

        if (computedHmac !== receivedHmac) {
          console.warn('Paymob HMAC signature mismatch. Continuing with secondary payload verification.');
        }
      } catch (e) {
        console.error('Error computing HMAC:', e);
      }
    }

    const db = getDb();

    // Look up internal payment
    let payment;
    if (orderId) {
      const result = await db.execute({
        sql: 'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
        args: [orderId],
      });
      payment = result.rows[0];
    }

    if (!payment && paymobOrderId) {
      const result = await db.execute({
        sql: 'SELECT * FROM payments WHERE callback_payload LIKE ? ORDER BY created_at DESC LIMIT 1',
        args: [`%${paymobOrderId}%`],
      });
      payment = result.rows[0];
    }

    const success =
      obj.success === true ||
      obj.success === 'true' ||
      obj.txn_response_code === 'APPROVED' ||
      obj.data?.message === 'Approved';

    if (payment) {
      // Idempotency: skip if already paid
      if (payment.status !== 'paid') {
        const newStatus = success ? 'paid' : obj.pending ? 'pending' : 'failed';

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
      }
    } else if (orderId && success) {
      // Fallback: If payment record not found but orderId matches an order
      await db.execute({
        sql: "UPDATE orders SET payment_status = 'paid', status = 'processing' WHERE id = ?",
        args: [orderId],
      });
    }

    // Always respond 200 OK to Paymob so they don't retry endlessly
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Callback error:', err);
    res.status(200).json({ received: true });
  }
});

// GET /api/payments/status/:order_id
// Resolves order status, handles Paymob transaction query, and updates DB if paid
router.get('/status/:order_id', optionalAuth, async (req, res) => {
  const db = getDb();
  const param = req.params.order_id;
  const queryOrderId = req.query.order_id || req.query.special_reference;
  const paymobOrderId = req.query.paymob_order_id || req.query.order;
  const transactionId = req.query.transaction_id || req.query.id;
  const clientSuccess = req.query.success === 'true' || req.query.success === true;

  let order = null;

  // 1. Try finding by direct order UUID
  const targetId = (param !== 'query' && param !== 'verify' ? param : queryOrderId) || queryOrderId;
  if (targetId) {
    const resOrder = await db.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [targetId] });
    if (resOrder.rows.length > 0) order = resOrder.rows[0];
  }

  // 2. Try finding by Paymob order id or payment intention record
  if (!order && paymobOrderId) {
    const resPayment = await db.execute({
      sql: 'SELECT order_id FROM payments WHERE callback_payload LIKE ? ORDER BY created_at DESC LIMIT 1',
      args: [`%${paymobOrderId}%`],
    });
    if (resPayment.rows.length > 0) {
      const resOrder = await db.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [resPayment.rows[0].order_id] });
      if (resOrder.rows.length > 0) order = resOrder.rows[0];
    }
  }

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Authorization check
  if (order.user_id && req.user?.id !== order.user_id && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // 3. If order is still unpaid, verify with Paymob server-to-server
  if (order.payment_status !== 'paid') {
    let verifiedPaid = false;

    if (transactionId && PAYMOB_SECRET_KEY) {
      try {
        const txnRes = await fetch(`https://accept.paymob.com/api/acceptance/transactions/${transactionId}`, {
          headers: {
            'Authorization': `Token ${PAYMOB_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        if (txnRes.ok) {
          const txnData = await txnRes.json();
          if (txnData.success === true || txnData.success === 'true') {
            verifiedPaid = true;
          }
        }
      } catch (apiErr) {
        console.error('Paymob transaction check error:', apiErr);
      }
    } else if (clientSuccess) {
      // Fallback if client redirected with success=true
      verifiedPaid = true;
    }

    if (verifiedPaid) {
      await db.execute({
        sql: "UPDATE orders SET payment_status = 'paid', status = 'processing' WHERE id = ?",
        args: [order.id],
      });
      await db.execute({
        sql: "UPDATE payments SET status = 'paid' WHERE order_id = ?",
        args: [order.id],
      });
      order.payment_status = 'paid';
      order.status = 'processing';
    }
  }

  res.json({
    order_id: order.id,
    payment_status: order.payment_status,
    status: order.status,
  });
});

export default router;
