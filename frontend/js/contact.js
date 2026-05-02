// ─── Contact Page ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('contact-submit');
  const successEl = document.getElementById('contact-success');
  const errorEl = document.getElementById('contact-error');

  if (!form) return;

  const requestedService = new URLSearchParams(window.location.search).get('service')?.trim();
  if (requestedService) {
    const categoryEl = document.getElementById('contact-category');
    const subjectEl = document.getElementById('contact-subject');
    const messageEl = document.getElementById('contact-message');

    if (categoryEl) categoryEl.value = 'request_service';
    if (subjectEl && !subjectEl.value) subjectEl.value = `Service request: ${requestedService}`;
    if (messageEl && !messageEl.value) {
      messageEl.value = `Hi Lbara team,\n\nI would like to request this service: ${requestedService}\n\nPlease let me know if you can add it to the store.`;
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const body = {
      full_name: document.getElementById('contact-name')?.value.trim(),
      email: document.getElementById('contact-email')?.value.trim(),
      subject: document.getElementById('contact-subject')?.value.trim(),
      category: document.getElementById('contact-category')?.value,
      message: document.getElementById('contact-message')?.value.trim(),
    };

    if (!body.full_name || !body.email || !body.message) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    if (errorEl) errorEl.classList.add('hidden');

    try {
      await api.sendContact(body);

      form.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';

      if (successEl) {
        successEl.classList.remove('hidden');
        successEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        showToast('Message sent! We will reply within 2–4 hours.');
      }
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      } else {
        showToast(err.message, 'error');
      }
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });
});
