const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const LEGACY_ALGORITHM = 'aes-256-cbc';
const GCM_PREFIX = 'gcm';

function getKey() {
  const raw = process.env.ENCRYPTION_KEY;
  const placeholder = !raw || raw.includes('change_this') || raw.includes('change_in_production');

  if (placeholder && process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY must be set to a strong secret in production.');
  }

  if (raw && /^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }

  // Keeps local/dev installs from crashing while still producing a valid 32-byte key.
  return crypto.createHash('sha256').update(raw || 'fallback_key_change_in_production!').digest();
}

const KEY = getKey();

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [GCM_PREFIX, iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

function decrypt(encryptedText) {
  const parts = encryptedText.split(':');

  if (parts[0] === GCM_PREFIX) {
    const [, ivHex, tagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  const [ivHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(LEGACY_ALGORITHM, KEY, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };
