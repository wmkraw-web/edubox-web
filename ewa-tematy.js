// Tematy postów Ewy (ewamarketing.html): narzędzie z katalogu, dzień z EduKalendarza, pakiet z Bazy Materiałów,
// własny temat i plan tygodnia. Zwykły skrypt bez JSX (window.EwaTematy) – instrukcje dla AI, linki i układanie
// planu testuje scripts/check-ewa.js w Node przez vm. Daty świąt bierze z kalendarz-dane.js (to samo źródło co
// EduKalendarz), pakiety z publicznego katalogu Firestore (odczyt REST, bez logowania).
(function (global) {
  const SITE = 'https://eduboxpro.pl';
  const FIRESTORE_KATALOG = 'https://firestore.googleapis.com/v1/projects/edubox-pro/databases/(default)/documents/artifacts/eduboxpro/public/data/materialy_katalog';
  const SEKCJE = { przedszkole: 'przedszkole', 'klasy-1-3': 'klasy 1–3', 'klasy-4-8': 'klasy 4–8', inne: 'inne' };
  const DNI = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
  const MIES_DOP = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

  // ---------- Katalog pakietów (Firestore REST → zwykłe obiekty) ----------
  function zFirestore(v) {
    if (!v || typeof v !== 'object') return null;
    if ('stringValue' in v) return v.stringValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return v.doubleValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('timestampValue' in v) return v.timestampValue;
    if ('nullValue' in v) return null;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(zFirestore);
    if ('mapValue' in v) return polaFirestore(v.mapValue.fields || {});
    return null;
  }
  function polaFirestore(fields) {
    const o = {};
    Object.keys(fields || {}).forEach((k) => { o[k] = zFirestore(fields[k]); });
    return o;
  }
  // Odpowiedź GET …/materialy_katalog → lista pakietów (najnowsze pierwsze).
  function pakietyZFirestore(json) {
    return ((json && json.documents) || []).map((d) => ({ id: d.name.split('/').pop(), ...polaFirestore(d.fields) }))
      .filter((p) => p.title)
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }

  // Sekcja jak w Bazie Materiałów (materialy-wspolne.js): pole „sekcja” albo zgadywanie z nazwy.
  function sekcjaPakietu(p) {
    if (global.EduMaterialy && global.EduMaterialy.sekcjaPakietu) return global.EduMaterialy.sekcjaPakietu(p);
    return p && SEKCJE[p.sekcja] ? p.sekcja : 'inne';
  }
  const adresPakietu = (p) => `${SITE}/materialy.html?sekcja=${encodeURIComponent(sekcjaPakietu(p))}&pakiet=${encodeURIComponent(p.id)}`;
  // Okładka (np. pin) albo pierwsza strona podglądu – publiczny obrazek ze znakiem wodnym.
  function okladkaPakietu(p) {
    const o = p && (p.okladka || (p.podglad || [])[0]);
    return o && o.path ? `${SITE}/api/verify-code?podglad=${encodeURIComponent(o.path)}` : '';
  }
  function zawartoscPakietu(p) {
    const pliki = (p.pliki || []).map((f) => String(f.name || ''));
    const pdf = pliki.filter((n) => /\.pdf$/i.test(n)).length;
    const mp3 = pliki.filter((n) => /\.(mp3|m4a|wav)$/i.test(n)).length;
    const czesci = [];
    if (p.stron) czesci.push(`PDF: ${p.stron} stron`);
    else if (pdf) czesci.push(`plików PDF: ${pdf}`);
    if (mp3) czesci.push(`piosenek (mp3): ${mp3}`);
    return czesci.join(', ');
  }

  // ---------- Święta z EduKalendarza ----------
  const dzienBez = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dodajDni = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const roznicaDni = (a, b) => Math.round((dzienBez(b) - dzienBez(a)) / 86400000);
  const dataSlownie = (d) => `${DNI[d.getDay()]}, ${d.getDate()} ${MIES_DOP[d.getMonth()]}`;
  const duzaLitera = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
  const dataKrotko = (d) => `${d.getDate()} ${MIES_DOP[d.getMonth()]}`;

  // Święta od dziś do dziś + ile dni (włącznie), z prawdziwą datą (także ruchome). Wakacje (lipiec, sierpień) – brak.
  function nadchodzaceSwieta(now, ileDni) {
    const dane = global.EduKalendarzDane;
    if (!dane) return [];
    const start = dzienBez(now || new Date());
    const koniec = dodajDni(start, ileDni == null ? 45 : ileDni);
    const wynik = [];
    const widziane = new Set();
    for (let d = start; d <= koniec; d = dodajDni(d, 1)) {
      const m = d.getMonth() + 1;
      if (m === 7 || m === 8) continue;
      const klucz = `${d.getFullYear()}-${m}`;
      if (widziane.has(klucz)) continue;
      widziane.add(klucz);
      // holidaysFor liczy ruchome święta dla roku szkolnego zawierającego „now” – podajemy dzień z tego miesiąca.
      dane.holidaysFor(m, d).forEach((h) => {
        const data = new Date(d.getFullYear(), m - 1, h.day);
        if (data >= start && data <= koniec) wynik.push({ data, month: m, swieto: h });
      });
    }
    return wynik.sort((a, b) => a.data - b.data);
  }
  const adresSwieta = (month, swieto) => `${SITE}/edukalendarz.html?m=${month}&swieto=${encodeURIComponent(swieto.name)}`;

  // Pakiety pasujące do święta: wszystkie „znaczące” słowa nazwy święta są w tytule pakietu
  // („Dzień Czystych Rąk” ↔ „Dzień Czystych Rąk – przedszkole”). Pomijamy słowa typu „dzień”, „światowy”.
  const POMIJANE = new Set(['dzień', 'dzien', 'światowy', 'swiatowy', 'międzynarodowy', 'miedzynarodowy', 'narodowy', 'narodowe', 'święto', 'swieto', 'polski', 'polskiej', 'dla', 'oraz']);
  const slowa = (t) => String(t || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2 && !POMIJANE.has(w));
  function pakietyDoSwieta(swieto, pakiety) {
    const klucz = slowa(swieto && swieto.name);
    if (!klucz.length) return [];
    return (pakiety || []).filter((p) => { const t = new Set(slowa(`${p.title} ${p.kategoria || ''}`)); return klucz.every((w) => t.has(w)); });
  }

  // ---------- Instrukcje dla AI ----------
  const PERSONA = `Jesteś Ewą, 32-letnią pedagożką i ambasadorką platformy EduBox PRO.
Masz krótkie blond włosy i ubierasz się elegancko (szary garnitur, biała koszula).
Piszesz posty dla innych nauczycieli: ciepło, konkretnie, jak koleżanka z pokoju nauczycielskiego, z emotikonami (z umiarem).`;

  const ZASADY = `ZASADY:
- NIE wpisuj żadnego adresu URL w treści – prawdziwy link system dokleja pod postem. Możesz napisać np. „Link poniżej 👇”.
- Pisz tylko to, co wynika z podanych informacji. Nie wymyślaj zawartości, liczb, opinii, cytatów, historii święta ani efektów.
- Bez obietnic typu „100% zgodne z przepisami” i bez nachalnej sprzedaży – wsparcie kawą to „dziękuję”, nie „kup teraz”.
- Gdy temat tego dotyczy, przypomnij, że do AI nie wpisuje się danych uczniów.`;

  function wskazowkaPlatformy(platform) {
    const p = String(platform || '');
    if (p.startsWith('Pinterest')) return 'To opis PINA na Pinterest (wyszukiwarka, nie feed): post_text do 450 znaków, 2–3 słowa kluczowe na samym początku, prawie bez emotikon. Dodaj też "pin_title" (do 90 znaków, z frazą, którą nauczyciel wpisałby w wyszukiwarkę) i "keywords" (5–8 fraz po polsku).';
    if (p.startsWith('YouTube')) return 'To opis pod filmem na YouTube – pierwsze 2 zdania są najważniejsze (widać je przed „pokaż więcej”), na końcu naturalne wezwanie do działania.';
    if (p.startsWith('Instagram')) return 'To post na Instagram – krótkie akapity, na końcu 5–8 hashtagów po polsku.';
    if (p.startsWith('LinkedIn')) return 'To post na LinkedIn – rzeczowo, bez nadmiaru emotikon.';
    return '';
  }

  const FORMAT = `ZWRÓĆ WYŁĄCZNIE JSON:
{
  "post_text": "gotowa treść posta, bez adresu URL",
  "image_prompt": "krótki opis po angielsku, co Ewa robi na zdjęciu pasującym do posta (sama akcja i tło)",
  "titles": ["tytuł 1", "tytuł 2", "tytuł 3"],
  "pin_title": "tylko dla Pinteresta, inaczej pusty napis",
  "keywords": ["tylko dla Pinteresta, inaczej pusta lista"],
  "apps": ["adresy url narzędzi z listy, jeśli o nie proszono, inaczej pusta lista"]
}
Tytuły: 3 krótkie napisy na grafikę/wideo (max 6–8 słów), różne kąty: pytanie, korzyść, ciekawostka.`;

  const kontekstSekcji = (p) => SEKCJE[sekcjaPakietu(p)] || 'inne';

  function zrodloOpis(z) {
    if (z.typ === 'narzedzie') {
      return `TEMAT: promujesz narzędzie „${z.app.title}” – ${z.app.desc}
Problem, od którego zaczyna się post: ${z.temat || 'wybierz typowy problem nauczyciela, który to narzędzie rozwiązuje'}.
Zachęć do wypróbowania.`;
    }
    if (z.typ === 'swieto') {
      const kiedy = z.data ? `${dataSlownie(z.data)}${z.dniDo != null ? (z.dniDo === 0 ? ' (dziś)' : z.dniDo === 1 ? ' (jutro)' : ` (za ${z.dniDo} dni)`) : ''}` : '';
      const pak = (z.pakiety || []).length
        ? `\nSą gotowe pakiety materiałów do druku na ten dzień: ${z.pakiety.map((p) => `„${p.title}” (${kontekstSekcji(p)}${zawartoscPakietu(p) ? '; ' + zawartoscPakietu(p) : ''})`).join('; ')}. Wspomnij o nich.`
        : '';
      return `TEMAT: zbliża się ${z.swieto.name}${kiedy ? ' – ' + kiedy : ''}. Opis z kalendarza: ${z.swieto.desc}.
Zachęć do zaplanowania zajęć w EduKalendarzu (gotowy scenariusz zajęć na ten dzień dla wybranej grupy, w kilka minut).${pak}
Nie podawaj historii ani pochodzenia święta, jeśli nie ma ich w opisie.${z.temat ? `\nDodatkowa wskazówka: ${z.temat}` : ''}`;
    }
    if (z.typ === 'pakiet') {
      const p = z.pakiet;
      const zaw = zawartoscPakietu(p);
      return `TEMAT: pakiet materiałów do pobrania „${p.title}” (grupa: ${kontekstSekcji(p)}${p.kategoria ? ', katalog: ' + p.kategoria : ''}).
Opis pakietu: ${p.opis || '(brak opisu – pisz ogólnie, bez wymyślania zawartości)'}
${zaw ? 'Zawartość: ' + zaw + '.' : ''}
Pod linkiem jest podgląd kilku stron, a pobranie odblokowuje wsparcie kawą (kod z podziękowania) – wspomnij o tym lekko, jako „dziękuję”, nie sprzedaż.${z.temat ? `\nDodatkowa wskazówka: ${z.temat}` : ''}`;
    }
    // własny temat – AI dobiera 1–2 narzędzia z listy
    const lista = (z.apps || []).map((a) => `- ${a.url} | ${a.title}: ${String(a.desc || '').slice(0, 140)}`).join('\n');
    return `TEMAT: ${z.temat}
Wybierz 1–2 narzędzia EduBox, które NAPRAWDĘ pomagają w tym temacie, i wspomnij o nich w poście. Wpisz ich adresy (dokładnie jak na liście, np. "edudialog.html") do pola "apps". Jeśli żadne nie pasuje, zostaw "apps" puste i napisz post bez narzędzia.
NARZĘDZIA:
${lista}`;
  }

  function promptEwy(z, platform) {
    const system = `${PERSONA}\nPiszesz na: ${platform}.\n${wskazowkaPlatformy(platform)}\n\n${ZASADY}\n\n${FORMAT}`;
    return { system, prompt: zrodloOpis(z) };
  }

  // ---------- Odpowiedź AI ----------
  function wytnijJson(raw) {
    const t = String(raw || '').replace(/```json/gi, '').replace(/```/g, '').trim();
    const a = t.indexOf('{');
    const b = t.lastIndexOf('}');
    if (a < 0 || b <= a) throw new Error('AI nie zwróciło JSON.');
    return JSON.parse(t.slice(a, b + 1));
  }
  // Usuwa adresy, które model mimo zakazu wstawił do treści (link dokleja system).
  const bezAdresow = (t) => String(t || '').replace(/\bhttps?:\/\/\S+/gi, '').replace(/\b(?:www\.)?eduboxpro\.pl\/\S*/gi, '').replace(/[ \t]+\n/g, '\n').trim();
  function parsujOdpowiedz(raw, apps) {
    const d = wytnijJson(raw);
    const poUrl = new Map((apps || []).map((a) => [String(a.url).replace(/^\.?\//, ''), a]));
    const wybrane = (Array.isArray(d.apps) ? d.apps : []).map((u) => poUrl.get(String(u).replace(/^https?:\/\/[^/]+\//, '').replace(/^\.?\//, ''))).filter(Boolean);
    return {
      post: bezAdresow(d.post_text),
      imagePrompt: String(d.image_prompt || ''),
      titles: (Array.isArray(d.titles) ? d.titles : []).map(String).filter(Boolean).slice(0, 3),
      pinTitle: String(d.pin_title || '').slice(0, 100),
      keywords: (Array.isArray(d.keywords) ? d.keywords : []).map(String).filter(Boolean).slice(0, 10),
      apps: wybrane.filter((a, i) => wybrane.indexOf(a) === i).slice(0, 2),
    };
  }

  // Link pod postem (pierwszy) i ewentualne dodatkowe.
  function linkiPosta(z, wynik) {
    if (z.typ === 'narzedzie') return [{ label: z.app.title, url: `${SITE}/${z.app.url}` }];
    if (z.typ === 'pakiet') return [{ label: z.pakiet.title, url: adresPakietu(z.pakiet) }];
    if (z.typ === 'swieto') {
      const l = [{ label: `EduKalendarz – ${z.swieto.name}`, url: adresSwieta(z.month, z.swieto) }];
      const pk = z.pakiety || [];
      if (pk.length === 1) l.push({ label: pk[0].title, url: adresPakietu(pk[0]) });
      if (pk.length > 1) l.push({ label: `Pakiety: ${z.swieto.name}`, url: `${SITE}/materialy.html?szukaj=${encodeURIComponent(z.swieto.name)}` });
      return l;
    }
    return ((wynik && wynik.apps) || []).map((a) => ({ label: a.title, url: `${SITE}/${a.url}` }));
  }

  // ---------- Plan tygodnia (bez AI – AI pisze dopiero szkice) ----------
  // Święta w ciągu najbliższych dni dostają post ok. 3 dni wcześniej (jeśli się da – w dniu planu, nie w przeszłości).
  // Wolne dni wypełniają na zmianę pakiety (najpierw te bez święta w planie) i narzędzia; wybór rotuje z datą,
  // więc kolejne tygodnie nie powtarzają tego samego.
  function planTygodnia(start, { pakiety = [], apps = [], dni = 7, wyprzedzenie = 3 } = {}) {
    const s = dzienBez(start || new Date());
    const sloty = Array.from({ length: dni }, (_, i) => ({ data: dodajDni(s, i), typ: null }));
    const swieta = nadchodzaceSwieta(s, dni + wyprzedzenie);
    const uzytePakiety = new Set();
    swieta.forEach((x) => {
      const cel = Math.max(0, roznicaDni(s, x.data) - wyprzedzenie);
      let i = cel;
      while (i < dni && sloty[i].typ) i += 1;
      if (i >= dni || i > roznicaDni(s, x.data)) return; // brak miejsca przed świętem
      const pk = pakietyDoSwieta(x.swieto, pakiety);
      pk.forEach((p) => uzytePakiety.add(p.id));
      sloty[i] = { data: sloty[i].data, typ: 'swieto', swieto: x.swieto, month: x.month, dataSwieta: x.data, dniDo: roznicaDni(sloty[i].data, x.data), pakiety: pk };
    });
    const numerDnia = Math.floor(s / 86400000);
    const wolnePakiety = pakiety.filter((p) => !uzytePakiety.has(p.id));
    let ip = wolnePakiety.length ? numerDnia % wolnePakiety.length : 0;
    let ia = apps.length ? (numerDnia * 7) % apps.length : 0;
    let naprzemian = numerDnia % 2;
    let uzyteWolne = 0;
    sloty.forEach((slot, i) => {
      if (slot.typ) return;
      // Każdy pakiet najwyżej raz w planie – gdy się skończą, resztę dni biorą narzędzia.
      const zostalPakiet = uzyteWolne < wolnePakiety.length;
      const chcePakiet = naprzemian % 2 === 0 && zostalPakiet;
      naprzemian += 1;
      if (chcePakiet || (!apps.length && zostalPakiet)) { sloty[i] = { data: slot.data, typ: 'pakiet', pakiet: wolnePakiety[ip % wolnePakiety.length] }; ip += 1; uzyteWolne += 1; return; }
      if (apps.length) { sloty[i] = { data: slot.data, typ: 'narzedzie', app: apps[ia % apps.length] }; ia += 1; }
    });
    return sloty.filter((x) => x.typ);
  }

  function nazwaZrodla(z) {
    if (z.typ === 'narzedzie') return z.app.title;
    if (z.typ === 'pakiet') return z.pakiet.title;
    if (z.typ === 'swieto') return `${z.swieto.name}${z.dataSwieta ? ' (' + dataKrotko(z.dataSwieta) + ')' : ''}`;
    return z.temat || '';
  }

  global.EwaTematy = {
    SITE, FIRESTORE_KATALOG, SEKCJE, pakietyZFirestore, sekcjaPakietu, adresPakietu, okladkaPakietu, zawartoscPakietu,
    nadchodzaceSwieta, adresSwieta, pakietyDoSwieta, promptEwy, parsujOdpowiedz, linkiPosta, planTygodnia,
    nazwaZrodla, dataSlownie, duzaLitera, dataKrotko, roznicaDni,
  };
})(typeof window !== 'undefined' ? window : this);
