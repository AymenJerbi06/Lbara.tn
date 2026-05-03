// Checkout Page

document.addEventListener('DOMContentLoaded', async function () {
  const cart = JSON.parse(sessionStorage.getItem('lbara_cart') || 'null');

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

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('error') === 'payment_failed') {
    showToast('Payment was not completed. Please try again.', 'error');
  }

  if (!cart) {
    showToast('No item selected. Redirecting to shop...', 'error');
    setTimeout(function () { window.location.href = '/shop.html'; }, 1500);
    return;
  }

  let product = {
    id: cart.product_id,
    name: cart.product_name,
    price_tnd: cart.price_tnd,
    account_type: 'private',
    duration_label: '1 Month',
    fulfillment_type: 'account_setup',
  };

  try {
    const res = await api.getProduct(cart.product_id);
    if (res.product) product = res.product;
  } catch (err) {
    showToast('Using saved cart details. Product options could not be refreshed.', 'error');
  }

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const productVariant = cart.variant_id
    ? variants.find(function (variant) { return variant.id === cart.variant_id; })
    : null;
  const selectedVariant = cart.variant_id
    ? productVariant || {
        id: cart.variant_id,
        name: cart.variant_name,
        price_tnd: cart.price_tnd,
        checkout_mode: cart.checkout_mode || 'full_payment',
        billing_period: cart.billing_period || null,
      }
    : null;

  function toNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    var number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function amountForSelection() {
    if (selectedVariant) {
      if (selectedVariant.checkout_mode === 'quote') return toNumber(productVariant ? selectedVariant.deposit_tnd : (selectedVariant.deposit_tnd ?? cart.price_tnd));
      return toNumber(productVariant ? selectedVariant.price_tnd : (selectedVariant.price_tnd ?? cart.price_tnd));
    }
    return toNumber(product.price_tnd ?? cart.price_tnd);
  }

  const nameEl = document.getElementById('summary-product-name');
  const priceEl = document.getElementById('summary-price');
  const totalEl = document.getElementById('summary-total');
  const subtotalEl = document.getElementById('summary-subtotal');
  const metaEl = nameEl ? nameEl.nextElementSibling : null;
  const price = amountForSelection();
  const pricingReady = price !== null && price > 0;

  if (nameEl) nameEl.textContent = selectedVariant ? tr(product.name) + ' - ' + tr(selectedVariant.name) : tr(product.name);
  if (metaEl) {
    const billingLabel = selectedVariant?.billing_period || product.duration_label || '1 Month';
    const modeLabel = selectedVariant?.checkout_mode === 'quote' ? 'Special request ticket - not part of final price' : 'Full payment';
    metaEl.textContent = tr(product.account_type === 'shared' ? 'Shared' : 'Private') + ' ' + tr('Account') + ' - ' + tr(billingLabel) + ' - ' + tr(modeLabel);
  }
  if (priceEl) priceEl.textContent = pricingReady ? price.toFixed(3) : tr('TBD');
  if (subtotalEl) subtotalEl.textContent = pricingReady ? formatCurrency(price) : tr('Pricing TBD');
  if (totalEl) totalEl.textContent = pricingReady ? price.toFixed(3) : tr('TBD');

  const placeOrderBtn = document.getElementById('place-order-btn');
  if (!pricingReady && placeOrderBtn) {
    placeOrderBtn.disabled = true;
    placeOrderBtn.classList.add('opacity-50', 'cursor-not-allowed');
    placeOrderBtn.innerHTML = '<span class="material-symbols-outlined">schedule</span> ' + tr('Pricing Not Ready');
    showToast('This option does not have a price yet. Please contact us first.', 'error');
  }

  renderFulfillmentFields(product, selectedVariant);
  applyTranslations(document);

  document.addEventListener('lbara:languagechange', function () {
    applyTranslations(document);
  });

  let discountApplied = 0;
  const promoInput = document.getElementById('promo-input');
  const promoBtn = document.getElementById('promo-btn');
  const discountRow = document.getElementById('discount-row');

  if (promoBtn && promoInput) {
    promoBtn.addEventListener('click', async function () {
      const code = promoInput.value.trim().toUpperCase();
      if (!code) return;

      if (code === 'LBARA10') {
        if (!pricingReady) {
          showToast('Promo codes can be applied after pricing is set.', 'error');
          return;
        }
        discountApplied = parseFloat((price * 0.10).toFixed(3));
        const newTotal = parseFloat((price - discountApplied).toFixed(3));
        if (totalEl) totalEl.textContent = newTotal.toFixed(3);
        if (discountRow) {
          discountRow.classList.remove('hidden');
          discountRow.querySelector('.discount-amount').textContent = '-' + formatCurrency(discountApplied);
        }
        showToast('Promo code applied! 10% discount.');
      } else {
        showToast('Invalid promo code.', 'error');
      }
    });
  }

  var selectedPayment = 'd17';

  function updatePaymentUI(value) {
    selectedPayment = value;
    var d17Option = document.getElementById('option-d17');
    var cardOption = document.getElementById('option-card');
    var dotD17 = document.getElementById('dot-d17');
    var dotCard = document.getElementById('dot-card');
    if (!d17Option || !cardOption || !dotD17 || !dotCard) return;

    var offBorder = 'rgba(0,48,96,0.1)';
    var offBg = 'transparent';
    var offDotBg = 'transparent';
    var offDotBorder = 'rgba(0,48,96,0.2)';

    d17Option.style.borderColor = offBorder;
    d17Option.style.backgroundColor = offBg;
    dotD17.style.backgroundColor = offDotBg;
    dotD17.style.borderColor = offDotBorder;
    dotD17.innerHTML = '';

    cardOption.style.borderColor = offBorder;
    cardOption.style.backgroundColor = offBg;
    dotCard.style.backgroundColor = offDotBg;
    dotCard.style.borderColor = offDotBorder;
    dotCard.innerHTML = '';

    var activeOption = value === 'd17' ? d17Option : cardOption;
    var activeDot = value === 'd17' ? dotD17 : dotCard;
    activeOption.style.borderColor = '#B8860B';
    activeOption.style.backgroundColor = 'rgba(184,134,11,0.05)';
    activeDot.style.backgroundColor = '#B8860B';
    activeDot.style.borderColor = '#B8860B';
    activeDot.innerHTML = '<div style="width:8px;height:8px;background:#fff;border-radius:50%;"></div>';

    var radio = document.querySelector('input[name="payment"][value="' + value + '"]');
    if (radio) radio.checked = true;
  }

  document.getElementById('option-d17').addEventListener('click', function () { updatePaymentUI('d17'); });
  document.getElementById('option-card').addEventListener('click', function () { updatePaymentUI('card'); });
  updatePaymentUI('d17');

  const deliveryEmailEl = document.getElementById('delivery-email');
  if (deliveryEmailEl) {
    deliveryEmailEl.addEventListener('blur', function () {
      const value = deliveryEmailEl.value.trim();
      ['service-account-email', 'giftable-account-email', 'store-account-email', 'new-account-email'].forEach(function (id) {
        const el = document.getElementById(id);
        if (el && !el.value.trim()) el.value = value;
      });
    });
  }

  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', async function () {
      if (!pricingReady) {
        showToast('This option does not have a price yet. Please contact us first.', 'error');
        return;
      }

      const deliveryEmail = document.getElementById('delivery-email')?.value.trim();
      const deliveryPhone = document.getElementById('delivery-phone')?.value.trim();
      const promoCode = promoInput?.value.trim() || '';

      if (!deliveryEmail || !deliveryEmail.includes('@')) {
        showToast('Please enter a valid delivery email.', 'error');
        return;
      }

      if (!selectedPayment) {
        showToast('Please select a payment method.', 'error');
        return;
      }

      let fulfillment;
      try {
        fulfillment = collectFulfillmentDetails(product);
      } catch (err) {
        showToast(err.message, 'error');
        return;
      }

      placeOrderBtn.disabled = true;
      placeOrderBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">autorenew</span> ' + tr('Processing...');

      try {
        const result = await api.createOrder({
          product_id: cart.product_id,
          variant_id: cart.variant_id || null,
          delivery_email: deliveryEmail,
          delivery_phone: deliveryPhone || null,
          payment_method: selectedPayment,
          promo_code: promoCode || null,
          fulfillment_method: fulfillment.method,
          fulfillment_details: fulfillment.details,
        });

        if (!result.payment_url) {
          throw new Error('Payment gateway not configured. Please contact support.');
        }
        sessionStorage.setItem('lbara_pending_order', result.order_id);
        sessionStorage.removeItem('lbara_cart');
        window.location.href = result.payment_url;
      } catch (err) {
        showToast(err.message, 'error');
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = '<span class="material-symbols-outlined">lock_open</span> ' + tr('Place Order Now');
      }
    });
  }
});

