const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

function requirePlainObject(value, label = 'Request body') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw badRequest(`${label} must be an object.`);
  }
  return value;
}

function rejectUnexpectedFields(source, allowed, label = 'Request') {
  requirePlainObject(source, label);
  const allowedSet = new Set(allowed);
  const unexpected = Object.keys(source).filter((key) => !allowedSet.has(key));
  if (unexpected.length) {
    throw badRequest(`${label} contains unsupported field: ${unexpected[0]}.`);
  }
}

function cleanString(value, { label = 'Value', required = false, min = 0, max = 255 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw badRequest(`${label} is required.`);
    return null;
  }
  if (typeof value !== 'string') {
    throw badRequest(`${label} must be text.`);
  }
  const normalized = value.replace(/\0/g, '').trim();
  if (required && normalized.length < Math.max(min, 1)) {
    throw badRequest(`${label} is required.`);
  }
  if (normalized.length < min) {
    throw badRequest(`${label} is too short.`);
  }
  if (normalized.length > max) {
    throw badRequest(`${label} is too long.`);
  }
  return normalized;
}

function cleanEmail(value, { label = 'Email', required = true } = {}) {
  const email = cleanString(value, { label, required, max: 255 });
  if (!email) return null;
  const normalized = email.toLowerCase();
  if (!EMAIL_RE.test(normalized)) {
    throw badRequest(`${label} must be a valid email address.`);
  }
  return normalized;
}

function cleanPassword(value, { label = 'Password', min = 8, max = 128 } = {}) {
  if (typeof value !== 'string') {
    throw badRequest(`${label} is required.`);
  }
  if (value.length < min) {
    throw badRequest(`${label} must be at least ${min} characters.`);
  }
  if (value.length > max) {
    throw badRequest(`${label} is too long.`);
  }
  return value;
}

function cleanUuid(value, { label = 'Identifier', required = true } = {}) {
  const id = cleanString(value, { label, required, max: 40 });
  if (!id) return null;
  if (!UUID_RE.test(id)) {
    throw badRequest(`Invalid ${label.toLowerCase()}.`);
  }
  return id;
}

function cleanEnum(value, allowed, { label = 'Value', required = false } = {}) {
  const text = cleanString(value, { label, required, max: 100 });
  if (!text) return null;
  if (!allowed.includes(text)) {
    throw badRequest(`Invalid ${label.toLowerCase()}.`);
  }
  return text;
}

function cleanInteger(value, { label = 'Value', defaultValue = null, min = 1, max = 100 } = {}) {
  if (value === undefined || value === null || value === '') return defaultValue;
  const number = Number.parseInt(String(value), 10);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw badRequest(`${label} must be between ${min} and ${max}.`);
  }
  return number;
}

function cleanPhone(value) {
  const phone = cleanString(value, { label: 'Phone number', required: false, max: 30 });
  if (!phone) return null;
  if (!/^[0-9+\-\s().]{6,30}$/.test(phone)) {
    throw badRequest('Phone number contains unsupported characters.');
  }
  return phone;
}

function handleValidationError(err, res) {
  if (err.statusCode === 400) {
    res.status(400).json({ success: false, message: err.message });
    return true;
  }
  return false;
}

module.exports = {
  badRequest,
  requirePlainObject,
  rejectUnexpectedFields,
  cleanString,
  cleanEmail,
  cleanPassword,
  cleanUuid,
  cleanEnum,
  cleanInteger,
  cleanPhone,
  handleValidationError,
};
