// Testuje budowanie i podpisywanie JWT (RFC 7523) BEZ łączenia się z prawdziwym Google (fetch jest
// tu podmieniony na atrapę przechwytującą żądanie) - generujemy własną parę kluczy RSA i sprawdzamy,
// że podpis JWT faktycznie weryfikuje się kluczem publicznym. To sprawdza całą logikę kryptograficzną
// bez potrzeby prawdziwych danych logowania Google.
const assert = require('assert');
const crypto = require('crypto');
const { getServiceAccountAccessToken } = require('./googleServiceAccountAuth');

let passed = 0;
let failed = 0;

function test(name, fn) {
    return fn()
        .then(() => { console.log(`✅ ${name}`); passed++; })
        .catch(e => { console.log(`❌ ${name}`); console.log(`   ${e.message}`); failed++; });
}

function base64urlToBuffer(str) {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4);
    return Buffer.from(padded, 'base64');
}

async function run() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    const fakeCredentials = { client_email: 'test@example.iam.gserviceaccount.com', private_key: privateKey };

    await test('Buduje poprawnie sformowany, podpisany JWT i wysyła go do endpointu tokena', async () => {
        const originalFetch = globalThis.fetch;
        let capturedBody = null;
        globalThis.fetch = async (url, options) => {
            assert.strictEqual(url, 'https://oauth2.googleapis.com/token');
            capturedBody = options.body;
            return { ok: true, json: async () => ({ access_token: 'FAKE_TOKEN', expires_in: 3600 }) };
        };

        try {
            const token = await getServiceAccountAccessToken(fakeCredentials, 'https://www.googleapis.com/auth/spreadsheets');
            assert.strictEqual(token, 'FAKE_TOKEN');

            const params = new URLSearchParams(capturedBody.toString());
            assert.strictEqual(params.get('grant_type'), 'urn:ietf:params:oauth:grant-type:jwt-bearer');
            const jwt = params.get('assertion');
            assert.ok(jwt, 'Brak "assertion" (JWT) w treści żądania');

            const [headerB64, claimsB64, signatureB64] = jwt.split('.');
            const header = JSON.parse(base64urlToBuffer(headerB64).toString('utf-8'));
            assert.strictEqual(header.alg, 'RS256');
            assert.strictEqual(header.typ, 'JWT');

            const claims = JSON.parse(base64urlToBuffer(claimsB64).toString('utf-8'));
            assert.strictEqual(claims.iss, fakeCredentials.client_email);
            assert.strictEqual(claims.scope, 'https://www.googleapis.com/auth/spreadsheets');
            assert.strictEqual(claims.aud, 'https://oauth2.googleapis.com/token');
            assert.ok(claims.exp > claims.iat, 'exp powinno być późniejsze niż iat');

            // Kluczowy test: podpis MUSI weryfikować się kluczem publicznym odpowiadającym
            // wygenerowanemu wyżej kluczowi prywatnemu - to dowód, że podpisywanie działa poprawnie.
            const signatureInput = `${headerB64}.${claimsB64}`;
            const isValid = crypto.createVerify('RSA-SHA256').update(signatureInput).verify(publicKey, base64urlToBuffer(signatureB64));
            assert.strictEqual(isValid, true, 'Podpis JWT nie weryfikuje się kluczem publicznym');
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    await test('Rzuca czytelny błąd, gdy Google odrzuci żądanie', async () => {
        const originalFetch = globalThis.fetch;
        globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: 'invalid_grant', error_description: 'Bad key' }) });
        try {
            await assert.rejects(
                () => getServiceAccountAccessToken(fakeCredentials, 'https://www.googleapis.com/auth/spreadsheets'),
                /Bad key/
            );
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    console.log(`\n${passed} zaliczone, ${failed} niezaliczone`);
    if (failed > 0) process.exit(1);
}

run();
