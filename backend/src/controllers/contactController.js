const pool = require('../config/db');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const { escapeHtml, htmlLines } = require('../utils/html');
const { contactEmailDeliveryEnabled } = require('../config/previewMode');
const {
  rejectUnexpectedFields,
  cleanString,
  cleanEmail,
  cleanEnum,
  handleValidationError,
  badRequest,
} = require('../utils/validation');

function generateContactReference() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

function contactReferenceFromId(messageId) {
  return String(messageId || '').split('-')[0].toUpperCase();
}

async function insertContactMessage(values) {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const reference = generateContactReference();
    try {
      const result = await pool.query(
        `INSERT INTO contact_messages (user_id, reference, full_name, email, subject, category, message)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, reference`,
        [
          values.userId,
          reference,
          values.fullName,
          values.email,
          values.subject || null,
          values.category || null,
          values.message,
        ]
      );
      return result.rows[0];
    } catch (err) {
      lastError = err;
      if (err.code !== '23505') throw err;
    }
  }
  throw lastError;
}

async function submit(req, res) {
  try {
    rejectUnexpectedFields(req.body, ['full_name', 'email', 'subject', 'category', 'message'], 'Contact form');
    const full_name = cleanString(req.body.full_name, { label: 'Name', required: true, max: 100 });
    const submittedEmail = cleanEmail(req.body.email);
    const email = String(req.user?.email || '').toLowerCase();
    if (!email || submittedEmail !== email) {
      throw badRequest('Please send support messages from your logged-in account email.');
    }
    const subject = cleanString(req.body.subject, { label: 'Subject', required: false, max: 150 });
    const rawCategory = cleanString(req.body.category, { label: 'Category', required: false, max: 100 });
    if (rawCategory === 'request_service') {
      throw badRequest('Service requests must use the paid request-ticket path, not the contact form.');
    }
    const category = cleanEnum(rawCategory, ['', 'general', 'sales', 'technical', 'billing', 'feedback'], {
      label: 'Category',
      required: false,
    });
    const message = cleanString(req.body.message, { label: 'Message', required: true, min: 5, max: 2000 });

    const contact = await insertContactMessage({
      userId: req.user.id,
      fullName: full_name,
      email,
      subject,
      category,
      message,
    });
    const messageId = contact.id;
    const reference = contact.reference || contactReferenceFromId(messageId);

    if (contactEmailDeliveryEnabled()) {
      // Send acknowledgement to customer
      try {
        await emailService.sendContactAck(full_name, email, reference);
      } catch (e) {
        console.error('[contact email]', e.message);
      }

      // Notify admin
      try {
        const supportEmail = process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL;
        if (supportEmail) {
          await emailService.send({
            to: supportEmail,
            subject: `New Contact #${reference}: ${subject || 'General'} from ${full_name}`,
            html: `<p><strong>Reference:</strong> #${escapeHtml(reference)}</p><p><strong>From:</strong> ${escapeHtml(full_name)} (${escapeHtml(email)})</p><p><strong>Category:</strong> ${escapeHtml(category || 'N/A')}</p><p><strong>Subject:</strong> ${escapeHtml(subject || 'N/A')}</p><p><strong>Message:</strong><br>${htmlLines(message)}</p>`,
            replyTo: email,
          });
        } else {
          console.info(`[contact/notify] Stored contact message ${messageId}; SUPPORT_EMAIL is not configured.`);
        }
      } catch (e) {
        console.error('[admin notify]', e.message);
      }
    } else {
      console.info(`[contact/preview] Stored contact message ${messageId}; email delivery is paused.`);
    }

    res.status(201).json({
      success: true,
      reference,
      email_delivery: contactEmailDeliveryEnabled(),
      message: contactEmailDeliveryEnabled()
        ? 'Your message has been sent. We will get back to you within 2-4 hours.'
        : 'Your message has been saved for preview review.',
    });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[contact/submit]', err);
    res.status(500).json({ success: false, message: 'Failed to send message. Please try again.' });
  }
}

module.exports = { submit };
