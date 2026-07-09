const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Konfiguracja Twojej domeny
const BASE_URL = 'https://eduboxpro.pl';
const directoryPath = path.join(__dirname);

function formatTitle(filename) {
    const name = filename.replace('.html', '');
    return name.charAt(0).toUpperCase() + name.slice(1);
}

fs.readdir(directoryPath, (err, files) => {
    if (err) return console.log('Błąd podczas skanowania folderu: ' + err);

    // Wybieramy tylko pliki HTML, odrzucając pliki testowe jeśli chcesz (np. test-edubiurokrata.html)
    const htmlFiles = files.filter(file => file.endsWith('.html') && !file.startsWith('test-'));
    console.log(`\nRozpoczynam audyt SEO dla ${htmlFiles.length} plików HTML...`);

    let updatedFilesCount = 0;
    const sitemapLinks = [];
    const todayDate = new Date().toISOString().split('T')[0]; // Format: RRRR-MM-DD

    htmlFiles.forEach(file => {
        const filePath = path.join(directoryPath, file);
        const htmlData = fs.readFileSync(filePath, 'utf8');
        const $ = cheerio.load(htmlData);
        let fileWasModified = false;

        // --- 1. AUDYT I NAPRAWA SEO (Wersja 1.0) ---
        
        // Tytuł
        const titleTag = $('head title');
        if (titleTag.length === 0 || titleTag.text().trim() === '') {
            const newTitle = `${formatTitle(file)} - EduBox AI`;
            if (titleTag.length === 0) {
                $('head').append(`\n  <title>${newTitle}</title>`);
            } else {
                titleTag.text(newTitle);
            }
            fileWasModified = true;
        }

        // Canonical
        if ($('link[rel="canonical"]').length === 0) {
            $('head').append(`\n  <link rel="canonical" href="${BASE_URL}/${file}" />`);
            fileWasModified = true;
        }

        // Meta Description
        if ($('meta[name="description"]').length === 0) {
            const desc = `Poznaj ${formatTitle(file)} - nowoczesne narzędzie edukacyjne dostępne w platformie EduBox AI.`;
            $('head').append(`\n  <meta name="description" content="${desc}" />`);
            fileWasModified = true;
        }

        // Favicon
        if ($('link[rel="icon"]').length === 0) {
            $('head').append(`\n  <link rel="icon" href="/favicon.ico" type="image/x-icon" />`);
            fileWasModified = true;
        }

        // Jeśli były poprawki, zapisujemy plik HTML
        if (fileWasModified) {
            fs.writeFileSync(filePath, $.html(), 'utf8');
            updatedFilesCount++;
        }

        // --- 2. ZBIERANIE DANYCH DO SITEMAP.XML ---
        // Jeśli plik to index.html, kierujemy na główną domenę. Dla reszty podajemy pełną nazwę pliku.
        const urlPath = file === 'index.html' ? '' : file;
        const priority = file === 'index.html' ? '1.0' : '0.8';
        const changefreq = file === 'index.html' ? 'daily' : 'weekly';

        sitemapLinks.push(`  <url>
    <loc>${BASE_URL}/${urlPath}</loc>
    <lastmod>${todayDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`);
    });

    console.log(`[OK] SEO sprawdzone. Zaktualizowano ${updatedFilesCount} plików HTML.`);

    // --- 3. GENEROWANIE SITEMAP.XML ---
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapLinks.join('\n')}
</urlset>`;

    fs.writeFileSync(path.join(directoryPath, 'sitemap.xml'), sitemapContent, 'utf8');
    console.log(`[GENEROWANIE] Utworzono plik sitemap.xml zawierający ${sitemapLinks.length} adresów.`);

    // --- 4. GENEROWANIE ROBOTS.TXT ---
    const robotsContent = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;

    fs.writeFileSync(path.join(directoryPath, 'robots.txt'), robotsContent, 'utf8');
    console.log(`[GENEROWANIE] Utworzono / zaktualizowano plik robots.txt.`);
    
    console.log('\n==================================================');
    console.log('Sukces! Twoja platforma jest w pełni gotowa pod Google.');
    console.log('==================================================\n');
});