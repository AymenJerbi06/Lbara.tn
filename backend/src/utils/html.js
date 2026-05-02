function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function htmlLines(value) {
  return escapeHtml(value).replace(/\r?\n/g, '<br>');
}

module.exports = { escapeHtml, htmlLines };
