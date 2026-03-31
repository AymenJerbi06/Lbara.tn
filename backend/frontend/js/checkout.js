// ─── Checkout Page ────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  const cart = JSON.parse(sessionStorage.getItem('lbara_cart') || 'null');

  // Show error from URL params (e.g. after payment failure)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('error') === 'payment_failed') {
    showToast('Payment was not completed. Please try again.', 'error');
  }

  if (!cart) {
    // No item in cart — redirect to shop
    showToast('No item selected. Redirecting to shop...', 'error');
    setTimeout(() => { window.location.href = '/shop.html'; }, 1500);
    return;
  }

  // Populate order summary
  const nameEl = document.getElementById('summary-product-name');
  const priceEl = document.getElementById('summary-price');
  const totalEl = document.getElementById('summary-total');
  const subtotalEl = document.getElementById('summary-subtotal');

  if (nameEl) nameEl.textContent = cart.product_name;
  if (priceEl) priceEl.textContent = parseFloat(cart.price_tnd).toFixed(3);
  if (subtotalEl) subtotalEl.textContent = `${parseFloat(cart.price_tnd).toFixed(3)} TND`;
  if (totalEl) totalEl.textContent = parseFloat(cart.price_tnd).toFixed(3);

  // Promo code logic
  let discountApplied = 0;
  const promoInput = document.getElementById('promo-input');
  const promoBtn = document.getElementById('promo-btn');
  const discountRow = document.getElementById('discount-row');

  if (promoBtn && promoInput) {
    promoBtn.addEventListener('click', async () => {
      const code = promoInput.value.trim().toUpperCase();
      if (!code) return;
      // For now we just show the server will validate it
      // A real implementation hits an API endpoint
      if (code === 'LBARA10') {
        discountApplied = parseFloat((cart.price_tnd * 0.10).toFixed(3));
        const newTotal = parseFloat((cart.price_tnd - discountApplied).toFixed(3));
        if (totalEl) totalEl.textContent = newTotal.toFixed(3);
        if (discountRow) {
          discountRow.classList.remove('hidden');
          discountRow.querySelector('.discount-amount').textContent = `-${discountApplied.toFixed(3)} TND`;
        }
        showToast('Promo code applied! 10% discount.');
      } else {
        showToast('Invalid promo code.', 'error');
      }
    });
  }

  // Payment method radio selection styling
  document.querySelectorAll('input[name="payment"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.payment-option').forEach((el) => {
        el.classList.remove('border-accent', 'bg-accent/5');
        el.classList.add('border-primary/10');
      });
      const selected = radio.closest('.payment-option');
      if (selected) {
        selected.classList.add('border-accent', 'bg-accent/5');
        selected.classList.remove('border-primary/10');
      }
    });
  });

  // Place order
  const placeOrderBtn = document.getElementById('place-order-btn');
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', async () => {
      const deliveryEmail = document.getElementById('delivery-email')?.value.trim();
      const deliveryPhone = document.getElementById('delivery-phone')?.value.trim();
      const promoCode = promoInput?.value.trim() || '';

      if (!deliveryEmail || !deliveryEmail.includes('@')) {
        showToast('Please enter a valid delivery email.', 'error');
        return;
      }

      const selectedPayment = document.querySelector('input[name="payment"]:checked');
      if (!selectedPayment) {
        showToast('Please select a payment method.', 'error');
        return;
      }

      placeOrderBtn.disabled = true;
      placeOrderBtn.innerHTML = `<span class="material-symbols-outlined animate-spin">autorenew</span> Processing...`;

      try {
        const result = await api.createOrder({
          product_id: cart.product_id,
          delivery_email: deliveryEmail,
          delivery_phone: deliveryPhone || null,
          promo_code: promoCode || null,
        });

        // Clear cart and redirect to payment gateway
        sessionStorage.setItem('lbara_pending_order', result.order_id);
        sessionStorage.removeItem('lbara_cart');
        window.location.href = result.payment_url;
      } catch (err) {
        showToast(err.message, 'error');
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = `<span class="material-symbols-outlined">lock_open</span> Place Order Now`;
      }
    });
  }
});
