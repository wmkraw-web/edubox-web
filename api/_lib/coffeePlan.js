// Plan podziękowania za wsparcie z Buycoffee.to (czysta funkcja – testy w coffeePlan.test.js).
// Drobna „kawa” = kod PRO na 7 dni (scenariusz weryfikacji w Make, bez zmian).
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

module.exports = { YEAR_PLAN_MIN_PLN, YEAR_CODE_PATTERN, parseAmountPLN, planForAmount, yearCodeUntil };
