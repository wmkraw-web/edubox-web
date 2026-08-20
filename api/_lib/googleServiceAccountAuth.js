// Zamienia klucz konta usługi Google (JSON) na token dostępu (access token) do wywoływania API
// Google (np. Arkuszy) - metodą "JWT Bearer" (RFC 7523), używając TYLKO wbudowanego modułu crypto
// Node.js i fetch. Napisane ręcznie zamiast używać paczki "googleapis" celowo - ta paczka ciągnie za
// sobą klientów do WSZYSTKICH usług Google (Drive, Calendar, YouTube, ...), co napompowało bundle
// funkcji serverless do ~34 MB i najprawdopodobniej powodowało awarię przy starcie na Vercelu
// ("FUNCTION_INVOCATION_FAILED" bez żadnego innego opisu błędu - sprawdzone lokalnie 20.08.2026:
// ten sam kod z "googleapis" ważył 34 MB, bez niej funkcja jest o rząd wielkości mniejsza).
function base64url(input) {
    return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getServiceAccountAccessToken(credentials, scope) {
    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const claimSet = base64url(JSON.stringify({
        iss: credentials.client_email,
        scope,
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
    }));

    const crypto = await import('crypto');
    const signatureInput = `${header}.${claimSet}`;
    const signature = crypto
        .createSign('RSA-SHA256')
        .update(signatureInput)
        .sign(credentials.private_key, 'base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const jwt = `${signatureInput}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt
        })
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(`Błąd autoryzacji konta usługi: ${data.error_description || data.error || res.status}`);
    }
    return data.access_token;
}

module.exports = { getServiceAccountAccessToken };
