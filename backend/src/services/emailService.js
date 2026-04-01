const axios = require('axios');

const FROM = process.env.EMAIL_FROM || 'Lbara.tn <onboarding@resend.dev>';

async function send({ to, subject, html }) {
  try {
    await axios.post('https://api.resend.com/emails', {
      from: FROM,
      to: [to],
      subject,
      html,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    const details = err.response?.data || err.message;
    console.error('[emailService] Resend error:', JSON.stringify(details));
    throw new Error(typeof details === 'object' ? (details.message || JSON.stringify(details)) : details);
  }
}

// ─── Email Templates ──────────────────────────────────────

async function sendOrderConfirmation(order, product) {
  await send({
    to: order.delivery_email,
    subject: `Order Confirmed — ${order.order_ref} | Lbara.tn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9;">
        <div style="background: #003060; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #B8860B; margin: 0; font-size: 28px;">Lbara.tn</h1>
          <p style="color: #fff; margin: 8px 0 0; font-size: 14px;">Your Order is Confirmed!</p>
        </div>
        <div style="background: #fff; border: 2px solid #003060; border-radius: 12px; padding: 24px; margin-bottom: 16px;">
          <h2 style="color: #003060; margin-top: 0;">Order #${order.order_ref}</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Product</td><td style="padding: 8px 0; font-weight: bold; color: #003060;">${product.name}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Duration</td><td style="padding: 8px 0; font-weight: bold; color: #003060;">${product.duration_label || '1 Month'}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Amount Paid</td><td style="padding: 8px 0; font-weight: bold; color: #003060;">${order.amount_tnd} TND</td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Delivery To</td><td style="padding: 8px 0; font-weight: bold; color: #003060;">${order.delivery_email}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Estimated Delivery</td><td style="padding: 8px 0; font-weight: bold; color: #005F4B;">Within ${product.delivery_hours || 2} hour(s)</td></tr>
          </table>
        </div>
        <p style="color: #666; font-size: 13px; text-align: center;">
          Your credentials will be sent to this email once our team processes your order.<br>
          Need help? Contact us at <a href="mailto:hello@lbara.tn" style="color: #003060;">hello@lbara.tn</a>
        </p>
      </div>
    `,
  });
}

async function sendFulfillmentEmail(order, product, credentials) {
  await send({
    to: order.delivery_email,
    subject: `Your ${product.name} is Ready — ${order.order_ref} | Lbara.tn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9;">
        <div style="background: #003060; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #B8860B; margin: 0; font-size: 28px;">Lbara.tn</h1>
          <p style="color: #fff; margin: 8px 0 0;">Your Access is Ready!</p>
        </div>
        <div style="background: #fff; border: 4px solid #003060; border-radius: 12px; padding: 24px; margin-bottom: 16px;">
          <h2 style="color: #003060; margin-top: 0;">${product.name} — Order #${order.order_ref}</h2>
          <div style="background: #f0f4ff; border: 2px dashed #003060; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Your Access Details</p>
            <pre style="margin: 8px 0 0; font-size: 15px; color: #003060; font-weight: bold; white-space: pre-wrap;">${credentials}</pre>
          </div>
          <p style="color: #666; font-size: 13px;">
            Keep these credentials safe. Do not share them.<br>
            If you have any issues, reply to this email with your order reference: <strong>${order.order_ref}</strong>
          </p>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center;">
          Thank you for choosing Lbara.tn — Breaking digital walls one subscription at a time.
        </p>
      </div>
    `,
  });
}

async function sendContactAck(name, email, messageId) {
  await send({
    to: email,
    subject: `We received your message — Lbara.tn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #003060; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #B8860B; margin: 0;">Lbara.tn</h1>
        </div>
        <p>Hi <strong>${name}</strong>,</p>
        <p>We received your message and will get back to you within <strong>2–4 hours</strong>.</p>
        <p>Reference: <strong>#${messageId.split('-')[0].toUpperCase()}</strong></p>
        <p>— The Lbara.tn Team</p>
      </div>
    `,
  });
}

async function sendPasswordChangeOTP(email, otp) {
  await send({
    to: email,
    subject: `Your password change code — Lbara.tn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9ff;">
        <div style="background: #003060; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #B8860B; margin: 0; font-size: 28px;">Lbara.tn</h1>
          <p style="color: #fff; margin: 8px 0 0; font-size: 14px;">Password Change Request</p>
        </div>
        <div style="background: #fff; border: 2px solid #003060; border-radius: 12px; padding: 32px; text-align: center;">
          <p style="color: #43474f; font-size: 15px; margin-top: 0;">Use the code below to confirm your password change.</p>
          <div style="background: #f1f3ff; border: 2px dashed #003060; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; color: #43474f; text-transform: uppercase; letter-spacing: 2px;">Verification Code</p>
            <p style="margin: 8px 0 0; font-size: 48px; font-weight: 900; color: #003060; letter-spacing: 12px;">${otp}</p>
          </div>
          <p style="color: #43474f; font-size: 13px;">This code expires in <strong>15 minutes</strong>.</p>
          <p style="color: #999; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });
}

async function sendPasswordResetLink(email, resetUrl) {
  await send({
    to: email,
    subject: `Reset your password — Lbara.tn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9ff;">
        <div style="background: #003060; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #B8860B; margin: 0; font-size: 28px;">Lbara.tn</h1>
          <p style="color: #fff; margin: 8px 0 0; font-size: 14px;">Password Reset Request</p>
        </div>
        <div style="background: #fff; border: 2px solid #003060; border-radius: 12px; padding: 32px; text-align: center;">
          <p style="color: #43474f; font-size: 15px; margin-top: 0;">Click the button below to reset your password. This link expires in <strong>30 minutes</strong>.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #003060; color: #fff; font-weight: bold; font-size: 16px; padding: 14px 32px; border-radius: 12px; text-decoration: none; margin: 16px 0;">Reset My Password</a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">If you did not request this, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });
}

module.exports = { send, sendOrderConfirmation, sendFulfillmentEmail, sendContactAck, sendPasswordChangeOTP, sendPasswordResetLink };
