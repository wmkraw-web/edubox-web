// Cotygodniowe podsumowanie portfolio wysyłane mailem - "co się działo w tym tygodniu" bez potrzeby
// pytania o to ręcznie. Liczy nowe kody z "Postaw kawę" i "Poleć i zyskaj PRO" z ostatnich 7 dni
// wprost z arkuszy Google (ten sam mechanizm konta usługi co api/coffee-check.js).
//
// WYWOŁYWANE PRZEZ: .github/workflows/weekly-report.yml (raz w tygodniu, razem z resztą raportu -
// koszty OpenAI/Fal.ai, ruch GA4, licznik materiałów) - ten workflow sam składa i wysyła e-mail
// (przez Resend), a ten endpoint tylko dostarcza dane liczbowe z arkuszy, żeby nie duplikować
// klucza konta usługi Google w sekretach GitHub (jest już ustawiony na Vercelu).
//
// WYMAGANE ZMIENNE ŚRODOWISKOWE (te same co coffee-check.js + jedna nowa):
//   GOOGLE_SERVICE_ACCOUNT_KEY  - już ustawione (używane przez coffee-check.js)
//   SHEETS_SPREADSHEET_ID       - już ustawione
//   WEEKLY_REPORT_SECRET        - NOWA - dowolny losowy string, potwierdza wywołanie z GitHub Actions

import { getServiceAccountAccessToken } from './_lib/googleServiceAccountAuth.js';

async function readSheet(accessToken, spreadsheetId, sheetName) {
    const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:F`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await res.json();
    if (!res.ok) {
        throw new Error(`Błąd odczytu arkusza ${sheetName}: ${data.error?.message || res.status}`);
    }
    return data.values || [];
}

// Sprawdza, czy podany tekst z komórki daty mieści się w ostatnich `days` dniach. Obie sekcje
// (Coffee_Codes i Referral_Codes) zapisują datę inaczej (ISO vs "YYYY-MM-DD HH:mm" z Make), ale
// new Date() w Node radzi sobie z obiema postaciami wystarczająco dobrze na potrzeby zgrubnego
// tygodniowego podsumowania (nie jest to rozliczenie księgowe).
function isWithinLastDays(dateText, days) {
    if (!dateText) return false;
    const parsed = new Date(dateText);
    if (isNaN(parsed.getTime())) return false;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return parsed.getTime() >= cutoff;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (req.headers.authorization !== `Bearer ${process.env.WEEKLY_REPORT_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        for (const key of ['GOOGLE_SERVICE_ACCOUNT_KEY', 'SHEETS_SPREADSHEET_ID']) {
            if (!process.env[key]) throw new Error(`Brak zmiennej środowiskowej ${key} na Vercelu.`);
        }

        let serviceAccountCredentials;
        try {
            serviceAccountCredentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        } catch (e) {
            throw new Error(`GOOGLE_SERVICE_ACCOUNT_KEY nie jest poprawnym JSON-em (${e.message}).`);
        }

        const accessToken = await getServiceAccountAccessToken(
            serviceAccountCredentials,
            'https://www.googleapis.com/auth/spreadsheets.readonly'
        );
        const spreadsheetId = process.env.SHEETS_SPREADSHEET_ID;

        // Coffee_Codes: A=kod, B=email, C=imię, D=kwota, E=status, F=data (ISO)
        const coffeeRows = await readSheet(accessToken, spreadsheetId, 'Coffee_Codes');
        const coffeeThisWeek = coffeeRows.slice(1).filter(r => isWithinLastDays(r[5], 7));
        const coffeeAmountThisWeek = coffeeThisWeek.reduce((sum, r) => {
            const n = parseFloat(String(r[3] || '0').replace(',', '.'));
            return sum + (isNaN(n) ? 0 : n);
        }, 0);

        // Referral_Codes: A=kod, B=email, C=status(unused/used), D=data utworzenia, E=data użycia
        const referralRows = await readSheet(accessToken, spreadsheetId, 'Referral_Codes');
        const referralCreatedThisWeek = referralRows.slice(1).filter(r => isWithinLastDays(r[3], 7));
        const referralUsedThisWeek = referralRows.slice(1).filter(r => r[2] === 'used' && isWithinLastDays(r[4], 7));

        res.status(200).json({
            coffee: {
                newCodesThisWeek: coffeeThisWeek.length,
                totalAmountThisWeek: Math.round(coffeeAmountThisWeek * 100) / 100
            },
            referral: {
                newCodesThisWeek: referralCreatedThisWeek.length,
                usedThisWeek: referralUsedThisWeek.length
            }
        });
    } catch (error) {
        console.error('Błąd weekly-report:', error);
        res.status(500).json({ error: error.message });
    }
}
