async function createPayment({ orderId, orderRef }) {
  return {
    payment_id: `mock_${orderRef}_${Date.now()}`,
    payment_url: `/order-confirmed.html?order_id=${encodeURIComponent(orderId)}&mock_payment=success`,
  };
}

async function verifyPayment(paymentId) {
  return {
    success: String(paymentId || '').startsWith('mock_'),
    raw: { gateway: 'mock', payment_id: paymentId, status: 'SUCCESS' },
  };
}

module.exports = { createPayment, verifyPayment };
