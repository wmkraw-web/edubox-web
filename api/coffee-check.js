// Sprawdza skrzynkę Gmail pod kątem nowych powiadomień o wpłatach z Buycoffee.to, generuje kod PRO,
// zapisuje go do arkusza Coffee_Codes i wysyła klientowi mailem. Zastępuje wcześniejszy scenariusz
// Make (zbyt kruchy - łatwo się psuł przy drobnych zmianach formatu maila, bez możliwości
// przetestowania zmian przed wdrożeniem).
//
// WYWOŁYWANE PRZEZ: harmonogram GitHub Actions co ok. 5 minut (POST z nagłówkiem autoryzacji) -
// NIE przez Vercel Cron, bo darmowy plan Vercela pozwala na max. 1 uruchomienie dziennie.
//
// CELOWO bez OAuth do Gmaila (refresh token w trybie testowym wygasałby po 7 dniach - sprawdzone
// na żywo). Zamiast tego: "Hasło aplikacji" Gmaila (IMAP/SMTP, nie wygasa) + konto usługi Google
// do Arkuszy (też nie wygasa) - żadne z nich nie wymaga procesu weryfikacji aplikacji przez Google.
//
// WYMAGANE ZMIENNE ŚRODOWISKOWE (Vercel → Settings → Environment Variables):
//   GMAIL_ADDRESS               - "edubox.ai@gmail.com"
//   GMAIL_APP_PASSWORD          - 16-znakowe hasło aplikacji z myaccount.google.com/apppasswords
//   GOOGLE_SERVICE_ACCOUNT_KEY  - pełna zawartość pliku JSON klucza konta usługi (jedna linia)
//   SHEETS_SPREADSHEET_ID       - "1qccAchzRDlcRPjsTINt8wEBW2WXWk6HXIb-7UyBei8s"
//   COFFEE_CHECK_SECRET         - dowolny losowy string, potwierdza że wywołanie przychodzi z GitHub Actions

import crypto from 'crypto';
import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import { parseCoffeePayment } from './_lib/parseCoffeePayment.js';
import { extractEmailText } from './_lib/extractEmailText.js';
import { getServiceAccountAccessToken } from './_lib/googleServiceAccountAuth.js';

async function sendEmail(transporter, { to, subject, text }) {
    await transporter.sendMail({ from: process.env.GMAIL_ADDRESS, to, subject, text });
}

