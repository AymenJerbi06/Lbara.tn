function envFlag(name, defaultValue = false) {
  const value = process.env[name];
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function publicAuthEnabled() {
  return envFlag('PUBLIC_AUTH_ENABLED', true);
}

function contactEmailDeliveryEnabled() {
  return envFlag('CONTACT_EMAIL_DELIVERY_ENABLED', false);
}

function resendConfigured() {
  const key = process.env.RESEND_API_KEY;
  return Boolean(key && !key.includes('your_') && key.length > 20);
}

function emailVerificationRequired() {
  return envFlag('EMAIL_VERIFICATION_REQUIRED', process.env.NODE_ENV === 'production' && resendConfigured());
}

module.exports = {
  publicAuthEnabled,
  contactEmailDeliveryEnabled,
  emailVerificationRequired,
};
