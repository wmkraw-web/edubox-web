// Czy tekst wyciągnięty z pliku w ogóle jest tekstem – wspólne dla „Moje Zdrowie” i „Teczki podopiecznych”.
// Zwykły skrypt: w przeglądarce window.EduTekstJakosc, w Node module.exports (testy: check-zdrowie / check-podopieczni).
//
// POWÓD (28.10.2026, zgłoszenie właściciela): część PDF-ów z systemów medycznych osadza czcionkę z własnym
// kodowaniem i BEZ poprawnej mapy ToUnicode. pdf.js wyciąga wtedy kody glifów zamiast liter – plik ma tysiące
// znaków, ale żaden nic nie znaczy („▌▌▌AA (▌▌▌▌ ▌▌@ ▌▌”). Kontrola „czy jest dość znaków” taki plik
// przepuszczała, więc nigdy nie trafiał do rozpoznawania obrazu, a do kartoteki wpadały śmieci.
(function () {
  // ---------- czy wyciągnięty z PDF tekst w ogóle jest tekstem ----------
  // Część PDF-ów (zwłaszcza z systemów laboratoryjnych) osadza czcionkę z własnym kodowaniem i bez poprawnej
  // mapy ToUnicode. pdf.js wyciąga wtedy KODY GLIFÓW zamiast liter: tysiące znaków, z których żaden nic nie znaczy
  // („▌▌▌AA (▌▌▌▌ ▌▌@ ▌▌”). Wcześniej liczyliśmy tylko ILE znaków wyszło, więc taki plik przechodził jako
  // „ma warstwę tekstową” i nigdy nie trafiał do rozpoznawania obrazu (zgłoszenie właściciela 28.10.2026).
  const PODEJRZANY_ZNAK = (c) =>
    (c >= 0xE000 && c <= 0xF8FF) ||      // obszar prywatny – tu lądują glify bez ToUnicode
    (c >= 0x2580 && c <= 0x259F) ||      // bloki rysunkowe ▌▐█▄
    (c >= 0x25A0 && c <= 0x25FF) ||      // figury geometryczne ■●▲
    c === 0xFFFD ||                       // znak zastępczy
    (c < 0x20 && c !== 0x09 && c !== 0x0A && c !== 0x0D);
  const SAMOGLOSKI = 'aeiouyąęó';
  // Słowa, bez których polski (albo angielski) dokument medyczny praktycznie nie istnieje.
  const SLOWA_KONTROLNE = [
    'wynik', 'badan', 'norma', 'pacjent', 'data', 'lekarz', 'rozpozn', 'zalec', 'oddzia', 'szpital',
    'jednostk', 'referen', 'materia', 'godzin', 'nazwisk', 'urodz', 'kontrol', 'leczen', 'poradni',
    'result', 'patient', 'reference', 'report', 'date', 'unit'
  ];

  // Zwraca ocenę tekstu: czy nadaje się do czytania i dlaczego nie.
  function textQuality(text) {
    const t = String(text || '');
    const znaki = [...t];
    const wszystkie = znaki.length;
    if (wszystkie < 20) return { ok: false, powod: 'pusty', litery: 0, podejrzane: 0, udzialPodejrzanych: 0, udzialSamoglosek: 0 };
    let litery = 0, samogloski = 0, podejrzane = 0;
    znaki.forEach(ch => {
      const c = ch.codePointAt(0);
      if (PODEJRZANY_ZNAK(c)) { podejrzane++; return; }
      if (/\p{L}/u.test(ch)) {
        litery++;
        if (SAMOGLOSKI.includes(ch.toLocaleLowerCase('pl'))) samogloski++;
      }
    });
    const udzialPodejrzanych = podejrzane / wszystkie;
    const udzialSamoglosek = litery ? samogloski / litery : 0;
    const lower = t.toLocaleLowerCase('pl');
    const maSlowa = SLOWA_KONTROLNE.some(w => lower.includes(w));
    const stat = { litery, podejrzane, udzialPodejrzanych: Math.round(udzialPodejrzanych * 1000) / 1000, udzialSamoglosek: Math.round(udzialSamoglosek * 1000) / 1000, maSlowa };

    // Każdy próg osobno, żeby komunikat mówił, co konkretnie jest nie tak.
    if (udzialPodejrzanych > 0.02) return Object.assign({ ok: false, powod: 'znaki-zastepcze' }, stat);
    if (litery < wszystkie * 0.12) return Object.assign({ ok: false, powod: 'prawie-bez-liter' }, stat);
    // Polski tekst ma ok. 40% samogłosek wśród liter; poniżej 20% to prawie na pewno przestawione kodowanie.
    if (litery >= 60 && udzialSamoglosek < 0.2) return Object.assign({ ok: false, powod: 'bez-samoglosek' }, stat);
    // Dokument medyczny bez ani jednego typowego słowa przy dużej liczbie liter = podmienione litery.
    if (litery >= 200 && !maSlowa) return Object.assign({ ok: false, powod: 'brak-typowych-slow' }, stat);
    return Object.assign({ ok: true, powod: '' }, stat);
  }

  const POWOD_OPIS = {
    'pusty': 'w pliku nie ma tekstu',
    'znaki-zastepcze': 'plik zwraca znaki zastępcze zamiast liter (czcionka bez mapy znaków)',
    'prawie-bez-liter': 'w odczytanym tekście prawie nie ma liter',
    'bez-samoglosek': 'odczytane litery nie układają się w słowa (przestawione kodowanie czcionki)',
    'brak-typowych-slow': 'odczytany tekst nie zawiera ani jednego typowego słowa z dokumentu medycznego'
  };
  const qualityMessage = (q) => POWOD_OPIS[(q && q.powod) || ''] || '';
  const api = { textQuality, qualityMessage, PODEJRZANY_ZNAK, SLOWA_KONTROLNE, POWOD_OPIS };
  if (typeof window !== 'undefined') window.EduTekstJakosc = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
