// Sprawdza skrzynkę Gmail pod kątem nowych powiadomień o wpłatach z Buycoffee.to, generuje kod PRO,
// zapisuje go do arkusza Coffee_Codes i wysyła klientowi mailem. Zastępuje wcześniejszy scenariusz
// Make (zbyt kruchy - łatwo się psuł przy drobnych zmianach formatu maila, bez możliwości
// przetestowania zmian przed wdrożeniem).
//
// WYWOŁYWANE PRZEZ: harmonogram GitHub Actions co ok. 5 minut (POST z nagłówkiem autoryzacji) -
// NIE przez Vercel Cron, bo darmowy plan Vercela pozwala na max. 1 uruchomienie dziennie.
//
// WYMAGANE ZMIENNE ŚRODOWISKOWE (Vercel → Settings → Environment Variables):
//   GMAIL_CLIENT_ID       - z Google Cloud Console (OAuth 2.0 Client)
//   GMAIL_CLIENT_SECRET   - jw.
//   GMAIL_REFRESH_TOKEN   - wygenerowany przez OAuth Playground (patrz instrukcja)
//   SHEETS_SPREADSHEET_ID - "1qccAchzRDlcRPjsTINt8wEBW2WXWk6HXIb-7UyBei8s" (ten sam arkusz co wcześniej)
//   COFFEE_CHECK_SECRET   - dowolny losowy string, potwierdza że wywołanie przychodzi z naszego GitHub Actions

import crypto from 'crypto';
import { parseCoffeePayment } from './_lib/parseCoffeePayment.js';

const GMAIL_LABEL_PROCESSED = 'EduBox-Coffee-Processed'; // etykieta Gmail zapobiegająca podwójnemu przetworzeniu tego samego maila

async function getAccessToken() {
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: process.env.GMAIL_CLIENT_ID,
            client_secret: process.env.GMAIL_CLIENT_SECRET,
            refresh_token: process.env.GMAIL_REFRESH_TOKEN,
            grant_type: 'refresh_token'
        })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Błąd odświeżania tokenu Gmail: ${data.error_description || data.error}`);
    return data.access_token;
}

async function gmailFetch(accessToken, path, options = {}) {
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/${path}`, {
        ...options,
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Gmail API (${path}): ${data.error?.message || res.status}`);
    return data;
}

// Upewnia się, że etykieta "przetworzone" istnieje, i zwraca jej ID (tworzy ją przy pierwszym uruchomieniu).
async function ensureProcessedLabel(accessToken) {
    const { labels } = await gmailFetch(accessToken, 'users/me/labels');
    const existing = labels.find(l => l.name === GMAIL_LABEL_PROCESSED);
    if (existing) return existing.id;
    const created = await gmailFetch(accessToken, 'users/me/labels', {
        method: 'POST',
        body: JSON.stringify({ name: GMAIL_LABEL_PROCESSED, labelListVisibility: 'labelHide', messageListVisibility: 'hide' })
    });
    return created.id;
}

function decodeBase64Url(str) {
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

// Wyciąga tekst (plain text) z treści wiadomości Gmail (obsługuje proste i wieloczęściowe wiadomości).
function extractPlainText(payload) {
    if (payload.body?.data) return decodeBase64Url(payload.body.data);
    if (payload.parts) {
        const textPart = payload.parts.find(p => p.mimeType === 'text/plain') || payload.parts.find(p => p.mimeType === 'text/html');
        if (textPart) return extractPlainText(textPart);
        for (const part of payload.parts) {
            const nested = extractPlainText(part);
            if (nested) return nested;
        }
    }
    return '';
}

async function sendEmail(accessToken, { to, subject, body }) {
    const raw = Buffer.from(
        `To: ${to}\r\nSubject: =?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${body}`
    ).toString('base64url');
    return gmailFetch(accessToken, 'users/me/messages/send', { method: 'POST', body: JSON.stringify({ raw }) });
}

async function appendSheetRow(accessToken, spreadsheetId, values) {
    // Google Sheets API - używamy tego samego tokenu OAuth co Gmail (jeśli scope spreadsheets był
    // dołączony przy generowaniu refresh tokena), bo to jeden i ten sam "użytkownik" Google.
    const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Coffee_Codes!A:G:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: [values] })
        }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(`Sheets API: ${data.error?.message || res.status}`);
    return data;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Prosta ochrona, żeby tylko nasz harmonogram GitHub Actions mógł to wywołać.
    if (req.headers.authorization !== `Bearer ${process.env.COFFEE_CHECK_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const results = { checked: 0, processed: 0, skipped: 0, errors: [] };

    try {
        const accessToken = await getAccessToken();
        const labelId = await ensureProcessedLabel(accessToken);

        // Szukamy nieoznaczonych jeszcze maili od Buycoffee wspominających "Wspierający".
        const query = `from:buycoffee.to "Wspierający" -label:${GMAIL_LABEL_PROCESSED}`;
        const { messages = [] } = await gmailFetch(accessToken, `users/me/messages?q=${encodeURIComponent(query)}`);
        results.checked = messages.length;

        for (const { id } of messages) {
            try {
                const full = await gmailFetch(accessToken, `users/me/messages/${id}?format=full`);
                const text = extractPlainText(full.payload);
                const parsed = parseCoffeePayment(text);

                if (!parsed.ok) {
                    // Nie rozpoznano - alert do Ciebie z surowym tekstem, żeby dało się to precyzyjnie naprawić.
                    await sendEmail(accessToken, {
                        to: 'edubox.ai@gmail.com',
                        subject: '⚠️ Nierozpoznana wiadomość od Buycoffee',
                        body: `Powód: ${parsed.reason}\n\nSUROWY TEKST (pierwsze 2000 znaków):\n${text.slice(0, 2000)}`
                    });
                } else {
                    const code = `KAWA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
                    await appendSheetRow(accessToken, process.env.SHEETS_SPREADSHEET_ID, [
                        code, parsed.payerEmail, parsed.payerName, parsed.amount, 'unused', new Date().toISOString()
                    ]);
                    await sendEmail(accessToken, {
                        to: parsed.payerEmail,
                        subject: 'Dziękujemy za kawę! Twój kod PRO na 7 dni ☕',
                        body: `Cześć!\n\nDziękujemy za postawioną kawę dla EduBox AI — to naprawdę dużo dla nas znaczy!\n\nOto Twój kod dostępu PRO:\n\n${code}\n\nWpisz go na eduboxpro.pl (przycisk odblokowania Premium w dowolnym narzędziu) — dostaniesz 7 dni pełnego dostępu PRO.\n\nDzięki, że jesteś z nami!\nZespół EduBox AI`
                    });
                    results.processed++;
                }

                // Oznacz jako przetworzone NIEZALEŻNIE od wyniku, żeby nie próbować w kółko tego samego maila.
                await gmailFetch(accessToken, `users/me/messages/${id}/modify`, {
                    method: 'POST',
                    body: JSON.stringify({ addLabelIds: [labelId] })
                });
            } catch (itemError) {
                results.errors.push({ id, message: itemError.message });
            }
        }

        res.status(200).json(results);
    } catch (error) {
        console.error('Błąd coffee-check:', error);
        res.status(500).json({ error: error.message, ...results });
    }
};
