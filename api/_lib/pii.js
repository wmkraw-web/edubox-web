// Minimalizacja danych (RODO) przed wysłaniem tekstu do modelu AI.
// Celowo wąsko: usuwamy tylko PESEL (11 cyfr z poprawną sumą kontrolną) - najczęstszy identyfikator
// dziecka w dokumentacji SPE, praktycznie bez fałszywych trafień. Telefonów, e-maili i numerów kont
// NIE ruszamy: nauczyciel często wpisuje własny kontakt lub konto szkoły do pisma dla rodziców.
// Imion nie wykrywamy automatycznie - za dużo fałszywych trafień; zamiast tego prosimy o inicjały.

const PESEL_WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];

function isValidPesel(digits) {
    if (!/^\d{11}$/.test(digits)) return false;
    const month = Number(digits.slice(2, 4)) % 20;
    const day = Number(digits.slice(4, 6));
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;
    const sum = PESEL_WEIGHTS.reduce((acc, w, i) => acc + w * Number(digits[i]), 0);
    return (10 - (sum % 10)) % 10 === Number(digits[10]);
}

// Zwraca { text, removed } - liczba usuniętych numerów trafia tylko do odpowiedzi, nigdy do logów.
function scrubPersonalData(text) {
    if (typeof text !== 'string' || !text) return { text, removed: 0 };
    let removed = 0;
    const out = text.replace(/(?<!\d)\d{11}(?!\d)/g, (match) => {
        if (!isValidPesel(match)) return match;
        removed++;
        return '[PESEL usunięty]';
    });
    return { text: out, removed };
}

module.exports = { isValidPesel, scrubPersonalData };
