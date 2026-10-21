// Plan podziękowania za wsparcie z Buycoffee.to (czysta funkcja – testy w coffeePlan.test.js).
// Drobna „kawa” = kod PRO na 7 dni (aktywacja w Make, scenariusz Coffee-Verify; przy pobieraniu
// z Bazy Materiałów sprawdzany już bez Make – bonusUntilFromRows poniżej).
// Wpłata od 49 zł = kod ROK-… ważny 365 dni od zakupu, sprawdzany bezpośrednio w arkuszu
// Coffee_Codes przez api/verify-code.js.

const YEAR_PLAN_MIN_PLN = 49;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseAmountPLN(amount) {
    const n = Number(String(amount == null ? '' : amount).replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
}

function planForAmount(amount) {
    return parseAmountPLN(amount) >= YEAR_PLAN_MIN_PLN
        ? { prefix: 'ROK', days: 365, label: '12 miesięcy' }
        : { prefix: 'KAWA', days: 7, label: '7 dni' };
}

// Data wygaśnięcia kodu rocznego liczona od chwili wygenerowania (kolumna F arkusza, ISO).
function yearCodeUntil(createdIso, days = 365) {
    const t = Date.parse(createdIso);
    return Number.isFinite(t) ? new Date(t + days * DAY_MS).toISOString() : null;
}

const YEAR_CODE_PATTERN = /^ROK-[0-9A-F]{8}$/;

// Kody czasowe 7-dniowe: KAWA-… (kawa, arkusz Coffee_Codes) i EDU-… (polecenie, arkusz Referral_Codes).
// Aktywuje je Make (Coffee-Verify / Referral-Verify): oznacza wiersz jako „used” i wpisuje datę użycia
// w formacie „YYYY-MM-DD HH:mm”. Przy POBIERANIU z Bazy Materiałów nie wolno pytać Make drugi raz – kod
// jest już „used”, więc Make odpowiada „nieważny” (realny błąd do 21.10.2026: kto odblokował PRO kawą
// albo poleceniem, nie mógł pobrać żadnego pakietu). Dlatego pobieranie czyta arkusz bez zapisu.
const BONUS_DAYS = 7;
const BONUS_CODE_PATTERN = /^(KAWA|EDU)-[0-9A-Z]{4,16}$/;
const BONUS_SHEETS = {
    KAWA: { range: 'Coffee_Codes!A:G', status: 4, usedAt: 6 },
    EDU: { range: 'Referral_Codes!A:E', status: 2, usedAt: 4 },
};

// Koniec dostępu tak samo jak w przeglądarce: Make zwraca „until” jako samą datę (dzień użycia + 7),
// a przeglądarka wygasza bonus o północy UTC tego dnia (new Date('YYYY-MM-DD')).
function bonusCodeUntil(status, usedAt, days = BONUS_DAYS) {
    if (String(status || '').trim().toLowerCase() !== 'used') return null;
    const m = String(usedAt || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days)).toISOString();
}

// Szuka kodu w wierszach arkusza (wynik values.get) i zwraca datę końca dostępu, gdy kod był aktywowany
// i jeszcze nie wygasł; w każdym innym przypadku (brak kodu, nieaktywowany, wygasły) – null.
function bonusUntilFromRows(rows, normalizedCode, now = Date.now()) {
    const prefix = String(normalizedCode || '').split('-')[0];
    const sheet = BONUS_SHEETS[prefix];
    if (!sheet || !BONUS_CODE_PATTERN.test(normalizedCode)) return null;
    const row = (rows || []).find(r => String((r && r[0]) || '').trim().toUpperCase() === normalizedCode);
    const until = row ? bonusCodeUntil(row[sheet.status], row[sheet.usedAt]) : null;
    return until && Date.parse(until) > now ? until : null;
}

module.exports = {
    YEAR_PLAN_MIN_PLN, YEAR_CODE_PATTERN, BONUS_DAYS, BONUS_CODE_PATTERN, BONUS_SHEETS,
    parseAmountPLN, planForAmount, yearCodeUntil, bonusCodeUntil, bonusUntilFromRows,
};
