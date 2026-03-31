// ─── Order Confirmed Page ─────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order_id') || sessionStorage.getItem('lbara_pending_order');

  if (!orderId) {
    document.getElementById('order-content')?.classList.add('hidden');
    document.getElementById('order-error')?.classList.remove('hidden');
    return;
  }

  // Verify payment with backend
  try {
    const result = await api.verifyPayment(orderId);

    if (result.success || result.status === 'paid' || result.status === 'fulfilled') {
      sessionStorage.removeItem('lbara_pending_order');

      // Populate order ref
      const refEl = document.getElementById('order-ref');
      if (refEl && result.order_ref) refEl.textContent = `#${result.order_ref}`;

      // Show the confirmed content
      document.getElementById('order-content')?.classList.remove('hidden');
      document.getElementById('order-pending')?.classList.add('hidden');
    } else {
      // Payment failed
      document.getElementById('order-content')?.classList.add('hidden');
      document.getElementById('order-failed')?.classList.remove('hidden');
    }
  } catch (err) {
    console.error('[order-confirmed]', err);
    // Still show a generic success message — payment may have gone through
    document.getElementById('order-content')?.classList.remove('hidden');
  }
});
