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

async function renderProducts() {
  const grid = document.getElementById('products-grid');
  const paginationEl = document.getElementById('pagination');
  if (!grid) return;

  grid.innerHTML = `<div class="col-span-3 text-center py-12 text-primary/40 font-bold">Loading...</div>`;

  try {
    const params = { page: currentPage, limit: 9 };
    if (currentCategory !== 'all') params.category = currentCategory;
    if (currentSearch) params.search = currentSearch;

    const { products, total } = await api.getProducts(params);

    if (!products.length) {
      grid.innerHTML = `<div class="col-span-3 text-center py-12 text-primary/40 font-bold">No services found.</div>`;
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }

    grid.innerHTML = products.map((p) => `
      <div class="cartoon-card rounded-2xl overflow-hidden flex flex-col" data-product-id="${p.id}">
        <div class="relative ${p.image_url ? '' : 'bg-primary/5'} p-6 flex items-center justify-between overflow-hidden" style="min-height:96px;">
          ${p.image_url
            ? `<img src="${p.image_url}" alt="${p.name}" class="absolute inset-0 w-full h-full object-cover"/><div class="absolute inset-0 bg-primary/30"></div><span class="relative material-symbols-outlined text-white text-4xl">${CATEGORY_ICONS[p.category] || 'stars'}</span>`
            : `<span class="material-symbols-outlined text-primary text-4xl">${CATEGORY_ICONS[p.category] || 'stars'}</span>`}
          ${p.badge ? `<span class="relative bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">${p.badge}</span>` : ''}
        </div>
        <div class="p-6 flex flex-col flex-grow">
          <p class="text-xs font-black text-secondary uppercase tracking-widest mb-1">${p.provider}</p>
          <h3 class="font-headline font-bold text-primary text-lg leading-tight mb-2">${p.name}</h3>
          <p class="text-sm text-on-surface/60 font-medium flex-grow mb-4">${p.description || ''}</p>
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xs font-bold bg-primary/5 text-primary px-2 py-1 rounded-lg">${p.account_type === 'private' ? 'Private' : 'Shared'}</span>
            <span class="text-xs font-bold bg-secondary/5 text-secondary px-2 py-1 rounded-lg">${p.duration_label || '1 Month'}</span>
          </div>
          <div class="flex items-center justify-between pt-4 border-t-2 border-primary/5">
            <div>
              <span class="text-2xl font-black text-primary">${parseFloat(p.price_tnd).toFixed(3)}</span>
              <span class="text-sm font-bold text-primary ml-1">TND</span>
            </div>
            <button
              onclick="addToCart('${p.id}', '${p.name}', ${p.price_tnd})"
              class="cartoon-button bg-primary text-white font-bold px-5 py-2 rounded-xl text-sm flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">add_shopping_cart</span>
              Buy Now
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Pagination
    if (paginationEl) {
      const totalPages = Math.ceil(total / 9);
      paginationEl.innerHTML = Array.from({ length: totalPages }, (_, i) => i + 1)
        .map((n) => `
          <button onclick="goToPage(${n})"
            class="w-10 h-10 rounded-xl font-black text-sm border-2 ${n === currentPage ? 'bg-primary text-white border-primary' : 'border-primary/20 text-primary hover:bg-primary/5'}">
            ${n}
          </button>
        `).join('');
    }
  } catch (err) {
    grid.innerHTML = `<div class="col-span-3 text-center py-12 text-red-500 font-bold">${err.message}</div>`;
  }
}

function goToPage(n) {
  currentPage = n;
  renderProducts();
}

function addToCart(productId, productName, priceTnd) {
  sessionStorage.setItem('lbara_cart', JSON.stringify({ product_id: productId, product_name: productName, price_tnd: priceTnd }));
  showToast(`${productName} added! Heading to checkout...`);
  setTimeout(() => { window.location.href = '/checkout.html'; }, 800);
}

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const searchInput = document.getElementById('shop-search');
  const initialSearch = (params.get('search') || '').trim();

  if (initialSearch) {
    currentSearch = initialSearch;
    if (searchInput) searchInput.value = initialSearch;
  }

  renderProducts();

  // Category filter buttons
  document.querySelectorAll('[data-category]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentCategory = btn.dataset.category;
      currentPage = 1;
      document.querySelectorAll('[data-category]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts();
    });
  });

  // Search
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        currentSearch = e.target.value.trim();
        currentPage = 1;
        renderProducts();
      }, 400);
    });
  }
});
