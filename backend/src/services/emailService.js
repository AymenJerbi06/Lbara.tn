const axios = require('axios');
const { escapeHtml } = require('../utils/html');

const FROM = process.env.EMAIL_FROM || 'Lbara.tn <notifications@lbara.tn>';

function sanitizeHeader(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').slice(0, 200);
}

async function send({ to, subject, html, replyTo }) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('your_')) {
    throw new Error('Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM in your environment.');
  }

  try {
    const payload = {
      from: FROM,
      to: [to],
      subject: sanitizeHeader(subject),
      html,
    };
    if (replyTo) payload.reply_to = sanitizeHeader(replyTo);

    await axios.post('https://api.resend.com/emails', payload, {
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

function money(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(3) : String(value || '0.000');
}

function tableRow(label, value, color = '#003060') {
  return `<tr><td style="padding: 8px 0; color: #666; font-size: 14px;">${escapeHtml(label)}</td><td style="padding: 8px 0; font-weight: bold; color: ${color};">${escapeHtml(value || '-')}</td></tr>`;
}

function fulfillmentNextStep(order, product) {
  if (product.checkout_mode === 'quote') {
    return 'This is a special request ticket. We will review the exact service, then contact you with the final price before completing the purchase.';
  }

  const method = order.fulfillment_method;
  if (method === 'gift_card_self_redeem') {
    return 'We will send the code or gift card with the redemption steps. Some services may require the correct account region or VPN during redemption.';
  }
  if (method === 'gift_to_existing_account') {
    return 'We will gift or activate the subscription on the service account email you provided. Watch that inbox for any confirmation email from the service.';
  }
  if (method === 'create_account') {
    return 'We will create and activate a fresh account using the email you provided, then send the account details after processing.';
  }
  if (method === 'store_credit') {
    return 'We will prepare the store credit path you selected. Store region rules may apply, especially for Apple App Store and Google Play.';
  }
  return 'We will use the activation details you provided to complete the service on the correct account. Stay reachable in case the platform asks for verification.';
}

function fulfillmentDetailsTable(details = {}) {
  const labels = {
    service_account_email: 'Service account email',
    service_account_password: 'Service account password',
    new_account_email: 'New account email',
    account_full_name: 'Name on account',
    store_platform: 'Store platform',
    store_account_email: 'Store account email',
    store_region: 'Store region',
    customer_notes: 'Customer notes',
  };

  const rows = Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => {
      const label = labels[key] || key.replace(/_/g, ' ');
      const displayValue = key.toLowerCase().includes('password')
        ? 'Available securely in the admin dashboard'
        : value;
      return tableRow(label, displayValue);
    })
    .join('');

  return rows || tableRow('Checkout details', 'No extra details were submitted.');
}

async function sendOrderConfirmation(order, product) {
  const safeOrderRef = escapeHtml(order.order_ref);
  const safeNextStep = escapeHtml(fulfillmentNextStep(order, product));

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
            ${tableRow('Product', product.name)}
            ${tableRow('Duration', product.duration_label || '1 Month')}
            ${tableRow('Activation flow', product.fulfillment_type_label || 'Service activation')}
            ${tableRow('Selected method', product.fulfillment_method_label || 'Selected during checkout')}
            ${tableRow('Amount Paid', `${money(order.amount_tnd)} TND`)}
            ${tableRow('Delivery To', order.delivery_email)}
            ${tableRow('Estimated Delivery', `Within ${product.delivery_hours || 2} hour(s)`, '#005F4B')}
          </table>
        </div>
        <div style="background: #fff; border: 2px solid #B8860B; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <h3 style="color: #003060; margin: 0 0 8px;">What happens next?</h3>
          <p style="color: #43474f; font-size: 14px; line-height: 1.6; margin: 0;">${safeNextStep}</p>
        </div>
        <p style="color: #666; font-size: 13px; text-align: center;">
          Your access details and activation instructions will be sent to this email once our team processes your order.<br>
          Need help? Use the contact page on Lbara.tn and include your order reference.
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

async function sendContactAck(name, email, reference) {
  const safeName = escapeHtml(name);
  const safeMessageRef = escapeHtml(String(reference || '').split('-')[0].toUpperCase());

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

async function sendInternalOrderNotification(order, product) {
  const recipient = process.env.ORDER_NOTIFICATION_EMAIL
    || process.env.BUYING_EMAIL
    || process.env.SUPPORT_EMAIL
    || process.env.ADMIN_EMAIL;
  if (!recipient) return false;

  const safeOrderRef = escapeHtml(order.order_ref);
  const detailsRows = fulfillmentDetailsTable(order.fulfillment_details_decoded || {});

  await send({
    to: recipient,
    subject: `Paid Order: ${safeOrderRef} | Lbara.tn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
        <div style="background: #003060; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          <h1 style="color: #B8860B; margin: 0; font-size: 24px;">Lbara.tn</h1>
          <p style="color: #fff; margin: 8px 0 0;">New paid order</p>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          ${tableRow('Order', order.order_ref)}
          ${tableRow('Product', product.name)}
          ${tableRow('Activation flow', product.fulfillment_type_label || 'Service activation')}
          ${tableRow('Selected method', product.fulfillment_method_label || order.fulfillment_method || 'Selected during checkout')}
          ${tableRow('Amount', `${money(order.amount_tnd)} TND`)}
          ${tableRow('Promo code', order.promo_code || '-')}
          ${tableRow('Discount', `${money(order.discount_tnd || 0)} TND`)}
          ${tableRow('Delivery email', order.delivery_email)}
          ${tableRow('Phone', order.delivery_phone || '-')}
          ${tableRow('Gateway', order.gateway || 'payment gateway')}
        </table>
        <div style="background: #f8fafc; border: 2px solid #003060; border-radius: 12px; padding: 16px; margin-top: 20px;">
          <h3 style="color: #003060; margin: 0 0 10px;">Fulfillment details</h3>
          <table style="width: 100%; border-collapse: collapse;">${detailsRows}</table>
          <p style="color: #666; font-size: 12px; margin: 12px 0 0;">Sensitive passwords are intentionally kept in the admin dashboard instead of this email.</p>
        </div>
      </div>
    `,
  });
  return true;
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
  sendInternalOrderNotification,
  sendPasswordChangeOTP,
  sendPasswordResetLink,
};
