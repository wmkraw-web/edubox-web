'use strict';
(() => {
  const root = document.documentElement;
  const themeButton = document.getElementById('theme-toggle');
  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('edubox_theme') || 'dark'; } catch (_) { /* Storage is optional. */ }
  function applyTheme(theme) {
    root.dataset.theme = theme === 'light' ? 'light' : 'dark';
    themeButton.textContent = root.dataset.theme === 'dark' ? 'Jasny motyw' : 'Ciemny motyw';
  }
  applyTheme(savedTheme);
  themeButton.hidden = false;
  themeButton.addEventListener('click', () => {
    applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    try { localStorage.setItem('edubox_theme', root.dataset.theme); } catch (_) { /* Reading remains available. */ }
  });
  if (new URLSearchParams(window.location.search).get('druk') === '1') {
    document.body.classList.add('print-view');
    document.title = 'Lista kontrolna standardów ochrony małoletnich | EduBox AI';
  }
  const checks = Array.from(document.querySelectorAll('input[name="som-check"]'));
  const status = document.getElementById('checklist-status');
  function updateStatus() {
    status.textContent = `Zaznaczono ${checks.filter(input => input.checked).length} z ${checks.length} punktów`;
  }
  checks.forEach(input => input.addEventListener('change', updateStatus));
  const resetButton = document.getElementById('clear-checklist');
  resetButton.hidden = false;
  resetButton.addEventListener('click', () => {
    checks.forEach(input => { input.checked = false; });
    updateStatus();
  });
  const printButton = document.getElementById('print-checklist');
  printButton.hidden = false;
  printButton.addEventListener('click', () => window.print());
  window.addEventListener('pageshow', updateStatus);
  updateStatus();
})();
