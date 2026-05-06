(function () {
  const CART_KEY = 'lbara_cart_items';
  const CHECKOUT_KEY = 'lbara_cart';

  function readRaw() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function itemKey(item) {
    return String(item.product_id || '') + ':' + String(item.variant_id || 'base');
  }

  function normalizeItem(item) {
    const normalized = {
      cart_item_id: item.cart_item_id || itemKey(item),
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      product_name: item.product_name || 'Selected service',
      variant_name: item.variant_name || null,
      provider: item.provider || 'Lbara.tn',
      image_url: item.image_url || '',
      price_tnd: toNumber(item.price_tnd),
      checkout_mode: item.checkout_mode || 'full_payment',
      billing_period: item.billing_period || null,
      added_at: item.added_at || new Date().toISOString(),
    };
    normalized.cart_item_id = itemKey(normalized);
    return normalized;
  }

  function items() {
    return readRaw()
      .map(normalizeItem)
      .filter((item) => item.product_id && item.price_tnd !== null && item.price_tnd > 0);
  }

  function save(nextItems) {
    localStorage.setItem(CART_KEY, JSON.stringify(nextItems.map(normalizeItem)));
    syncBadges();
    document.dispatchEvent(new CustomEvent('lbara:cartchange', { detail: { items: nextItems } }));
  }

  function add(item) {
    const normalized = normalizeItem(item);
    const current = items();
    const index = current.findIndex((entry) => entry.cart_item_id === normalized.cart_item_id);
    const existed = index >= 0;
    if (existed) {
      current[index] = { ...current[index], ...normalized, added_at: new Date().toISOString() };
    } else {
      current.unshift(normalized);
    }
    save(current);
    return { item: normalized, existed };
  }

  function remove(cartItemId) {
    const current = items().filter((item) => item.cart_item_id !== cartItemId);
    save(current);
  }

  function clear() {
    save([]);
  }

  function count() {
    return items().length;
  }

  function subtotal() {
    return items().reduce((sum, item) => sum + (toNumber(item.price_tnd) || 0), 0);
  }

  function checkoutItem(cartItemId) {
    const item = items().find((entry) => entry.cart_item_id === cartItemId);
    if (!item) return false;
    sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(item));
    window.location.href = '/checkout.html';
    return true;
  }

  function removeCheckoutItem(cart) {
    if (!cart) return;
    const id = cart.cart_item_id || itemKey(cart);
    if (id) remove(id);
  }

  function syncBadges() {
    const value = count();
    document.querySelectorAll('[data-cart-count]').forEach((badge) => {
      badge.textContent = String(value);
      badge.classList.toggle('hidden', value === 0);
    });
  }

  document.addEventListener('DOMContentLoaded', syncBadges);
  window.addEventListener('storage', (event) => {
    if (event.key === CART_KEY) syncBadges();
  });

  window.lbaraCartStore = {
    add,
    clear,
    checkoutItem,
    count,
    items,
    remove,
    removeCheckoutItem,
    save,
    subtotal,
    syncBadges,
  };
})();
