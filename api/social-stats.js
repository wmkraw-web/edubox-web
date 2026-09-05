// Prywatny, wyłącznie do odczytu, panel statystyk WŁASNYCH kont w mediach społecznościowych.
// Pinterest + YouTube. Docelowo też Facebook, wszystko pod tym samym endpointem przez
// ?platform=... (dokładnie ten sam wzorzec co /api/weekly-report?view=make-health - jeden
// endpoint, wybór trybu przez parametr, żeby nie mnożyć funkcji Vercel ponad limit 12).
//
// YouTube jest prostszy niż Pinterest: liczby wyświetleń/polubień/komentarzy publicznych
// filmów są dostępne przez zwykły klucz API (YouTube Data API v3), bez OAuth i bez logowania
// się aplikacją na konto - to dane publiczne każdego opublikowanego filmu.
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

// WYMAGANE ZMIENNE ŚRODOWISKOWE (YouTube):
//   YOUTUBE_API_KEY       - klucz z Google Cloud Console (projekt edubox-pro), ograniczony
//                           do "YouTube Data API v3"
//   YOUTUBE_CHANNEL_ID    - ID kanału (ciąg zaczynający się od "UC"), z Ustawień kanału
async function fetchYouTubeStats() {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!apiKey) throw new Error('Brak YOUTUBE_API_KEY w zmiennych środowiskowych Vercela.');
    if (!channelId) throw new Error('Brak YOUTUBE_CHANNEL_ID w zmiennych środowiskowych Vercela.');

    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${encodeURIComponent(channelId)}&key=${apiKey}`;
    const channelRes = await fetch(channelUrl);
    if (!channelRes.ok) {
        const detail = await channelRes.text().catch(() => '');
        throw new Error(`YouTube: nie udało się pobrać kanału (HTTP ${channelRes.status}). ${detail}`.trim());
    }
    const channelData = await channelRes.json();
    const channel = channelData.items && channelData.items[0];
    if (!channel) throw new Error('YouTube: nie znaleziono kanału o podanym ID.');

    let videos = [];
    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
    if (uploadsPlaylistId) {
        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=25&key=${apiKey}`;
        const playlistRes = await fetch(playlistUrl);
        if (playlistRes.ok) {
            const playlistData = await playlistRes.json();
            const items = Array.isArray(playlistData.items) ? playlistData.items : [];
            const videoIds = items.map((item) => item.contentDetails?.videoId).filter(Boolean);

            let statsById = new Map();
            if (videoIds.length) {
                const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.join(',')}&key=${apiKey}`;
                const statsRes = await fetch(statsUrl);
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    statsById = new Map((statsData.items || []).map((video) => [video.id, video.statistics]));
                }
            }

            videos = items.map((item) => {
                const videoId = item.contentDetails?.videoId;
                const stats = statsById.get(videoId);
                return {
                    id: videoId,
                    title: item.snippet?.title || '(bez tytułu)',
                    publishedAt: item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt || null,
                    thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || null,
                    views: stats ? Number(stats.viewCount || 0) : null,
                    likes: stats ? Number(stats.likeCount || 0) : null,
                    comments: stats ? Number(stats.commentCount || 0) : null,
                    url: `https://www.youtube.com/watch?v=${videoId}`,
                };
            });
        }
    }

    return {
        platform: 'youtube',
        account: {
            title: channel.snippet?.title || null,
            thumbnail: channel.snippet?.thumbnails?.default?.url || null,
            subscribers: channel.statistics?.hiddenSubscriberCount ? null : Number(channel.statistics?.subscriberCount || 0),
            totalViews: Number(channel.statistics?.viewCount || 0),
            videoCount: Number(channel.statistics?.videoCount || 0),
        },
        videos,
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
        if (platform === 'youtube') {
            const data = await fetchYouTubeStats();
            return res.status(200).json(data);
        }
        return res.status(400).json({ error: `Nieobsługiwana platforma: ${platform}` });
    } catch (error) {
        console.error('social-stats error:', error);
        return res.status(500).json({ error: error.message });
    }
}
