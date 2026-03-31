// Flouci Payment Gateway
// Docs: https://docs.flouci.com
const axios = require('axios');

const BASE_URL = 'https://developers.flouci.com/api';

async function createPayment({ orderId, orderRef, amount }) {
  const payload = {
    app_token: process.env.FLOUCI_APP_TOKEN,
    app_secret: process.env.FLOUCI_APP_SECRET,
    amount: Math.round(amount * 1000),  // Flouci expects millimes (1 TND = 1000 millimes)
    accept_card: 'true',
    session_timeout_secs: 1200,
    success_link: `${process.env.FRONTEND_URL}/order-confirmed.html?order_id=${orderId}`,
    fail_link: `${process.env.FRONTEND_URL}/checkout.html?error=payment_failed&order_id=${orderId}`,
    developer_tracking_id: orderRef,
  };

  const response = await axios.post(`${BASE_URL}/generate_payment`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.data?.result?.success) {
    throw new Error('Flouci: Failed to create payment session.');
  }

  return {
    payment_id: response.data.result.payment_id,
    payment_url: `https://gateway.flouci.com/application/public/${response.data.result.payment_id}`,
  };
}

async function verifyPayment(paymentId) {
  const response = await axios.get(`${BASE_URL}/verify_payment/${paymentId}`, {
    headers: {
      'apppublic': process.env.FLOUCI_APP_TOKEN,
      'appsecret': process.env.FLOUCI_APP_SECRET,
    },
  });

  return {
    success: response.data?.result?.status === 'SUCCESS',
    raw: response.data,
  };
}

module.exports = { createPayment, verifyPayment };
