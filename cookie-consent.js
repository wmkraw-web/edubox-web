// Baner zgody na cookies (Google Analytics) - wspólny dla całego EduBox.
// Google Consent Mode v2 startuje domyślnie z analytics_storage:'denied' (patrz blok
// gtag w <head> każdej strony) - ten skrypt tylko pyta o zgodę i, jeśli ją dostanie,
// odblokowuje pomiar przez gtag('consent','update', ...). Bez zgody strona i tak
// działa w 100% normalnie - to jedyny cel tego pliku, nic więcej nie robi.
//
// window.EduBoxCookieConsent.openSettings() pozwala użytkownikowi wrócić i zmienić
// wcześniejszą decyzję (link "Ustawienia cookies" w stopce/menu) - bez tego, raz
// podjęta decyzja byłaby niemożliwa do cofnięcia bez ręcznego czyszczenia przeglądarki.
(function () {
  var STORAGE_KEY = 'eduboxCookieConsent';

  function alreadyDecided() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function remember(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
  }

  function grantAnalytics() {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
    }
  }

  function revokeAnalytics() {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: 'denied' });
    }
  }

  function removeBanner() {
    var el = document.getElementById('edubox-cookie-banner');
    if (el) el.remove();
  }

  function injectStyleOnce() {
    if (document.getElementById('edubox-cookie-style')) return;
    var style = document.createElement('style');
    style.id = 'edubox-cookie-style';
    style.textContent =
      '#edubox-cookie-banner{position:fixed;left:0;right:0;bottom:0;z-index:9999;' +
      'background:#0f172a;color:#e2e8f0;padding:14px 18px;box-shadow:0 -4px 20px rgba(0,0,0,.25);' +
      'font-family:inherit;animation:eduboxCookieSlideUp .35s ease-out}' +
      '@keyframes eduboxCookieSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}' +
      '.edubox-cookie-inner{max-width:900px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px}' +
      '.edubox-cookie-text{flex:1 1 380px;font-size:13.5px;line-height:1.5;margin:0;color:#cbd5e1}' +
      '.edubox-cookie-text a{color:#7dd3fc;text-decoration:underline}' +
      '.edubox-cookie-actions{display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap}' +
      '.edubox-cookie-btn{border:0;border-radius:9999px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;transition:opacity .15s}' +
      '.edubox-cookie-btn:hover{opacity:.85}' +
      '.edubox-cookie-accept{background:#f59e0b;color:#0f172a}' +
      '.edubox-cookie-reject{background:#1e293b;color:#e2e8f0;border:1px solid #334155}';
    document.head.appendChild(style);
  }

  function showBanner() {
    removeBanner(); // gdyby banner z jakiegoś powodu już wisiał (np. dwa kliknięcia "Ustawienia cookies")
    injectStyleOnce();

    var banner = document.createElement('div');
    banner.id = 'edubox-cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Zgoda na pliki cookie');
    banner.innerHTML =
      '<div class="edubox-cookie-inner">' +
      '<p class="edubox-cookie-text">🍪 Korzystamy z Google Analytics, żeby wiedzieć, które narzędzia naprawdę Wam pomagają — nic więcej, żadnej sprzedaży danych. ' +
      'Możesz się zgodzić albo zostać tylko przy tym, co niezbędne do działania strony. <a href="/polityka-prywatnosci.html">Szczegóły w polityce prywatności</a></p>' +
      '<div class="edubox-cookie-actions">' +
      '<button type="button" class="edubox-cookie-btn edubox-cookie-reject" id="edubox-cookie-reject">Tylko niezbędne</button>' +
      '<button type="button" class="edubox-cookie-btn edubox-cookie-accept" id="edubox-cookie-accept">Zgadzam się 👍</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(banner);

    document.getElementById('edubox-cookie-accept').addEventListener('click', function () {
      remember('granted');
      grantAnalytics();
      removeBanner();
    });
    document.getElementById('edubox-cookie-reject').addEventListener('click', function () {
      remember('denied');
      revokeAnalytics(); // gdyby ktoś wcześniej zgodził się, a teraz zmienia zdanie na "nie"
      removeBanner();
    });
  }

  function init() {
    var decision = alreadyDecided();
    if (decision === 'granted') { grantAnalytics(); return; }
    if (decision === 'denied') return;
    if (document.body) showBanner();
    else document.addEventListener('DOMContentLoaded', showBanner);
  }

  // Publiczne API - link "Ustawienia cookies" w stopce wywołuje to, żeby użytkownik
  // mógł wrócić i zmienić wcześniejszą decyzję.
  window.EduBoxCookieConsent = {
    openSettings: function () {
      if (document.body) showBanner();
      else document.addEventListener('DOMContentLoaded', showBanner);
    }
  };

  init();
})();
