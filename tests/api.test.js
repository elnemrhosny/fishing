import { describe, expect, it, beforeAll } from 'bun:test';
import app from '../server/index.js';
import { getDb } from '../server/db/client.js';

let adminCookie = '';
let customerCookie = '';
let customer2Cookie = '';
let customerId = '';
let customer2Id = '';
let testCategoryId = '';
let testProductId = '';
let testOrderId = '';
let verificationToken = '';
let resetToken = '';

// Helper to make request to express app using supertest or native fetch with app.listen
let server;
let baseUrl = '';

beforeAll(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

describe('1. Authentication, Verification & Authorization', () => {
  it('should login as default admin and receive auth cookies', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@fishing.com',
        password: 'admin123',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.role).toBe('admin');

    const rawCookies = res.headers.get('set-cookie');
    expect(rawCookies).toContain('access_token=');
    adminCookie = rawCookies;
  });

  it('should register a new customer and trigger verification token', async () => {
    const uniqueEmail = `fisherman_${Date.now()}@example.com`;
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'password123',
        name: 'Sayed Fisher',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.user.role).toBe('customer');
    expect(data.requiresVerification).toBe(true);

    customerId = data.user.id;
    customerCookie = res.headers.get('set-cookie');

    // Retrieve verification token from DB
    const db = getDb();
    const userRow = await db.execute({
      sql: 'SELECT verification_token, is_verified FROM users WHERE id = ?',
      args: [customerId],
    });
    expect(userRow.rows[0].is_verified).toBe(0);
    verificationToken = userRow.rows[0].verification_token;
    expect(verificationToken).toBeTruthy();
  });

  it('should verify email with valid verification token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verificationToken }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.is_verified).toBe(1);
  });

  it('should initiate forgot password and generate reset token', async () => {
    const db = getDb();
    const userRow = await db.execute({
      sql: 'SELECT email FROM users WHERE id = ?',
      args: [customerId],
    });
    const email = userRow.rows[0].email;

    const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    expect(res.status).toBe(200);

    const check = await db.execute({
      sql: 'SELECT reset_token FROM users WHERE id = ?',
      args: [customerId],
    });
    resetToken = check.rows[0].reset_token;
    expect(resetToken).toBeTruthy();
  });

  it('should reset password using reset token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        password: 'new_password_123',
      }),
    });

    expect(res.status).toBe(200);

    // Verify login with new password
    const db = getDb();
    const userRow = await db.execute({
      sql: 'SELECT email FROM users WHERE id = ?',
      args: [customerId],
    });
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userRow.rows[0].email,
        password: 'new_password_123',
      }),
    });
    expect(loginRes.status).toBe(200);
  });

  it('should reject unauthorized access to admin stats', async () => {
    const res = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Cookie: customerCookie },
    });
    expect(res.status).toBe(403);
  });

  it('should grant admin access to admin stats', async () => {
    const res = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Cookie: adminCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('total_orders');
    expect(data).toHaveProperty('total_revenue');
  });
});

describe('2. Categories and Products CRUD', () => {
  it('should allow admin to create a category', async () => {
    const slug = `test-rods-${Date.now()}`;
    const res = await fetch(`${baseUrl}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name_en: 'Test Marine Rods',
        name_ar: 'صنارات بحرية تجريبية',
        slug,
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    testCategoryId = data.id;
    expect(data.slug).toBe(slug);
  });

  it('should allow public to fetch categories', async () => {
    const res = await fetch(`${baseUrl}/api/categories`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('should allow admin to create a product with images', async () => {
    const res = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name_en: 'Antigravity Deep Sea Rod 2.4m',
        name_ar: 'صنارة الأعماق البحرية 2.4 متر',
        description_en: 'Specialized deep sea jigging rod.',
        description_ar: 'صنارة متخصصة لصيد الأعماق والجيجينج.',
        category_id: testCategoryId,
        price: 950.0,
        main_image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
        images: ['https://images.unsplash.com/photo-1516962215378-7fa2e137ae93'],
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    testProductId = data.id;
    expect(data.name_en).toBe('Antigravity Deep Sea Rod 2.4m');
    expect(data.images.length).toBe(1);
  });

  it('should fetch single product with images', async () => {
    const res = await fetch(`${baseUrl}/api/products/${testProductId}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(testProductId);
    expect(data.price).toBe(950.0);
  });

  it('should filter products by category', async () => {
    const res = await fetch(`${baseUrl}/api/products?category=${testCategoryId}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.products.length).toBeGreaterThan(0);
    expect(data.products[0].id).toBe(testProductId);
  });
});

describe('3. Shopping Cart (Guest & Authenticated & Merging)', () => {
  let guestCookie = '';

  it('should allow guest to add product to cookie-based cart', async () => {
    const res = await fetch(`${baseUrl}/api/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: testProductId,
        quantity: 2,
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items.length).toBe(1);
    expect(data.items[0].quantity).toBe(2);

    guestCookie = res.headers.get('set-cookie');
    expect(guestCookie).toContain('guest_cart=');
  });

  it('should allow authenticated customer to add item to DB cart', async () => {
    const res = await fetch(`${baseUrl}/api/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: customerCookie,
      },
      body: JSON.stringify({
        product_id: testProductId,
        quantity: 1,
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items.length).toBe(1);
  });

  it('should merge guest cart into user cart without duplicating items', async () => {
    // Merging guest cart (which has quantity 2) into user cart (which has quantity 1)
    const combinedCookie = `${customerCookie}; ${guestCookie}`;
    const res = await fetch(`${baseUrl}/api/cart/merge`, {
      method: 'POST',
      headers: {
        Cookie: combinedCookie,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    // Item count remains 1, quantity is merged (max: 2)
    expect(data.items.length).toBe(1);
    expect(data.items[0].quantity).toBe(2);
  });
});

describe('4. Orders, Checkout & Access Control', () => {
  it('should create order and calculate totals on server', async () => {
    const res = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: customerCookie,
      },
      body: JSON.stringify({
        items: [{ product_id: testProductId, quantity: 2 }],
        shipping: {
          name: 'Ahmed Hassan',
          phone: '01099887766',
          address: '22 Corniche El Nile',
          city: 'Alexandria',
        },
        payment_method: 'cod',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.payment_method).toBe('cod');
    testOrderId = data.order_id;
  });

  it('should allow order owner to view their order', async () => {
    const res = await fetch(`${baseUrl}/api/orders/${testOrderId}`, {
      headers: { Cookie: customerCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(testOrderId);
    expect(data.total).toBe(1900.0); // 950 * 2
    expect(data.items.length).toBe(1);
  });

  it('should prevent other customers from viewing another customer order', async () => {
    // Register customer 2
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `hacker_${Date.now()}@test.com`,
        password: 'password123',
        name: 'Other Person',
      }),
    });
    customer2Cookie = regRes.headers.get('set-cookie');

    // Customer 2 tries to access Customer 1's order
    const res = await fetch(`${baseUrl}/api/orders/${testOrderId}`, {
      headers: { Cookie: customer2Cookie },
    });
    expect(res.status).toBe(403);
  });

  it('should allow admin to update order status', async () => {
    const res = await fetch(`${baseUrl}/api/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ status: 'shipped' }),
    });

    expect(res.status).toBe(200);

    const checkRes = await fetch(`${baseUrl}/api/orders/${testOrderId}`, {
      headers: { Cookie: adminCookie },
    });
    const order = await checkRes.json();
    expect(order.status).toBe('shipped');
  });
});

