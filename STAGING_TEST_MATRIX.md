# Staging Test Matrix — Lbara.tn

Run every test below after a successful staging deploy.
Mark each result: ✅ PASS | ❌ FAIL | ⚠️ PARTIAL

---

## A. Authentication

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| A1 | Register new account | Account created, redirected to shop | | |
| A2 | Register with duplicate email | Error: "account already exists" | | |
| A3 | Register with invalid email | Error: "invalid email" | | |
| A4 | Register with password < 8 chars | Error: "at least 8 characters" | | |
| A5 | Login with correct credentials | Logged in, redirected correctly | | |
| A6 | Login with wrong password | Error: "invalid email or password" | | |
| A7 | Login as admin | Redirected to `/admin/dashboard.html` | | |
| A8 | Logout | Session cleared, nav shows "Login / Sign Up" | | |
| A9 | Access `/api/auth/me` without cookie | 401 response | | |
| A10 | Access `/api/admin/stats` as normal user | 403 response | | |
| A11 | Access `/api/admin/stats` as admin | Stats returned | | |

---

## B. Products

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| B1 | Shop page loads | Products grid renders | | |
| B2 | Category filter works | Only matching products shown | | |
| B3 | Empty category | "No services found" + pagination hidden | | |
| B4 | Search by name | Matching products shown | | |
| B5 | Inactive product | Does NOT appear in shop | | |
| B6 | Product with image URL | Image shown as card header | | |
| B7 | `/api/products` returns 200 | JSON with products array | | |

---

## C. Order Creation

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| C1 | Add product to cart | Redirected to `/checkout.html` with product shown | | |
| C2 | Submit valid order | Order created, redirected to payment gateway | | |
| C3 | Submit with invalid email | 400 error shown | | |
| C4 | Submit with no product | 400 error shown | | |
| C5 | Submit with invalid UUID | 400 error shown | | |
| C6 | Apply promo code LBARA10 | 10% discount applied | | |
| C7 | Apply invalid promo code | Error shown | | |
| C8 | Double-click "Place Order" | Only ONE order created | | |
| C9 | Order appears in admin dashboard | Visible under Orders tab | | |

---

## D. Payment Flow

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| D1 | Sandbox successful payment | Redirected to `/order-confirmed.html` | | |
| D2 | Order status becomes `paid` | Visible in admin as paid | | |
| D3 | Sandbox cancelled/failed payment | Redirected with error, status = `payment_failed` | | |
| D4 | `/api/payments/verify/:id` on paid order | Returns `{ status: "paid" }` | | |
| D5 | Webhook received | Log shows "marked paid" | | |
| D6 | Webhook replayed (same payment_id) | Status does NOT change again (idempotent) | | |
| D7 | Verify called multiple times | Order not marked paid twice | | |
| D8 | Confirmation email received | Email in inbox with correct order ref | | |

---

## E. Admin & Fulfillment

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| E1 | Dashboard stats load | Total orders, revenue, pending shown | | |
| E2 | Orders tab loads all orders | Table populated | | |
| E3 | Filter orders by status | Correct subset shown | | |
| E4 | Fulfill a paid order | Modal opens, credentials submitted | | |
| E5 | Fulfillment email sent | Customer receives delivery email | | |
| E6 | Order status changes to `fulfilled` | Status pill updates | | |
| E7 | Mark order as cancelled | Status updates | | |
| E8 | Products tab loads | All products listed with thumbnails | | |
| E9 | Edit product | All fields save correctly incl. image URL | | |
| E10 | Add new product | Appears in shop | | |
| E11 | Deactivate product | Disappears from shop | | |
| E12 | Messages tab loads | Contact messages visible | | |

---

## F. Contact Form

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| F1 | Submit valid contact form | Success message shown | | |
| F2 | Submit with missing fields | Validation error shown | | |
| F3 | Message appears in admin | Visible in Messages tab | | |
| F4 | Rate limit (6th submit same IP) | 429 error | | |

---

## G. Security

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| G1 | Send request body > 10kb | 413 error | | |
| G2 | Send expired/fake JWT in cookie | 401 response | | |
| G3 | Stack trace in production error | NOT visible (generic message shown) | | |
| G4 | CORS from unknown origin | Blocked | | |
| G5 | Cookies over HTTPS | `Secure` flag present | | |
| G6 | `/health` endpoint | Returns `{ status: "ok" }` | | |
| G7 | 15+ login attempts same IP | Rate limited (429) | | |

---

## H. Email Delivery (Inbox Check)

| # | Test | Expected | Result | Notes |
|---|------|----------|--------|-------|
| H1 | Order confirmation email | Arrives, correct order ref, no broken HTML | | |
| H2 | Fulfillment delivery email | Arrives, credentials visible, correct format | | |
| H3 | Contact acknowledgement | Arrives if implemented | | |
| H4 | Sender name | Shows as "Lbara.tn" not raw email | | |
| H5 | Not in spam | Lands in inbox | | |
| H6 | Links in email | All point to staging domain, not localhost | | |

---

## Summary

| Section | Total | Pass | Fail | Blocked |
|---------|-------|------|------|---------|
| A. Auth | 11 | | | |
| B. Products | 7 | | | |
| C. Orders | 9 | | | |
| D. Payment | 8 | | | |
| E. Admin | 12 | | | |
| F. Contact | 4 | | | |
| G. Security | 7 | | | |
| H. Email | 6 | | | |
| **Total** | **64** | | | |

---

**Target: 0 failures in A, C, D, E before going to production.**
All G items must pass before production.
