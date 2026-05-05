// ─── Login Page ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const tr = (value) => (window.lbaraT ? window.lbaraT(value) : value);
  const icon = (name) => `<span class="material-symbols-outlined">${name}</span> `;
  const loginForm = document.getElementById('login-form');
  const loginBtn = document.getElementById('login-btn');
  const loginError = document.getElementById('login-error');

  if (loginForm) {
    const verified = new URLSearchParams(window.location.search).get('verified');
    if (verified === '1') showToast(tr('Email verified. You can log in now.'));
    if (verified === 'invalid') showToast(tr('Verification link is invalid or expired.'), 'error');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      loginBtn.disabled = true;
      loginBtn.textContent = tr('Logging in...');
      if (loginError) loginError.classList.add('hidden');

      try {
        const { user } = await api.login({ email, password });
        showToast(`${tr('Welcome back')}, ${user.full_name || user.email}!`);
        setTimeout(() => {
          window.location.href = user.is_admin ? '/admin/dashboard.html' : '/shop.html';
        }, 800);
      } catch (err) {
        if (err.verification_required && err.email) {
          sessionStorage.setItem('lbara_verify_email', err.email);
          showToast(tr('Please verify your email before logging in.'), 'error');
          setTimeout(() => {
            window.location.href = `/verify-email.html?email=${encodeURIComponent(err.email)}`;
          }, 900);
          return;
        }
        if (loginError) {
          loginError.textContent = err.message;
          loginError.classList.remove('hidden');
        } else {
          showToast(err.message, 'error');
        }
        loginBtn.disabled = false;
        loginBtn.innerHTML = icon('login') + tr('LOGIN');
      }
    });
  }

  // ─── Signup Page ─────────────────────────────────────────
  const signupForm = document.getElementById('signup-form');
  const signupBtn = document.getElementById('signup-btn');
  const signupError = document.getElementById('signup-error');

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('signup-full-name')?.value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirm = document.getElementById('signup-confirm').value;
      const terms = document.getElementById('signup-terms')?.checked;
      const phone = document.getElementById('signup-phone')?.value.trim();
      const city = document.getElementById('signup-city')?.value.trim();
      const addressLine1 = document.getElementById('signup-address-line1')?.value.trim();
      const addressLine2 = document.getElementById('signup-address-line2')?.value.trim();
      const postalCode = document.getElementById('signup-postal-code')?.value.trim();
      const country = document.getElementById('signup-country')?.value.trim() || 'Tunisia';

      if (!fullName) {
        if (signupError) { signupError.textContent = tr('Please enter your full name.'); signupError.classList.remove('hidden'); }
        return;
      }
      if (password !== confirm) {
        if (signupError) { signupError.textContent = tr('Passwords do not match.'); signupError.classList.remove('hidden'); }
        return;
      }
      if (!terms) {
        if (signupError) { signupError.textContent = tr('Please accept the Terms & Conditions.'); signupError.classList.remove('hidden'); }
        return;
      }

      signupBtn.disabled = true;
      signupBtn.textContent = tr('Creating account...');
      if (signupError) signupError.classList.add('hidden');

      try {
        const result = await api.register({
          email,
          password,
          full_name: fullName,
          phone,
          city,
          address_line1: addressLine1,
          address_line2: addressLine2,
          postal_code: postalCode,
          country,
          preferred_language: window.lbaraI18n?.language ? window.lbaraI18n.language() : (document.documentElement.lang || 'en'),
        });
        if (result.verification_required) {
          sessionStorage.setItem('lbara_verify_email', email);
          showToast(result.email_delivery_failed
            ? tr('Account created, but the verification email could not be sent. Please try resending the code in a moment.')
            : tr('Account created. Please verify your email before logging in.'));
          setTimeout(() => { window.location.href = `/verify-email.html?email=${encodeURIComponent(email)}`; }, 1200);
        } else {
          showToast(tr('Account created! Welcome to Lbara.tn'));
          setTimeout(() => { window.location.href = '/shop.html'; }, 800);
        }
      } catch (err) {
        if (signupError) {
          signupError.textContent = err.message;
          signupError.classList.remove('hidden');
        } else {
          showToast(err.message, 'error');
        }
        signupBtn.disabled = false;
        signupBtn.innerHTML = icon('person_add') + tr('SIGN UP');
      }
    });
  }

  document.addEventListener('lbara:languagechange', () => {
    if (loginBtn && !loginBtn.disabled) loginBtn.innerHTML = icon('login') + tr('LOGIN');
    if (signupBtn && !signupBtn.disabled) signupBtn.innerHTML = icon('person_add') + tr('SIGN UP');
  });

  // ─── Email Verification Page ─────────────────────────────────────────
  const verifyForm = document.getElementById('verify-email-form');
  const verifyBtn = document.getElementById('verify-email-btn');
  const resendBtn = document.getElementById('resend-verification-btn');
  const verifyError = document.getElementById('verify-email-error');
  const verifyEmailInput = document.getElementById('verify-email');
  const verifyCodeInput = document.getElementById('verify-code');

  function showVerifyMessage(message, type = 'error') {
    if (!verifyError) {
      showToast(message, type);
      return;
    }
    verifyError.textContent = message;
    verifyError.className = type === 'success'
      ? 'mt-4 bg-green-50 border-2 border-green-500 text-green-700 px-4 py-3 rounded-xl font-bold text-sm'
      : 'mt-4 bg-red-50 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl font-bold text-sm';
  }

  if (verifyEmailInput) {
    const emailFromUrl = new URLSearchParams(window.location.search).get('email');
    verifyEmailInput.value = emailFromUrl || sessionStorage.getItem('lbara_verify_email') || '';
  }

  if (verifyForm) {
    verifyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = verifyEmailInput.value.trim();
      const code = verifyCodeInput.value.trim();
      if (!email || !code) {
        showVerifyMessage(tr('Enter your email and verification code.'));
        return;
      }

      verifyBtn.disabled = true;
      verifyBtn.textContent = tr('Verifying...');
      if (verifyError) verifyError.classList.add('hidden');

      try {
        await api.verifyEmailCode({ email, code });
        sessionStorage.removeItem('lbara_verify_email');
        showVerifyMessage(tr('Email verified. You can log in now.'), 'success');
        setTimeout(() => { window.location.href = '/login.html?verified=1'; }, 1000);
      } catch (err) {
        showVerifyMessage(err.message || tr('Failed to verify email.'));
      } finally {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = icon('verified') + tr('VERIFY EMAIL');
      }
    });
  }

  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      const email = verifyEmailInput.value.trim();
      if (!email) {
        showVerifyMessage(tr('Enter your email first.'));
        return;
      }
      resendBtn.disabled = true;
      resendBtn.textContent = tr('Sending...');
      try {
        await api.resendVerification({ email });
        sessionStorage.setItem('lbara_verify_email', email);
        showVerifyMessage(tr('Verification code sent. Check your email.'), 'success');
      } catch (err) {
        showVerifyMessage(err.message || tr('Could not send a verification code right now.'));
      } finally {
        resendBtn.disabled = false;
        resendBtn.textContent = tr('Resend Code');
      }
    });
  }
});
