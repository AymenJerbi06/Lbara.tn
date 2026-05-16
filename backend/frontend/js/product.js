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

function currentLang() {
  return window.lbaraI18n?.language ? window.lbaraI18n.language() : (localStorage.getItem('lbara_lang') || 'en');
}

function currencyUnit() {
  var lang = currentLang();
  if (lang === 'ar') return 'دينار';
  if (lang === 'fr') return 'Dinar';
  return 'TND';
}

function formatCurrency(amount) {
  return amount.toFixed(3) + ' ' + currencyUnit();
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
  return (variant.checkout_mode === 'quote' ? tr('Request ticket') + ' ' : '') + formatCurrency(amount);
}

function deliveryTimeLabel(hours) {
  var count = Number(hours) || 2;
  var lang = currentLang();
  if (lang === 'ar') return count === 1 ? 'خلال ساعة واحدة' : 'خلال ' + count + ' ساعات';
  if (lang === 'fr') return 'Sous ' + count + ' h';
  return tr('Within') + ' ' + count + 'h';
}

function choiceCountLabel(count) {
  var value = Number(count) || 0;
  var lang = currentLang();
  if (lang === 'ar') return value === 1 ? 'خيار واحد' : value + ' خيارات';
  if (lang === 'fr') return value + ' ' + (value === 1 ? 'choix' : 'choix');
  return value + ' ' + tr(value === 1 ? 'choice' : 'choices');
}

function waitForI18n() {
  if (window.lbaraI18n || (localStorage.getItem('lbara_lang') || 'en') === 'en') return Promise.resolve();
  return new Promise(function (resolve) {
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      document.removeEventListener('lbara:i18nready', finish);
      resolve();
    }
    document.addEventListener('lbara:i18nready', finish);
    setTimeout(finish, 900);
  });
}

function pulseControl(control) {
  if (!control) return;
  control.classList.remove('lbara-tap-bounce');
  void control.offsetWidth;
  control.classList.add('lbara-tap-bounce');
  setTimeout(function () { control.classList.remove('lbara-tap-bounce'); }, 280);
}

function refreshMotion(root) {
  document.dispatchEvent(new CustomEvent('lbara:contentupdated', { detail: { root: root || document } }));
}

