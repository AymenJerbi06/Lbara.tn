// ─── Login Page ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const loginBtn = document.getElementById('login-btn');
  const loginError = document.getElementById('login-error');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      loginBtn.disabled = true;
      loginBtn.textContent = 'Logging in...';
      if (loginError) loginError.classList.add('hidden');

      try {
        const { user } = await api.login({ email, password });
        showToast(`Welcome back, ${user.full_name || user.email}!`);
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
        loginBtn.innerHTML = '<span class="material-symbols-outlined">login</span> LOGIN';
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
        if (signupError) { signupError.textContent = 'Passwords do not match.'; signupError.classList.remove('hidden'); }
        return;
      }
      if (!terms) {
        if (signupError) { signupError.textContent = 'Please accept the Terms & Conditions.'; signupError.classList.remove('hidden'); }
        return;
      }

      signupBtn.disabled = true;
      signupBtn.textContent = 'Creating account...';
      if (signupError) signupError.classList.add('hidden');

      try {
        await api.register({ email, password });
        showToast('Account created! Welcome to Lbara.tn');
        setTimeout(() => { window.location.href = '/shop.html'; }, 800);
      } catch (err) {
        if (signupError) {
          signupError.textContent = err.message;
          signupError.classList.remove('hidden');
        } else {
          showToast(err.message, 'error');
        }
        signupBtn.disabled = false;
        signupBtn.innerHTML = '<span class="material-symbols-outlined">person_add</span> CREATE ACCOUNT';
      }
    });
  }
});
