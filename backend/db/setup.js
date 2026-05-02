// Run once: node db/setup.js
// Creates the database tables and seeds initial products

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

async function setup() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('✅ Database schema applied successfully.');
  } catch (err) {
    console.error('❌ Schema error:', err.message);
  }

  // Seed admin account if ADMIN_EMAIL + ADMIN_PASSWORD are set
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    try {
      const hash = await bcrypt.hash(adminPassword, 12);
      await pool.query(
        `INSERT INTO users (email, password_hash, full_name, is_admin, is_verified)
         VALUES ($1, $2, 'Admin', TRUE, TRUE)
         ON CONFLICT (email) DO UPDATE SET is_admin = TRUE, is_verified = TRUE, password_hash = $2`,
        [adminEmail.toLowerCase(), hash]
      );
      console.log('✅ Admin account ready:', adminEmail);
    } catch (err) {
      console.error('❌ Admin seed error:', err.message);
    }
  }

  await pool.end();
}

setup();
