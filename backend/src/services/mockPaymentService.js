async function createPayment({ orderId, orderRef, amount }) {
  const paymentId = `mock_${orderRef}_${Date.now()}`;
  const amountQuery = amount === undefined || amount === null ? '' : `&amount=${encodeURIComponent(amount)}`;
  return {
    payment_id: paymentId,
    payment_url: `/test-payment.html?order_id=${encodeURIComponent(orderId)}&payment_id=${encodeURIComponent(paymentId)}${amountQuery}`,
  };
}

async function verifyPayment(paymentId) {
  return {
    success: String(paymentId || '').startsWith('mock_'),
    raw: { gateway: 'mock', payment_id: paymentId, status: 'SUCCESS' },
  };
}

module.exports = { createPayment, verifyPayment };