function fulfillmentType(product) {
  return product.fulfillment_type || 'account_setup';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function serviceDisplayName(product) {
  var name = String(product?.name || product?.provider || 'this service').trim();
  return name
    .replace(/\s+(Subscription|Request|Purchase)$/i, '')
    .replace(/\s+(Gift Card)$/i, '')
    .trim() || name;
}

function selectedOfferName(product, variant) {
  var base = serviceDisplayName(product);
  if (!variant?.name) return base;
  if (/^(monthly subscription|annual plan|annual delivery)$/i.test(variant.name)) return base;
  return base + ' - ' + variant.name;
}

function serviceAccountName(product) {
  var slug = String(product?.slug || '').toLowerCase();
  var name = String(product?.name || '').toLowerCase();
  var provider = String(product?.provider || '').toLowerCase();

  if (slug.includes('chatgpt')) return 'ChatGPT/OpenAI account';
  if (slug.includes('claude')) return 'Claude/Anthropic account';
  if (slug.includes('gemini')) return 'Gemini/Google account';
  if (slug.includes('youtube')) return 'YouTube/Google account';
  if (slug.includes('icloud')) return 'Apple ID for iCloud';
  if (slug.includes('apple') || name.includes('app store') || name.includes('itunes') || name.includes('apple books')) return 'Apple ID';
  if (slug.includes('google-play')) return 'Google Play/Google account';
  if (slug.includes('playstation')) return 'PlayStation Network account';
  if (slug.includes('xbox')) return 'Xbox/Microsoft account';
  if (slug.includes('steam')) return 'Steam account';
  if (slug.includes('disney') || name.includes('disney+')) return 'Disney+ account';
  if (slug.includes('prime-video')) return 'Amazon Prime Video account';
  if (provider === 'amazon kindle') return 'Amazon Kindle account';
  if (provider === 'google cloud') return 'Google Cloud account';

  return serviceDisplayName(product) + ' account';
}

function optionCard(value, title, description, icon, checked, details) {
  var detailHtml = '';
  if (Array.isArray(details) && details.length) {
    detailHtml = ''
      + '<ul class="mt-3 space-y-1.5 text-[11px] font-bold text-primary/45 leading-relaxed">'
      + details.map(function (detail) {
        return '<li class="flex gap-2"><span class="material-symbols-outlined text-secondary text-sm mt-0.5">check_circle</span><span>' + escapeHtml(detail) + '</span></li>';
      }).join('')
      + '</ul>';
  }

  return ''
    + '<label data-fulfillment-card="' + escapeHtml(value) + '" class="payment-option border-primary/10 hover:bg-primary/5 cursor-pointer">'
    + '<input style="position:absolute;opacity:0;width:0;height:0;" name="fulfillment_method" type="radio" value="' + escapeHtml(value) + '"' + (checked ? ' checked' : '') + '/>'
    + '<div class="flex items-start justify-between gap-4 w-full">'
    + '<div class="flex items-start gap-3 min-w-0">'
    + '<span data-fulfillment-icon class="material-symbols-outlined text-primary/50 text-3xl shrink-0">' + escapeHtml(icon) + '</span>'
    + '<div class="min-w-0"><p class="font-black text-primary text-sm uppercase">' + escapeHtml(title) + '</p>'
    + '<p class="text-xs font-bold text-primary/45 leading-relaxed">' + escapeHtml(description) + '</p>'
    + detailHtml
    + '</div>'
    + '</div>'
    + '<span data-fulfillment-dot class="w-6 h-6 rounded-full border-2 border-primary/20 flex items-center justify-center shrink-0 mt-1 transition-all"></span>'
    + '</div>'
    + '</label>';
}

function guidanceBlock(title, items, tone, icon) {
  var tones = {
    primary: 'bg-primary/5 border-primary/10 text-primary/70',
    secondary: 'bg-secondary/10 border-secondary/20 text-secondary',
    accent: 'bg-accent/10 border-accent/20 text-primary/70',
  };
  var classes = tones[tone] || tones.primary;

  return ''
    + '<div class="' + classes + ' border-2 rounded-2xl p-4 text-sm font-bold leading-relaxed">'
    + '<div class="flex gap-3">'
    + '<span class="material-symbols-outlined text-2xl shrink-0">' + escapeHtml(icon) + '</span>'
    + '<div>'
    + '<p class="font-black uppercase tracking-wide text-xs mb-2">' + escapeHtml(title) + '</p>'
    + '<ul class="space-y-1.5 text-xs leading-relaxed">'
    + items.map(function (item) {
      return '<li class="flex gap-2"><span class="material-symbols-outlined text-sm mt-0.5">done</span><span>' + escapeHtml(item) + '</span></li>';
    }).join('')
    + '</ul>'
    + '</div>'
    + '</div>'
    + '</div>';
}

function assistedActivationOption(accountName, offerName, checked) {
  return optionCard('assisted_account_activation', 'Activate it for me', 'Give us temporary access to your ' + accountName + '. We handle the correct activation path for ' + offerName + ', whether it requires a card payment, gifted plan, store credit, or gift-card redemption.', 'support_agent', checked, [
    'You provide temporary login access to your ' + accountName + '.',
    'We activate the selected service on that exact account.',
    'You stay reachable for verification, then change your password after confirmation.',
  ]);
}

function assistedActivationPanel(accountName, offerName) {
  return ''
    + '<div data-method-panel="assisted_account_activation" class="space-y-3 bg-primary/5 border-2 border-primary/10 rounded-2xl p-4">'
    + guidanceBlock('What we need for assisted activation', [
      'We specifically need the ' + accountName + ' where you want the ' + offerName + ' activation applied.',
      'The ' + accountName + ' email and password must work at the time we process your order.',
      'If ' + accountName + ' login asks for two-factor authentication, stay reachable by email or phone.',
      'You should never send banking details. We only need access to your ' + accountName + ' when this method is selected.',
    ], 'primary', 'support_agent')
    + field('service-account-email', accountName + ' Email *', 'account@email.com', 'email', 'Use the email for the ' + accountName + ' that should receive this activation.')
    + field('service-account-password', accountName + ' Password *', 'Temporary password', 'password', 'A temporary password for your ' + accountName + ' is safest. Change it after we confirm activation.')
    + '</div>';
}

function renderFulfillmentFields(product, selectedVariant) {
  const container = document.getElementById('fulfillment-fields');
  if (!container) return;

  const type = fulfillmentType(product);
  const accountName = serviceAccountName(product);
  const offerName = selectedOfferName(product, selectedVariant);
  let html = '';
  const quoteNotice = selectedVariant?.checkout_mode === 'quote'
    ? guidanceBlock('Special request ticket', [
        'You are paying 1.500 TND to open a request ticket, let us review availability, and contact you shortly.',
        'This 1.500 TND is not part of the final service price and is not refundable if you change your mind after we start reviewing the request.',
        'You must provide the requested account details so we can check the exact price and complete the purchase if you approve it.',
        'Example estimate: if a course certificate costs 40 CAD, the expected final price is about 125.798 TND using 40 CAD x 12% tax x 17% service margin x 2.40.',
      ], 'accent', 'confirmation_number')
    : '';

  if (type === 'gift_card') {
    html = ''
      + quoteNotice
      + guidanceBlock('Allowed for this product', [
        'This service is configured as a gift-card or store-credit product, so self-redemption and store-credit choices may appear here.',
        'If you choose self-redemption, you handle the service account region, VPN steps, and redemption instructions yourself.',
        'Assisted activation is also available: you give us temporary access to your ' + accountName + ', and we handle whichever payment or redemption path works for this product.',
      ], 'primary', 'redeem')
      + '<div class="grid grid-cols-1 gap-3">'
      + optionCard('gift_card_self_redeem', 'Send me the code', 'Best if you want the most privacy and you are comfortable following the instructions yourself.', 'redeem', true, [
        'We send the code and any service-specific steps to your delivery email.',
        'Some gift cards only work when the account region matches the card region.',
        'You may need a VPN during redemption, depending on the service.',
      ])
      + assistedActivationOption(accountName, offerName, false)
      + optionCard('store_credit', 'Store credit help', 'For Apple App Store or Google Play credit when the service can be paid through the store balance.', 'phone_iphone', false, [
        'Apple and Google credit rules depend heavily on account region.',
        'Changing store region can affect existing balance, subscriptions, and family sharing.',
        'Use this only when you understand the store-region requirement.',
      ])
      + '</div>'
      + guidanceBlock('Before choosing gift card delivery', [
        'Do not redeem the code before contacting us if you notice the wrong service, wrong amount, or wrong region.',
        'We cannot control restrictions created by the service provider, your account country, or a previously used gift card.',
        'Keep your delivery email active because all code and activation updates are sent there.',
      ], 'accent', 'info')
      + assistedActivationPanel(accountName, offerName)
      + '<div data-method-panel="store_credit" class="hidden space-y-3 bg-primary/5 border-2 border-primary/10 rounded-2xl p-4">'
      + guidanceBlock('Store credit details', [
        'For Apple, the Apple ID region usually needs to match the credit region before redemption.',
        'For Google Play, gift card redemption rules can be stricter and may require matching country signals.',
        'If you are unsure, add a note before paying so we can confirm the safest route.',
      ], 'primary', 'phone_iphone')
      + '<div><label class="block text-xs font-black text-primary/50 uppercase tracking-widest mb-2">Store Platform *</label><select id="store-platform" class="input-cartoon"><option value="apple_app_store">Apple App Store</option><option value="google_play">Google Play</option></select></div>'
      + field('store-account-email', 'Store Account Email *', 'appleid@email.com', 'email', 'Use the Apple ID or Google account that will receive the credit.')
      + field('store-region', 'Target Region', 'Canada', 'text', 'Write the region you want us to prepare for. Canada is the default for most imported services.')
      + '</div>'
      + notesField('Notes for the team', 'Mention your current account region, device type, VPN availability, or any redemption concern.')
      + ackField('I understand this product can use gift-card, store-credit, or assisted activation depending on the option I choose. If I choose assisted activation, I agree to provide the requested ' + accountName + ' details and any verification needed.');
  } else if (type === 'giftable_subscription') {
    html = ''
      + quoteNotice
      + guidanceBlock('Allowed for this product', [
        'This service can usually be gifted directly to an existing account using only the account email.',
        'Assisted activation is also available if you want us to enter the account and handle the correct purchase or activation path for you.',
        'The method you choose below determines whether we only need your ' + accountName + ' email or full temporary account access.',
      ], 'secondary', 'card_giftcard')
      + '<div class="grid grid-cols-1 gap-3">'
      + optionCard('gift_to_existing_account', 'Gift it to my account email', 'Best if your ' + accountName + ' can receive gifts or plan upgrades without sharing a password.', 'card_giftcard', true, [
        'You provide only the email linked to your ' + accountName + '.',
        'We send or apply the gift through the official gifting path when available.',
        'You may need to accept a service email after payment.',
      ])
      + assistedActivationOption(accountName, offerName, false)
      + '</div>'
      + '<div data-method-panel="gift_to_existing_account" class="space-y-3 bg-primary/5 border-2 border-primary/10 rounded-2xl p-4">'
      + field('giftable-account-email', accountName + ' Email *', 'account@email.com', 'email', 'Enter the email used to sign in to your ' + accountName + ', not just your delivery email.')
      + guidanceBlock('Before placing this order', [
        'Check that the target ' + accountName + ' exists and can receive gifts or plan upgrades.',
        'Watch the service inbox and spam folder after payment because some platforms send an acceptance email.',
        'We will use your delivery email for order updates and this ' + accountName + ' email for the actual gift.',
      ], 'primary', 'mark_email_read')
      + '</div>'
      + assistedActivationPanel(accountName, offerName)
      + notesField('Notes for the team', 'Add anything that helps us identify the account, such as username, current plan, or renewal date.')
      + ackField('I understand this product can be handled by gift email or assisted activation. I confirm the information I provide for my ' + accountName + ' is correct and that I will stay reachable for any verification.');
  } else if (type === 'existing_account_only') {
    html = ''
      + quoteNotice
      + guidanceBlock('Allowed for this product', [
        'This service must be completed inside your ' + accountName + ' because the item, course, profile, or progress is already there.',
        'For quote or deposit products, the first payment covers review and coordination before we confirm the final price.',
        'Once review work starts, deposits may not be refundable because the team has already spent time on the request.',
      ], 'accent', 'manage_accounts')
      + '<div class="grid grid-cols-1 gap-3">'
      + assistedActivationOption(accountName, offerName, true)
      + '</div>'
      + '<div data-method-panel="assisted_account_activation" class="space-y-3 bg-primary/5 border-2 border-primary/10 rounded-2xl p-4">'
      + guidanceBlock('What we need from you', [
        'The ' + accountName + ' must already contain the course, certificate request, saved item, or profile we are working on.',
        'Tell us exactly what you want purchased or activated in the notes field.',
        'If your account uses two-factor authentication, stay reachable until the order is processed.',
      ], 'primary', 'assignment')
      + field('service-account-email', accountName + ' Email *', 'account@email.com', 'email', 'Use the ' + accountName + ' where the course, request, or saved progress already exists.')
      + field('service-account-password', accountName + ' Password *', 'Temporary password', 'password', 'Use a temporary password for your ' + accountName + ' when possible, then change it after completion.')
      + '</div>'
      + notesField('Notes for the team', 'Include course link, certificate name, account username, exact request, deadline, or anything we should verify before quoting.')
      + ackField('I understand this request must be processed on my existing ' + accountName + ' and that any deposit is used for review, coordination, and follow-up before final pricing is confirmed.');
  } else {
    html = ''
      + quoteNotice
      + guidanceBlock('Allowed for this product', [
        'This service is bought with a card or external payment method, so we need a safe way to activate it on an account.',
        'Assisted activation is available if you already have a ' + accountName + ' you want to keep using.',
        'Choose new account if you prefer not to share your current account, or if the service works better with a fresh account.',
      ], 'accent', 'vpn_key')
      + '<div class="grid grid-cols-1 gap-3">'
      + assistedActivationOption(accountName, offerName, true)
      + optionCard('create_account', 'Create a new account for me', 'Best if you want a cleaner setup and you only want to provide an email you control.', 'person_add', false, [
        'We create the service account and pay for the selected plan.',
        'You receive the login details at your delivery email.',
        'Because you own the email, you can reset or change the password later.',
      ])
      + '</div>'
      + '<div data-method-panel="assisted_account_activation" class="space-y-3 bg-primary/5 border-2 border-primary/10 rounded-2xl p-4">'
      + guidanceBlock('Existing account requirements', [
        'Make sure the password works before paying.',
        'Remove login blocks when possible, such as unavailable recovery email or strict two-factor settings.',
        'Stay reachable in case the service asks for an email code, SMS code, or login confirmation.',
      ], 'primary', 'lock_open')
      + field('service-account-email', accountName + ' Email *', 'account@email.com', 'email', 'Use the ' + accountName + ' where you want the paid plan activated.')
      + field('service-account-password', accountName + ' Password *', 'Temporary password', 'password', 'A temporary password for your ' + accountName + ' is recommended. Change it after activation.')
      + '</div>'
      + '<div data-method-panel="create_account" class="hidden space-y-3 bg-primary/5 border-2 border-primary/10 rounded-2xl p-4">'
      + guidanceBlock('New account requirements', [
        'Use an email you control because some services require email verification before the account can be used.',
        'We send you the created account details after payment and activation.',
        'Change the password as soon as you receive the account details.',
      ], 'primary', 'person_add')
      + field('new-account-email', 'Email For The New Account *', 'account@email.com', 'email', 'This must be an inbox you can access for verification and future password resets.')
      + field('account-full-name', 'Name On Account (Optional)', 'Your name', 'text', 'Use the name you want displayed on the service account, if the service asks for one.')
      + '</div>'
      + notesField('Notes for the team', 'Mention your preferred username, recovery email, device, country/region, or any account restriction we should know before activation.')
      + ackField('I understand the selected method determines what access Lbara.tn needs. I agree to provide accurate ' + accountName + ' details, stay reachable for verification, and change any temporary password after activation.');
  }

  container.innerHTML = html;
  if (window.lbaraI18n) window.lbaraI18n.apply(container);

  container.querySelectorAll('input[name="fulfillment_method"]').forEach(function (radio) {
    radio.addEventListener('change', updateFulfillmentPanels);
  });
  updateFulfillmentPanels();
}

function field(id, label, placeholder, type, helpText) {
  return ''
    + '<div>'
    + '<label class="block text-xs font-black text-primary/50 uppercase tracking-widest mb-2">' + escapeHtml(label) + '</label>'
    + '<input id="' + escapeHtml(id) + '" class="input-cartoon" placeholder="' + escapeHtml(placeholder) + '" type="' + escapeHtml(type) + '"/>'
    + (helpText ? '<p class="text-[10px] font-bold text-primary/45 mt-1 leading-relaxed">' + escapeHtml(helpText) + '</p>' : '')
    + '</div>';
}

function notesField(label, placeholder) {
  return ''
    + '<div>'
    + '<label class="block text-xs font-black text-primary/50 uppercase tracking-widest mb-2">' + escapeHtml(label) + '</label>'
    + '<textarea id="fulfillment-notes" class="input-cartoon h-24 resize-none" placeholder="' + escapeHtml(placeholder || 'Anything we should know before activating this service?') + '"></textarea>'
    + '</div>';
}

function ackField(copy) {
  return ''
    + '<label class="flex items-start gap-3 bg-accent/10 border-2 border-accent/20 rounded-2xl p-4 cursor-pointer">'
    + '<input id="fulfillment-ack" type="checkbox" class="mt-1 rounded border-accent text-accent focus:ring-accent"/>'
    + '<span class="text-xs font-bold text-primary/70 leading-relaxed">' + escapeHtml(copy || 'I understand this service only supports the activation path shown here. I agree to provide the requested account or redemption details, and I understand request/deposit payments are used to review and process the order.') + '</span>'
    + '</label>';
}

function updateFulfillmentPanels() {
  const selected = document.querySelector('input[name="fulfillment_method"]:checked')?.value;

  document.querySelectorAll('[data-fulfillment-card]').forEach(function (card) {
    var radio = card.querySelector('input[name="fulfillment_method"]');
    var dot = card.querySelector('[data-fulfillment-dot]');
    var icon = card.querySelector('[data-fulfillment-icon]');
    var isSelected = Boolean(radio && radio.checked);

    card.style.borderColor = isSelected ? '#B8860B' : 'rgba(0,48,96,0.1)';
    card.style.backgroundColor = isSelected ? 'rgba(184,134,11,0.06)' : 'transparent';

    if (icon) {
      icon.style.color = isSelected ? '#B8860B' : 'rgba(0,48,96,0.5)';
    }

    if (dot) {
      dot.style.borderColor = isSelected ? '#B8860B' : 'rgba(0,48,96,0.2)';
      dot.style.backgroundColor = isSelected ? '#B8860B' : 'transparent';
      dot.innerHTML = isSelected ? '<span class="block w-2.5 h-2.5 rounded-full bg-white"></span>' : '';
    }
  });

  document.querySelectorAll('[data-method-panel]').forEach(function (panel) {
    if (panel.getAttribute('data-method-panel') === selected) {
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  });
}

function inputValue(id) {
  return document.getElementById(id)?.value.trim() || '';
}

function requireValue(value, message) {
  if (!value) throw new Error(message);
  return value;
}

function requireEmailValue(value, message) {
  requireValue(value, message);
  if (!value.includes('@')) throw new Error(message);
  return value;
}

function collectFulfillmentDetails(product) {
  const method = document.querySelector('input[name="fulfillment_method"]:checked')?.value;
  if (!method) throw new Error('Please choose an activation method.');
  if (!document.getElementById('fulfillment-ack')?.checked) {
    throw new Error('Please confirm that you understand the activation requirements for this service.');
  }

  const details = {
    customer_notes: inputValue('fulfillment-notes'),
  };

  if (method === 'assisted_account_activation' || method === 'gift_card_redeem_for_me' || method === 'existing_account') {
    details.service_account_email = requireEmailValue(inputValue('service-account-email'), 'Please enter the service account email.');
    details.service_account_password = requireValue(inputValue('service-account-password'), 'Please enter the service account password.');
  }

  if (method === 'store_credit') {
    details.store_platform = inputValue('store-platform');
    details.store_account_email = requireEmailValue(inputValue('store-account-email'), 'Please enter the store account email.');
    details.store_region = inputValue('store-region') || 'Canada';
  }

  if (method === 'gift_to_existing_account') {
    details.service_account_email = requireEmailValue(inputValue('giftable-account-email'), 'Please enter the service account email.');
  }

  if (method === 'create_account') {
    details.new_account_email = requireEmailValue(inputValue('new-account-email'), 'Please enter the email for the new account.');
    details.account_full_name = inputValue('account-full-name');
  }

  return { method, details };
}
