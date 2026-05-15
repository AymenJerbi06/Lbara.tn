# lbara.tn — Setup Guide

## Folder Structure

```
Code/
├── backend/          ← Node.js/Express API
│   ├── server.js
│   ├── db/schema.sql
│   └── src/
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       ├── middleware/
│       └── utils/
└── frontend/         ← Static HTML pages (served by Express)
    ├── index.html
    ├── shop.html
    ├── login.html
    ├── signup.html
    ├── checkout.html
    ├── order-confirmed.html
    ├── contact.html
    ├── js/
    │   ├── api.js
    │   ├── auth.js
    │   ├── shop.js
    │   ├── checkout.js
    │   ├── order-confirmed.js
    │   └── contact.js
    └── admin/
        └── dashboard.html
```

---

## Step 1 — Install PostgreSQL

Download and install PostgreSQL from https://postgresql.org
Create a database: `psql -U postgres -c "CREATE DATABASE lbara_db;"`

---

## Step 2 — Configure environment

```bash
cd Code/backend
cp .env.example .env
```

Edit `.env` and fill in:
- `DB_PASSWORD` — your PostgreSQL password
- `JWT_SECRET` — any long random string
- `ENCRYPTION_KEY` — exactly 64 hex characters (e.g. run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `RESEND_API_KEY` — your Resend API key for sending order and support emails
- `EMAIL_FROM` — your verified sender, for example `Lbara.tn <notifications@lbara.tn>`
- `FLOUCI_APP_TOKEN` + `FLOUCI_APP_SECRET` — from https://developers.flouci.com
  OR `PAYMEE_API_KEY` + `PAYMEE_VENDOR_ID` — from https://paymee.tn
- Set `PAYMENT_GATEWAY=flouci` (or `paymee`)
- `FRONTEND_URL=http://localhost:3000`

---

## Step 3 — Install dependencies and set up DB

```bash
cd Code/backend
npm install
node db/setup.js
```

---

## Step 4 — Run the server

```bash
npm run dev     # development (auto-reload)
# or
npm start       # production
```

Open http://localhost:3000

---

## Step 5 — Create your admin account

1. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`
2. Run `node db/setup.js`
3. Or create an account at http://localhost:3000/signup.html and run:
   ```sql
   UPDATE users SET is_admin = TRUE WHERE email = 'your@email.com';
   ```
4. Go to http://localhost:3000/admin/dashboard.html

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Get current user |
| GET | /api/products | List products (filter: category, search, page, limit) |
| GET | /api/products/:id | Get product |
| POST | /api/orders | Create order (returns payment_url) |
| GET | /api/orders/my | My orders (auth required) |
| GET | /api/orders/:id | Get order status |
| GET | /api/payments/verify/:order_id | Verify payment after redirect |
| POST | /api/payments/webhook/flouci | Flouci webhook |
| POST | /api/payments/webhook/paymee | Paymee webhook |
| POST | /api/contact | Submit contact message |
| GET | /api/admin/stats | Dashboard stats (admin) |
| GET | /api/admin/orders | List all orders (admin) |
| PUT | /api/admin/orders/:id/fulfill | Fulfill order + send email (admin) |
| PUT | /api/admin/orders/:id/status | Update order status (admin) |
| GET | /api/admin/products | List products (admin) |
| POST | /api/admin/products | Create product (admin) |
| PUT | /api/admin/products/:id | Update product (admin) |
| GET | /api/admin/messages | List contact messages (admin) |

---

## Order Flow

1. Customer picks product on `/shop.html` → stored in `sessionStorage`
2. `/checkout.html` reads cart, customer enters email + picks payment
3. "Place Order Now" → POST `/api/orders` → backend creates order + calls Flouci/Paymee
4. Customer redirected to payment gateway page
5. After payment → redirected back to `/order-confirmed.html?order_id=...`
6. Page calls GET `/api/payments/verify/:order_id` to confirm
7. Backend also receives webhook → marks order as `paid`
8. Admin sees order in dashboard → clicks **Fulfill** → enters credentials → sends email
9. Customer receives delivery email

---

## Payment Gateways

### Flouci (recommended for MVP)
- Sign up at https://flouci.com/developers
- Get `APP_TOKEN` and `APP_SECRET`
- Sandbox available for testing before going live

### Paymee
- Sign up at https://paymee.tn
- Get `API_KEY` and `VENDOR_ID`
- Set `PAYMENT_GATEWAY=paymee` in `.env`

Both gateways use a **redirect flow**: customer goes to gateway page, pays, returns to your site.
Your backend also receives a **webhook** to update order status independently.

---

## Deploying to Production

1. Host backend on **Railway** or **Render** (free tier available)
2. Use **Railway PostgreSQL** add-on for the database
3. Set all env vars in the hosting dashboard
4. Set `NODE_ENV=production` and `FRONTEND_URL=https://lbara.tn`
5. Configure your domain (lbara.tn) to point to the deployment
