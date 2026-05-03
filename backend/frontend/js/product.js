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

function tr(value) {
  return window.lbaraT ? window.lbaraT(value) : value;
}

function applyTranslations(root) {
  if (window.lbaraI18n) window.lbaraI18n.apply(root || document);
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
  if (amount === null || amount <= 0) return tr('Pricing TBD');
  return (variant.checkout_mode === 'quote' ? tr('Request ticket') + ' ' : '') + amount.toFixed(3) + ' TND';
}

function categoryLabel(value) {
  return tr(String(value || 'service').replace(/_/g, ' '));
}

function flowLabel(type) {
  return tr({
    gift_card: 'Gift Card',
    giftable_subscription: 'Giftable',
    account_setup: 'Account Setup',
    existing_account_only: 'Existing Account',
  }[type] || 'Account Setup');
}

function activationCopy(type) {
  if (type === 'gift_card') {
    return tr('This service can use a gift card or store-credit path, and checkout also lets you choose assisted activation if you want Lbara.tn to handle it on your account.');
  }
  if (type === 'giftable_subscription') {
    return tr('This service can be gifted to an existing account email, or you can choose assisted activation and provide temporary account access if you want Lbara.tn to handle it for you.');
  }
  if (type === 'existing_account_only') {
    return tr('This request must be connected to an account you already use. Checkout will ask for that account so the certificate, item, or activation lands in the right place.');
  }
  return tr('This service can be activated on your existing account with temporary access, or set up as a new account using an email you control.');
}

function restrictionCopy(product) {
  var slug = String(product?.slug || '').toLowerCase();
  if (slug === 'disney-plus') {
    return tr('Important: Disney+ is not officially available in Tunisia. Even after payment and activation, you should expect to use a reliable VPN to watch. The NordVPN bundle options include a 13% discount on the combined service + VPN price.');
  }
  if (slug === 'paramount-plus') {
    return tr('Important: Paramount+ availability is restricted in Tunisia. Even after payment and activation, you should expect to use a reliable VPN to watch. The NordVPN bundle options include a 13% discount on the combined service + VPN price.');
  }
  return '';
}

function reviewCount(item) {
  var count = Number(item?.review_count);
  return Number.isFinite(count) ? count : 0;
}

function averageRating(item) {
  var rating = Number(item?.average_rating);
  return Number.isFinite(rating) ? rating : 0;
}

function ratingStarsMarkup(rating) {
  var value = Number(rating);
  if (!Number.isFinite(value)) value = 0;
  var rounded = Math.round(value);
  var html = '<span class="lbara-rating-stars" aria-hidden="true">';
  for (var i = 1; i <= 5; i++) {
    html += '<span class="material-symbols-outlined lbara-rating-star ' + (i <= rounded ? '' : 'is-empty') + '">star</span>';
  }
  html += '</span>';
  return html;
}

function renderRatingSummary(product) {
  var container = document.getElementById('product-rating-summary');
  if (!container) return;
  var count = reviewCount(product);
  var rating = averageRating(product);
  container.innerHTML = count
    ? '<div class="lbara-rating-pill inline-flex max-w-max">' + ratingStarsMarkup(rating) + '<strong>' + rating.toFixed(1) + ' ' + escapeHtml(tr('average from')) + ' ' + count + ' ' + escapeHtml(tr(count === 1 ? 'review' : 'reviews')) + '</strong></div>'
    : '<div class="lbara-rating-pill inline-flex max-w-max">' + ratingStarsMarkup(0) + '<strong>' + escapeHtml(tr('No reviews yet')) + '</strong></div>';
}

