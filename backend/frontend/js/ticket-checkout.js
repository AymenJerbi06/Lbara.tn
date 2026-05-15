document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('quote') || params.get('token');
  const loadingEl = document.getElementById('quote-loading');
  const contentEl = document.getElementById('quote-content');
  const errorEl = document.getElementById('quote-error');
  const payBtn = document.getElementById('quote-pay-btn');
  let quote = null;
  let selectedPayment = 'card';

  function showError(message) {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (contentEl) contentEl.classList.add('hidden');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  }

  function money(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number.toFixed(3) : '0.000';
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '';
  }

  function renderQuote(data) {
    quote = data.quote;
    if (!quote) {
      showError('This quote link could not be loaded.');
      return;
    }
    setText('quote-title', quote.service_title);
    setText('quote-description', quote.description);
    setText('quote-ref', quote.quote_ref ? `Quote ${quote.quote_ref}` : '');
    setText('quote-ticket-ref', quote.ticket_order_ref);
    setText('quote-email', quote.delivery_email);
    setText('quote-amount', money(quote.amount_tnd));
    if (loadingEl) loadingEl.classList.add('hidden');
    if (contentEl) contentEl.classList.remove('hidden');
  }

  document.querySelectorAll('[data-payment-method]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedPayment = button.dataset.paymentMethod || 'card';
      document.querySelectorAll('[data-payment-method]').forEach((el) => {
        el.classList.toggle('active', el === button);
      });
    });
  });

  if (payBtn) {
    payBtn.addEventListener('click', async () => {
      if (!quote) return;
      payBtn.disabled = true;
      payBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">autorenew</span> Creating payment...';
      try {
        const result = await api.checkoutTicketQuote(token, { payment_method: selectedPayment });
        if (!result.payment_url) throw new Error('Payment link could not be created.');
        sessionStorage.setItem('lbara_pending_order', result.order_id);
        window.location.href = result.payment_url;
      } catch (err) {
        showError(err.message || 'Could not create payment for this quote.');
        payBtn.disabled = false;
        payBtn.innerHTML = '<span class="material-symbols-outlined">lock_open</span> Pay Final Quote';
      }
    });
  }

  if (typeof initNav === 'function') initNav();

  if (!token) {
    showError('Missing quote token.');
    return;
  }

  api.getTicketQuote(token)
    .then(renderQuote)
    .catch((err) => showError(err.message || 'This quote link is invalid or expired.'));
});
