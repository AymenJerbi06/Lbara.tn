function envFlag(name, defaultValue = false) {
  const value = process.env[name];
  if (value === undefined || value === null || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function isPlaceholder(value) {
  if (!value) return true;
  const normalized = String(value).trim().toLowerCase();
  return (
    normalized.includes('your_') ||
    normalized.includes('change_this') ||
    normalized.includes('change-me') ||
    normalized.includes('changeme') ||
    normalized === 'secret' ||
    normalized === 'password'
  );
}

function requireValue(name, errors, { minLength = 1 } = {}) {
  const value = process.env[name];
  if (isPlaceholder(value) || String(value || '').length < minLength) {
    errors.push(`${name} must be set to a real production value.`);
  }
  return value;
}

function validateFrontendUrl(errors) {
  const value = requireValue('FRONTEND_URL', errors);
  if (!value) return;

  try {
    const url = new URL(value);
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      errors.push('FRONTEND_URL must use https in production.');
    }
  } catch {
    errors.push('FRONTEND_URL must be a valid absolute URL.');
  }
}

function validatePaymentGateway(errors) {
  const gateway = (process.env.PAYMENT_GATEWAY || 'flouci').toLowerCase();
  const allowed = ['flouci', 'paymee', 'mock'];
  if (!allowed.includes(gateway)) {
    errors.push('PAYMENT_GATEWAY must be one of: flouci, paymee, mock.');
    return;
  }

  if (gateway === 'mock') {
    if (process.env.NODE_ENV === 'production' && !envFlag('ALLOW_MOCK_PAYMENTS_IN_PRODUCTION')) {
      errors.push('PAYMENT_GATEWAY=mock is blocked in production unless ALLOW_MOCK_PAYMENTS_IN_PRODUCTION=true.');
    }
    return;
  }

  if (gateway === 'flouci') {
    requireValue('FLOUCI_APP_TOKEN', errors);
    requireValue('FLOUCI_APP_SECRET', errors);
    return;
  }

  requireValue('PAYMEE_API_KEY', errors);
  requireValue('PAYMEE_VENDOR_ID', errors);
}

function validateEmailConfig(errors) {
  const verificationSetting = process.env.EMAIL_VERIFICATION_REQUIRED;
  const verificationEnabled = verificationSetting === undefined || verificationSetting === null || verificationSetting === ''
    ? !isPlaceholder(process.env.RESEND_API_KEY) && String(process.env.RESEND_API_KEY || '').length > 20
    : envFlag('EMAIL_VERIFICATION_REQUIRED');
  const needsEmail =
    envFlag('CONTACT_EMAIL_DELIVERY_ENABLED') ||
    verificationEnabled;

  if (!needsEmail) return;
  requireValue('RESEND_API_KEY', errors, { minLength: 20 });
  requireValue('EMAIL_FROM', errors);
}

function validateRuntimeConfig() {
  if (process.env.NODE_ENV !== 'production') return;

  const errors = [];
  requireValue('JWT_SECRET', errors, { minLength: 32 });

  const encryptionKey = requireValue('ENCRYPTION_KEY', errors);
  if (encryptionKey && !/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
    errors.push('ENCRYPTION_KEY must be a 64-character hex string.');
  }

  validateFrontendUrl(errors);
  validatePaymentGateway(errors);
  validateEmailConfig(errors);

  if (errors.length) {
    throw new Error(`Production configuration is not safe:\n- ${errors.join('\n- ')}`);
  }
}

module.exports = { validateRuntimeConfig };
