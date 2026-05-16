(function () {
  const LANGUAGES = {
    en: { code: 'EN', label: 'English', local: 'English' },
    fr: { code: 'FR', label: 'French', local: 'Francais' },
    ar: { code: 'AR', label: 'Arabic', local: 'العربية' },
  };

  function currentLanguage() {
    const lang = window.lbaraI18n?.language ? window.lbaraI18n.language() : localStorage.getItem('lbara_lang');
    return LANGUAGES[lang] ? lang : 'en';
  }

  function translate(value) {
    return window.lbaraT ? window.lbaraT(value) : value;
  }

  function closeMenus() {
    document.querySelectorAll('[data-account-language].open').forEach((el) => el.classList.remove('open'));
  }

  function syncLanguageMenus() {
    const lang = currentLanguage();
    document.querySelectorAll('[data-account-language]').forEach((wrap) => {
      const item = LANGUAGES[lang];
      const label = wrap.querySelector('[data-current-language-label]');
      const code = wrap.querySelector('[data-current-language-code]');
      if (label) label.textContent = translate(item.label);
      if (code) code.textContent = item.code;
      wrap.querySelectorAll('[data-account-set-language]').forEach((button) => {
        button.classList.toggle('active', button.getAttribute('data-account-set-language') === lang);
      });
    });
  }

  async function setLanguage(lang) {
    if (!LANGUAGES[lang]) return;
    localStorage.setItem('lbara_lang', lang);
    if (window.lbaraI18n) window.lbaraI18n.apply(document);
    closeMenus();
    syncLanguageMenus();
    document.dispatchEvent(new CustomEvent('lbara:languagechange', { detail: { lang } }));
    try {
      if (window.api?.updateProfile) await window.api.updateProfile({ preferred_language: lang });
    } catch {
      if (window.showToast) window.showToast(translate('Could not save language preference.'), 'error');
    }
  }

  function buildLanguageMenu(wrap) {
    if (wrap.dataset.accountLanguageReady === '1') return;
    wrap.dataset.accountLanguageReady = '1';
    wrap.classList.add('account-language');
    const lang = currentLanguage();
    wrap.innerHTML = `
      <button type="button" class="account-language-toggle" aria-haspopup="true" aria-expanded="false">
        <span class="material-symbols-outlined">language</span>
        <span class="account-language-label" data-current-language-label>${translate(LANGUAGES[lang].label)}</span>
        <span class="account-language-code" data-current-language-code>${LANGUAGES[lang].code}</span>
        <span class="material-symbols-outlined text-base">expand_more</span>
      </button>
      <div class="account-language-menu" role="menu">
        ${Object.entries(LANGUAGES).map(([code, item]) => `
          <button type="button" class="account-language-option ${code === lang ? 'active' : ''}" data-account-set-language="${code}" role="menuitem">
            <span>${translate(item.label)}</span>
            <span class="account-language-code">${item.code}</span>
          </button>
        `).join('')}
      </div>
    `;
    const toggle = wrap.querySelector('.account-language-toggle');
    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = !wrap.classList.contains('open');
      closeMenus();
      wrap.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    wrap.querySelectorAll('[data-account-set-language]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        setLanguage(button.getAttribute('data-account-set-language'));
      });
    });
  }

  function initAccountSocials() {
    document.querySelectorAll('[data-account-social]').forEach((slot, index) => {
      if (slot.dataset.accountSocialReady === '1') return;
      if (!window.lbaraCreateSocialLinks) return;
      slot.dataset.accountSocialReady = '1';
      const row = window.lbaraCreateSocialLinks(`lbara-account-social-${index}`, 'account-social-row');
      slot.appendChild(row);
    });
  }

  async function logout() {
    try {
      if (window.api?.logout) {
        await window.api.logout();
      } else {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch {
      // The redirect still clears the user-facing session path even if the request fails.
    }
    window.location.href = '/login.html';
  }

  function init() {
    initAccountSocials();
    document.querySelectorAll('[data-account-language]').forEach(buildLanguageMenu);
    syncLanguageMenus();
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('lbara:i18nready', init);
  document.addEventListener('lbara:languagechange', syncLanguageMenus);
  document.addEventListener('click', closeMenus);
  document.addEventListener('click', (event) => {
    const logoutButton = event.target.closest('[data-account-logout]');
    if (!logoutButton) return;
    event.preventDefault();
    event.stopPropagation();
    logout();
  });

  window.lbaraAccountShell = { init, syncLanguageMenus, setLanguage, initAccountSocials, logout };
})();
