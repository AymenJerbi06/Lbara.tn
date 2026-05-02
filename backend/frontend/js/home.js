// Home page service availability search

document.addEventListener('DOMContentLoaded', function () {
  var input = document.getElementById('service-availability-search');
  var indicator = document.getElementById('service-availability-indicator');
  var icon = document.getElementById('service-availability-icon');
  var status = document.getElementById('service-availability-status');
  var action = document.getElementById('service-availability-action');

  if (!input || !indicator || !icon || !status || !action) return;

  var debounce;
  var requestId = 0;
  var lastActionUrl = '';

  function normalizeQuery(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function setIndicator(symbol, color, filled) {
    indicator.classList.remove('hidden');
    indicator.classList.add('flex');
    icon.textContent = symbol;
    icon.style.color = color;
    icon.style.fontVariationSettings = filled ? "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 600, 'GRAD' 0, 'opsz' 24";
  }

  function hideIndicator() {
    indicator.classList.add('hidden');
    indicator.classList.remove('flex');
    icon.textContent = '';
  }

  function hideAction() {
    action.classList.add('hidden');
    action.classList.remove('flex');
    action.removeAttribute('aria-label');
    lastActionUrl = '';
  }

  function showAction(label, href, variant) {
    action.textContent = label;
    action.href = href;
    action.setAttribute('aria-label', label);
    action.classList.remove('hidden', 'bg-white', 'text-primary');
    action.classList.add('flex');
    lastActionUrl = href;

    if (variant === 'outline') {
      action.classList.remove('bg-primary', 'text-white');
      action.classList.add('bg-white', 'text-primary');
    } else {
      action.classList.remove('bg-white', 'text-primary');
      action.classList.add('bg-primary', 'text-white');
    }
  }

  function setIdle(message) {
    hideIndicator();
    hideAction();
    status.textContent = message || '';
  }

  function setLoading() {
    setIndicator('sync', '#003060', false);
    status.textContent = 'Checking the catalog...';
    hideAction();
  }

  function setAvailable(query, products) {
    var names = products.slice(0, 2).map(function (p) { return p.name; }).filter(Boolean);
    var label = names.length ? names.join(', ') : query;
    setIndicator('check_circle', '#005F4B', true);
    status.textContent = 'Available: ' + label + '.';
    showAction('View in Shop', '/shop.html?search=' + encodeURIComponent(query), 'outline');
  }

  function setUnavailable(query) {
    setIndicator('cancel', '#DC2626', true);
    status.textContent = 'Not in the catalog yet. Request it and we will track demand.';
    showAction('Request a Service', '/contact.html?service=' + encodeURIComponent(query), 'solid');
  }

  function setError() {
    setIndicator('error', '#DC2626', false);
    status.textContent = 'We could not check right now. You can still request the service.';
    showAction('Request a Service', '/contact.html', 'solid');
  }

  async function checkAvailability() {
    var query = normalizeQuery(input.value);
    requestId += 1;
    var currentRequest = requestId;

    if (query.length < 2) {
      setIdle(query ? 'Type at least 2 characters to check the catalog.' : '');
      return;
    }

    if (!window.api || typeof window.api.getProducts !== 'function') {
      setError();
      return;
    }

    setLoading();

    try {
      var result = await window.api.getProducts({ search: query, limit: 6 });
      if (currentRequest !== requestId) return;

      var products = result.products || [];
      if (products.length) {
        setAvailable(query, products);
      } else {
        setUnavailable(query);
      }
    } catch (err) {
      if (currentRequest !== requestId) return;
      setError();
    }
  }

  input.addEventListener('input', function () {
    clearTimeout(debounce);
    setIdle('');
    debounce = setTimeout(checkAvailability, 450);
  });

  input.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    if (lastActionUrl) {
      window.location.href = lastActionUrl;
      return;
    }

    clearTimeout(debounce);
    checkAvailability();
  });
});
