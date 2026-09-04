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

const MAKE_PANEL_CACHE_MS = 5 * 60 * 1000;
const makePanelCache = { expiresAt: 0, payload: null };

// Panel śledzi wyłącznie automaty związane z publikacją EduBox. Lista jest jawna,
// żeby prywatne/testowe scenariusze nie pojawiały się przypadkiem w interfejsie.
const MAKE_PANEL_SCENARIOS = [
    { id: 5300571, channel: 'facebook', label: 'Facebook — posty ogólne' },
    { id: 6941268, channel: 'facebook', label: 'Facebook — wrześniowe problemy' },
    { id: 6113587, channel: 'facebook', label: 'Facebook — wrześniowe wyzwania' },
    { id: 7117334, channel: 'facebook', label: 'Facebook — powrót do szkoły' },
    { id: 5327390, channel: 'pinterest', label: 'Pinterest — posty ogólne' },
    { id: 5333588, channel: 'pinterest', label: 'Pinterest — Leonardo' },
    { id: 6114985, channel: 'pinterest', label: 'Pinterest — wrześniowe wyzwania' },
    { id: 6941310, channel: 'pinterest', label: 'Pinterest — wrześniowe problemy' },
    { id: 7117407, channel: 'pinterest', label: 'Pinterest — powrót do szkoły' },
    { id: 6943601, channel: 'youtube', label: 'YouTube — wrześniowe bóle' },
    { id: 7117339, channel: 'youtube', label: 'YouTube — powrót do szkoły' },
    { id: 7048286, channel: 'youtube', label: 'Minuta z Adą', manual: true },
];

function decodeBasicAuth(header = '') {
    if (!header.startsWith('Basic ')) return null;
    try {
        const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
        const separator = decoded.indexOf(':');
        if (separator < 0) return null;
        return { user: decoded.slice(0, separator), pass: decoded.slice(separator + 1) };
    } catch (_) {
        return null;
    }
}

function isPanelAuthorized(req) {
    const credentials = decodeBasicAuth(req.headers.authorization || '');
    return Boolean(
        credentials &&
        process.env.EWA_AUTH_USER &&
        process.env.EWA_AUTH_PASS &&
        credentials.user === process.env.EWA_AUTH_USER &&
        credentials.pass === process.env.EWA_AUTH_PASS
    );
}

async function fetchMake(path, token, zone) {
    const response = await fetch(`https://${zone}/api/v2${path}`, {
        method: 'GET',
        headers: {
            Authorization: `Token ${token}`,
            Accept: 'application/json',
        },
        signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
        const error = new Error(`Make API zwróciło HTTP ${response.status}.`);
        error.status = response.status;
        throw error;
    }
    return response.json();
}

function normalizeMakeStatus(scenario, lastRun, tracked) {
    if (!scenario) return { level: 'error', label: 'Nie znaleziono' };
    if (!scenario.isActive && !tracked.manual) return { level: 'error', label: 'Wyłączony' };
    if (!lastRun) return { level: tracked.manual ? 'neutral' : 'warning', label: tracked.manual ? 'Ręczny' : 'Brak historii' };
    if (Number(lastRun.status) === 3) return { level: 'error', label: 'Ostatnio błąd' };
    if (Number(lastRun.status) === 2) return { level: 'warning', label: 'Ostatnio ostrzeżenie' };
    if (Number(scenario.incompleteExecutions || 0) > 0) return { level: 'warning', label: 'Wymaga uwagi' };
    return { level: 'ok', label: tracked.manual ? 'Gotowy ręcznie' : 'Działa' };
}

async function buildMakePanelPayload() {
    if (makePanelCache.payload && makePanelCache.expiresAt > Date.now()) return makePanelCache.payload;

    const token = process.env.MAKE_API_TOKEN;
    const teamId = Number(process.env.MAKE_TEAM_ID || 1469669);
    const zone = String(process.env.MAKE_ZONE || 'eu1.make.com').replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!token) {
        const error = new Error('Panel czeka na dodanie MAKE_API_TOKEN w ustawieniach Vercel.');
        error.code = 'MAKE_NOT_CONFIGURED';
        throw error;
    }

    const scenarioData = await fetchMake(`/scenarios?teamId=${teamId}&pg%5Blimit%5D=100`, token, zone);
    const scenarios = Array.isArray(scenarioData.scenarios) ? scenarioData.scenarios : [];
    const byId = new Map(scenarios.map(item => [Number(item.id), item]));

    const items = await Promise.all(MAKE_PANEL_SCENARIOS.map(async tracked => {
        const scenario = byId.get(tracked.id);
        let lastRun = null;
        let historyError = null;
        if (scenario) {
            try {
                const logData = await fetchMake(`/scenarios/${tracked.id}/logs?pg%5Blimit%5D=7&pg%5BsortDir%5D=desc&showCheckRuns=true`, token, zone);
                lastRun = Array.isArray(logData.scenarioLogs) ? logData.scenarioLogs[0] || null : null;
            } catch (error) {
                historyError = error.message;
            }
        }

        const health = historyError
            ? { level: 'warning', label: 'Historia niedostępna' }
            : normalizeMakeStatus(scenario, lastRun, tracked);

        return {
            id: tracked.id,
            name: scenario?.name || tracked.label,
            label: tracked.label,
            channel: tracked.channel,
            manual: Boolean(tracked.manual),
            isActive: Boolean(scenario?.isActive),
            health,
            incompleteExecutions: Number(scenario?.incompleteExecutions || 0),
            lastRun: lastRun ? {
                id: String(lastRun.id || ''),
                timestamp: lastRun.timestamp || null,
                status: Number(lastRun.status || 0),
                duration: Number(lastRun.duration || 0),
                operations: Number(lastRun.operations || 0),
            } : null,
            nextExecution: scenario?.nextExec || null,
            historyError,
        };
    }));

    const payload = {
        updatedAt: new Date().toISOString(),
        cacheSeconds: MAKE_PANEL_CACHE_MS / 1000,
        makeUrl: `https://${zone}/`,
        summary: {
            total: items.length,
            ok: items.filter(item => item.health.level === 'ok').length,
            warning: items.filter(item => item.health.level === 'warning').length,
            error: items.filter(item => item.health.level === 'error').length,
            incomplete: items.reduce((sum, item) => sum + item.incompleteExecutions, 0),
        },
        scenarios: items,
    };

    makePanelCache.payload = payload;
    makePanelCache.expiresAt = Date.now() + MAKE_PANEL_CACHE_MS;
    return payload;
}

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
    if (req.method === 'GET' && req.query.view === 'make-health') {
        if (!isPanelAuthorized(req)) {
            res.setHeader('WWW-Authenticate', 'Basic realm="Prywatny panel EduBox"');
            return res.status(401).json({ error: 'Autoryzacja wymagana.' });
        }
        try {
            const payload = await buildMakePanelPayload();
            res.setHeader('Cache-Control', 'private, no-store');
            return res.status(200).json(payload);
        } catch (error) {
            console.error('Błąd panelu Make:', error.message);
            const status = error.code === 'MAKE_NOT_CONFIGURED' ? 503 : 502;
            return res.status(status).json({ error: error.message, code: error.code || 'MAKE_API_ERROR' });
        }
    }

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
