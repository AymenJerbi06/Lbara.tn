const axios = require('axios');
const { escapeHtml } = require('../utils/html');

const FROM = process.env.EMAIL_FROM || 'Lbara.tn <onboarding@resend.dev>';

function sanitizeHeader(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').slice(0, 200);
}

async function send({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('your_')) {
    throw new Error('Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM in your environment.');
  }

  try {
    await axios.post('https://api.resend.com/emails', {
      from: FROM,
      to: [to],
      subject: sanitizeHeader(subject),
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

async function sendEmailVerificationLink(email, verifyUrl) {
  const safeVerifyUrl = escapeHtml(verifyUrl);

  await send({
    to: email,
    subject: 'Verify your email - Lbara.tn',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9ff;">
        <div style="background: #003060; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #B8860B; margin: 0; font-size: 28px;">Lbara.tn</h1>
          <p style="color: #fff; margin: 8px 0 0; font-size: 14px;">Confirm Your Account</p>
        </div>
        <div style="background: #fff; border: 2px solid #003060; border-radius: 12px; padding: 32px; text-align: center;">
          <p style="color: #43474f; font-size: 15px; margin-top: 0;">Please confirm this email address before using your account.</p>
          <a href="${safeVerifyUrl}" style="display: inline-block; background: #003060; color: #fff; font-weight: bold; font-size: 16px; padding: 14px 32px; border-radius: 12px; text-decoration: none; margin: 16px 0;">Verify Email</a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>
        </div>
      </div>
    `,
  });
}

async function sendEmailVerificationOTP(email, otp) {
  const safeOtp = escapeHtml(otp);

  await send({
    to: email,
    subject: 'Your Lbara.tn verification code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9ff;">
        <div style="background: #003060; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #B8860B; margin: 0; font-size: 28px;">Lbara.tn</h1>
          <p style="color: #fff; margin: 8px 0 0; font-size: 14px;">Confirm Your Account</p>
        </div>
        <div style="background: #fff; border: 2px solid #003060; border-radius: 12px; padding: 32px; text-align: center;">
          <p style="color: #43474f; font-size: 15px; margin-top: 0;">Use this code to verify your email address before logging in.</p>
          <div style="background: #f1f3ff; border: 2px dashed #003060; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; color: #43474f; text-transform: uppercase; letter-spacing: 2px;">Verification Code</p>
            <p style="margin: 8px 0 0; font-size: 48px; font-weight: 900; color: #003060; letter-spacing: 12px;">${safeOtp}</p>
          </div>
          <p style="color: #43474f; font-size: 13px;">This code expires in <strong>20 minutes</strong>.</p>
          <p style="color: #999; font-size: 12px;">If you did not create an account, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });
}

async function sendOrderConfirmation(order, product) {
  const safeOrderRef = escapeHtml(order.order_ref);
  const safeProductName = escapeHtml(product.name);
  const safeDuration = escapeHtml(product.duration_label || '1 Month');
  const safeAmount = escapeHtml(order.amount_tnd);
  const safeEmail = escapeHtml(order.delivery_email);
  const safeDeliveryHours = escapeHtml(product.delivery_hours || 2);

  await send({
    to: order.delivery_email,
    subject: `Order Confirmed - ${order.order_ref} | Lbara.tn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9;">
        <div style="background: #003060; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #B8860B; margin: 0; font-size: 28px;">Lbara.tn</h1>
          <p style="color: #fff; margin: 8px 0 0; font-size: 14px;">Your Order is Confirmed!</p>
        </div>
        <div style="background: #fff; border: 2px solid #003060; border-radius: 12px; padding: 24px; margin-bottom: 16px;">
          <h2 style="color: #003060; margin-top: 0;">Order #${safeOrderRef}</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Product</td><td style="padding: 8px 0; font-weight: bold; color: #003060;">${safeProductName}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Duration</td><td style="padding: 8px 0; font-weight: bold; color: #003060;">${safeDuration}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Amount Paid</td><td style="padding: 8px 0; font-weight: bold; color: #003060;">${safeAmount} TND</td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Delivery To</td><td style="padding: 8px 0; font-weight: bold; color: #003060;">${safeEmail}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">Estimated Delivery</td><td style="padding: 8px 0; font-weight: bold; color: #005F4B;">Within ${safeDeliveryHours} hour(s)</td></tr>
          </table>
        </div>
        <p style="color: #666; font-size: 13px; text-align: center;">
          Your access details and activation instructions will be sent to this email once our team processes your order.<br>
          Need help? Contact us at <a href="mailto:hello@lbara.tn" style="color: #003060;">hello@lbara.tn</a>
        </p>
      </div>
    `,
  });
}

async function sendFulfillmentEmail(order, product, credentials) {
  const safeOrderRef = escapeHtml(order.order_ref);
  const safeProductName = escapeHtml(product.name);
  const safeCredentials = escapeHtml(credentials);

  await send({
    to: order.delivery_email,
    subject: `Your ${product.name} is Ready - ${order.order_ref} | Lbara.tn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9;">
        <div style="background: #003060; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #B8860B; margin: 0; font-size: 28px;">Lbara.tn</h1>
          <p style="color: #fff; margin: 8px 0 0;">Your Access is Ready!</p>
        </div>
        <div style="background: #fff; border: 4px solid #003060; border-radius: 12px; padding: 24px; margin-bottom: 16px;">
          <h2 style="color: #003060; margin-top: 0;">${safeProductName} - Order #${safeOrderRef}</h2>
          <div style="background: #f0f4ff; border: 2px dashed #003060; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Your Access Details</p>
            <pre style="margin: 8px 0 0; font-size: 15px; color: #003060; font-weight: bold; white-space: pre-wrap;">${safeCredentials}</pre>
          </div>
          <p style="color: #666; font-size: 13px;">
            Keep these credentials safe. Do not share them.<br>
            If you have any issues, reply to this email with your order reference: <strong>${safeOrderRef}</strong>
          </p>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center;">
          Thank you for choosing Lbara.tn - Breaking digital walls one subscription at a time.
        </p>
      </div>
    `,
  });
}

async function sendContactAck(name, email, messageId) {
  const safeName = escapeHtml(name);
  const safeMessageRef = escapeHtml(messageId.split('-')[0].toUpperCase());

  await send({
    to: email,
    subject: 'We received your message - Lbara.tn',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #003060; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #B8860B; margin: 0;">Lbara.tn</h1>
        </div>
        <p>Hi <strong>${safeName}</strong>,</p>
        <p>We received your message and will get back to you within <strong>2-4 hours</strong>.</p>
        <p>Reference: <strong>#${safeMessageRef}</strong></p>
        <p>- The Lbara.tn Team</p>
      </div>
    `,
  });
}

async function sendPasswordChangeOTP(email, otp) {
  const safeOtp = escapeHtml(otp);

  await send({
    to: email,
    subject: 'Your password change code - Lbara.tn',
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
            <p style="margin: 8px 0 0; font-size: 48px; font-weight: 900; color: #003060; letter-spacing: 12px;">${safeOtp}</p>
          </div>
          <p style="color: #43474f; font-size: 13px;">This code expires in <strong>15 minutes</strong>.</p>
          <p style="color: #999; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });
}

async function sendPasswordResetLink(email, resetUrl) {
  const safeResetUrl = escapeHtml(resetUrl);

  await send({
    to: email,
    subject: 'Reset your password - Lbara.tn',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9ff;">
        <div style="background: #003060; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: #B8860B; margin: 0; font-size: 28px;">Lbara.tn</h1>
          <p style="color: #fff; margin: 8px 0 0; font-size: 14px;">Password Reset Request</p>
        </div>
        <div style="background: #fff; border: 2px solid #003060; border-radius: 12px; padding: 32px; text-align: center;">
          <p style="color: #43474f; font-size: 15px; margin-top: 0;">Click the button below to reset your password. This link expires in <strong>30 minutes</strong>.</p>
          <a href="${safeResetUrl}" style="display: inline-block; background: #003060; color: #fff; font-weight: bold; font-size: 16px; padding: 14px 32px; border-radius: 12px; text-decoration: none; margin: 16px 0;">Reset My Password</a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">If you did not request this, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });
}

module.exports = {
  send,
  sendEmailVerificationLink,
  sendEmailVerificationOTP,
  sendOrderConfirmation,
  sendFulfillmentEmail,
  sendContactAck,
  sendPasswordChangeOTP,
  sendPasswordResetLink,
};
