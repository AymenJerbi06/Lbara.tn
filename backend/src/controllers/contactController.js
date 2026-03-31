const pool = require('../config/db');
const emailService = require('../services/emailService');

async function submit(req, res) {
  const { full_name, email, subject, category, message } = req.body;

  if (!full_name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
  }
  if (message.length > 2000) {
    return res.status(400).json({ success: false, message: 'Message is too long (max 2000 characters).' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO contact_messages (full_name, email, subject, category, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [full_name, email.toLowerCase(), subject || null, category || null, message]
    );
    const messageId = result.rows[0].id;

    // Send acknowledgement to customer
    try {
      await emailService.sendContactAck(full_name, email, messageId);
    } catch (e) {
      console.error('[contact email]', e.message);
    }

    // Notify admin
    try {
      await emailService.send({
        to: process.env.ADMIN_EMAIL,
        subject: `New Contact: ${subject || 'General'} from ${full_name}`,
        html: `<p><strong>From:</strong> ${full_name} (${email})</p><p><strong>Category:</strong> ${category || 'N/A'}</p><p><strong>Subject:</strong> ${subject || 'N/A'}</p><p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>`,
      });
    } catch (e) {
      console.error('[admin notify]', e.message);
    }

    res.status(201).json({ success: true, message: 'Your message has been sent. We will get back to you within 2-4 hours.' });
  } catch (err) {
    console.error('[contact/submit]', err);
    res.status(500).json({ success: false, message: 'Failed to send message. Please try again.' });
  }
}

module.exports = { submit };
