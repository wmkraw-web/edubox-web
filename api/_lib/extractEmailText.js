// Wyciąga czysty tekst (text/plain) z surowej wiadomości e-mail (format RFC822/MIME), pobranej przez
// IMAP. Napisane ręcznie (zamiast biblioteki "mailparser") celowo - mailparser ciągnie za sobą
// zależności z aktualnie znanymi podatnościami bezpieczeństwa. Obsługuje to, czego faktycznie
// potrzebujemy: proste wiadomości oraz multipart/alternative z quoted-printable (typowe dla maili
// transakcyjnych, w tym z Buycoffee.to) - NIE jest to pełny, zgodny z RFC parser MIME.

function decodeQuotedPrintable(str) {
    // Miękkie złamania linii ("=" na końcu linii) oznaczają "kontynuacja bez prawdziwego \n" - usuwamy je.
    const joined = str.replace(/=\r?\n/g, '');
    // Zamieniamy sekwencje "=XX" (szesnastkowe) na bajty, potem dekodujemy całość jako UTF-8.
    const bytes = [];
    for (let i = 0; i < joined.length; i++) {
        if (joined[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(joined.slice(i + 1, i + 3))) {
            bytes.push(parseInt(joined.slice(i + 1, i + 3), 16));
            i += 2;
        } else {
            bytes.push(joined.charCodeAt(i));
        }
    }
    return Buffer.from(bytes).toString('utf-8');
}

function decodePart(headers, body) {
    const encodingMatch = headers.match(/Content-Transfer-Encoding:\s*(\S+)/i);
    const encoding = encodingMatch ? encodingMatch[1].toLowerCase() : '7bit';

    if (encoding === 'quoted-printable') return decodeQuotedPrintable(body);
    if (encoding === 'base64') return Buffer.from(body.replace(/\s+/g, ''), 'base64').toString('utf-8');
    return body; // 7bit / 8bit / brak - już czysty tekst
}

function splitHeadersAndBody(chunk) {
    const idx = chunk.search(/\r?\n\r?\n/);
    if (idx === -1) return { headers: '', body: chunk };
    const sep = chunk.slice(idx).match(/\r?\n\r?\n/)[0];
    return { headers: chunk.slice(0, idx), body: chunk.slice(idx + sep.length) };
}

function stripHtmlTags(html) {
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/[ \t]+/g, ' ')
        .trim();
}

function extractEmailText(rawSource) {
    const full = Buffer.isBuffer(rawSource) ? rawSource.toString('utf-8') : String(rawSource || '');
    const { headers: topHeaders, body: topBody } = splitHeadersAndBody(full);

    const contentTypeMatch = topHeaders.match(/Content-Type:\s*([^\r\n]+(?:\r?\n[ \t][^\r\n]+)*)/i);
    const contentType = contentTypeMatch ? contentTypeMatch[1].replace(/\r?\n[ \t]/g, ' ') : 'text/plain';

    if (!/multipart\//i.test(contentType)) {
        // Wiadomość jednoczęściowa - cała treść to jedna część.
        return decodePart(topHeaders, topBody).trim();
    }

    const boundaryMatch = contentType.match(/boundary="?([^";\r\n]+)"?/i);
    if (!boundaryMatch) return topBody.trim();
    const boundary = boundaryMatch[1];
    const escaped = boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rawParts = topBody.split(new RegExp(`--${escaped}(?:--)?\\r?\\n?`)).filter(p => p.trim());

    let htmlFallback = null;
    for (const rawPart of rawParts) {
        const { headers, body } = splitHeadersAndBody(rawPart);
        if (/Content-Type:\s*text\/plain/i.test(headers)) {
            return decodePart(headers, body).trim();
        }
        if (/Content-Type:\s*text\/html/i.test(headers) && htmlFallback === null) {
            htmlFallback = stripHtmlTags(decodePart(headers, body));
        }
    }
    return htmlFallback || '';
}

module.exports = { extractEmailText };