async function appendSheetRow(accessToken, spreadsheetId, values) {
    const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Coffee_Codes!A:F:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: [values] })
        }
    );
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(`Błąd zapisu do arkusza: ${data.error?.message || res.status}`);
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Prosta ochrona, żeby tylko nasz harmonogram GitHub Actions mógł to wywołać.
    if (req.headers.authorization !== `Bearer ${process.env.COFFEE_CHECK_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const results = { checked: 0, processed: 0, unrecognized: 0, errors: [] };
    let client;

    try {
        // WAŻNE: cała konfiguracja (nie tylko sama praca z pocztą/arkuszem) jest wewnątrz try/catch -
        // wcześniej JSON.parse klucza konta usługi był POZA blokiem try, więc zły/uszkodzony klucz
        // powodował twardą awarię funkcji (nieczytelne "FUNCTION_INVOCATION_FAILED" od Vercela)
        // zamiast zrozumiałego komunikatu błędu w odpowiedzi JSON.
        for (const key of ['GMAIL_ADDRESS', 'GMAIL_APP_PASSWORD', 'GOOGLE_SERVICE_ACCOUNT_KEY', 'SHEETS_SPREADSHEET_ID']) {
            if (!process.env[key]) throw new Error(`Brak zmiennej środowiskowej ${key} na Vercelu.`);
        }

        let serviceAccountCredentials;
        try {
            serviceAccountCredentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        } catch (e) {
            throw new Error(`GOOGLE_SERVICE_ACCOUNT_KEY nie jest poprawnym JSON-em (${e.message}). Sprawdź, czy cała zawartość pliku .json została wklejona bez zmian.`);
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.GMAIL_ADDRESS, pass: process.env.GMAIL_APP_PASSWORD }
        });

        const sheetsAccessToken = await getServiceAccountAccessToken(
            serviceAccountCredentials,
            'https://www.googleapis.com/auth/spreadsheets'
        );

        client = new ImapFlow({
            host: 'imap.gmail.com',
            port: 993,
            secure: true,
            auth: { user: process.env.GMAIL_ADDRESS, pass: process.env.GMAIL_APP_PASSWORD },
            logger: false
        });

        await client.connect();

        // WAŻNE: przeszukujemy ZARÓWNO Odebrane (\Inbox) JAK I Spam (\Junk), a nie samo INBOX.
        // Powód: prawdziwa awaria z 20.08.2026 - płatność przyszła, ale mail trafił do Spamu
        // (pierwsza wiadomość od tego nadawcy), więc INBOX-only wyszukiwanie zwracało "checked:0" bez
        // żadnego błędu - a mechanizm ratunkowy (alert mailowy) uruchamia się tylko gdy wiadomość
        // ZOSTANIE znaleziona, ale nie da się jej rozpoznać, więc ta luka przechodziła bezgłośnie.
        // UWAGA: folderu "Wszystkie wiadomości" (\All) celowo NIE używamy - w Gmailu ten folder z
        // definicji WYKLUCZA Spam i Kosz, więc nie rozwiązałby tego konkretnego problemu.
        //
        // Nazwy tych folderów po stronie IMAP bywają zależne od języka interfejsu konta Gmail (np.
        // polski: "[Gmail]/Spam" vs angielski: "[Gmail]/Spam" - zwykle to samo, ale dla pewności i
        // tak wyszukujemy po prawdziwej roli folderu (atrybuty specjalne \Inbox i \Junk), nie po
        // nazwie, żeby nie zgadywać.
        const mailboxes = await client.list();
        const targetBoxes = mailboxes.filter(mb => mb.specialUse === '\\Inbox' || mb.specialUse === '\\Junk');
        if (targetBoxes.length === 0) {
            throw new Error('Nie znaleziono folderów Odebrane/Spam (\\Inbox, \\Junk) na koncie Gmail - sprawdź konfigurację IMAP.');
        }

        for (const box of targetBoxes) {
            const lock = await client.getMailboxLock(box.path);
            try {
                // Nieprzeczytane maile od Buycoffee - "nieprzeczytane" pełni tu rolę "jeszcze nieprzetworzone".
                const uids = await client.search({ seen: false, from: 'buycoffee.to' });
                results.checked += uids.length;

                for (const uid of uids) {
                    try {
                        const message = await client.fetchOne(uid, { source: true });
                        const text = extractEmailText(message.source);
                        const parsed = parseCoffeePayment(text);

                        if (!parsed.ok) {
                            results.unrecognized++;
                            await sendEmail(transporter, {
                                to: process.env.GMAIL_ADDRESS,
                                subject: '⚠️ Nierozpoznana wiadomość od Buycoffee',
                                text: `Powód: ${parsed.reason}\nFolder: ${box.path}\n\nSUROWY TEKST (pierwsze 2000 znaków):\n${text.slice(0, 2000)}`
                            });
                        } else {
                            const code = `KAWA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
                            await appendSheetRow(sheetsAccessToken, process.env.SHEETS_SPREADSHEET_ID, [
                                code, parsed.payerEmail, parsed.payerName, parsed.amount, 'unused', new Date().toISOString()
                            ]);
                            await sendEmail(transporter, {
                                to: parsed.payerEmail,
                                subject: 'Dziękujemy za kawę! Twój kod PRO na 7 dni ☕',
                                text: `Cześć!\n\nDziękujemy za postawioną kawę dla EduBox AI — to naprawdę dużo dla nas znaczy!\n\nOto Twój kod dostępu PRO:\n\n${code}\n\nWpisz go na eduboxpro.pl (przycisk odblokowania Premium w dowolnym narzędziu) — dostaniesz 7 dni pełnego dostępu PRO.\n\nDzięki, że jesteś z nami!\nZespół EduBox AI`
                            });
                            results.processed++;
                        }

                        // Oznacz jako przeczytane NIEZALEŻNIE od wyniku, żeby nie przetwarzać ponownie.
                        await client.messageFlagsAdd(uid, ['\\Seen']);
                    } catch (itemError) {
                        results.errors.push({ uid, folder: box.path, message: itemError.message });
                        // Alert o pojedynczym błędzie, żeby nie został niezauważony w logach.
                        try {
                            await sendEmail(transporter, {
                                to: process.env.GMAIL_ADDRESS,
                                subject: '🔴 Błąd przetwarzania wpłaty kawa',
                                text: `Nie udało się przetworzyć wiadomości (uid ${uid}, folder ${box.path}):\n${itemError.message}`
                            });
                        } catch (alertError) {
                            results.errors.push({ uid, folder: box.path, message: `Dodatkowo nie udało się wysłać alertu: ${alertError.message}` });
                        }
                    }
                }
            } finally {
                lock.release();
            }
        }

        await client.logout();
        res.status(200).json(results);
    } catch (error) {
        console.error('Błąd coffee-check:', error);
        // "client" może nie istnieć, jeśli błąd wystąpił wcześniej (np. brak zmiennej środowiskowej,
        // zanim zdążyliśmy w ogóle utworzyć połączenie IMAP).
        if (client) {
            try { await client.logout(); } catch (e) { /* połączenie mogło już nie istnieć */ }
        }
        res.status(500).json({ error: error.message, ...results });
    }
}