function visitorKey() {
  try {
    var key = localStorage.getItem('lbara_visitor_key');
    if (!key) {
      key = (window.crypto && window.crypto.randomUUID)
        ? window.crypto.randomUUID()
        : 'visitor-' + Date.now() + '-' + Math.random().toString(36).slice(2);
      localStorage.setItem('lbara_visitor_key', key);
    }
    return key;
  } catch {
    return 'visitor-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  }
}

function trackProductView(productId) {
  if (!productId || !api.trackProductView) return;
  api.trackProductView(productId, {
    visitor_key: visitorKey(),
    source: 'product_page',
  }).catch(function () {
    // Engagement stats are useful, but they should never block browsing.
  });
}

function categoryLabel(value) {
  var key = String(value || 'service').toLowerCase();
  var labels = {
    ai_tools: 'AI Tools',
    gift_cards: 'Gift Cards',
  };
  var label = labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  return tr(label);
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
    return tr('This service can use a gift card or store-credit path. If it is redeemed with a gift card rather than a simple activation code, you must use a reliable VPN set to Canada and open the Canadian version or region of the service/store before redeeming.');
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
    + '<p class="text-primary font-black leading-relaxed mb-4">"' + escapeHtml(tr(item.quote || item.comment || '')) + '"</p>'
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
    var variantName = tr(variant.name);
    return '<button type="button" data-variant-id="' + escapeAttr(variant.id) + '" class="option-card ' + (active ? 'active' : '') + '">'
      + '<div class="flex items-start justify-between gap-4">'
      + '<div>'
      + '<p class="font-headline text-lg font-black text-primary mb-1">' + escapeHtml(variantName) + '</p>'
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
  refreshMotion(list);

  list.querySelectorAll('[data-variant-id]').forEach(function (button) {
    button.addEventListener('click', function () {
      selectedVariantId = button.getAttribute('data-variant-id');
      renderOptions();
      renderSelection();
      pulseControl(document.getElementById('selection-panel'));
    });
  });
}

function renderSelection() {
  var variant = selectedVariant();
  var ready = canCheckoutVariant(variant);
  var isQuote = variant?.checkout_mode === 'quote';
  var continueBtn = document.getElementById('continue-btn');
  var addCartBtn = document.getElementById('add-cart-btn');
  var contactBtn = document.getElementById('pricing-contact-btn');

  document.getElementById('selected-name').textContent = variant ? tr(variant.name) : tr('Choose an option');
  document.getElementById('selected-meta').textContent = variant
    ? (tr(variant.billing_period || 'Option') + (isQuote ? ' - ' + tr('Special request ticket') : ' - ' + tr('Full payment')))
    : tr('Pick one of the options to see the checkout summary.');
  document.getElementById('selected-price').textContent = variant ? variantPriceLabel(variant) : tr('TBD');

  continueBtn.disabled = !ready;
  continueBtn.innerHTML = ready
    ? '<span class="material-symbols-outlined">shopping_cart_checkout</span> ' + escapeHtml(tr(isQuote ? 'Pay Request Ticket' : 'Checkout Now'))
    : '<span class="material-symbols-outlined">schedule</span> ' + escapeHtml(tr('Pricing Soon'));
  if (addCartBtn) {
    addCartBtn.disabled = !ready;
    addCartBtn.innerHTML = ready
      ? '<span class="material-symbols-outlined">add_shopping_cart</span> ' + escapeHtml(tr('Add to Cart'))
      : '<span class="material-symbols-outlined">schedule</span> ' + escapeHtml(tr('Pricing Soon'));
  }
  contactBtn.href = '/contact.html?category=sales';
  applyTranslations(document.getElementById('selection-panel') || document);
}

function selectedCartItem(variant) {
  return {
    product_id: product.id,
    variant_id: variant.id,
    product_name: product.name,
    variant_name: variant.name,
    provider: product.provider || 'Lbara.tn',
    image_url: product.image_url || '',
    price_tnd: amountForVariant(variant),
    checkout_mode: variant.checkout_mode || 'full_payment',
    billing_period: variant.billing_period || product.duration_label || null,
  };
}

function addSelectedToCart(options) {
  var shouldCheckout = Boolean(options && options.checkout);
  var variant = selectedVariant();
  if (!variant || !canCheckoutVariant(variant)) {
    showToast('Pricing for this option is not ready yet. Please contact us first.', 'error');
    return;
  }

  var item = selectedCartItem(variant);
  if (window.lbaraCartStore) {
    item = window.lbaraCartStore.add(item).item;
  }

  if (shouldCheckout) {
    sessionStorage.setItem('lbara_cart', JSON.stringify(item));
    showToast('Option selected! Heading to checkout...');
    setTimeout(function () { window.location.href = '/checkout.html'; }, 600);
    return;
  }

  showToast('Added to cart. You can checkout whenever you are ready.');
}

function renderProduct(item) {
  product = item;
  var variants = variantsFor(product);
  var displayName = tr(product.name);
  document.title = displayName + ' - Lbara.tn';

  var image = document.getElementById('product-image');
  image.src = safeImageUrl(product.image_url) || '';
  image.alt = displayName;

  document.getElementById('product-provider').textContent = tr(product.provider || '');
  document.getElementById('product-category').textContent = categoryLabel(product.category);
  document.getElementById('product-name').textContent = displayName;
  document.getElementById('product-description').textContent = product.description ? tr(product.description) : tr('No description available yet.');
  document.getElementById('info-account').textContent = tr(product.account_type === 'shared' ? 'Shared' : 'Private');
  document.getElementById('info-delivery').textContent = deliveryTimeLabel(product.delivery_hours);
  document.getElementById('info-flow').textContent = flowLabel(product.fulfillment_type);
  document.getElementById('info-options').textContent = variants.length ? choiceCountLabel(variants.length) : tr('Coming soon');
  document.getElementById('activation-copy').textContent = activationCopy(product.fulfillment_type);
  renderRatingSummary(product);
  var favoriteBtn = document.getElementById('product-favorite-btn');
  var saleBtn = document.getElementById('product-sale-btn');
  if (favoriteBtn) {
    favoriteBtn.setAttribute('data-favorite-product', product.id);
    favoriteBtn.setAttribute('data-product-name', product.name);
    favoriteBtn.setAttribute('aria-label', tr('Save') + ' ' + displayName);
  }
  if (saleBtn) {
    saleBtn.setAttribute('data-sale-product', product.id);
    saleBtn.setAttribute('data-product-name', product.name);
  }

  var pitch = pitchCopy(product);
  document.getElementById('pitch-title').textContent = tr(pitch.title);
  document.getElementById('pitch-one').textContent = tr(pitch.one);
  document.getElementById('pitch-two').textContent = tr(pitch.two);
  document.getElementById('pitch-three').textContent = tr(pitch.three);
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
  refreshMotion(document.getElementById('product-content') || document);
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

  document.addEventListener('lbara:languagechange', function () {
    if (product) renderProduct(product);
  });

  try {
    await waitForI18n();
    var res = await api.getProduct(id);
    renderProduct(res.product);
    trackProductView(res.product.id);
    loading.classList.add('hidden');
    content.classList.remove('hidden');
  } catch (err) {
    loading.classList.add('hidden');
    error.classList.remove('hidden');
  }

  document.getElementById('continue-btn').addEventListener('click', function () {
    pulseControl(this);
    addSelectedToCart({ checkout: true });
  });
  var addCartBtn = document.getElementById('add-cart-btn');
  if (addCartBtn) addCartBtn.addEventListener('click', function () {
    this.classList.remove('lbara-add-cart-press');
    void this.offsetWidth;
    this.classList.add('lbara-add-cart-press');
    setTimeout(() => this.classList.remove('lbara-add-cart-press'), 360);
    addSelectedToCart({ checkout: false });
  });
});
