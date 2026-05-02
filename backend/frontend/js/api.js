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

const LBARA_SOCIAL_LINKS = [
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/lbara.tn/?utm_source=ig_web_button_share_sheet',
    svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="5"></rect><circle cx="12" cy="12" r="3.5"></circle><circle cx="16.5" cy="7.5" r="1"></circle></svg>',
  },
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/profile.php?id=61574485700646',
    svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.2 8.2H17V4.4c-.5-.1-1.9-.2-3.4-.2-3.3 0-5.5 2-5.5 5.7v3.2H4.5v4.2h3.6V24h4.4v-6.7h3.6l.6-4.2h-4.2V10.3c0-1.2.3-2.1 1.7-2.1Z"></path></svg>',
  },
  {
    name: 'TikTok',
    url: 'https://www.tiktok.com/@lbara.tn?is_from_webapp=1&sender_device=pc',
    svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.8 3c.4 2.6 1.8 4.1 4.2 4.3v4.1c-1.4.1-2.7-.3-4-1.1v5.7c0 4.2-2.6 6.8-6.5 6.8-3.5 0-6.2-2.5-6.2-5.9 0-3.8 3.1-6.5 7.4-6v4.3c-1.8-.3-3 .5-3 1.8 0 1.1.9 1.8 2.1 1.8 1.3 0 2.1-.8 2.1-2.7V3h3.9Z"></path></svg>',
  },
];

function ensureSocialStyles() {
  if (document.getElementById('lbara-social-styles')) return;
  const style = document.createElement('style');
  style.id = 'lbara-social-styles';
  style.textContent = `
    .lbara-social-row{align-items:center;gap:8px;flex-shrink:0}
    .lbara-social-row:not(.hidden){display:inline-flex}
    .lbara-social-row.hidden{display:none!important}
    @media(min-width:1024px){.lbara-social-row.lg\\:inline-flex{display:inline-flex!important}.lbara-social-row.lg\\:hidden{display:none!important}}
    .lbara-social-icon{width:36px;height:36px;border:2px solid #003060;border-radius:999px;background:#fff;color:#003060;display:inline-flex;align-items:center;justify-content:center;box-shadow:3px 3px 0 #003060;transition:transform .15s ease,box-shadow .15s ease,background .15s ease,color .15s ease}
    .lbara-social-icon:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 #003060;background:#003060;color:#fff}
    .lbara-social-icon svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round}
    .lbara-social-icon svg path{fill:currentColor;stroke:none}
    .lbara-social-icon-footer{border-color:rgba(255,255,255,.25);background:rgba(255,255,255,.06);color:#fff;box-shadow:3px 3px 0 #B8860B}
    .lbara-social-icon-footer:hover{background:#B8860B;color:#003060;box-shadow:4px 4px 0 rgba(255,255,255,.15)}
    @media(max-width:767px){
      .lbara-social-row-mobile{gap:5px}
      .lbara-social-row-mobile .lbara-social-icon{width:23px;height:23px;box-shadow:2px 2px 0 #003060}
      .lbara-social-row-mobile .lbara-social-icon svg{width:12px;height:12px}
      #designer-credit-mobile{max-width:104px}
    }
    @media(max-width:430px){#designer-credit-mobile{max-width:88px;font-size:8px!important;padding:5px 6px!important}.lbara-social-row-mobile .lbara-social-icon{width:21px;height:21px}}
    @media(max-width:360px){#designer-credit-mobile{max-width:66px}.lbara-social-row-mobile{gap:3px}.lbara-social-row-mobile .lbara-social-icon{width:19px;height:19px}.lbara-social-row-mobile .lbara-social-icon svg{width:10px;height:10px}}
  `;
  document.head.appendChild(style);
}

