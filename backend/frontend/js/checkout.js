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

  // Payment method selection
  var selectedPayment = 'd17';

  function updatePaymentUI(value) {
    selectedPayment = value;
    var d17Option = document.getElementById('option-d17');
    var cardOption = document.getElementById('option-card');
    var dotD17 = document.getElementById('dot-d17');
    var dotCard = document.getElementById('dot-card');
    if (!d17Option || !cardOption || !dotD17 || !dotCard) return;

    // Reset d17
    d17Option.style.borderColor = '';
    d17Option.style.backgroundColor = '';
    dotD17.style.backgroundColor = '';
    dotD17.style.borderColor = '';
    dotD17.innerHTML = '';

    // Reset card
    cardOption.style.borderColor = '';
    cardOption.style.backgroundColor = '';
    dotCard.style.backgroundColor = '';
    dotCard.style.borderColor = '';
    dotCard.innerHTML = '';

    // Apply selected styles
    var activeOption = value === 'd17' ? d17Option : cardOption;
    var activeDot   = value === 'd17' ? dotD17   : dotCard;
    activeOption.style.borderColor = '#B8860B';
    activeOption.style.backgroundColor = 'rgba(184,134,11,0.05)';
    activeDot.style.backgroundColor = '#B8860B';
    activeDot.style.borderColor = '#B8860B';
    activeDot.innerHTML = '<div style="width:8px;height:8px;background:#fff;border-radius:50%;"></div>';

    // Sync the actual radio
    var radio = document.querySelector('input[name="payment"][value="' + value + '"]');
    if (radio) radio.checked = true;
  }

  document.getElementById('option-d17').addEventListener('click', function () { updatePaymentUI('d17'); });
  document.getElementById('option-card').addEventListener('click', function () { updatePaymentUI('card'); });

  // Set initial state via JS
  updatePaymentUI('d17');

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
        if (!result.payment_url) {
          throw new Error('Payment gateway not configured. Please contact support.');
        }
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