function pitchCopy(product) {
  var category = String(product?.category || '').toLowerCase();
  var name = product?.name || 'this service';
  if (category === 'ai_tools') {
    return {
      title: 'Use premium AI without payment friction',
      one: 'Pay in TND and avoid international-card blockers.',
      two: 'Pick monthly or annual AI access with the exact account path explained.',
      three: 'Know whether the service needs your existing account email before checkout.',
    };
  }
  if (category === 'education' || category === 'books') {
    return {
      title: 'Keep learning with a clearer request flow',
      one: 'Education and book services use lower-margin pricing when possible.',
      two: 'Special certificate or course requests explain the ticket before you pay.',
      three: 'You get contacted for the exact account or course details when needed.',
    };
  }
  if (category === 'streaming') {
    return {
      title: 'Start watching with fewer surprises',
      one: 'Pay locally, then follow service-specific activation guidance.',
      two: 'VPN notes are shown before checkout when Tunisia availability is restricted.',
      three: 'Choose assisted activation if you want help setting up ' + name + '.',
    };
  }
  if (category === 'gaming' || category === 'gift_cards') {
    return {
      title: 'Top up with the right card and region',
      one: 'Compare the gift card amounts before choosing.',
      two: 'Region and redemption expectations are explained before checkout.',
      three: 'Save the product or turn on sale alerts while you decide.',
    };
  }
  return {
    title: 'A cleaner way to unlock ' + name,
    one: 'Pay in TND without needing your own international card.',
    two: 'Choose the exact variation and understand the delivery path first.',
    three: 'Get guided activation notes for the account or code path.',
  };
}

function testimonialCard(item) {
  return '<article class="cartoon-card rounded-3xl p-5">'
    + '<div class="lbara-rating-stars flex items-center gap-1 text-accent mb-3">'
    + ratingStarsMarkup(item.rating || 5)
    + '</div>'
    + '<p class="text-primary font-black leading-relaxed mb-4">"' + escapeHtml(item.quote || item.comment || '') + '"</p>'
    + '<p class="text-xs font-black text-primary/45 uppercase tracking-widest">' + escapeHtml(tr(item.by || 'Verified buyer')) + '</p>'
    + '</article>';
}

function renderTestimonials(product) {
  var container = document.getElementById('product-testimonials');
  if (!container) return;
  var name = product?.name || 'this service';
  var provider = product?.provider || 'Lbara.tn';
  var category = String(product?.category || '').replace(/_/g, ' ');
  var items = [
    {
      quote: 'I like that ' + provider + ' options are separated clearly. It makes the price and delivery path easier to understand.',
      by: 'Early tester - comparison flow',
    },
    {
      quote: 'The save and sale-alert buttons let me keep ' + name + ' in mind without rushing into checkout.',
      by: 'Beta tester - ' + category,
    },
  ];
  container.innerHTML = items.map(testimonialCard).join('');
}

async function loadProductReviews(product) {
  var container = document.getElementById('product-testimonials');
  if (!container || !api.getProductReviews) return;
  try {
    var res = await api.getProductReviews(product.id);
    var reviews = (res.reviews || []).filter(function (review) {
      return review.comment && String(review.comment).trim();
    });
    if (!reviews.length) return;
    container.innerHTML = reviews.slice(0, 6).map(function (review) {
      return testimonialCard({
        rating: review.rating,
        quote: review.comment,
        by: 'Verified buyer',
      });
    }).join('');
  } catch {
    // Keep the lightweight tester notes if reviews cannot be loaded.
  }
}

function selectedVariant() {
  var variants = variantsFor(product);
  return variants.find(function (variant) { return variant.id === selectedVariantId; }) || variants[0] || null;
}

