const crypto = require('crypto');
const pool = require('../config/db');
const audit = require('../utils/audit');
const { generateOrderRef } = require('../utils/orderRef');
const { encrypt } = require('../utils/crypto');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');
const {
  cleanString,
  cleanUuid,
  cleanEnum,
  rejectUnexpectedFields,
  handleValidationError,
  badRequest,
} = require('../utils/validation');

function frontendUrl(path) {
  const base = String(process.env.FRONTEND_URL || 'http://localhost:3025').replace(/\/+$/, '');
  return `${base}${path}`;
}

function generateQuoteToken() {
  return crypto.randomBytes(24).toString('base64url');
}

function generateQuoteRef() {
  return `TQ-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function cleanAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    throw badRequest('Quote amount must be a positive number.');
  }
  return parseFloat(amount.toFixed(3));
}

async function createQuote(req, res) {
  try {
    const ticketOrderId = cleanUuid(req.params.id, { label: 'Ticket order' });
    rejectUnexpectedFields(req.body, ['service_title', 'description', 'amount_tnd'], 'Ticket quote');
    const serviceTitle = cleanString(req.body.service_title, { label: 'Service title', required: true, max: 180 });
    const description = cleanString(req.body.description, { label: 'Quote description', required: false, max: 1200 });
    const amount = cleanAmount(req.body.amount_tnd);

    const orderResult = await pool.query(
      `SELECT o.*, p.name AS product_name, p.provider, p.duration_label,
              v.name AS variant_name, v.checkout_mode AS variant_checkout_mode
       FROM orders o
       JOIN products p ON p.id = o.product_id
       LEFT JOIN product_variants v ON v.id = o.variant_id
       WHERE o.id = $1`,
      [ticketOrderId]
    );
    const ticket = orderResult.rows[0];
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket order not found.' });
    if (ticket.variant_checkout_mode !== 'quote' || ticket.ticket_quote_id) {
      return res.status(400).json({ success: false, message: 'Quotes can only be sent for paid request tickets.' });
    }
    if (!['paid', 'processing'].includes(ticket.status)) {
      return res.status(400).json({ success: false, message: 'The request ticket must be paid before sending a quote link.' });
    }

    let quote;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const result = await pool.query(
          `INSERT INTO ticket_quotes (quote_ref, ticket_order_id, token, service_title, description, amount_tnd, status, created_by, sent_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'sent', $7, NOW())
           RETURNING *`,
          [generateQuoteRef(), ticket.id, generateQuoteToken(), serviceTitle, description || null, amount, req.user.id]
        );
        quote = result.rows[0];
        break;
      } catch (err) {
        if (err.code !== '23505') throw err;
      }
    }
    if (!quote) throw new Error('Could not generate a unique quote link.');

    const checkoutUrl = frontendUrl(`/ticket-checkout.html?token=${encodeURIComponent(quote.token)}`);
    try {
      await emailService.sendTicketQuoteEmail(ticket, quote, checkoutUrl);
    } catch (emailErr) {
      console.error('[ticket quote email]', emailErr.message);
    }

    await pool.query(`UPDATE orders SET status = 'processing', updated_at = NOW() WHERE id = $1`, [ticket.id]);
    await audit.log({
      entityType: 'order',
      entityId: ticket.id,
      action: 'ticket_quote_sent',
      actorId: req.user.id,
      actorType: 'admin',
      metadata: { quote_ref: quote.quote_ref, amount_tnd: amount },
    });

    res.status(201).json({ success: true, quote: { ...quote, checkout_url: checkoutUrl } });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[admin/createTicketQuote]', err);
    res.status(500).json({ success: false, message: 'Failed to send ticket quote.' });
  }
}

async function getQuote(req, res) {
  try {
    const token = cleanString(req.params.token, { label: 'Quote token', required: true, max: 120 });
    const result = await pool.query(
      `SELECT tq.*, o.order_ref AS ticket_order_ref, o.delivery_email, o.status AS ticket_status,
              p.name AS product_name, p.provider,
              v.name AS variant_name
       FROM ticket_quotes tq
       JOIN orders o ON o.id = tq.ticket_order_id
       JOIN products p ON p.id = o.product_id
       LEFT JOIN product_variants v ON v.id = o.variant_id
       WHERE tq.token = $1`,
      [token]
    );
    const quote = result.rows[0];
    if (!quote) return res.status(404).json({ success: false, message: 'Quote link not found.' });
    if (!['sent', 'paid'].includes(quote.status)) {
      return res.status(410).json({ success: false, message: 'This quote link is no longer available.' });
    }

    res.json({
      success: true,
      quote: {
        token: quote.token,
        quote_ref: quote.quote_ref,
        ticket_order_ref: quote.ticket_order_ref,
        service_title: quote.service_title,
        description: quote.description,
        amount_tnd: quote.amount_tnd,
        status: quote.status,
        product_name: quote.product_name,
        variant_name: quote.variant_name,
        delivery_email: quote.delivery_email,
      },
    });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[ticketQuotes/getQuote]', err);
    res.status(500).json({ success: false, message: 'Failed to load quote.' });
  }
}

async function checkoutQuote(req, res) {
  try {
    const token = cleanString(req.params.token, { label: 'Quote token', required: true, max: 120 });
    rejectUnexpectedFields(req.body, ['payment_method'], 'Ticket quote checkout');
    const paymentMethod = cleanEnum(req.body.payment_method || 'd17', ['d17', 'card'], { label: 'Payment method' });

    const result = await pool.query(
      `SELECT tq.*, o.user_id, o.product_id, o.variant_id, o.delivery_email, o.delivery_phone,
              o.fulfillment_type, o.fulfillment_details, o.order_ref AS ticket_order_ref,
              p.name AS product_name
       FROM ticket_quotes tq
       JOIN orders o ON o.id = tq.ticket_order_id
       JOIN products p ON p.id = o.product_id
       WHERE tq.token = $1`,
      [token]
    );
    const quote = result.rows[0];
    if (!quote) return res.status(404).json({ success: false, message: 'Quote link not found.' });
    if (quote.status !== 'sent') {
      return res.status(409).json({ success: false, message: 'This quote has already been paid or closed.' });
    }

    const amount = cleanAmount(quote.amount_tnd);
    const orderRef = generateOrderRef();
    const gateway = paymentMethod === 'card' ? 'mock' : (process.env.PAYMENT_GATEWAY || 'flouci');
    const fulfillmentDetails = encrypt(JSON.stringify({
      ticket_order_ref: quote.ticket_order_ref,
      quote_ref: quote.quote_ref,
      service_title: quote.service_title,
      quote_description: quote.description || '',
    }));

    const orderResult = await pool.query(
      `INSERT INTO orders (
         order_ref, user_id, product_id, variant_id, amount_tnd, gateway,
         delivery_email, delivery_phone, fulfillment_type, fulfillment_method,
         fulfillment_details, ticket_quote_id, ip_address, user_agent
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'ticket_final_activation',$10,$11,$12,$13)
       RETURNING *`,
      [
        orderRef,
        quote.user_id,
        quote.product_id,
        quote.variant_id,
        amount,
        gateway,
        quote.delivery_email,
        quote.delivery_phone,
        quote.fulfillment_type || 'account_setup',
        fulfillmentDetails,
        quote.id,
        req.ip,
        req.headers['user-agent'],
      ]
    );
    const order = orderResult.rows[0];

    const paymentSession = await paymentService.createPayment({
      orderId: order.id,
      orderRef: order.order_ref,
      amount,
      gateway,
    });

    await pool.query('UPDATE orders SET gateway_payment_id = $1 WHERE id = $2', [paymentSession.payment_id, order.id]);
    await pool.query(
      `INSERT INTO payments (order_id, gateway, gateway_payment_id, gateway_status)
       VALUES ($1, $2, $3, 'initiated')`,
      [order.id, gateway, paymentSession.payment_id]
    );
    await pool.query(
      `UPDATE ticket_quotes
       SET final_order_id = $1, updated_at = NOW()
       WHERE id = $2`,
      [order.id, quote.id]
    );

    await audit.log({
      entityType: 'order',
      entityId: order.id,
      action: 'ticket_quote_checkout_created',
      actorId: quote.user_id,
      actorType: quote.user_id ? 'user' : 'guest',
      metadata: { ticket_order_ref: quote.ticket_order_ref, quote_ref: quote.quote_ref },
    });

    res.status(201).json({
      success: true,
      order_id: order.id,
      order_ref: order.order_ref,
      payment_url: paymentSession.payment_url,
    });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[ticketQuotes/checkoutQuote]', err);
    res.status(500).json({ success: false, message: 'Failed to create quote checkout.' });
  }
}

module.exports = { createQuote, getQuote, checkoutQuote };
