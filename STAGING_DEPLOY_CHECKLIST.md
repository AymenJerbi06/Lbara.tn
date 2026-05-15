# Staging Deploy Checklist — Lbara.tn

Use this before every staging or production deployment.
Check each item before moving to the next section.

---

## 1. Repository

- [ ] `.env` is NOT committed (check `.gitignore`)
- [ ] `node_modules/` is NOT committed
- [ ] `cookies.txt` and other test artifacts removed
- [ ] `.env.example` is up to date with all required keys (no real values)
- [ ] Latest code is pushed to the deploy branch

---

## 2. Platform Setup (Railway / Render)

- [ ] Backend service created
- [ ] PostgreSQL database created and linked
- [ ] `DATABASE_URL` injected automatically by platform
- [ ] Service is set to deploy from correct branch
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Health check URL configured: `/health`

---

## 3. Environment Variables (set in platform dashboard)

- [ ] `NODE_ENV=production`
- [ ] `PORT` — leave unset (platform injects it)
- [ ] `DATABASE_URL` — injected by platform (do NOT set manually)
- [ ] `FRONTEND_URL=https://your-staging-domain.railway.app`
- [ ] `JWT_SECRET` — long random string (generate fresh for staging)
- [ ] `JWT_EXPIRES_IN=7d`
- [ ] `ENCRYPTION_KEY` — 32 hex chars (generate fresh for staging)
- [ ] `SMTP_HOST` — staging SMTP (use Mailtrap or Gmail App Password)
- [ ] `SMTP_PORT=587`
- [ ] `SMTP_USER` — staging email sender
- [ ] `SMTP_PASS` — staging email password
- [ ] `EMAIL_FROM="Lbara.tn <notifications@lbara.tn>"`
- [ ] `FLOUCI_APP_TOKEN` — **sandbox** token only
- [ ] `FLOUCI_APP_SECRET` — **sandbox** secret only
- [ ] `FLOUCI_DEVELOPER_ID`
- [ ] `PAYMENT_GATEWAY=flouci` (or paymee)
- [ ] `ADMIN_EMAIL=your@email.com`

---

## 4. Database

- [ ] PostgreSQL instance is running
- [ ] Schema applied (`db/schema.sql` executed against staging DB)
- [ ] Tables exist: `users`, `products`, `orders`, `payments`, `fulfillments`, `contact_messages`, `audit_logs`
- [ ] `image_url` column exists on `products` table
- [ ] Indexes and constraints applied
- [ ] Admin user created and `is_admin = TRUE` set
- [ ] At least 3 test products seeded

---

## 5. Payment Gateway

- [ ] Using **sandbox/test** keys only — NOT live keys
- [ ] Flouci callback URL updated to staging domain
- [ ] Paymee callback URL updated to staging domain (if used)
- [ ] Webhook URL updated to: `https://your-staging-domain/api/payments/webhook/flouci`
- [ ] Webhook URL is publicly reachable (test with curl)

---

## 6. Frontend & CORS

- [ ] `FRONTEND_URL` in env matches exact staging domain (no trailing slash)
- [ ] CORS allows staging domain
- [ ] All frontend pages load correctly over HTTPS
- [ ] No mixed content warnings (HTTP assets on HTTPS page)
- [ ] Logo says `Lbara.tn` on all pages

---

## 7. Auth & Cookies

- [ ] Login works on staging HTTPS domain
- [ ] Cookie is `Secure` (only sent over HTTPS)
- [ ] Cookie is `HttpOnly`
- [ ] Cookie is `SameSite=lax`
- [ ] Logout clears session correctly
- [ ] JWT expiry behaves correctly (7 days)

---

## 8. Logs

- [ ] Logs visible in Railway/Render dashboard
- [ ] Server startup log shows correct port and environment
- [ ] DB connection confirmed in logs (no pool errors on boot)
- [ ] Request log lines appear on first page load

---

## 9. Final Boot Check

- [ ] `/health` returns `{ "status": "ok", "env": "production" }`
- [ ] Homepage loads with no console errors
- [ ] Products load on `/shop.html`
- [ ] Login page works
- [ ] Admin dashboard loads for admin user

---

**Only proceed to test matrix after all items above are checked.**
