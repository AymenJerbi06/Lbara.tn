function cartEscapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cartTr(value) {
  return window.lbaraT ? window.lbaraT(value) : value;
}

function cartCurrentLang() {
  return window.lbaraI18n?.language ? window.lbaraI18n.language() : (localStorage.getItem('lbara_lang') || 'en');
}

function cartCurrencyUnit() {
  const lang = cartCurrentLang();
  if (lang === 'ar') return 'دينار';
  if (lang === 'fr') return 'Dinar';
  return 'TND';
}

function cartFormatMoney(amount) {
  return Number(amount || 0).toFixed(3) + ' ' + cartCurrencyUnit();
}

function cartSafeImage(value) {
  const url = String(value || '').trim();
  if (/^(https?:\/\/|data:image\/|\/)/i.test(url)) return url;
  return '';
}

function cartItemMarkup(item) {
  const image = cartSafeImage(item.image_url)
    ? '<img src="' + cartEscapeHtml(item.image_url) + '" alt="" class="w-20 h-20 rounded-2xl object-contain bg-white border-2 border-primary/10 shrink-0"/>'
    : '<div class="w-20 h-20 rounded-2xl bg-primary/5 border-2 border-primary/10 flex items-center justify-center shrink-0"><span class="material-symbols-outlined text-primary text-3xl">auto_awesome</span></div>';
  const variant = item.variant_name ? item.variant_name : 'Selected option';
  const mode = item.checkout_mode === 'quote' ? 'Request ticket' : 'Full payment';
  return ''
    + '<article class="cartoon-card rounded-3xl p-5 md:p-6" data-cart-row="' + cartEscapeHtml(item.cart_item_id) + '">'
    + '<div class="flex flex-col md:flex-row md:items-center gap-5">'
    + '<a href="/product.html?id=' + encodeURIComponent(item.product_id) + '" class="flex items-center gap-4 min-w-0 flex-1">'
    + image
    + '<div class="min-w-0">'
    + '<p class="text-xs font-black text-secondary uppercase tracking-widest mb-1">' + cartEscapeHtml(cartTr(item.provider || 'Lbara.tn')) + '</p>'
    + '<h3 class="font-headline text-xl font-black text-primary leading-tight">' + cartEscapeHtml(cartTr(item.product_name)) + '</h3>'
    + '<p class="text-sm font-bold text-on-surface/55 mt-1">' + cartEscapeHtml(cartTr(variant)) + '</p>'
    + '<div class="flex flex-wrap gap-2 mt-3">'
    + '<span class="text-xs font-black px-3 py-1 rounded-full bg-secondary/10 text-secondary">' + cartEscapeHtml(cartTr(item.billing_period || 'Option')) + '</span>'
    + '<span class="text-xs font-black px-3 py-1 rounded-full bg-primary/5 text-primary">' + cartEscapeHtml(cartTr(mode)) + '</span>'
    + '</div>'
    + '</div>'
    + '</a>'
    + '<div class="flex md:flex-col items-center md:items-end justify-between gap-3 md:min-w-[190px]">'
    + '<p class="font-headline font-black text-2xl text-primary">' + cartEscapeHtml(cartFormatMoney(item.price_tnd)) + '</p>'
    + '<div class="flex gap-2">'
    + '<button type="button" data-checkout-cart-item="' + cartEscapeHtml(item.cart_item_id) + '" class="cartoon-button bg-primary text-white font-black px-4 py-2 rounded-2xl flex items-center gap-2">'
    + '<span class="material-symbols-outlined text-base">shopping_cart_checkout</span>'
    + '<span>Checkout</span>'
    + '</button>'
    + '<button type="button" data-remove-cart-item="' + cartEscapeHtml(item.cart_item_id) + '" class="border-2 border-primary/15 text-primary font-black px-3 py-2 rounded-2xl hover:bg-primary/5" aria-label="Remove item">'
    + '<span class="material-symbols-outlined text-base">delete</span>'
    + '</button>'
    + '</div>'
    + '</div>'
    + '</div>'
    + '</article>';
}

function renderCartPage() {
  const store = window.lbaraCartStore;
  if (!store) return;
  const items = store.items();
  const empty = document.getElementById('cart-empty');
  const content = document.getElementById('cart-content');
  const list = document.getElementById('cart-list');
  const clearBtn = document.getElementById('clear-cart-btn');
  const count = document.getElementById('cart-summary-count');
  const total = document.getElementById('cart-summary-total');

  if (!items.length) {
    empty.classList.remove('hidden');
    content.classList.add('hidden');
    if (clearBtn) clearBtn.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  content.classList.remove('hidden');
  if (clearBtn) clearBtn.classList.remove('hidden');
  list.innerHTML = items.map(cartItemMarkup).join('');
  count.textContent = String(items.length);
  total.textContent = cartFormatMoney(store.subtotal());
  if (window.lbaraI18n) window.lbaraI18n.apply(document);
}

document.addEventListener('DOMContentLoaded', function () {
  renderCartPage();

  document.addEventListener('lbara:languagechange', renderCartPage);
  document.addEventListener('lbara:cartchange', renderCartPage);

  document.getElementById('cart-list')?.addEventListener('click', function (event) {
    const checkout = event.target.closest('[data-checkout-cart-item]');
    if (checkout) {
      window.lbaraCartStore.checkoutItem(checkout.getAttribute('data-checkout-cart-item'));
      return;
    }
    const remove = event.target.closest('[data-remove-cart-item]');
    if (remove) {
      window.lbaraCartStore.remove(remove.getAttribute('data-remove-cart-item'));
      if (window.showToast) window.showToast('Removed from cart.');
    }
  });

  document.getElementById('clear-cart-btn')?.addEventListener('click', function () {
    window.lbaraCartStore.clear();
    if (window.showToast) window.showToast('Cart cleared.');
  });
});
