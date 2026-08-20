// Wyciąga dane wpłaty (imię, e-mail, kwota) z treści powiadomienia Buycoffee.to.
// UWAGA: to jest CZYSTA funkcja (brak zależności od sieci/Gmaila/Make) - dzięki temu można ją
// w pełni przetestować lokalnie (patrz parseCoffeePayment.test.js) PRZED wdrożeniem, w przeciwieństwie
// do formuł w Make, których nie dało się sprawdzić bez odpalenia na prawdziwej wpłacie.
//
// Format oczekiwanego tekstu (potwierdzony na prawdziwych mailach z Buycoffee, sierpień 2026):
//   "Wspierający <Imię Nazwisko> (<email>)
//    właśnie przekazał Ci wsparcie w wysokości <kwota> zł."
//
// Jeśli mail jest odpowiedzią/wątkiem i zawiera ten fragment więcej niż raz (np. cytowana
// wcześniejsza wiadomość), bierzemy OSTATNIE wystąpienie - ono odpowiada najświeższej wpłacie.
function parseCoffeePayment(rawText) {
    if (!rawText || typeof rawText !== 'string') {
        return { ok: false, reason: 'Brak tekstu wejściowego.' };
    }

    // Wyrażenie regularne zamiast ręcznego liczenia pozycji znaków (substring/indexOf) - dużo
    // odporniejsze na drobne zmiany formatowania (spacje, złamania linii, kropka na końcu itp.),
    // bo nie zakłada dokładnych przesunięć znaków, tylko dopasowuje kształt tekstu.
    const pattern = /Wspieraj[ąa]cy\s+([^(]+?)\s*\(\s*([^\s()]+@[^\s()]+?)\s*\)[\s\S]{0,80}?wysoko[śs]ci\s*([\d]+(?:[.,]\d+)?)\s*z[łl]/gi;

    let match;
    let lastMatch = null;
    while ((match = pattern.exec(rawText)) !== null) {
        lastMatch = match;
    }

    if (!lastMatch) {
        return { ok: false, reason: 'Nie znaleziono wzorca "Wspierający ... (email) ... wysokości ... zł" w tekście.' };
    }

    const payerName = lastMatch[1].trim();
    const payerEmail = lastMatch[2].trim();
    const amount = lastMatch[3].trim().replace('.', ',');

    if (!payerEmail.includes('@')) {
        return { ok: false, reason: `Wyłuskany e-mail nie zawiera @: "${payerEmail}"` };
    }

    return { ok: true, payerName, payerEmail, amount };
}

module.exports = { parseCoffeePayment };