function renderOptions() {
  var list = document.getElementById('option-list');
  var variants = variantsFor(product);

  if (!variants.length) {
    list.innerHTML = '<div class="option-card"><p class="font-black text-primary">' + escapeHtml(tr('No options are available for this service yet.')) + '</p></div>';
    applyTranslations(list);
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
      + '<p class="text-sm font-bold text-on-surface/55 leading-relaxed">' + escapeHtml(tr(description)) + '</p>'
      + '</div>'
      + '<span class="material-symbols-outlined text-primary/35 shrink-0">' + (active ? 'radio_button_checked' : 'radio_button_unchecked') + '</span>'
      + '</div>'
      + '<div class="mt-4 flex flex-wrap items-center gap-2">'
      + '<span class="text-xs font-black px-3 py-1 rounded-full bg-secondary/10 text-secondary">' + escapeHtml(tr(variant.billing_period || 'Option')) + '</span>'
      + '<span class="text-xs font-black px-3 py-1 rounded-full ' + (ready ? 'bg-primary/5 text-primary' : 'bg-accent/10 text-accent') + '">' + escapeHtml(variantPriceLabel(variant)) + '</span>'
      + (variant.checkout_mode === 'quote' ? '<span class="text-xs font-black px-3 py-1 rounded-full bg-accent/10 text-accent">' + escapeHtml(tr('Quote')) + '</span>' : '')
      + '</div>'
      + '</button>';
  }).join('');
  applyTranslations(list);

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

  document.getElementById('selected-name').textContent = variant ? variant.name : tr('Choose an option');
  document.getElementById('selected-meta').textContent = variant
    ? (tr(variant.billing_period || 'Option') + (isQuote ? ' - ' + tr('Special request ticket') : ' - ' + tr('Full payment')))
    : tr('Pick one of the options to see the checkout summary.');
  document.getElementById('selected-price').textContent = variant ? variantPriceLabel(variant) : tr('TBD');

  continueBtn.disabled = !ready;
  continueBtn.innerHTML = ready
    ? '<span class="material-symbols-outlined">add_shopping_cart</span> ' + escapeHtml(tr(isQuote ? 'Pay Request Ticket' : 'Continue to Checkout'))
    : '<span class="material-symbols-outlined">schedule</span> ' + escapeHtml(tr('Pricing Soon'));
  contactBtn.href = '/contact.html?service=' + encodeURIComponent(product.name + (variant ? ' - ' + variant.name : ''));
  applyTranslations(document.getElementById('selection-panel') || document);
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
  document.getElementById('product-description').textContent = product.description || tr('No description available yet.');
  document.getElementById('info-account').textContent = tr(product.account_type === 'shared' ? 'Shared' : 'Private');
  document.getElementById('info-delivery').textContent = tr('Within') + ' ' + (product.delivery_hours || 2) + 'h';
  document.getElementById('info-flow').textContent = flowLabel(product.fulfillment_type);
  document.getElementById('info-options').textContent = variants.length ? variants.length + ' ' + tr('choices') : tr('Coming soon');
  document.getElementById('activation-copy').textContent = activationCopy(product.fulfillment_type);
  renderRatingSummary(product);
  var favoriteBtn = document.getElementById('product-favorite-btn');
  var saleBtn = document.getElementById('product-sale-btn');
  if (favoriteBtn) {
    favoriteBtn.setAttribute('data-favorite-product', product.id);
    favoriteBtn.setAttribute('data-product-name', product.name);
    favoriteBtn.setAttribute('aria-label', tr('Save') + ' ' + product.name);
  }
  if (saleBtn) {
    saleBtn.setAttribute('data-sale-product', product.id);
    saleBtn.setAttribute('data-product-name', product.name);
  }

  var pitch = pitchCopy(product);
  document.getElementById('pitch-title').textContent = pitch.title;
  document.getElementById('pitch-one').textContent = pitch.one;
  document.getElementById('pitch-two').textContent = pitch.two;
  document.getElementById('pitch-three').textContent = pitch.three;
  renderTestimonials(product);
  loadProductReviews(product);

  var restrictionEl = document.getElementById('restriction-copy');
  var restriction = restrictionCopy(product);
  if (restrictionEl) {
    restrictionEl.textContent = restriction;
    restrictionEl.classList.toggle('hidden', !restriction);
  }

  renderOptions();
  renderSelection();
  applyTranslations(document.getElementById('product-content') || document);
  if (window.lbaraEngagement) {
    window.lbaraEngagement.load().then(function () {
      window.lbaraEngagement.syncButtons(document.getElementById('product-content'));
    });
  }
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

  document.addEventListener('lbara:languagechange', function () {
    if (product) renderProduct(product);
  });
});
