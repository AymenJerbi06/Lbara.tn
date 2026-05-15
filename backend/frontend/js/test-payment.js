document.addEventListener('DOMContentLoaded', function () {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order_id');
  const paymentId = params.get('payment_id');
  const amount = Number(params.get('amount') || 0);
  const amountEl = document.getElementById('payment-amount');
  const form = document.getElementById('test-card-form');
  const errorEl = document.getElementById('payment-error');
  const button = document.getElementById('pay-now-btn');

  if (amountEl) amountEl.textContent = Number.isFinite(amount) ? amount.toFixed(3) : '0.000';

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }

  if (!orderId || !paymentId) {
    showError('Payment session is missing. Please return to checkout and try again.');
    if (button) button.disabled = true;
    return;
  }

  form?.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (errorEl) errorEl.classList.add('hidden');
    if (button) {
      button.disabled = true;
      button.innerHTML = '<span class="material-symbols-outlined animate-spin">autorenew</span> Processing...';
    }

    try {
      await api.submitTestCardPayment(orderId, {
        payment_id: paymentId,
        cardholder_name: document.getElementById('cardholder-name')?.value.trim(),
        card_number: document.getElementById('card-number')?.value.trim(),
        expiry: document.getElementById('card-expiry')?.value.trim(),
        cvc: document.getElementById('card-cvc')?.value.trim(),
      });
      sessionStorage.setItem('lbara_pending_order', orderId);
      window.location.href = '/order-confirmed.html?order_id=' + encodeURIComponent(orderId);
    } catch (err) {
      showError(err.message || 'Payment failed. Please use the test card details shown above.');
      if (button) {
        button.disabled = false;
        button.innerHTML = '<span class="material-symbols-outlined">lock_open</span> Pay Test Order';
      }
    }
  });
});
