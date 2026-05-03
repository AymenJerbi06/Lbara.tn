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
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirm = document.getElementById('signup-confirm').value;
      const terms = document.getElementById('signup-terms')?.checked;

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
        const result = await api.register({ email, password });
        if (result.verification_required) {
          showToast(tr('Account created. Please verify your email before logging in.'));
          setTimeout(() => { window.location.href = '/login.html'; }, 1200);
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
});
