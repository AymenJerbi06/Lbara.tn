// Paymee Payment Gateway
// Docs: https://paymee.tn/paymee-integration-with-redirection/
const axios = require('axios');

const BASE_URL = 'https://app.paymee.tn/api/v2';

async function createPayment({ orderId, orderRef, amount }) {
  const payload = {
    vendor: process.env.PAYMEE_VENDOR_ID,
    amount: parseFloat(amount.toFixed(3)),
    note: `Lbara.tn Order ${orderRef}`,
    first_name: 'lbara',
    last_name: 'Customer',
    email: 'customer@lbara.tn',   // overridden at order level
    phone: '00000000',
    return_url: `${process.env.FRONTEND_URL}/order-confirmed.html?order_id=${orderId}`,
    cancel_url: `${process.env.FRONTEND_URL}/checkout.html?error=payment_failed&order_id=${orderId}`,
    webhook_url: `${process.env.FRONTEND_URL}/api/payments/webhook/paymee`,
    order_id: orderRef,
  };

  const response = await axios.post(`${BASE_URL}/payments/create`, payload, {
    headers: {
      'Authorization': `Token ${process.env.PAYMEE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.data?.status) {
    throw new Error('Paymee: Failed to create payment session.');
  }

  return {
    payment_id: response.data.data?.token,
    payment_url: response.data.data?.payment_url,
  };
}

async function verifyPayment(token) {
  const response = await axios.get(`${BASE_URL}/payments/${token}/check`, {
    headers: { 'Authorization': `Token ${process.env.PAYMEE_API_KEY}` },
  });

  return {
    success: response.data?.data?.payment_status === true,
    raw: response.data,
  };
}

module.exports = { createPayment, verifyPayment };
