// Gateway abstraction layer — swap gateway via PAYMENT_GATEWAY env var
const flouci = require('./flouciService');
const paymee = require('./paymeeService');

function getGateway(name) {
  if (name === 'paymee') return paymee;
  return flouci; // default
}

async function createPayment({ orderId, orderRef, amount, gateway }) {
  return getGateway(gateway).createPayment({ orderId, orderRef, amount });
}

async function verifyPayment({ gateway, paymentId }) {
  return getGateway(gateway).verifyPayment(paymentId);
}

module.exports = { createPayment, verifyPayment };
