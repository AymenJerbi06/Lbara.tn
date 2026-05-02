require('dotenv').config();

const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

const TEST_USER = {
  email: 'test.customer@lbara.local',
  password: 'LbaraTest#3025',
  fullName: 'Lbara Test Customer',
};

const TEST_OPTIONS = [
  {
    productSlug: 'netflix-subscription',
    variantSlug: 'standard-ads',
    mode: 'price',
    amount: 1.000,
  },
  {
    productSlug: 'chatgpt-plus',
    variantSlug: 'monthly',
    mode: 'price',
    amount: 1.000,
  },
  {
    productSlug: 'coursera-certificate',
    variantSlug: 'certificate-review',
    mode: 'deposit',
    amount: 1.000,
  },
];

async function upsertTestUser() {
  const passwordHash = await bcrypt.hash(TEST_USER.password, 12);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, is_admin, is_verified)
     VALUES ($1, $2, $3, FALSE, TRUE)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       full_name = EXCLUDED.full_name,
       is_admin = FALSE,
       is_verified = TRUE
     RETURNING id, email, full_name, is_admin`,
    [TEST_USER.email, passwordHash, TEST_USER.fullName]
  );
  return result.rows[0];
}

async function seedOption({ productSlug, variantSlug, mode, amount }) {
  const result = await pool.query(
    `UPDATE product_variants v
     SET price_tnd = CASE WHEN $3 = 'price' THEN $4::numeric ELSE NULL END,
         deposit_tnd = CASE WHEN $3 = 'deposit' THEN $4::numeric ELSE NULL END,
         checkout_mode = CASE WHEN $3 = 'deposit' THEN 'quote' ELSE 'full_payment' END,
         active = TRUE
     FROM products p
     WHERE p.id = v.product_id
       AND p.slug = $1
       AND v.slug = $2
     RETURNING p.name AS product_name, v.name AS variant_name, v.price_tnd, v.deposit_tnd, v.checkout_mode`,
    [productSlug, variantSlug, mode, amount]
  );

  if (!result.rows[0]) {
    throw new Error(`Could not find ${productSlug} / ${variantSlug}`);
  }

  return result.rows[0];
}

async function main() {
  const user = await upsertTestUser();
  const options = [];
  for (const option of TEST_OPTIONS) {
    options.push(await seedOption(option));
  }

  console.log(JSON.stringify({
    user: {
      email: TEST_USER.email,
      password: TEST_USER.password,
      full_name: user.full_name,
      is_admin: user.is_admin,
    },
    seeded_options: options,
    note: 'These prices are local database test values only. Running npm run prices:sync will restore prices from the Excel catalog.',
  }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
