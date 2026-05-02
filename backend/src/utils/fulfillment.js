const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FULFILLMENT_TYPES = {
  gift_card: 'Gift Card / Store Credit',
  giftable_subscription: 'Giftable Subscription',
  account_setup: 'Account Setup',
  existing_account_only: 'Existing Account Access',
};

const FULFILLMENT_METHODS = {
  gift_card_self_redeem: 'Send gift card/code to customer',
  assisted_account_activation: 'Lbara activates on customer account',
  gift_card_redeem_for_me: 'Redeem gift card on customer account',
  store_credit: 'Apple/Google store credit',
  gift_to_existing_account: 'Gift subscription to existing account',
  existing_account: 'Use customer existing account',
  create_account: 'Create account for customer',
};

const METHODS_BY_TYPE = {
  gift_card: ['gift_card_self_redeem', 'assisted_account_activation', 'store_credit', 'gift_card_redeem_for_me'],
  giftable_subscription: ['gift_to_existing_account', 'assisted_account_activation'],
  account_setup: ['assisted_account_activation', 'create_account', 'existing_account'],
  existing_account_only: ['assisted_account_activation', 'existing_account'],
};

function normalizeFulfillmentType(type) {
  return FULFILLMENT_TYPES[type] ? type : 'account_setup';
}

function getDefaultMethod(type) {
  return METHODS_BY_TYPE[normalizeFulfillmentType(type)][0];
}

function cleanText(value, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function cleanEmail(value) {
  return cleanText(value, 255).toLowerCase();
}

function isValidEmail(value) {
  return EMAIL_RE.test(value);
}

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

function requireEmail(value, label) {
  const email = cleanEmail(value);
  if (!isValidEmail(email)) {
    throw badRequest(`${label} must be a valid email address.`);
  }
  return email;
}

function requirePassword(value, label) {
  const password = cleanText(value, 300);
  if (password.length < 4) {
    throw badRequest(`${label} is required.`);
  }
  return password;
}

function normalizeFulfillmentForOrder(product, method, details = {}) {
  const fulfillmentType = normalizeFulfillmentType(product.fulfillment_type);
  const allowedMethods = METHODS_BY_TYPE[fulfillmentType];
  const fulfillmentMethod = method || getDefaultMethod(fulfillmentType);

  if (!allowedMethods.includes(fulfillmentMethod)) {
    throw badRequest('Invalid fulfillment method for this product.');
  }

  const normalized = {
    customer_notes: cleanText(details.customer_notes, 1000),
  };

  if (['assisted_account_activation', 'gift_card_redeem_for_me', 'existing_account'].includes(fulfillmentMethod)) {
    normalized.service_account_email = requireEmail(details.service_account_email, 'Service account email');
    normalized.service_account_password = requirePassword(details.service_account_password, 'Service account password');
  }

  if (fulfillmentType === 'gift_card') {
    if (fulfillmentMethod === 'store_credit') {
      const platform = cleanText(details.store_platform, 50);
      if (!['apple_app_store', 'google_play'].includes(platform)) {
        throw badRequest('Please choose Apple App Store or Google Play.');
      }
      normalized.store_platform = platform;
      normalized.store_account_email = requireEmail(details.store_account_email, 'Store account email');
      normalized.store_region = cleanText(details.store_region, 80) || 'Canada';
    }
  }

  if (fulfillmentType === 'giftable_subscription') {
    normalized.service_account_email = requireEmail(details.service_account_email, 'Service account email');
  }

  if (fulfillmentType === 'account_setup' || fulfillmentType === 'existing_account_only') {
    if (fulfillmentMethod === 'create_account') {
      normalized.new_account_email = requireEmail(details.new_account_email, 'New account email');
      normalized.account_full_name = cleanText(details.account_full_name, 120);
    }
  }

  return {
    fulfillment_type: fulfillmentType,
    fulfillment_method: fulfillmentMethod,
    fulfillment_details: normalized,
  };
}

function getFulfillmentTypeLabel(type) {
  return FULFILLMENT_TYPES[normalizeFulfillmentType(type)];
}

function getFulfillmentMethodLabel(method) {
  return FULFILLMENT_METHODS[method] || method || 'Not selected';
}

module.exports = {
  FULFILLMENT_TYPES,
  FULFILLMENT_METHODS,
  normalizeFulfillmentType,
  normalizeFulfillmentForOrder,
  getFulfillmentTypeLabel,
  getFulfillmentMethodLabel,
};
