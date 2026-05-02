// Shop Page

const CATEGORY_ICONS = {
  streaming: 'play_circle',
  ai_tools: 'auto_awesome',
  gaming: 'sports_esports',
  productivity: 'work',
  education: 'school',
  gift_cards: 'redeem',
  social: 'alternate_email',
  storage: 'cloud',
  cloud: 'cloud_queue',
  vpn: 'vpn_key',
  books: 'menu_book',
  lifestyle: 'favorite',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function safeImageUrl(value) {
  var url = String(value || '').trim();
  if (/^(https?:\/\/|data:image\/|\/)/i.test(url)) return escapeAttr(url);
  return '';
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  var number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function variantsFor(product) {
  return Array.isArray(product.variants) ? product.variants.filter(function (variant) {
    return variant && variant.active !== false;
  }) : [];
}

function amountForVariant(variant) {
  if (!variant) return null;
  if (variant.checkout_mode === 'quote') return toNumber(variant.deposit_tnd);
  return toNumber(variant.price_tnd);
}

function canCheckoutVariant(variant) {
  var amount = amountForVariant(variant);
  return amount !== null && amount > 0;
}

function canCheckoutProduct(product) {
  var variants = variantsFor(product);
  if (variants.length) return variants.some(canCheckoutVariant);
  var price = toNumber(product.price_tnd);
  return price !== null && price > 0;
}

function formatMoney(value) {
  var amount = toNumber(value);
  if (amount === null || amount <= 0) return 'Price TBD';
  return amount.toFixed(3) + ' TND';
}

function productPriceLabel(product) {
  var variants = variantsFor(product);
  if (variants.length) {
    var priced = variants.map(amountForVariant).filter(function (value) { return value !== null && value > 0; });
    if (!priced.length) return 'Price TBD';
    var min = Math.min.apply(null, priced);
    var quoteOnly = variants.some(function (variant) {
      return variant.checkout_mode === 'quote' && amountForVariant(variant) === min;
    });
    return (quoteOnly ? 'Request ticket ' : 'From ') + min.toFixed(3) + ' TND';
  }
  return formatMoney(product.price_tnd);
}

function variantPriceLabel(variant) {
  var amount = amountForVariant(variant);
  if (amount === null || amount <= 0) return 'Pricing TBD';
  return (variant.checkout_mode === 'quote' ? 'Request ticket ' : '') + amount.toFixed(3) + ' TND';
}

// Lower number = shown first. Gift cards/prepaid forced to end.
const PRODUCT_PRIORITY = {
  netflix: 10,
  chatgpt: 20,
  spotify: 30,
  'prime video': 40,
  'amazon prime': 40,
  youtube: 50,
  disney: 60,
  hulu: 70,
  canva: 120,
  adobe: 130,
  linkedin: 140,
};

// Per-product object-position for smarter image cropping.
const PRODUCT_IMG_POS = {
  netflix: 'center center',
  chatgpt: 'center center',
  spotify: 'center center',
  youtube: 'center center',
  disney: 'center center',
  amazon: 'center center',
  'google play': 'center center',
  canva: 'center center',
  adobe: 'center center',
};

function productSortOrder(p) {
  var text = ((p.name || '') + ' ' + (p.provider || '')).toLowerCase();
  var best = 500;
  for (var key in PRODUCT_PRIORITY) {
    if (text.includes(key)) best = Math.min(best, PRODUCT_PRIORITY[key]);
  }
  if (text.includes('gift') || text.includes('prepaid') || p.category === 'gift_cards') best = 800;
  return best;
}

function getImgPos(p) {
  var text = ((p.name || '') + ' ' + (p.provider || '')).toLowerCase();
  for (var key in PRODUCT_IMG_POS) {
    if (text.includes(key)) return PRODUCT_IMG_POS[key];
  }
  return 'center 30%';
}

let currentPage = 1;
let currentCategory = 'all';
let currentSearch = '';
const DESKTOP_PAGE_SIZE = 18;
const MOBILE_PAGE_SIZE = 4;
let lastPageSize = getPageSize();

// product data keyed by id, used by click handlers.
const productMap = {};

function getPageSize() {
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
    return MOBILE_PAGE_SIZE;
  }
  return DESKTOP_PAGE_SIZE;
}

function scrollToProductsTop() {
  var grid = document.getElementById('products-grid');
  if (!grid) return;

  var nav = document.querySelector('nav');
  var navOffset = nav ? nav.getBoundingClientRect().height : 0;
  var top = grid.getBoundingClientRect().top + window.scrollY - navOffset - 18;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: 'smooth',
  });
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  const paginationEl = document.getElementById('pagination');
  const requestCta = document.getElementById('request-service-cta');
  if (!grid) return;
  const pageSize = getPageSize();

  grid.innerHTML = '<div class="col-span-3 text-center py-12 text-primary/40 font-bold">Loading...</div>';

  const params = { page: currentPage, limit: pageSize };
  if (currentCategory !== 'all') params.category = currentCategory;
  if (currentSearch) params.search = currentSearch;

  api.getProducts(params).then(function (res) {
    const products = res.products || [];
    const total = res.total || 0;

    if (!products.length) {
      grid.innerHTML = '<div class="col-span-3 text-center py-12 text-primary/40 font-bold">No services found.</div>';
      if (paginationEl) paginationEl.innerHTML = '';
      if (requestCta) requestCta.classList.remove('hidden');
      return;
    }

    products.forEach(function (p) { productMap[p.id] = p; });
    products.sort(function (a, b) { return productSortOrder(a) - productSortOrder(b); });

    grid.innerHTML = products.map(function (p) {
      var safeId = escapeAttr(p.id);
      var safeHref = '/product.html?id=' + encodeURIComponent(p.id);
      var safeName = escapeHtml(p.name);
      var safeProvider = escapeHtml(p.provider);
      var safeDescription = escapeHtml(p.description || '');
      var safeBadge = escapeHtml(p.badge);
      var safeDuration = escapeHtml(p.duration_label || (variantsFor(p).length ? 'Options' : '1 Month'));
      var safeImg = safeImageUrl(p.image_url);
      var safeImgPos = escapeAttr(p.image_position || getImgPos(p));
      var variants = variantsFor(p);
      var hasVariants = variants.length > 0;
      var priceLabel = productPriceLabel(p);
      var badgeHtml = p.badge ? '<span style="position:absolute;top:10px;right:10px;background:#003060;color:#fff;font-size:10px;font-weight:900;padding:3px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:0.08em;">' + safeBadge + '</span>' : '';
      var optionBadge = hasVariants ? '<span class="text-xs font-bold bg-accent/10 text-accent px-2 py-1 rounded-lg">' + variants.length + ' Options</span>' : '';
      var headerHtml = safeImg
        ? '<div class="shop-card-img-hdr" style="position:relative;overflow:hidden;">'
            + '<img src="' + safeImg + '" alt="' + escapeAttr(p.name) + '" class="shop-card-img" style="object-position:' + safeImgPos + '">'
            + badgeHtml
          + '</div>'
        : '<div class="shop-card-icon-hdr" style="position:relative;background:rgba(0,48,96,0.05);display:flex;align-items:center;justify-content:space-between;">'
            + '<span class="material-symbols-outlined text-primary text-4xl">' + (CATEGORY_ICONS[p.category] || 'stars') + '</span>'
            + badgeHtml
          + '</div>';
      return '<a href="' + safeHref + '" data-product-card="' + safeId + '" class="cartoon-card shop-product-card rounded-2xl overflow-hidden flex flex-col no-underline text-inherit focus:outline-none focus:ring-4 focus:ring-accent/30">'
        + headerHtml
        + '<div class="p-6 flex flex-col flex-grow" style="flex:1;">'
        + '<p class="text-xs font-black text-secondary uppercase tracking-widest mb-1">' + safeProvider + '</p>'
        + '<h3 class="font-headline font-bold text-primary text-lg leading-tight mb-2">' + safeName + '</h3>'
        + '<p class="text-sm text-on-surface/60 font-medium flex-grow mb-4 shop-card-desc">' + safeDescription + '</p>'
        + '<div class="flex items-center gap-2 mb-4 flex-wrap">'
        + '<span class="text-xs font-bold bg-primary/5 text-primary px-2 py-1 rounded-lg">' + (p.account_type === 'shared' ? 'Shared' : 'Private') + '</span>'
        + '<span class="text-xs font-bold bg-secondary/5 text-secondary px-2 py-1 rounded-lg">' + safeDuration + '</span>'
        + optionBadge
        + '</div>'
        + '<div class="flex items-center justify-between pt-4 border-t-2 border-primary/5 gap-3">'
        + '<div><span class="text-xl font-black text-primary">' + escapeHtml(priceLabel) + '</span></div>'
        + '<span class="inline-flex w-10 h-10 rounded-full border-2 border-primary items-center justify-center text-primary bg-primary/5 shrink-0" aria-hidden="true"><span class="material-symbols-outlined text-xl">arrow_forward</span></span>'
        + '</div></div></a>';
    }).join('');

    if (paginationEl) {
      var totalPages = Math.ceil(total / pageSize);
      paginationEl.innerHTML = Array.from({ length: totalPages }, function (_, i) { return i + 1; }).map(function (n) {
        return '<button data-page="' + n + '" class="w-10 h-10 rounded-xl font-black text-sm border-2 ' + (n === currentPage ? 'bg-primary text-white border-primary' : 'border-primary/20 text-primary hover:bg-primary/5') + '">' + n + '</button>';
      }).join('');
    }
    if (requestCta) {
      requestCta.classList.toggle('hidden', currentPage < 3 && products.length > 0);
    }
  }).catch(function (err) {
    grid.innerHTML = '<div class="col-span-3 text-center py-12 text-red-500 font-bold">' + escapeHtml(err.message || 'Failed to load products.') + '</div>';
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var searchInput = document.getElementById('shop-search');
  var initialSearch = (params.get('search') || '').trim();
  var initialCategory = (params.get('category') || '').trim();

  if (initialSearch) {
    currentSearch = initialSearch;
    if (searchInput) searchInput.value = initialSearch;
  }

  if (initialCategory) {
    currentCategory = initialCategory;
    document.querySelectorAll('[data-category]').forEach(function (b) { b.classList.remove('active'); });
    document.querySelectorAll('[data-category="' + CSS.escape(initialCategory) + '"]').forEach(function (b) { b.classList.add('active'); });
  }

  renderProducts();

  document.getElementById('pagination').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-page]');
    if (!btn) return;
    var nextPage = parseInt(btn.getAttribute('data-page'), 10);
    if (!Number.isFinite(nextPage)) return;

    if (nextPage === currentPage) {
      scrollToProductsTop();
      return;
    }

    currentPage = nextPage;
    renderProducts();
    requestAnimationFrame(scrollToProductsTop);
  });

  document.querySelectorAll('[data-category]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentCategory = btn.dataset.category;
      currentPage = 1;
      document.querySelectorAll('[data-category]').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('[data-category="' + CSS.escape(btn.dataset.category) + '"]').forEach(function (b) { b.classList.add('active'); });
      renderProducts();
    });
  });

  if (searchInput) {
    var debounce;
    searchInput.addEventListener('input', function (e) {
      clearTimeout(debounce);
      debounce = setTimeout(function () {
        currentSearch = e.target.value.trim();
        currentPage = 1;
        renderProducts();
      }, 400);
    });
  }

  var resizeDebounce;
  window.addEventListener('resize', function () {
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(function () {
      var nextPageSize = getPageSize();
      if (nextPageSize !== lastPageSize) {
        lastPageSize = nextPageSize;
        currentPage = 1;
        renderProducts();
      }
    }, 200);
  });
});
