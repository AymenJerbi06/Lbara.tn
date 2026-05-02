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

  // Profile
  updateProfile: (body) => apiFetch('/auth/profile', { method: 'POST', body }),

  // Password change
  requestPasswordChange: () => apiFetch('/auth/request-password-change', { method: 'POST' }),
  confirmPasswordChange: (body) => apiFetch('/auth/confirm-password-change', { method: 'POST', body }),
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
  const btnMobile = document.getElementById('nav-account-btn-mobile');
  const btns = [btn, btnMobile].filter(Boolean);
  if (!btns.length) return;
  const user = await loadAuthState();
  btns.forEach(b => {
    if (user) {
      b.textContent = user.is_admin ? 'Admin Panel' : 'My Account';
      b.onclick = () => { window.location.href = user.is_admin ? '/admin/dashboard.html' : '/my-account.html'; };
    } else {
      b.textContent = 'Login / Sign Up';
      b.onclick = () => { window.location.href = '/login.html'; };
    }
  });
}

function initDesignerCredit() {
  function creditLink(id, labelText, className) {
    const link = document.createElement('a');
    link.id = id;
    link.href = 'https://aymen.info';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = 'Created and designed by Aymen';
    link.className = className;
    link.innerHTML = labelText + ' <span class="text-accent underline decoration-2 underline-offset-4">Aymen</span>';
    return link;
  }

  const desktopBtn = document.getElementById('nav-account-btn');
  if (desktopBtn && !document.getElementById('designer-credit-desktop')) {
    desktopBtn.insertAdjacentElement('beforebegin', creditLink(
      'designer-credit-desktop',
      'Created and designed by',
      'hidden lg:inline-flex items-center whitespace-nowrap rounded-full border-2 border-primary/15 bg-white px-4 py-2 font-headline text-xs font-black text-primary shadow-[3px_3px_0px_0px_#003060] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#003060] transition-all'
    ));
  }

  const mobileBtn = document.getElementById('nav-account-btn-mobile');
  const mobileShop = mobileBtn?.parentElement?.querySelector('a[href="/shop.html"]');
  const mobileMenuBtn = document.getElementById('hamburger-btn');
  if (mobileBtn && mobileShop && mobileMenuBtn) {
    const mobileWrap = mobileBtn.parentElement;
    mobileWrap.style.gap = '8px';
    mobileWrap.style.minWidth = '0';

    let mobileCredit = document.getElementById('designer-credit-mobile');
    if (!mobileCredit) {
      mobileCredit = creditLink(
      'designer-credit-mobile',
        'Created and designed by',
        'lg:hidden inline-flex items-center whitespace-nowrap rounded-full border-2 border-primary/15 bg-white px-2 py-1 font-headline text-[10px] font-black text-primary shadow-[2px_2px_0px_0px_#003060] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
      );
    }

    mobileCredit.style.fontSize = '10px';
    mobileCredit.style.lineHeight = '1';
    mobileCredit.style.padding = '5px 8px';
    mobileCredit.style.maxWidth = '190px';
    mobileCredit.style.overflow = 'hidden';
    mobileCredit.style.textOverflow = 'ellipsis';
    mobileCredit.style.flexShrink = '1';

    mobileShop.style.fontSize = '12px';
    mobileShop.style.flexShrink = '0';
    mobileBtn.style.fontSize = '11px';
    mobileBtn.style.lineHeight = '1.1';
    mobileBtn.style.padding = '7px 10px';
    mobileBtn.style.flexShrink = '0';
    mobileMenuBtn.style.flexShrink = '0';

    mobileWrap.insertBefore(mobileCredit, mobileWrap.firstChild);
    mobileWrap.insertBefore(mobileShop, mobileBtn);
    mobileWrap.appendChild(mobileMenuBtn);
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

document.addEventListener('DOMContentLoaded', function() {
  initNav();
  initDesignerCredit();

  var hamburger = document.getElementById('hamburger-btn');
  var mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function() {
      mobileMenu.style.display = mobileMenu.style.display === 'none' ? 'block' : 'none';
    });
  }
});
window.api = api;
window.showToast = showToast;