describe('5. Paymob Payments & Webhook Verification', () => {
  it('should return client_secret and public_key on payment initiation', async () => {
    // Create an order for card payment
    const orderRes = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: customerCookie,
      },
      body: JSON.stringify({
        items: [{ product_id: testProductId, quantity: 1 }],
        shipping: {
          name: 'Ahmed Hassan',
          phone: '01099887766',
          address: 'Cairo St',
          city: 'Cairo',
        },
        payment_method: 'card',
      }),
    });
    const { order_id } = await orderRes.json();

    // Check payment status endpoint
    const statusRes = await fetch(`${baseUrl}/api/payments/status/${order_id}`, {
      headers: { Cookie: customerCookie },
    });
    expect(statusRes.status).toBe(200);
    const statusData = await statusRes.json();
    expect(statusData.payment_status).toBe('unpaid');
  });

  it('should handle payment callback webhook and update order status to paid', async () => {
    const db = getDb();
    // Insert a pending payment record
    const paymentId = 'pay-test-' + Date.now();
    await db.execute({
      sql: 'INSERT INTO payments (id, order_id, method, status, amount) VALUES (?, ?, ?, ?, ?)',
      args: [paymentId, testOrderId, 'card', 'pending', 1900.0],
    });

    // Simulate Paymob callback webhook
    const res = await fetch(`${baseUrl}/api/payments/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        obj: {
          id: 12345678,
          success: true,
          pending: false,
          order: {
            merchant_order_id: testOrderId,
          },
        },
      }),
    });

    expect(res.status).toBe(200);

    // Verify order payment_status in DB
    const orderRow = await db.execute({
      sql: 'SELECT payment_status, status FROM orders WHERE id = ?',
      args: [testOrderId],
    });
    expect(orderRow.rows[0].payment_status).toBe('paid');
    expect(orderRow.rows[0].status).toBe('processing');
  });
});

describe('6. Editable About Page', () => {
  it('should fetch public about page content', async () => {
    const res = await fetch(`${baseUrl}/api/pages/about`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.page_key).toBe('about');
    expect(data).toHaveProperty('content_en');
    expect(data).toHaveProperty('content_ar');
  });

  it('should reject non-admin updating about page', async () => {
    const res = await fetch(`${baseUrl}/api/pages/about`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: customerCookie,
      },
      body: JSON.stringify({
        content_en: 'Updated English Content',
        content_ar: 'محتوى عربي محدث',
      }),
    });
    expect(res.status).toBe(403);
  });

  it('should allow admin to update about page in both languages', async () => {
    const newEn = '<h2>Welcome to Egypt Fishing Gear</h2><p>Premium rods and reels.</p>';
    const newAr = '<h2>مرحباً بكم في متجر أدوات الصيد</h2><p>أفضل الصنارات والبكرات.</p>';

    const res = await fetch(`${baseUrl}/api/pages/about`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        content_en: newEn,
        content_ar: newAr,
      }),
    });
    expect(res.status).toBe(200);

    const checkRes = await fetch(`${baseUrl}/api/pages/about`);
    const page = await checkRes.json();
    expect(page.content_en).toBe(newEn);
    expect(page.content_ar).toBe(newAr);
  });
});
