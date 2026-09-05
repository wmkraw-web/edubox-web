// Prywatny, wyłącznie do odczytu, panel statystyk WŁASNYCH kont w mediach społecznościowych.
// Na start: Pinterest. Docelowo Facebook i YouTube pod tym samym endpointem przez ?platform=...
// (dokładnie ten sam wzorzec co /api/weekly-report?view=make-health - jeden endpoint, wybór
// trybu przez parametr, żeby nie mnożyć funkcji Vercel ponad limit 12).
//
// BEZPIECZEŃSTWO: token dostawcy (Pinterest itd.) jest używany WYŁĄCZNIE tutaj, po stronie
// serwera - nigdy nie trafia do przeglądarki. Dostęp do samego endpointu jest podwójnie
// zabezpieczony: middleware.js blokuje ścieżkę Basic Authem, a funkcja i tak sama weryfikuje
// login/hasło (na wypadek błędu konfiguracji matchera w middleware).
//
// WYMAGANE ZMIENNE ŚRODOWISKOWE:
//   EWA_AUTH_USER / EWA_AUTH_PASS   - już ustawione (to samo logowanie co inne prywatne panele)
//   PINTEREST_ACCESS_TOKEN          - NOWA, token z developers.pinterest.com (Wygeneruj token)

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
    if (!credentials) return false;
    return credentials.user === process.env.EWA_AUTH_USER && credentials.pass === process.env.EWA_AUTH_PASS;
}

function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

// Pobiera profil, ostatnie piny i (jeśli dostęp konta na to pozwala) zbiorczą analitykę
// z ostatnich 30 dni. Analityka jest "nice to have" - jej brak/błąd (typowy przy dostępie
// próbnym/ograniczonym) nie blokuje reszty panelu, tylko pomija tę sekcję.
async function fetchPinterestStats() {
    const token = process.env.PINTEREST_ACCESS_TOKEN;
    if (!token) throw new Error('Brak PINTEREST_ACCESS_TOKEN w zmiennych środowiskowych Vercela.');
    const headers = { Authorization: `Bearer ${token}` };

    const accountRes = await fetch('https://api.pinterest.com/v5/user_account', { headers });
    if (!accountRes.ok) {
        const detail = await accountRes.text().catch(() => '');
        throw new Error(`Pinterest: nie udało się pobrać konta (HTTP ${accountRes.status}). ${detail}`.trim());
    }
    const account = await accountRes.json();

    const pinsRes = await fetch('https://api.pinterest.com/v5/pins?page_size=25', { headers });
    if (!pinsRes.ok) {
        const detail = await pinsRes.text().catch(() => '');
        throw new Error(`Pinterest: nie udało się pobrać pinów (HTTP ${pinsRes.status}). ${detail}`.trim());
    }
    const pinsData = await pinsRes.json();
    const pins = Array.isArray(pinsData.items) ? pinsData.items : [];

    let analytics = null;
    let analyticsError = null;
    try {
        const end = new Date();
        const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        const url = `https://api.pinterest.com/v5/user_account/analytics?start_date=${formatDate(start)}&end_date=${formatDate(end)}&metric_types=IMPRESSION,SAVE,PIN_CLICK,OUTBOUND_CLICK`;
        const analyticsRes = await fetch(url, { headers });
        if (analyticsRes.ok) {
            analytics = await analyticsRes.json();
        } else {
            analyticsError = `Analityka konta niedostępna (HTTP ${analyticsRes.status}) - typowe przy dostępie próbnym/ograniczonym Pinteresta.`;
        }
    } catch (error) {
        analyticsError = 'Analityka konta chwilowo niedostępna: ' + error.message;
    }

    return {
        platform: 'pinterest',
        account: {
            username: account.username || null,
            profileImage: account.profile_image || null,
            followers: typeof account.follower_count === 'number' ? account.follower_count : null,
        },
        pins: pins.map((pin) => ({
            id: pin.id,
            title: pin.title || pin.grid_title || '(bez tytułu)',
            link: pin.link || null,
            createdAt: pin.created_at || null,
            media: pin.media?.images?.['400x300']?.url || pin.media?.images?.['150x150']?.url || null,
            pinUrl: `https://www.pinterest.com/pin/${pin.id}/`,
        })),
        analytics,
        analyticsError,
        updatedAt: new Date().toISOString(),
    };
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Metoda niedozwolona' });
    }
    if (!isPanelAuthorized(req)) {
        return res.status(401).json({ error: 'Niepoprawny login lub hasło.' });
    }

    const platform = req.query.platform || 'pinterest';
    try {
        if (platform === 'pinterest') {
            const data = await fetchPinterestStats();
            return res.status(200).json(data);
        }
        return res.status(400).json({ error: `Nieobsługiwana platforma: ${platform}` });
    } catch (error) {
        console.error('social-stats error:', error);
        return res.status(500).json({ error: error.message });
    }
}
