const pool = require('../config/db');
const emailService = require('../services/emailService');
const { escapeHtml, htmlLines } = require('../utils/html');
const { contactEmailDeliveryEnabled } = require('../config/previewMode');
const {
  rejectUnexpectedFields,
  cleanString,
  cleanEmail,
  cleanEnum,
  handleValidationError,
} = require('../utils/validation');

const DEFAULT_ADMIN_EMAIL = 'Jerbiaymen6@gmail.com';

async function submit(req, res) {
  try {
    rejectUnexpectedFields(req.body, ['full_name', 'email', 'subject', 'category', 'message'], 'Contact form');
    const full_name = cleanString(req.body.full_name, { label: 'Name', required: true, max: 100 });
    const email = cleanEmail(req.body.email);
    const subject = cleanString(req.body.subject, { label: 'Subject', required: false, max: 150 });
    const category = cleanEnum(req.body.category, ['', 'general', 'sales', 'technical', 'billing', 'request_service', 'feedback'], {
      label: 'Category',
      required: false,
    });
    const message = cleanString(req.body.message, { label: 'Message', required: true, min: 5, max: 2000 });

    const result = await pool.query(
      `INSERT INTO contact_messages (full_name, email, subject, category, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [full_name, email.toLowerCase(), subject || null, category || null, message]
    );
    const messageId = result.rows[0].id;

    if (contactEmailDeliveryEnabled()) {
      // Send acknowledgement to customer
      try {
        await emailService.sendContactAck(full_name, email, messageId);
      } catch (e) {
        console.error('[contact email]', e.message);
      }

      // Notify admin
      try {
        const adminEmail = process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
        await emailService.send({
          to: adminEmail,
          subject: `New Contact: ${subject || 'General'} from ${full_name}`,
          html: `<p><strong>From:</strong> ${escapeHtml(full_name)} (${escapeHtml(email)})</p><p><strong>Category:</strong> ${escapeHtml(category || 'N/A')}</p><p><strong>Subject:</strong> ${escapeHtml(subject || 'N/A')}</p><p><strong>Message:</strong><br>${htmlLines(message)}</p>`,
        });
      } catch (e) {
        console.error('[admin notify]', e.message);
      }
    } else {
      console.info(`[contact/preview] Stored contact message ${messageId}; email delivery is paused.`);
    }

    res.status(201).json({
      success: true,
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
