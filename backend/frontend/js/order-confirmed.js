document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order_id') || sessionStorage.getItem('lbara_pending_order');

  if (!orderId) {
    document.getElementById('order-content')?.classList.add('hidden');
    document.getElementById('order-pending')?.classList.add('hidden');
    document.getElementById('order-error')?.classList.remove('hidden');
    return;
  }

  try {
    const result = await api.verifyPayment(orderId);

    if (result.success || result.status === 'paid' || result.status === 'fulfilled') {
      sessionStorage.removeItem('lbara_pending_order');

      const refEl = document.getElementById('order-ref');
      if (refEl && result.order_ref) refEl.textContent = `#${result.order_ref}`;

      document.getElementById('order-content')?.classList.remove('hidden');
      document.getElementById('order-pending')?.classList.add('hidden');
      return;
    }

    if (result.status === 'pending_payment') {
      const pendingText = document.querySelector('#order-pending p');
      if (pendingText) pendingText.textContent = 'Payment is still being verified. Please refresh in a moment.';
      return;
    }

    document.getElementById('order-content')?.classList.add('hidden');
    document.getElementById('order-pending')?.classList.add('hidden');
    document.getElementById('order-failed')?.classList.remove('hidden');
  } catch (err) {
    console.error('[order-confirmed]', err);
    const pendingText = document.querySelector('#order-pending p');
    if (pendingText) pendingText.textContent = 'We could not verify the payment yet. Please refresh in a moment or contact support.';
  }
});
