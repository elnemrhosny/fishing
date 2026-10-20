import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDb } from './client.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const db = getDb();
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  
  // Execute each statement separately
  const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of statements) {
    await db.execute(stmt);
  }

  // Gracefully add any new columns to users if table already existed
  const userColumns = [
    { name: 'is_verified', type: 'INTEGER NOT NULL DEFAULT 0' },
    { name: 'verification_token', type: 'TEXT' },
    { name: 'verification_expires', type: 'TEXT' },
    { name: 'reset_token', type: 'TEXT' },
    { name: 'reset_expires', type: 'TEXT' },
  ];
  for (const col of userColumns) {
    try {
      await db.execute(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
    } catch (e) {
      // Column probably already exists, ignore
    }
  }

  // Seed default admin if not exists
  const existing = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: [process.env.ADMIN_EMAIL || 'admin@fishing.com'],
  });

  if (existing.rows.length === 0) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
    await db.execute({
      sql: 'INSERT INTO users (id, email, password_hash, name, role, is_verified) VALUES (?, ?, ?, ?, ?, 1)',
      args: [uuidv4(), process.env.ADMIN_EMAIL || 'admin@fishing.com', hash, 'Admin', 'admin'],
    });
    console.log('Default admin created');
  } else {
    // Ensure admin is verified
    await db.execute({
      sql: 'UPDATE users SET is_verified = 1 WHERE email = ?',
      args: [process.env.ADMIN_EMAIL || 'admin@fishing.com'],
    });
  }

  // Seed default about page content
  const aboutExists = await db.execute({
    sql: "SELECT id FROM page_content WHERE page_key = 'about'",
    args: [],
  });
  if (aboutExists.rows.length === 0) {
    await db.execute({
      sql: "INSERT INTO page_content (id, page_key, content_en, content_ar) VALUES (?, 'about', ?, ?)",
      args: [
        uuidv4(),
        '<h2>About Us</h2><p>Welcome to our fishing equipment store. We offer the best gear for all fishing enthusiasts.</p>',
        '<h2>من نحن</h2><p>مرحباً بكم في متجرنا لمعدات الصيد. نقدم أفضل المعدات لجميع هواة الصيد.</p>',
      ],
    });
  }

  console.log('Migration complete');
}

migrate().catch(console.error);
