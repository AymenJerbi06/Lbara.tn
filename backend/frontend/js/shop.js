// ─── Shop Page ────────────────────────────────────────────

const CATEGORY_ICONS = {
  streaming: 'play_circle',
  ai_tools: 'auto_awesome',
  gaming: 'sports_esports',
  productivity: 'work',
  education: 'school',
};

let currentPage = 1;
let currentCategory = 'all';
let currentSearch = '';

// product data keyed by id — used by click handlers
const productMap = {};

function renderProducts() {
  const grid = document.getElementById('products-grid');
  const paginationEl = document.getElementById('pagination');
  if (!grid) return;

  grid.innerHTML = '<div class="col-span-3 text-center py-12 text-primary/40 font-bold">Loading...</div>';

  const params = { page: currentPage, limit: 9 };
  if (currentCategory !== 'all') params.category = currentCategory;
  if (currentSearch) params.search = currentSearch;

  api.getProducts(params).then(function (res) {
    const products = res.products || [];
    const total = res.total || 0;

    if (!products.length) {
      grid.innerHTML = '<div class="col-span-3 text-center py-12 text-primary/40 font-bold">No services found.</div>';
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }

    // store in map for click handlers
    products.forEach(function (p) { productMap[p.id] = p; });

    grid.innerHTML = products.map(function (p) {
      var badgeHtml = p.badge ? '<span style="position:absolute;top:10px;right:10px;background:#003060;color:#fff;font-size:10px;font-weight:900;padding:3px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:0.08em;">' + p.badge + '</span>' : '';
      var headerHtml = p.image_url
        ? '<div style="position:relative;overflow:hidden;min-height:120px;">'
            + '<img src="' + p.image_url + '" alt="' + p.name + '" style="width:100%;height:120px;object-fit:cover;display:block;"/>'
            + badgeHtml
          + '</div>'
        : '<div style="position:relative;background:rgba(0,48,96,0.05);padding:24px;display:flex;align-items:center;justify-content:space-between;min-height:96px;">'
            + '<span class="material-symbols-outlined text-primary text-4xl">' + (CATEGORY_ICONS[p.category] || 'stars') + '</span>'
            + badgeHtml
          + '</div>';
      return '<div class="cartoon-card rounded-2xl overflow-hidden flex flex-col">'
        + headerHtml
        + '<div class="p-6 flex flex-col flex-grow" style="flex:1;">'
        + '<p class="text-xs font-black text-secondary uppercase tracking-widest mb-1">' + p.provider + '</p>'
        + '<h3 class="font-headline font-bold text-primary text-lg leading-tight mb-2">' + p.name + '</h3>'
        + '<p class="text-sm text-on-surface/60 font-medium flex-grow mb-4">' + (p.description || '') + '</p>'
        + '<div class="flex items-center gap-2 mb-4">'
        + '<span class="text-xs font-bold bg-primary/5 text-primary px-2 py-1 rounded-lg">' + (p.account_type === 'private' ? 'Private' : 'Shared') + '</span>'
        + '<span class="text-xs font-bold bg-secondary/5 text-secondary px-2 py-1 rounded-lg">' + (p.duration_label || '1 Month') + '</span>'
        + '</div>'
        + '<div class="flex items-center justify-between pt-4 border-t-2 border-primary/5">'
        + '<div><span class="text-2xl font-black text-primary">' + parseFloat(p.price_tnd).toFixed(3) + '</span><span class="text-sm font-bold text-primary ml-1">TND</span></div>'
        + '<div class="flex items-center gap-2">'
        + '<button data-action="details" data-id="' + p.id + '" class="border-2 border-primary text-primary font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1 hover:bg-primary/5 transition-colors"><span class="material-symbols-outlined text-sm">info</span> Details</button>'
        + '<button data-action="buy" data-id="' + p.id + '" class="cartoon-button bg-primary text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1"><span class="material-symbols-outlined text-sm">add_shopping_cart</span> Buy Now</button>'
        + '</div></div></div></div>';
    }).join('');

    // Pagination
    if (paginationEl) {
      var totalPages = Math.ceil(total / 9);
      paginationEl.innerHTML = Array.from({ length: totalPages }, function (_, i) { return i + 1; }).map(function (n) {
        return '<button data-page="' + n + '" class="w-10 h-10 rounded-xl font-black text-sm border-2 ' + (n === currentPage ? 'bg-primary text-white border-primary' : 'border-primary/20 text-primary hover:bg-primary/5') + '">' + n + '</button>';
      }).join('');
    }

  }).catch(function (err) {
    grid.innerHTML = '<div class="col-span-3 text-center py-12 text-red-500 font-bold">' + (err.message || 'Failed to load products.') + '</div>';
  });
}

function openDetails(p) {
  document.getElementById('modal-provider').textContent = p.provider;
  document.getElementById('modal-name').textContent = p.name;
  document.getElementById('modal-description').textContent = p.description || 'No description available.';
  document.getElementById('modal-account-type').textContent = p.account_type === 'private' ? 'Private' : 'Shared';
  document.getElementById('modal-duration').textContent = p.duration_label || '1 Month';
  document.getElementById('modal-delivery').textContent = 'Within ' + (p.delivery_hours || 2) + ' hour(s)';
  document.getElementById('modal-price').textContent = parseFloat(p.price_tnd).toFixed(3) + ' TND';
  var badge = document.getElementById('modal-badge');
  if (p.badge) { badge.textContent = p.badge; badge.style.display = ''; }
  else { badge.style.display = 'none'; }
  document.getElementById('modal-buy-btn').setAttribute('data-id', p.id);
  document.getElementById('details-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeDetails() {
  document.getElementById('details-modal').style.display = 'none';
  document.body.style.overflow = '';
}

function addToCart(p) {
  sessionStorage.setItem('lbara_cart', JSON.stringify({ product_id: p.id, product_name: p.name, price_tnd: p.price_tnd }));
  showToast(p.name + ' added! Heading to checkout...');
  setTimeout(function () { window.location.href = '/checkout.html'; }, 800);
}

document.addEventListener('DOMContentLoaded', function () {
  renderProducts();

  // ── event delegation on grid ────────────────────────────
  document.getElementById('products-grid').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var p = productMap[btn.getAttribute('data-id')];
    if (!p) return;
    if (btn.getAttribute('data-action') === 'details') openDetails(p);
    if (btn.getAttribute('data-action') === 'buy') addToCart(p);
  });

  // ── pagination delegation ───────────────────────────────
  document.getElementById('pagination').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-page]');
    if (!btn) return;
    currentPage = parseInt(btn.getAttribute('data-page'));
    renderProducts();
  });

  // ── modal buy button ────────────────────────────────────
  document.getElementById('modal-buy-btn').addEventListener('click', function () {
    var p = productMap[this.getAttribute('data-id')];
    if (!p) return;
    closeDetails();
    addToCart(p);
  });

  // ── modal close ─────────────────────────────────────────
  document.getElementById('details-close').addEventListener('click', closeDetails);
  document.getElementById('details-backdrop').addEventListener('click', closeDetails);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDetails(); });

  // ── category filters ────────────────────────────────────
  document.querySelectorAll('[data-category]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentCategory = btn.dataset.category;
      currentPage = 1;
      document.querySelectorAll('[data-category]').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderProducts();
    });
  });

  // ── search ──────────────────────────────────────────────
  var searchInput = document.getElementById('shop-search');
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
});