function createSocialLinks(id, extraClass = '') {
  ensureSocialStyles();
  const row = document.createElement('div');
  row.id = id;
  row.className = `lbara-social-row ${extraClass}`.trim();
  LBARA_SOCIAL_LINKS.forEach(function (item) {
    const link = document.createElement('a');
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = item.name;
    link.setAttribute('aria-label', item.name);
    link.className = 'lbara-social-icon';
    link.innerHTML = item.svg;
    row.appendChild(link);
  });
  return row;
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
  if (desktopBtn && !document.getElementById('lbara-social-desktop')) {
    desktopBtn.insertAdjacentElement('beforebegin', createSocialLinks('lbara-social-desktop', 'hidden lg:inline-flex'));
  }

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
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileBtn && mobileShop && mobileMenuBtn) {
    const mobileWrap = mobileBtn.parentElement;
    mobileWrap.style.gap = '7px';
    mobileWrap.style.minWidth = '0';

    let mobileCredit = document.getElementById('designer-credit-mobile');
    if (!mobileCredit) {
      const mobileCreditLabel = window.matchMedia('(max-width: 360px)').matches ? 'by' : 'Designed by';
      mobileCredit = creditLink(
      'designer-credit-mobile',
        mobileCreditLabel,
        'lg:hidden inline-flex items-center whitespace-nowrap rounded-full border-2 border-primary/15 bg-white px-2 py-1 font-headline text-[10px] font-black text-primary shadow-[2px_2px_0px_0px_#003060] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
      );
    }

    mobileCredit.style.fontSize = '10px';
    mobileCredit.style.lineHeight = '1';
    mobileCredit.style.padding = '5px 8px';
    mobileCredit.style.maxWidth = '104px';
    mobileCredit.style.overflow = 'hidden';
    mobileCredit.style.textOverflow = 'ellipsis';
    mobileCredit.style.flexShrink = '1';

    let mobileSocial = document.getElementById('lbara-social-mobile');
    if (!mobileSocial) {
      mobileSocial = createSocialLinks('lbara-social-mobile', 'lg:hidden lbara-social-row-mobile');
    }

    mobileShop.style.fontSize = '12px';
    mobileShop.style.flexShrink = '0';
    mobileMenuBtn.style.flexShrink = '0';
    mobileMenuBtn.style.paddingLeft = '4px';
    mobileMenuBtn.style.paddingRight = '4px';

    const mobileLogo = document.querySelector('nav a[href="/index.html"]');
    if (mobileLogo) {
      mobileLogo.style.fontSize = window.matchMedia('(max-width: 360px)').matches ? '18px' : '20px';
      mobileLogo.style.letterSpacing = '-0.03em';
    }

    if (mobileMenu) {
      const menuInner = mobileMenu.querySelector('div') || mobileMenu;
      mobileBtn.className = 'cartoon-button bg-primary text-white font-black px-4 py-3 rounded-2xl text-sm text-center w-full flex items-center justify-center';
      mobileBtn.style.fontSize = '';
      mobileBtn.style.lineHeight = '';
      mobileBtn.style.padding = '';
      mobileBtn.style.flexShrink = '';
      mobileBtn.style.marginBottom = '8px';
      menuInner.insertBefore(mobileBtn, menuInner.firstChild);
    }

    mobileWrap.insertBefore(mobileSocial, mobileWrap.firstChild);
    if (!mobileWrap.contains(mobileCredit)) mobileWrap.insertBefore(mobileCredit, mobileMenuBtn);
    mobileWrap.insertBefore(mobileShop, mobileCredit);
    mobileWrap.appendChild(mobileMenuBtn);
  }
}

function initFooterSocials() {
  const footer = document.querySelector('footer');
  if (!footer || document.getElementById('lbara-social-footer')) return;

  const row = createSocialLinks('lbara-social-footer', 'mt-6');
  row.querySelectorAll('a').forEach(function (link) {
    link.classList.add('lbara-social-icon-footer');
  });

  const brandBlock = footer.querySelector('.grid > div:first-child') || footer.querySelector('div');
  if (brandBlock) brandBlock.appendChild(row);
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
  initFooterSocials();

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
