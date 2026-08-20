// Wyciąga czysty tekst (plain text) z surowej wiadomości e-mail w formacie RFC822 (nagłówki + treść),
// takiej jaką zwraca IMAP przy pobieraniu pełnej wiadomości. Obsługuje zarówno proste wiadomości
// tekstowe, jak i wieloczęściowe (multipart) - w tym zagnieżdżone multipart/alternative.
// CZYSTA funkcja (brak zależności od sieci) - w pełni testowalna lokalnie, patrz
// extractEmailText.test.js.
function decodeQuotedPrintable(str) {
    return str
        .replace(/=\r?\n/g, '') // znak "miękkiego" złamania linii - usuwamy
        .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function decodeBody(body, encoding) {
    const enc = (encoding || '').toLowerCase().trim();
    if (enc === 'base64') {
        try {
            return Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf-8');
        } catch (e) {
            return body;
        }
    }
    if (enc === 'quoted-printable') {
        return Buffer.from(decodeQuotedPrintable(body), 'latin1').toString('utf-8');
    }
    return body;
}

function stripHtml(html) {
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'");
}

function parseHeaders(block) {
    const headers = {};
    // Nagłówki mogą się zawijać na kolejne linie zaczynające się spacją/tabem - łączymy je z powrotem.
    const unfolded = block.replace(/\r?\n[ \t]+/g, ' ');
    unfolded.split(/\r?\n/).forEach(line => {
        const idx = line.indexOf(':');
        if (idx === -1) return;
        const name = line.slice(0, idx).trim().toLowerCase();
        const value = line.slice(idx + 1).trim();
        headers[name] = value;
    });
    return headers;
}

function splitHeadersAndBody(raw) {
    const idx = raw.search(/\r?\n\r?\n/);
    if (idx === -1) return { headers: parseHeaders(raw), body: '' };
    const headerBlock = raw.slice(0, idx);
    const body = raw.slice(idx).replace(/^\r?\n\r?\n/, '');
    return { headers: parseHeaders(headerBlock), body };
}

function getBoundary(contentType) {
    const match = /boundary="?([^";]+)"?/i.exec(contentType || '');
    return match ? match[1] : null;
}

// Rekurencyjnie przeszukuje część MIME (i jej pod-części, jeśli sama jest multipart) w poszukiwaniu
// najlepszego tekstu do wyciągnięcia: text/plain ma pierwszeństwo, text/html jako fallback.
function findBestText(headers, body) {
    const contentType = headers['content-type'] || 'text/plain';

    if (/multipart\//i.test(contentType)) {
        const boundary = getBoundary(contentType);
        if (!boundary) return null;
        const parts = body.split(`--${boundary}`).slice(1, -1); // pierwszy i ostatni fragment to preambuła/epilog
        let plainResult = null;
        let htmlResult = null;
        for (const part of parts) {
            const { headers: partHeaders, body: partBody } = splitHeadersAndBody(part);
            const result = findBestText(partHeaders, partBody);
            if (!result) continue;
            if (result.isHtml && !htmlResult) htmlResult = result;
            if (!result.isHtml && !plainResult) plainResult = result;
        }
        return plainResult || htmlResult;
    }

    if (/text\/plain/i.test(contentType)) {
        const encoding = headers['content-transfer-encoding'];
        return { text: decodeBody(body, encoding), isHtml: false };
    }
    if (/text\/html/i.test(contentType)) {
        const encoding = headers['content-transfer-encoding'];
        return { text: stripHtml(decodeBody(body, encoding)), isHtml: true };
    }
    return null;
}

function extractEmailText(rawSource) {
    if (!rawSource) return '';
    const raw = typeof rawSource === 'string' ? rawSource : rawSource.toString('utf-8');
    const { headers, body } = splitHeadersAndBody(raw);
    const result = findBestText(headers, body);
    return result ? result.text.trim() : '';
}

module.exports = { extractEmailText };
