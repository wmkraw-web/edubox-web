// Wspólne dane i funkcje Bazy Materiałów – używa ich publiczny katalog (materialy.html)
// i prywatny panel (panel-materialy.html). Zwykły skrypt (bez modułów), żeby dało się go
// testować w Node przez vm (scripts/check-materialy.js), tak jak asystent-dokumenty.js.
(function (global) {
    // Cztery sekcje katalogu: trzy grupy wiekowe (jak w pakietach) i „Inne”. Kolejność = kolejność zakładek.
    const SEKCJE = [
        { id: 'przedszkole', label: 'Przedszkole', opis: 'dzieci 3–6 lat', icon: 'ph-baby', kolor: 'amber' },
        { id: 'klasy-1-3', label: 'Klasy 1–3', opis: 'edukacja wczesnoszkolna', icon: 'ph-pencil-simple', kolor: 'emerald' },
        { id: 'klasy-4-8', label: 'Klasy 4–8', opis: 'szkoła podstawowa', icon: 'ph-graduation-cap', kolor: 'sky' },
        { id: 'inne', label: 'Inne', opis: 'pozostałe materiały', icon: 'ph-squares-four', kolor: 'fuchsia' },
    ];
    const SEKCJA_IDS = SEKCJE.map((s) => s.id);

    // Pakiety dodane przed podziałem na sekcje nie mają pola „sekcja” – zgadujemy z tytułu i folderu
    // (pakiety EduBox mają w nazwie „przedszkole”, „klasy 1-3”, „klasy 4-8”). Panel pokazuje, że to
    // przypisanie automatyczne, i pozwala je zmienić.
    function zgadnijSekcje(pakiet) {
        const t = `${(pakiet && pakiet.title) || ''} ${(pakiet && pakiet.kategoria) || ''}`.toLowerCase();
        if (/przedszkol|zerówk|zerowk/.test(t)) return 'przedszkole';
        if (/(klas[ay]?|kl\.)\s*(i\s*[–-]\s*iii|1\s*[–-]\s*3)/.test(t)) return 'klasy-1-3';
        if (/(klas[ay]?|kl\.)\s*(iv\s*[–-]\s*viii|4\s*[–-]\s*8)/.test(t)) return 'klasy-4-8';
        return 'inne';
    }

    function sekcjaPakietu(pakiet) {
        return pakiet && SEKCJA_IDS.includes(pakiet.sekcja) ? pakiet.sekcja : zgadnijSekcje(pakiet);
    }

    // Domyślny wybór stron do podglądu: okładka i spis treści + strony rozłożone równo po całym PDF,
    // żeby było widać przekrój (piosenki, scenariusz, karty pracy, dyplom), a nie tylko początek.
    function stronyPodgladu(liczbaStron, ile) {
        const n = Math.max(0, Math.floor(liczbaStron || 0));
        const max = Math.max(1, Math.floor(ile || 8));
        if (n <= max) return Array.from({ length: n }, (_, i) => i + 1);
        const wynik = [1, 2];
        const reszta = max - 2;
        for (let i = 1; i <= reszta; i += 1) {
            const s = Math.round(2 + (i * (n - 2)) / (reszta + 1));
            if (!wynik.includes(s)) wynik.push(s);
        }
        return wynik.sort((a, b) => a - b);
    }

    // „1-3, 7, 12” → [1, 2, 3, 7, 12]; strony spoza PDF są pomijane, najwyżej 12 stron.
    function parsujStrony(tekst, liczbaStron) {
        const wynik = [];
        String(tekst || '').split(/[,;\s]+/).filter(Boolean).forEach((czesc) => {
            const m = czesc.match(/^(\d+)(?:[-–](\d+))?$/);
            if (!m) return;
            const od = Number(m[1]);
            const doS = m[2] ? Number(m[2]) : od;
            for (let s = Math.min(od, doS); s <= Math.max(od, doS) && wynik.length < 12; s += 1) {
                if (s >= 1 && s <= liczbaStron && !wynik.includes(s)) wynik.push(s);
            }
        });
        return wynik.sort((a, b) => a - b);
    }

    // Podgląd jest publiczny i serwowany z pamięci podręcznej Vercela; adres zawiera tylko ścieżkę obrazka.
    function adresPodgladu(sciezka) {
        return `/api/verify-code?podglad=${encodeURIComponent(sciezka)}`;
    }

    // 1 pakiet, 2–4 pakiety (ale 12–14 pakietów), 5+ pakietów.
    function ilePakietow(n) {
        const d = n % 10, s = n % 100;
        if (n === 1) return '1 pakiet';
        if (d >= 2 && d <= 4 && !(s >= 12 && s <= 14)) return `${n} pakiety`;
        return `${n} pakietów`;
    }

    global.EduMaterialy = { ilePakietow, SEKCJE, SEKCJA_IDS, zgadnijSekcje, sekcjaPakietu, stronyPodgladu, parsujStrony, adresPodgladu };
})(typeof window !== 'undefined' ? window : this);
