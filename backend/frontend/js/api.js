// ─── Lbara.tn API Client ──────────────────────────────────
// Shared fetch wrapper for all pages. Uses cookies for auth (httpOnly JWT).

const API_BASE = '/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',  // send cookies
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, message: data.message || 'Something went wrong.' };
  return data;
}

const api = {
  // Auth
  register: (body) => apiFetch('/auth/register', { method: 'POST', body }),
  login: (body) => apiFetch('/auth/login', { method: 'POST', body }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  me: () => apiFetch('/auth/me'),

  // Products
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/products${qs ? '?' + qs : ''}`);
  },
  getProduct: (id) => apiFetch(`/products/${id}`),

  // Orders
  createOrder: (body) => apiFetch('/orders', { method: 'POST', body }),
  getOrder: (id) => apiFetch(`/orders/${id}`),
  myOrders: () => apiFetch('/orders/my'),

  // Payments
  verifyPayment: (orderId) => apiFetch(`/payments/verify/${orderId}`),

  // Contact
  sendContact: (body) => apiFetch('/contact', { method: 'POST', body }),
};

// ─── Auth State Helpers ───────────────────────────────────

async function loadAuthState() {
  try {
    const { user } = await api.me();
    return user;
  } catch {
    return null;
  }
}

// Update nav button based on auth state
async function initNav() {
  const btn = document.getElementById('nav-account-btn');
  if (!btn) return;
  const user = await loadAuthState();
  if (user) {
    btn.textContent = user.is_admin ? 'Admin Panel' : 'My Account';
    btn.onclick = () => { window.location.href = user.is_admin ? '/admin/dashboard.html' : '/my-account.html'; };
  } else {
    btn.textContent = 'Login / Sign Up';
    btn.onclick = () => { window.location.href = '/login.html'; };
  }
}

// Show toast notifications
function showToast(message, type = 'success') {
  const existing = document.getElementById('lbara-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'lbara-toast';
  toast.style.cssText = `
    position: fixed; bottom: 32px; right: 32px; z-index: 9999;
    background: ${type === 'error' ? '#dc2626' : '#005F4B'};
    color: white; padding: 16px 24px; border-radius: 12px;
    font-family: Nunito, sans-serif; font-weight: 700; font-size: 15px;
    border: 3px solid ${type === 'error' ? '#991b1b' : '#003060'};
    box-shadow: 6px 6px 0 #003060; max-width: 360px;
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

document.addEventListener('DOMContentLoaded', initNav);
