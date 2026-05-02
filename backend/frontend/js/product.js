// Product detail page

let product = null;
let selectedVariantId = null;

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
  if (/^(https?:\/\/|data:image\/|\/)/i.test(url)) return url;
  return '';
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  var number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function variantsFor(item) {
  return Array.isArray(item?.variants) ? item.variants.filter(function (variant) {
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

function variantPriceLabel(variant) {
  var amount = amountForVariant(variant);
  if (amount === null || amount <= 0) return 'Pricing TBD';
  return (variant.checkout_mode === 'quote' ? 'Request ticket ' : '') + amount.toFixed(3) + ' TND';
}

function categoryLabel(value) {
  return String(value || 'service').replace(/_/g, ' ');
}

function flowLabel(type) {
  return {
    gift_card: 'Gift Card',
    giftable_subscription: 'Giftable',
    account_setup: 'Account Setup',
    existing_account_only: 'Existing Account',
  }[type] || 'Account Setup';
}

function activationCopy(type) {
  if (type === 'gift_card') {
    return 'This service can use a gift card or store-credit path, and checkout also lets you choose assisted activation if you want Lbara.tn to handle it on your account.';
  }
  if (type === 'giftable_subscription') {
    return 'This service can be gifted to an existing account email, or you can choose assisted activation and provide temporary account access if you want Lbara.tn to handle it for you.';
  }
  if (type === 'existing_account_only') {
    return 'This request must be connected to an account you already use. Checkout will ask for that account so the certificate, item, or activation lands in the right place.';
  }
  return 'This service can be activated on your existing account with temporary access, or set up as a new account using an email you control.';
}

function restrictionCopy(product) {
  var slug = String(product?.slug || '').toLowerCase();
  if (slug === 'disney-plus') {
    return 'Important: Disney+ is not officially available in Tunisia. Even after payment and activation, you should expect to use a reliable VPN to watch. The NordVPN bundle options include a 13% discount on the combined service + VPN price.';
  }
  if (slug === 'paramount-plus') {
    return 'Important: Paramount+ availability is restricted in Tunisia. Even after payment and activation, you should expect to use a reliable VPN to watch. The NordVPN bundle options include a 13% discount on the combined service + VPN price.';
  }
  return '';
}

function selectedVariant() {
  var variants = variantsFor(product);
  return variants.find(function (variant) { return variant.id === selectedVariantId; }) || variants[0] || null;
}

function renderOptions() {
  var list = document.getElementById('option-list');
  var variants = variantsFor(product);

  if (!variants.length) {
    list.innerHTML = '<div class="option-card"><p class="font-black text-primary">No options are available for this service yet.</p></div>';
    return;
  }

  if (!selectedVariantId) selectedVariantId = variants[0].id;

  list.innerHTML = variants.map(function (variant) {
    var active = variant.id === selectedVariantId;
    var ready = canCheckoutVariant(variant);
    var description = variant.description || variant.billing_period || 'Selected during checkout';
    return '<button type="button" data-variant-id="' + escapeAttr(variant.id) + '" class="option-card ' + (active ? 'active' : '') + '">'
      + '<div class="flex items-start justify-between gap-4">'
      + '<div>'
      + '<p class="font-headline text-lg font-black text-primary mb-1">' + escapeHtml(variant.name) + '</p>'
      + '<p class="text-sm font-bold text-on-surface/55 leading-relaxed">' + escapeHtml(description) + '</p>'
      + '</div>'
      + '<span class="material-symbols-outlined text-primary/35 shrink-0">' + (active ? 'radio_button_checked' : 'radio_button_unchecked') + '</span>'
      + '</div>'
      + '<div class="mt-4 flex flex-wrap items-center gap-2">'
      + '<span class="text-xs font-black px-3 py-1 rounded-full bg-secondary/10 text-secondary">' + escapeHtml(variant.billing_period || 'Option') + '</span>'
      + '<span class="text-xs font-black px-3 py-1 rounded-full ' + (ready ? 'bg-primary/5 text-primary' : 'bg-accent/10 text-accent') + '">' + escapeHtml(variantPriceLabel(variant)) + '</span>'
      + (variant.checkout_mode === 'quote' ? '<span class="text-xs font-black px-3 py-1 rounded-full bg-accent/10 text-accent">Quote</span>' : '')
      + '</div>'
      + '</button>';
  }).join('');

  list.querySelectorAll('[data-variant-id]').forEach(function (button) {
    button.addEventListener('click', function () {
      selectedVariantId = button.getAttribute('data-variant-id');
      renderOptions();
      renderSelection();
    });
  });
}

function renderSelection() {
  var variant = selectedVariant();
  var ready = canCheckoutVariant(variant);
  var isQuote = variant?.checkout_mode === 'quote';
  var continueBtn = document.getElementById('continue-btn');
  var contactBtn = document.getElementById('pricing-contact-btn');

  document.getElementById('selected-name').textContent = variant ? variant.name : 'Choose an option';
  document.getElementById('selected-meta').textContent = variant
    ? ((variant.billing_period || 'Option') + (isQuote ? ' - Special request ticket' : ' - Full payment'))
    : 'Pick one of the options to see the checkout summary.';
  document.getElementById('selected-price').textContent = variant ? variantPriceLabel(variant) : 'TBD';

  continueBtn.disabled = !ready;
  continueBtn.innerHTML = ready
    ? '<span class="material-symbols-outlined">add_shopping_cart</span> ' + (isQuote ? 'Pay Request Ticket' : 'Continue to Checkout')
    : '<span class="material-symbols-outlined">schedule</span> Pricing Soon';
  contactBtn.href = '/contact.html?service=' + encodeURIComponent(product.name + (variant ? ' - ' + variant.name : ''));
}

function addSelectedToCart() {
  var variant = selectedVariant();
  if (!variant || !canCheckoutVariant(variant)) {
    showToast('Pricing for this option is not ready yet. Please contact us first.', 'error');
    return;
  }

  sessionStorage.setItem('lbara_cart', JSON.stringify({
    product_id: product.id,
    variant_id: variant.id,
    product_name: product.name,
    variant_name: variant.name,
    price_tnd: amountForVariant(variant),
    checkout_mode: variant.checkout_mode || 'full_payment',
    billing_period: variant.billing_period || product.duration_label || null,
  }));
  showToast('Option selected! Heading to checkout...');
  setTimeout(function () { window.location.href = '/checkout.html'; }, 700);
}

function renderProduct(item) {
  product = item;
  var variants = variantsFor(product);
  document.title = product.name + ' - Lbara.tn';

  var image = document.getElementById('product-image');
  image.src = safeImageUrl(product.image_url) || '';
  image.alt = product.name;

  document.getElementById('product-provider').textContent = product.provider || '';
  document.getElementById('product-category').textContent = categoryLabel(product.category);
  document.getElementById('product-name').textContent = product.name;
  document.getElementById('product-description').textContent = product.description || 'No description available yet.';
  document.getElementById('info-account').textContent = product.account_type === 'shared' ? 'Shared' : 'Private';
  document.getElementById('info-delivery').textContent = 'Within ' + (product.delivery_hours || 2) + 'h';
  document.getElementById('info-flow').textContent = flowLabel(product.fulfillment_type);
  document.getElementById('info-options').textContent = variants.length ? variants.length + ' choices' : 'Coming soon';
  document.getElementById('activation-copy').textContent = activationCopy(product.fulfillment_type);
  var restrictionEl = document.getElementById('restriction-copy');
  var restriction = restrictionCopy(product);
  if (restrictionEl) {
    restrictionEl.textContent = restriction;
    restrictionEl.classList.toggle('hidden', !restriction);
  }

  renderOptions();
  renderSelection();
}

document.addEventListener('DOMContentLoaded', async function () {
  var id = new URLSearchParams(window.location.search).get('id');
  var loading = document.getElementById('product-loading');
  var content = document.getElementById('product-content');
  var error = document.getElementById('product-error');

  if (!id) {
    loading.classList.add('hidden');
    error.classList.remove('hidden');
    return;
  }

  try {
    var res = await api.getProduct(id);
    renderProduct(res.product);
    loading.classList.add('hidden');
    content.classList.remove('hidden');
  } catch (err) {
    loading.classList.add('hidden');
    error.classList.remove('hidden');
  }

  document.getElementById('continue-btn').addEventListener('click', addSelectedToCart);
});
