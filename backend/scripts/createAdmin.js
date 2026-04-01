// Run once to create the admin account:
// node scripts/createAdmin.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

const EMAIL    = process.env.ADMIN_EMAIL    || 'jerbiaymen6@gmail.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

async function run() {
  const hash = await bcrypt.hash(PASSWORD, 12);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, is_admin)
     VALUES ($1, $2, 'Admin', TRUE)
     ON CONFLICT (email) DO UPDATE SET is_admin = TRUE, password_hash = $2
     RETURNING id, email, is_admin`,
    [EMAIL.toLowerCase(), hash]
  );
  console.log('[OK] Admin account ready:', result.rows[0]);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
