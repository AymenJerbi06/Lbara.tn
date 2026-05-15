document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('contact-submit');
  const successEl = document.getElementById('contact-success');
  const errorEl = document.getElementById('contact-error');
  const authGate = document.getElementById('contact-auth-gate');
  const serviceNote = document.getElementById('contact-service-note');
  const nameEl = document.getElementById('contact-name');
  const emailEl = document.getElementById('contact-email');
  const categoryEl = document.getElementById('contact-category');
  const subjectEl = document.getElementById('contact-subject');
  const messageEl = document.getElementById('contact-message');

  if (!form) return;

  let accountUser = null;

  function setFormEnabled(enabled) {
    Array.from(form.elements).forEach((el) => { el.disabled = !enabled; });
    form.classList.toggle('opacity-50', !enabled);
    form.classList.toggle('pointer-events-none', !enabled);
  }

  function setError(message) {
    if (!errorEl) {
      if (window.showToast) showToast(message, 'error');
      return;
    }
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }

  function setSuccess(reference) {
    if (successEl) {
      const detail = successEl.querySelectorAll('p')[1];
      if (detail) {
        detail.textContent = reference
          ? `Reference #${reference}. We will get back to you within 2-4 hours. You can track this request in your account dashboard.`
          : 'We will get back to you within 2-4 hours. You can track this request in your account dashboard.';
      }
      successEl.classList.remove('hidden');
      successEl.scrollIntoView({ behavior: 'smooth' });
    } else if (window.showToast) {
      showToast(reference ? `Message sent. Reference #${reference}.` : 'Message sent.');
    }
  }

  async function loadAccount() {
    try {
      const res = await api.me();
      accountUser = res.user;
      const displayName = accountUser.full_name || accountUser.email.split('@')[0];
      if (nameEl && !nameEl.value) nameEl.value = displayName;
      if (emailEl) {
        emailEl.value = accountUser.email;
        emailEl.readOnly = true;
        emailEl.classList.add('bg-primary/5');
      }
      if (authGate) authGate.classList.add('hidden');
      setFormEnabled(true);
    } catch {
      accountUser = null;
      if (authGate) authGate.classList.remove('hidden');
      setFormEnabled(false);
    }
  }

  const params = new URLSearchParams(window.location.search);
  const requestedService = params.get('service')?.trim();
  const requestedCategory = params.get('category')?.trim();
  if (requestedService || requestedCategory === 'request_service') {
    if (serviceNote) serviceNote.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (subjectEl && !subjectEl.value) subjectEl.value = 'Question about request-ticket path';
    if (messageEl && !messageEl.value && requestedService) {
      messageEl.value = `I was looking for ${requestedService}. I understand missing services must go through the paid request-ticket path, not this support form.`;
    }
  } else if (requestedCategory && categoryEl) {
    categoryEl.value = requestedCategory;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!accountUser) {
      setError('Please login or create an account before contacting support.');
      return;
    }

    const body = {
      full_name: nameEl?.value.trim(),
      email: accountUser.email,
      subject: subjectEl?.value.trim(),
      category: categoryEl?.value,
      message: messageEl?.value.trim(),
    };

    if (!body.full_name || !body.email || !body.message) {
      setError('Please fill in all required fields.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Sending...';
    if (errorEl) errorEl.classList.add('hidden');

    try {
      const res = await api.sendContact(body);
      form.reset();
      if (nameEl) nameEl.value = accountUser.full_name || accountUser.email.split('@')[0];
      if (emailEl) emailEl.value = accountUser.email;
      setSuccess(res.reference);
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="material-symbols-outlined">send</span> Send Message';
    }
  });

  loadAccount();
});
