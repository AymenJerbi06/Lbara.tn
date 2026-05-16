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
  if (!res.ok) throw { status: res.status, message: data.message || 'Something went wrong.', ...data };
  return data;
}

const api = {
  // Auth
  register: (body) => apiFetch('/auth/register', { method: 'POST', body }),
  login: (body) => apiFetch('/auth/login', { method: 'POST', body }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  me: () => apiFetch('/auth/me'),
  verifyEmailCode: (body) => apiFetch('/auth/verify-email-code', { method: 'POST', body }),
  resendVerification: (body) => apiFetch('/auth/resend-verification', { method: 'POST', body }),

  // Products
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/products${qs ? '?' + qs : ''}`);
  },
  getProduct: (id) => apiFetch(`/products/${id}`),
  getProductReviews: (id) => apiFetch(`/products/${encodeURIComponent(id)}/reviews`),
  trackProductView: (id, body = {}) => apiFetch(`/products/${encodeURIComponent(id)}/view`, { method: 'POST', body }),

  // Account engagement
  getWishlist: () => apiFetch('/account/wishlist'),
  addWishlist: (product_id) => apiFetch('/account/wishlist', { method: 'POST', body: { product_id } }),
  removeWishlist: (product_id) => apiFetch(`/account/wishlist/${encodeURIComponent(product_id)}`, { method: 'DELETE' }),
  getSaleNotifications: () => apiFetch('/account/sale-notifications'),
  addSaleNotification: (product_id) => apiFetch('/account/sale-notifications', { method: 'POST', body: { product_id } }),
  removeSaleNotification: (product_id) => apiFetch(`/account/sale-notifications/${encodeURIComponent(product_id)}`, { method: 'DELETE' }),

  // AI assistant
  chat: (message, options = {}) => apiFetch('/chat/message', {
    method: 'POST',
    body: {
      message,
      language: window.lbaraI18n?.language ? window.lbaraI18n.language() : (document.documentElement.lang || 'en'),
      history: options.history || [],
      page_context: options.page_context || '',
    },
  }),

  // Orders
  createOrder: (body) => apiFetch('/orders', { method: 'POST', body }),
  getTicketQuote: (token) => apiFetch(`/ticket-quotes/${encodeURIComponent(token)}`),
  checkoutTicketQuote: (token, body) => apiFetch(`/ticket-quotes/${encodeURIComponent(token)}/checkout`, { method: 'POST', body }),
  getOrder: (id) => apiFetch(`/orders/${id}`),
  myOrders: () => apiFetch('/orders/my'),
  reviewOrder: (id, body) => apiFetch(`/orders/${encodeURIComponent(id)}/review`, { method: 'POST', body }),
  validatePromoCode: (body) => apiFetch('/promos/validate', { method: 'POST', body }),

  // Payments
  verifyPayment: (orderId) => apiFetch(`/payments/verify/${orderId}`),
  submitTestCardPayment: (orderId, body) => apiFetch(`/payments/test-card/${encodeURIComponent(orderId)}`, { method: 'POST', body }),

  // Contact
  sendContact: (body) => apiFetch('/contact', { method: 'POST', body }),
  getContactRequests: () => apiFetch('/account/contact-requests'),

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
  if (window.lbaraI18n) window.lbaraI18n.apply(document);
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
    .lbara-social-menu{position:relative;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
    .lbara-social-menu.hidden{display:none!important}
    .lbara-social-menu.lg\\:hidden{display:inline-flex!important}
    .lbara-social-menu-toggle{height:36px;min-width:36px;border:2px solid #003060;border-radius:999px;background:#fff;color:#003060;display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:0 12px;font-family:Quicksand,Nunito,sans-serif;font-size:12px;font-weight:900;line-height:1;box-shadow:3px 3px 0 #003060;transition:transform .15s ease,box-shadow .15s ease,background .15s ease,color .15s ease}
    .lbara-social-menu-at{font-size:15px;font-weight:900;line-height:1}
    .lbara-social-menu-label{white-space:nowrap}
    .lbara-social-menu-toggle:hover,.lbara-social-menu.is-open .lbara-social-menu-toggle{transform:translate(-1px,-1px);box-shadow:4px 4px 0 #003060;background:#003060;color:#fff}
    .lbara-social-menu-panel{position:absolute;right:0;top:calc(100% + 10px);z-index:10020;min-width:168px;border:2px solid #003060;border-radius:18px;background:#fff;padding:8px;box-shadow:5px 5px 0 #003060;opacity:0;pointer-events:none;transform:translateY(-6px) scale(.98);transition:opacity .16s ease,transform .16s ease}
    .lbara-social-menu.is-open .lbara-social-menu-panel{opacity:1;pointer-events:auto;transform:translateY(0) scale(1)}
    .lbara-social-menu-item{display:flex;align-items:center;gap:9px;width:100%;border-radius:12px;padding:9px 10px;color:#003060;font-family:Quicksand,sans-serif;font-size:13px;font-weight:900;text-decoration:none;transition:background .15s ease,color .15s ease,transform .15s ease}
    .lbara-social-menu-item:hover{background:#003060;color:#fff;transform:translateX(-1px)}
    .lbara-social-menu-item svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round}
    .lbara-social-menu-item svg path{fill:currentColor;stroke:none}
    .lbara-social-icon-footer{border-color:rgba(255,255,255,.25);background:rgba(255,255,255,.06);color:#fff;box-shadow:3px 3px 0 #B8860B}
    .lbara-social-icon-footer:hover{background:#B8860B;color:#003060;box-shadow:4px 4px 0 rgba(255,255,255,.15)}
    @media(max-width:767px){
      .lbara-social-row-mobile{gap:5px}
      .lbara-social-row-mobile .lbara-social-icon{width:23px;height:23px;box-shadow:2px 2px 0 #003060}
      .lbara-social-row-mobile .lbara-social-icon svg{width:12px;height:12px}
      .lbara-social-menu-mobile .lbara-social-menu-toggle{height:32px;min-width:74px;padding:0 9px;font-size:11px;box-shadow:2px 2px 0 #003060}
      .lbara-social-menu-mobile .lbara-social-menu-at{font-size:13px}
      .lbara-social-menu-mobile .lbara-social-menu-panel{right:-8px;min-width:154px;border-radius:16px;box-shadow:4px 4px 0 #003060}
      .lbara-social-menu-mobile .lbara-social-menu-item{font-size:12px;padding:8px 9px}
      #designer-credit-mobile{max-width:104px}
    }
    @media(min-width:1024px){.lbara-social-menu.lg\\:hidden{display:none!important}}
    @media(max-width:430px){#designer-credit-mobile{max-width:88px;font-size:8px!important;padding:5px 6px!important}.lbara-social-row-mobile .lbara-social-icon{width:21px;height:21px}.lbara-social-menu-mobile .lbara-social-menu-toggle{height:30px;min-width:66px;padding:0 7px;font-size:10px}.lbara-social-menu-mobile .lbara-social-menu-panel{right:-10px}}
    @media(max-width:360px){#designer-credit-mobile{max-width:66px}.lbara-social-row-mobile{gap:3px}.lbara-social-row-mobile .lbara-social-icon{width:19px;height:19px}.lbara-social-row-mobile .lbara-social-icon svg{width:10px;height:10px}.lbara-social-menu-mobile .lbara-social-menu-toggle{height:28px;min-width:60px;padding:0 6px;font-size:9px}.lbara-social-menu-mobile .lbara-social-menu-at{font-size:12px}}
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

function createSocialMenu(id, extraClass = '') {
  ensureSocialStyles();
  const menu = document.createElement('div');
  menu.id = id;
  menu.className = `lbara-social-menu ${extraClass}`.trim();
  menu.innerHTML = `
    <button type="button" class="lbara-social-menu-toggle" aria-label="Open social media links" aria-expanded="false">
      <span class="lbara-social-menu-at" aria-hidden="true">@</span>
      <span class="lbara-social-menu-label">Socials</span>
    </button>
    <div class="lbara-social-menu-panel" role="menu">
      ${LBARA_SOCIAL_LINKS.map(function (item) {
        return `<a class="lbara-social-menu-item" href="${item.url}" target="_blank" rel="noopener noreferrer" role="menuitem" aria-label="${item.name}">
          ${item.svg}
          <span>${item.name}</span>
        </a>`;
      }).join('')}
    </div>
  `;

  const toggle = menu.querySelector('.lbara-social-menu-toggle');
  function close() {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    const open = !menu.classList.contains('is-open');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) mobileMenu.style.display = 'none';
    document.querySelectorAll('.lbara-language-wrap.open').forEach(function (item) {
      item.classList.remove('open');
    });
    document.querySelectorAll('.lbara-social-menu.is-open').forEach(function (item) {
      if (item !== menu) item.classList.remove('is-open');
      const button = item.querySelector('.lbara-social-menu-toggle');
      if (button) button.setAttribute('aria-expanded', 'false');
    });
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  document.addEventListener('click', function (event) {
    if (!menu.contains(event.target)) close();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') close();
  });

  return menu;
}

function ensureDesktopActions() {
  const desktopBtn = document.getElementById('nav-account-btn');
  if (!desktopBtn || !desktopBtn.parentElement) return null;

  let actions = document.getElementById('lbara-desktop-actions');
  if (!actions) {
    actions = document.createElement('div');
    actions.id = 'lbara-desktop-actions';
    actions.className = 'hidden lg:flex items-center gap-3 flex-shrink-0';
    desktopBtn.parentElement.insertBefore(actions, desktopBtn);
  }

  if (!actions.contains(desktopBtn)) {
    actions.appendChild(desktopBtn);
  }

  return actions;
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
  const desktopActions = ensureDesktopActions();
  if (desktopBtn && desktopActions && !document.getElementById('designer-credit-desktop')) {
    desktopActions.insertBefore(creditLink(
      'designer-credit-desktop',
      'Created and designed by',
      'hidden lg:inline-flex items-center whitespace-nowrap rounded-full border-2 border-primary/15 bg-white px-4 py-2 font-headline text-xs font-black text-primary shadow-[3px_3px_0px_0px_#003060] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#003060] transition-all'
    ), desktopActions.firstChild);
  }

  if (desktopBtn && desktopActions && !document.getElementById('lbara-social-desktop')) {
    desktopActions.insertBefore(createSocialLinks('lbara-social-desktop', 'hidden lg:inline-flex'), desktopBtn);
  }

  const mobileBtn = document.getElementById('nav-account-btn-mobile');
  const mobileShop = mobileBtn?.parentElement?.querySelector('a[href="/shop.html"]');
  const mobileMenuBtn = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileBtn && mobileShop && mobileMenuBtn) {
    const mobileWrap = mobileBtn.parentElement;
    mobileWrap.style.gap = '7px';
    mobileWrap.style.minWidth = '0';
    mobileWrap.style.justifyContent = 'flex-end';

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
    mobileCredit.style.maxWidth = '118px';
    mobileCredit.style.overflow = 'hidden';
    mobileCredit.style.textOverflow = 'ellipsis';
    mobileCredit.style.flexShrink = '1';

    let mobileSocial = document.getElementById('lbara-social-mobile');
    if (!mobileSocial) {
      mobileSocial = createSocialMenu('lbara-social-mobile', 'lg:hidden lbara-social-menu-mobile');
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

    mobileWrap.insertBefore(mobileCredit, mobileWrap.firstChild);
    mobileWrap.insertBefore(mobileSocial, mobileShop);
    const mobileLanguage = document.getElementById('lbara-language-mobile');
    if (mobileLanguage) mobileWrap.insertBefore(mobileLanguage, mobileShop);
    mobileWrap.insertBefore(mobileShop, mobileMenuBtn);
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

function initLanguageSystem() {
  function dispatchLanguageReady() {
    if (!window.lbaraI18n) return;
    document.dispatchEvent(new CustomEvent('lbara:i18nready', { detail: { lang: window.lbaraI18n.language() } }));
    document.dispatchEvent(new CustomEvent('lbara:languagechange', { detail: { lang: window.lbaraI18n.language() } }));
  }

  if (window.lbaraI18n) {
    window.lbaraI18n.init();
    dispatchLanguageReady();
    return;
  }

  if (document.getElementById('lbara-i18n-script')) return;

  const script = document.createElement('script');
  script.id = 'lbara-i18n-script';
  script.src = '/js/i18n.js';
  script.onload = function () {
    if (window.lbaraI18n) {
      window.lbaraI18n.init();
      dispatchLanguageReady();
    }
  };
  document.head.appendChild(script);
}

function lbaraT(text) {
  return window.lbaraI18n?.t ? window.lbaraI18n.t(text) : text;
}

function lbaraEscapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ensureEngagementStyles() {
  if (document.getElementById('lbara-engagement-styles')) return;
  const style = document.createElement('style');
  style.id = 'lbara-engagement-styles';
  style.textContent = `
    .lbara-engagement-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .lbara-engagement-btn{border:2px solid #003060;background:#fff;color:#003060;border-radius:999px;min-height:38px;padding:8px 12px;font-family:Quicksand,Nunito,sans-serif;font-weight:900;font-size:12px;display:inline-flex;align-items:center;justify-content:center;gap:6px;box-shadow:3px 3px 0 #003060;transition:transform .14s ease,box-shadow .14s ease,background .14s ease,color .14s ease}
    .lbara-engagement-btn:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 #003060}
    .lbara-engagement-btn:active{transform:translate(2px,2px);box-shadow:none}
    .lbara-engagement-btn.is-active{background:#003060;color:#fff;box-shadow:3px 3px 0 #B8860B}
    .lbara-engagement-btn .material-symbols-outlined{font-size:18px;line-height:1}
    .lbara-engagement-btn-icon{width:38px;padding:0}
    .lbara-engagement-btn-icon .lbara-engagement-label{display:none}
    .lbara-sale-btn{background:#fffdf7;color:#7a5600}
    .lbara-sale-btn.is-active{background:#B8860B;color:#fff}
    .lbara-rating-stars{display:inline-flex;align-items:center;gap:1px;color:#B8860B}
    .lbara-rating-stars > .material-symbols-outlined:not(.lbara-rating-star){font-variation-settings:'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 24!important}
    .lbara-rating-star{font-size:18px!important;line-height:1;font-variation-settings:'FILL' 1,'wght' 700,'GRAD' 0,'opsz' 24!important}
    .lbara-rating-star.is-empty{font-variation-settings:'FILL' 0,'wght' 700,'GRAD' 0,'opsz' 24!important;opacity:.35}
    .lbara-rating-pill{border:2px solid rgba(0,48,96,.14);background:#fffdf7;color:#003060;border-radius:999px;min-height:38px;padding:7px 12px;font-family:Quicksand,Nunito,sans-serif;font-weight:900;font-size:12px;display:inline-flex;align-items:center;gap:7px;flex:1;justify-content:center}
    .lbara-rating-pill strong{font-size:12px;color:#003060}
    .lbara-chat-toggle{position:fixed;right:24px;bottom:24px;z-index:9998;width:58px;height:58px;border-radius:999px;border:3px solid #003060;background:#B8860B;color:#fff;box-shadow:5px 5px 0 #003060;display:flex;align-items:center;justify-content:center;transition:transform .14s ease,box-shadow .14s ease}
    .lbara-chat-toggle:hover{transform:translate(-1px,-1px);box-shadow:6px 6px 0 #003060}
    .lbara-chat-panel{position:fixed;right:24px;bottom:96px;z-index:9998;width:min(380px,calc(100vw - 32px));max-height:min(620px,calc(100vh - 128px));background:#fff;border:4px solid #003060;border-radius:26px;box-shadow:8px 8px 0 #003060;overflow:hidden;display:flex;flex-direction:column}
    .lbara-chat-panel.hidden{display:none}
    .lbara-chat-head{background:#003060;color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px}
    .lbara-chat-head p{margin:0}
    .lbara-chat-close{width:32px;height:32px;border-radius:999px;border:2px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center}
    .lbara-chat-messages{padding:14px;overflow:auto;display:flex;flex-direction:column;gap:10px;background:#F8FAFC;min-height:240px}
    .lbara-chat-bubble{border:2px solid rgba(0,48,96,.12);border-radius:18px;padding:10px 12px;font-family:Nunito,sans-serif;font-weight:800;font-size:13px;line-height:1.45;max-width:88%}
    .lbara-chat-bubble.bot{background:#fff;color:#003060;align-self:flex-start}
    .lbara-chat-bubble.user{background:#003060;color:#fff;align-self:flex-end}
    .lbara-chat-bubble.is-typing{display:inline-flex;align-items:center;gap:5px;min-width:58px;min-height:38px}
    .lbara-chat-typing-dot{width:7px;height:7px;border-radius:999px;background:#B8860B;animation:lbaraTypingDot 1s infinite ease-in-out}
    .lbara-chat-typing-dot:nth-child(2){animation-delay:.14s}
    .lbara-chat-typing-dot:nth-child(3){animation-delay:.28s}
    @keyframes lbaraTypingDot{0%,80%,100%{opacity:.35;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
    .lbara-chat-next-steps{align-self:flex-start;max-width:94%;padding:4px 0 2px;display:flex;flex-direction:column;gap:8px}
    .lbara-chat-next-label{padding-left:2px;font-family:Quicksand,Nunito,sans-serif;font-size:11px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:rgba(0,48,96,.62)}
    .lbara-chat-detail-row{display:flex;flex-wrap:wrap;gap:7px}
    .lbara-chat-detail-chip{max-width:100%;border:2px solid rgba(0,48,96,.16);background:#fff;color:#003060;border-radius:999px;padding:7px 11px;font-family:Quicksand,Nunito,sans-serif;font-size:11px;font-weight:900;line-height:1.25;box-shadow:2px 2px 0 rgba(0,48,96,.14);transition:transform .14s ease,box-shadow .14s ease,background .14s ease,color .14s ease;white-space:normal;text-align:left}
    .lbara-chat-detail-chip:hover{background:#003060;color:#fff;transform:translate(-1px,-1px);box-shadow:3px 3px 0 #B8860B}
    .lbara-chat-detail-chip:active{transform:translate(1px,1px);box-shadow:none}
    .lbara-chat-contact-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
    .lbara-chat-contact-button{display:inline-flex;align-items:center;gap:6px;border:2px solid #003060;background:#B8860B;color:#fff;border-radius:999px;padding:8px 12px;font-family:Quicksand,sans-serif;font-size:12px;font-weight:900;text-decoration:none;box-shadow:2px 2px 0 #003060}
    .lbara-chat-contact-button:hover{transform:translate(-1px,-1px);box-shadow:3px 3px 0 #003060}
    .lbara-chat-form{display:flex;gap:8px;padding:12px;border-top:2px solid rgba(0,48,96,.08);background:#fff}
    .lbara-chat-input{flex:1;border:2px solid rgba(0,48,96,.18);border-radius:16px;padding:10px 12px;font-weight:800;color:#003060;min-width:0}
    .lbara-chat-input:focus{outline:none;border-color:#B8860B}
    .lbara-chat-send{width:42px;height:42px;border-radius:14px;background:#003060;color:#fff;border:2px solid #003060;display:flex;align-items:center;justify-content:center;box-shadow:3px 3px 0 #B8860B}
    @media(max-width:767px){.lbara-chat-toggle{right:16px;bottom:16px;width:52px;height:52px}.lbara-chat-panel{right:16px;bottom:82px;border-radius:22px}.lbara-engagement-btn{font-size:11px;min-height:35px;padding:7px 10px}.lbara-engagement-btn-icon{width:35px;padding:0}}
  `;
  document.head.appendChild(style);
}

const lbaraEngagement = (function () {
  const state = {
    loaded: false,
    user: null,
    favorites: new Set(),
    saleAlerts: new Set(),
  };

  async function load(force) {
    if (state.loaded && !force) return state;
    state.loaded = true;
    state.user = await loadAuthState();
    state.favorites = new Set();
    state.saleAlerts = new Set();

    if (!state.user) {
      syncButtons();
      return state;
    }

    try {
      const [wishlist, saleNotifications] = await Promise.all([
        api.getWishlist(),
        api.getSaleNotifications(),
      ]);
      (wishlist.products || []).forEach(function (item) { state.favorites.add(item.id); });
      (saleNotifications.products || []).forEach(function (item) { state.saleAlerts.add(item.id); });
    } catch {
      state.loaded = false;
    }

    syncButtons();
    return state;
  }

  async function requireUser() {
    await load();
    if (state.user) return true;
    showToast('Create an account or log in to save favorites and sale alerts.', 'error');
    return false;
  }

  function syncButtons(root) {
    ensureEngagementStyles();
    const scope = root || document;
    scope.querySelectorAll('[data-favorite-product]').forEach(function (button) {
      const id = button.getAttribute('data-favorite-product');
      const active = state.favorites.has(id);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      const label = button.getAttribute('data-favorite-label') || 'Favorite';
      button.innerHTML = '<span class="material-symbols-outlined">' + (active ? 'favorite' : 'favorite') + '</span><span class="lbara-engagement-label">' + lbaraEscapeHtml(lbaraT(active ? 'Saved' : label)) + '</span>';
    });
    scope.querySelectorAll('[data-sale-product]').forEach(function (button) {
      const id = button.getAttribute('data-sale-product');
      const active = state.saleAlerts.has(id);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.innerHTML = '<span class="material-symbols-outlined">' + (active ? 'notifications_active' : 'notifications') + '</span><span class="lbara-engagement-label">' + lbaraEscapeHtml(lbaraT(active ? 'Sale alert on' : 'Notify me if discounted')) + '</span>';
    });
  }

  async function toggleFavorite(productId, productName) {
    if (!(await requireUser())) return;
    const active = state.favorites.has(productId);
    try {
      if (active) {
        await api.removeWishlist(productId);
        state.favorites.delete(productId);
        showToast((productName || 'Service') + ' removed from favorites.');
      } else {
        await api.addWishlist(productId);
        state.favorites.add(productId);
        showToast((productName || 'Service') + ' saved to your favorites.');
      }
      syncButtons();
    } catch (err) {
      showToast(err.message || 'Could not update favorites.', 'error');
    }
  }

  async function toggleSaleAlert(productId, productName) {
    if (!(await requireUser())) return;
    const active = state.saleAlerts.has(productId);
    try {
      if (active) {
        await api.removeSaleNotification(productId);
        state.saleAlerts.delete(productId);
        showToast('Sale alert turned off.');
      } else {
        await api.addSaleNotification(productId);
        state.saleAlerts.add(productId);
        showToast('We will notify you when ' + (productName || 'this service') + ' is discounted.');
      }
      syncButtons();
    } catch (err) {
      showToast(err.message || 'Could not update sale alert.', 'error');
    }
  }

  document.addEventListener('click', function (event) {
    const favorite = event.target.closest('[data-favorite-product]');
    if (favorite) {
      event.preventDefault();
      event.stopPropagation();
      favorite.classList.remove('lbara-favorite-press');
      void favorite.offsetWidth;
      favorite.classList.add('lbara-favorite-press');
      setTimeout(function () { favorite.classList.remove('lbara-favorite-press'); }, 420);
      toggleFavorite(favorite.getAttribute('data-favorite-product'), favorite.getAttribute('data-product-name'));
      return;
    }

    const sale = event.target.closest('[data-sale-product]');
    if (sale) {
      event.preventDefault();
      event.stopPropagation();
      toggleSaleAlert(sale.getAttribute('data-sale-product'), sale.getAttribute('data-product-name'));
    }
  });

  return { load, syncButtons, toggleFavorite, toggleSaleAlert, state };
})();

function initChatWidget() {
  if (document.getElementById('lbara-chat-toggle')) return;
  ensureEngagementStyles();

  const toggle = document.createElement('button');
  toggle.id = 'lbara-chat-toggle';
  toggle.className = 'lbara-chat-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Open Lbara assistant');
  toggle.innerHTML = '<span class="material-symbols-outlined">support_agent</span>';

  const panel = document.createElement('section');
  panel.id = 'lbara-chat-panel';
  panel.className = 'lbara-chat-panel hidden';
  panel.setAttribute('aria-label', 'Lbara assistant chat');
  panel.innerHTML = `
    <div class="lbara-chat-head">
      <div>
        <p style="font-family:Quicksand,sans-serif;font-weight:900;font-size:16px;">Lbara assistant</p>
        <p style="font-size:11px;opacity:.75;font-weight:800;">Ask before you buy</p>
      </div>
      <button type="button" class="lbara-chat-close" aria-label="Close chat"><span class="material-symbols-outlined" style="font-size:18px;">close</span></button>
    </div>
    <div id="lbara-chat-messages" class="lbara-chat-messages">
      <div class="lbara-chat-bubble bot">Hi. Tell me what you want to buy, compare, or understand, and I will guide you through the right option, what details are needed, delivery, and checkout.</div>
    </div>
    <form id="lbara-chat-form" class="lbara-chat-form">
      <input id="lbara-chat-input" class="lbara-chat-input" autocomplete="off" maxlength="800" placeholder="Ask a question..."/>
      <button class="lbara-chat-send" type="submit" aria-label="Send"><span class="material-symbols-outlined">send</span></button>
    </form>
  `;

  document.body.appendChild(toggle);
  document.body.appendChild(panel);
  if (window.lbaraI18n) window.lbaraI18n.apply(panel);

  const close = panel.querySelector('.lbara-chat-close');
  const messages = panel.querySelector('#lbara-chat-messages');
  const form = panel.querySelector('#lbara-chat-form');
  const input = panel.querySelector('#lbara-chat-input');
  let supportMode = false;
  let supportStarted = false;
  let supportTurns = 0;
  let contactPromptShown = false;
  let sending = false;
  const conversation = [];

  function addBubble(text, role) {
    const bubble = document.createElement('div');
    bubble.className = 'lbara-chat-bubble ' + role;
    bubble.innerHTML = lbaraEscapeHtml(text);
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  }

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function pushHistory(role, content) {
    conversation.push({ role, content: String(content || '').slice(0, 700) });
    while (conversation.length > 10) conversation.shift();
  }

  function addTypingBubble() {
    const bubble = document.createElement('div');
    bubble.className = 'lbara-chat-bubble bot is-typing';
    bubble.setAttribute('aria-label', lbaraT('Thinking...'));
    bubble.innerHTML = '<span class="lbara-chat-typing-dot"></span><span class="lbara-chat-typing-dot"></span><span class="lbara-chat-typing-dot"></span>';
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  }

  async function typeBotText(bubble, text) {
    const answer = String(text || lbaraT('I could not answer that right now.'));
    const step = answer.length > 260 ? 4 : 2;
    const delay = answer.length > 420 ? 8 : 14;
    bubble.classList.remove('is-typing');
    bubble.removeAttribute('aria-label');
    bubble.textContent = '';
    for (let i = step; i < answer.length; i += step) {
      bubble.textContent = answer.slice(0, i);
      messages.scrollTop = messages.scrollHeight;
      await sleep(delay);
    }
    bubble.textContent = answer;
    messages.scrollTop = messages.scrollHeight;
  }

  function chatPageContext() {
    const title = document.title ? 'Page: ' + document.title : '';
    const path = window.location.pathname ? 'Path: ' + window.location.pathname : '';
    const productTitle = document.getElementById('product-title')?.textContent?.trim();
    const shopSearch = document.getElementById('shop-search')?.value?.trim();
    return [
      title,
      path,
      productTitle ? 'Product: ' + productTitle : '',
      shopSearch ? 'Shop search: ' + shopSearch : '',
    ].filter(Boolean).join(' | ').slice(0, 500);
  }

  function addDetailPrompts(prompts) {
    if (!Array.isArray(prompts) || !prompts.length) return;
    messages.querySelectorAll('.lbara-chat-next-steps').forEach(function (node) { node.remove(); });
    const suggestions = document.createElement('div');
    suggestions.className = 'lbara-chat-next-steps';
    const label = document.createElement('div');
    label.className = 'lbara-chat-next-label';
    label.textContent = lbaraT('Tell me a bit more:');
    const row = document.createElement('div');
    row.className = 'lbara-chat-detail-row';
    prompts.slice(0, 3).forEach(function (prompt) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lbara-chat-detail-chip';
      button.textContent = lbaraT(prompt);
      button.addEventListener('click', function () { send(lbaraT(prompt)); });
      row.appendChild(button);
    });
    suggestions.appendChild(label);
    suggestions.appendChild(row);
    messages.appendChild(suggestions);
    messages.scrollTop = messages.scrollHeight;
  }

  function addContactPrompt() {
    if (contactPromptShown) return;
    contactPromptShown = true;
    const bubble = document.createElement('div');
    bubble.className = 'lbara-chat-bubble bot';
    bubble.innerHTML = lbaraEscapeHtml(lbaraT('If you still need a person, contact us and we will follow up from the contact page.'))
      + '<div class="lbara-chat-contact-row">'
      + '<a class="lbara-chat-contact-button" href="/contact.html?category=technical">'
      + '<span class="material-symbols-outlined" style="font-size:16px;">support_agent</span>'
      + lbaraEscapeHtml(lbaraT('Contact us'))
      + '</a>'
      + '</div>';
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  function startSupportFlow() {
    supportMode = true;
    if (!supportStarted) {
      supportStarted = true;
      addBubble(lbaraT('Start here with the assistant. Ask your question, and if it still needs a human after one or two messages, I will send you to the contact page.'), 'bot');
    }
  }

  function openChat(options = {}) {
    panel.classList.remove('hidden');
    if (options.support) startSupportFlow();
    setTimeout(function () { input.focus(); }, 50);
  }

  async function send(text) {
    const message = String(text || '').trim();
    if (!message || sending) return;
    sending = true;
    messages.querySelectorAll('.lbara-chat-next-steps').forEach(function (node) { node.remove(); });
    const previousHistory = conversation.slice(-8);
    addBubble(message, 'user');
    pushHistory('user', message);
    input.value = '';
    if (supportMode) supportTurns += 1;
    const loading = addTypingBubble();
    try {
      await sleep(Math.min(850, Math.max(420, message.length * 12)));
      const res = await api.chat(message, {
        history: previousHistory,
        page_context: chatPageContext(),
      });
      const answer = res.answer || lbaraT('I could not answer that right now.');
      await typeBotText(loading, answer);
      pushHistory('assistant', answer);
      if (res.needs_details) addDetailPrompts(res.detail_prompts);
    } catch (err) {
      const errorMessage = lbaraT('Chat is unavailable right now.');
      await typeBotText(loading, errorMessage);
      pushHistory('assistant', errorMessage);
    } finally {
      sending = false;
    }
    if (supportMode && supportTurns >= 2) addContactPrompt();
    messages.scrollTop = messages.scrollHeight;
  }

  toggle.addEventListener('click', function () {
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) input.focus();
  });
  close.addEventListener('click', function () { panel.classList.add('hidden'); });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    send(input.value);
  });

  document.addEventListener('click', function (event) {
    const supportLink = event.target.closest('[data-lbara-support-chat]');
    if (!supportLink) return;
    event.preventDefault();
    openChat({ support: true });
  });

  window.lbaraOpenChat = openChat;
  window.lbaraOpenSupportChat = function () { openChat({ support: true }); };
}

function ensureMotionStyles() {
  if (document.getElementById('lbara-motion-styles')) return;
  const style = document.createElement('style');
  style.id = 'lbara-motion-styles';
  style.textContent = `
    @keyframes lbaraPageIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes lbaraLogoHello{0%{transform:translateY(-6px) scale(.96);filter:saturate(.8)}60%{transform:translateY(1px) scale(1.04)}100%{transform:translateY(0) scale(1);filter:saturate(1)}}
    @keyframes lbaraLogoClick{0%{transform:scale(1)}45%{transform:scale(.94) rotate(-1deg)}100%{transform:scale(1.04) rotate(.6deg)}}
    @keyframes lbaraStampIn{0%{opacity:0;transform:translateY(16px) scale(.9) rotate(-2deg)}55%{opacity:1;transform:translateY(-2px) scale(1.04) rotate(.8deg)}100%{opacity:1;transform:translateY(0) scale(1) rotate(0)}}
    @keyframes lbaraIntroOut{0%,55%{opacity:1}100%{opacity:0;visibility:hidden}}
    @keyframes lbaraTapBounce{0%{transform:scale(1)}45%{transform:scale(.96)}100%{transform:scale(1)}}
    @keyframes lbaraOptionSelect{0%{transform:scale(.985);box-shadow:4px 4px 0 #003060}100%{transform:scale(1);box-shadow:8px 8px 0 #003060}}
    body.lbara-motion-ready main{animation:lbaraPageIn .42s ease both}
    body.lbara-page-leaving main,body.lbara-page-leaving footer{opacity:0;transform:translateY(8px);transition:opacity .16s ease,transform .16s ease}
    .lbara-logo-interactive{position:relative;display:inline-flex;align-items:center;transition:transform .18s ease,color .18s ease;text-decoration:none}
    .lbara-logo-interactive::after{content:'';position:absolute;left:8%;right:8%;bottom:-6px;height:4px;border-radius:999px;background:#B8860B;transform:scaleX(0);transform-origin:left;opacity:.85;transition:transform .2s ease}
    .lbara-logo-interactive:hover{transform:translateY(-2px)}
    .lbara-logo-interactive:hover::after{transform:scaleX(1)}
    .lbara-logo-interactive.is-logo-clicked{animation:lbaraLogoClick .22s ease both}
    body.lbara-motion-ready .lbara-logo-interactive{animation:lbaraLogoHello .55s cubic-bezier(.2,.8,.2,1) both}
    nav a[href]:not(.cartoon-button):not(.lbara-social-icon):not(.lbara-social-menu-item):not(.lbara-logo-interactive):not([id^="designer-credit"]){position:relative;text-decoration:none}
    nav a[href]:not(.cartoon-button):not(.lbara-social-icon):not(.lbara-social-menu-item):not(.lbara-logo-interactive):not([id^="designer-credit"])::after{content:'';position:absolute;left:0;right:0;bottom:-7px;height:4px;border-radius:999px;background:#003060;transform:scaleX(0);transform-origin:left;transition:transform .18s ease,background .18s ease}
    nav a[href]:not(.cartoon-button):not(.lbara-social-icon):not(.lbara-social-menu-item):not(.lbara-logo-interactive):not([id^="designer-credit"]):hover::after,
    nav a[href]:not(.cartoon-button):not(.lbara-social-icon):not(.lbara-social-menu-item):not(.lbara-logo-interactive):not([id^="designer-credit"]):focus-visible::after{transform:scaleX(1)}
    .lbara-intro-stamp{position:fixed;inset:0;z-index:20000;display:flex;align-items:center;justify-content:center;background:#F8FAFC;pointer-events:none;animation:lbaraIntroOut 1.05s ease .45s forwards}
    .lbara-intro-badge{font-family:Quicksand,Nunito,sans-serif;font-weight:900;color:#003060;background:#fff;border:4px solid #003060;border-radius:28px;padding:18px 28px;box-shadow:8px 8px 0 #003060;letter-spacing:-.02em;animation:lbaraStampIn .55s cubic-bezier(.2,.9,.2,1) both}
    .lbara-intro-badge span{display:block;color:#B8860B;font-size:12px;text-transform:uppercase;letter-spacing:.16em;margin-top:4px;text-align:center}
    .lbara-section-enter{animation:lbaraPageIn .28s ease both}
    @keyframes lbaraProductOpen{0%{transform:scale(1);filter:saturate(1)}45%{transform:scale(.985);filter:saturate(1.16)}100%{transform:scale(1);filter:saturate(1)}}
    @keyframes lbaraCartPress{0%{transform:translateY(0) scale(1)}45%{transform:translateY(2px) scale(.96)}100%{transform:translateY(-1px) scale(1.03)}}
    @keyframes lbaraFavoritePress{0%{transform:scale(1)}50%{transform:scale(1.18) rotate(-5deg)}100%{transform:scale(1)}}
    #products-grid{transition:opacity .2s ease,transform .2s ease,filter .2s ease}
    #products-grid.lbara-grid-switching{opacity:.45;transform:translateY(8px);filter:saturate(.88)}
    #products-grid .shop-product-card{will-change:transform;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
    #products-grid .shop-product-card:hover{transform:translate(-3px,-3px) rotate(-.12deg);box-shadow:11px 11px 0 #003060}
    #products-grid .shop-product-card:active{transform:translate(1px,1px);box-shadow:5px 5px 0 #003060}
    #products-grid .shop-product-card.lbara-product-opening{animation:lbaraProductOpen .22s ease both;border-color:#B8860B}
    #products-grid .shop-product-card .shop-card-img{transition:transform .36s ease,filter .36s ease}
    #products-grid .shop-product-card:hover .shop-card-img{transform:scale(1.035);filter:saturate(1.08)}
    #products-grid .shop-product-card .inline-flex.w-10 .material-symbols-outlined{transition:transform .18s ease}
    #products-grid .shop-product-card:hover .inline-flex.w-10 .material-symbols-outlined{transform:translateX(3px)}
    .filter-item,.shop-chip{transition:transform .16s ease,box-shadow .16s ease,background .16s ease,color .16s ease}
    .filter-item:hover,.shop-chip:hover{transform:translate(-1px,-1px)}
    .filter-item.active .material-symbols-outlined,.shop-chip.active .material-symbols-outlined{animation:lbaraTapBounce .26s ease}
    .lbara-tap-bounce{animation:lbaraTapBounce .24s ease}
    .option-card{transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,background .18s ease}
    .option-card:hover{transform:translate(-2px,-2px)}
    .option-card.active{animation:lbaraOptionSelect .24s ease}
    .lbara-cart-press,.lbara-add-cart-press{animation:lbaraCartPress .28s ease both}
    .lbara-favorite-press .material-symbols-outlined{animation:lbaraFavoritePress .36s ease both}
    #pagination button{transition:transform .15s ease,box-shadow .15s ease,background .15s ease,color .15s ease}
    #pagination button:hover{transform:translateY(-2px)}
    @media(max-width:767px){
      .lbara-intro-badge{font-size:24px;padding:14px 20px;border-radius:22px;box-shadow:6px 6px 0 #003060}
      #products-grid .shop-product-card:hover{transform:translate(-1px,-1px);box-shadow:7px 7px 0 #003060}
    }
    @media(prefers-reduced-motion:reduce){
      *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.001ms!important}
      body.lbara-page-leaving main,body.lbara-page-leaving footer{opacity:1;transform:none}
      .lbara-intro-stamp{display:none!important}
    }
  `;
  document.head.appendChild(style);
}

function initLogoMotion() {
  document.querySelectorAll('nav a[href="/index.html"], nav a[href="/"]').forEach(function (logo) {
    if (logo.dataset.lbaraLogoReady === '1') return;
    logo.dataset.lbaraLogoReady = '1';
    logo.classList.add('lbara-logo-interactive');
    logo.addEventListener('click', function (event) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      logo.classList.remove('is-logo-clicked');
      void logo.offsetWidth;
      logo.classList.add('is-logo-clicked');
      window.lbaraNavigate(logo.href, 180);
    });
  });
}

function pressElement(el, className, duration = 320) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  setTimeout(function () { el.classList.remove(className); }, duration);
}

function initOpeningStamp() {
  if (sessionStorage.getItem('lbara_intro_seen') === '1') return;
  if (!['/', '/index.html'].includes(window.location.pathname)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  sessionStorage.setItem('lbara_intro_seen', '1');
  const stamp = document.createElement('div');
  stamp.className = 'lbara-intro-stamp';
  stamp.innerHTML = '<div class="lbara-intro-badge">Lbara.tn<span>Digital access starts here</span></div>';
  document.body.appendChild(stamp);
  setTimeout(function () { stamp.remove(); }, 1700);
}

function lbaraNavigate(href, delay = 130) {
  if (!href) return;
  document.body.classList.add('lbara-page-leaving');
  setTimeout(function () { window.location.href = href; }, delay);
}

function initSoftPageTransitions() {
  document.addEventListener('click', function (event) {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (link.target || link.hasAttribute('download') || link.dataset.noTransition === 'true') return;
    const rawHref = link.getAttribute('href') || '';
    if (rawHref === '#' || rawHref.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(rawHref)) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
    const isCartLink = /\/cart\.html$/i.test(url.pathname);
    if (isCartLink) pressElement(link, 'lbara-cart-press', 360);
    event.preventDefault();
    lbaraNavigate(url.href, isCartLink ? 190 : 130);
  });
}

function initLbaraMotion() {
  ensureMotionStyles();
  initLogoMotion();
  initSoftPageTransitions();
  initOpeningStamp();
  requestAnimationFrame(function () { document.body.classList.add('lbara-motion-ready'); });
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
  toast.textContent = lbaraT(message);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

document.addEventListener('DOMContentLoaded', function() {
  initNav();
  initDesignerCredit();
  initLanguageSystem();
  initFooterSocials();
  initLbaraMotion();
  lbaraEngagement.load();
  initChatWidget();

  var hamburger = document.getElementById('hamburger-btn');
  var mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function() {
      const shouldOpen = mobileMenu.style.display === 'none' || !mobileMenu.style.display;
      document.querySelectorAll('.lbara-language-wrap.open').forEach(function (item) {
        item.classList.remove('open');
      });
      document.querySelectorAll('.lbara-social-menu.is-open').forEach(function (item) {
        item.classList.remove('is-open');
        var button = item.querySelector('.lbara-social-menu-toggle');
        if (button) button.setAttribute('aria-expanded', 'false');
      });
      mobileMenu.style.display = shouldOpen ? 'block' : 'none';
    });
  }
});
window.api = api;
window.showToast = showToast;
window.lbaraEngagement = lbaraEngagement;
window.lbaraT = lbaraT;
window.lbaraCreateSocialLinks = createSocialLinks;
window.lbaraNavigate = lbaraNavigate;
