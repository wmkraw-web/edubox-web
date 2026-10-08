// Czcionki z Google Fonts muszą mieć polskie znaki (podzbiór latin-ext: ą ć ę ł ń ś ź ż).
// Comic Neue i Satisfy mają tylko „latin” – telefon brał polskie litery z innej czcionki (EduTik: „Kajdy”, „zak/ada”).
// Lista poniżej to rodziny sprawdzone w API Google Fonts (css2, podzbiory) 8.10.2026. Nowa czcionka = najpierw
// sprawdź, czy w odpowiedzi https://fonts.googleapis.com/css2?family=Nazwa jest blok /* latin-ext */, potem dopisz.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const POLISH_OK = new Set([
  'Plus Jakarta Sans', 'Inter', 'Playfair Display', 'Lora', 'Outfit', 'Nunito', 'Caveat', 'Baloo 2', 'Pacifico',
  'Fredoka', 'Montserrat', 'Dancing Script', 'Amatic SC', 'Space Grotesk', 'Roboto', 'Oswald', 'Kalam', 'Bangers',
  'Quicksand', 'Patrick Hand', 'Merriweather', 'Lobster', 'Lexend', 'Cinzel', 'Balsamiq Sans', 'Andika', 'Mali',
  'Comfortaa', 'Itim', 'Great Vibes', 'Allura', 'Courgette', 'Kaushan Script', 'Sacramento', 'Parisienne',
  'Indie Flower', 'Architects Daughter'
]);
// Sprawdzone: BEZ polskich znaków – nie używać.
const NO_POLISH = ['Comic Neue', 'Satisfy', 'Gaegu', 'Short Stack', 'Schoolbell', 'Coming Soon', 'Gochi Hand', 'Delius', 'Lobster Two', 'Cookie', 'Tangerine'];

const files = fs.readdirSync(ROOT).filter(f => /\.(html|css)$/.test(f));
let ok = 0, fail = 0;
const problems = [];
for (const f of files) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/&amp;/g, '&');
  for (const m of src.matchAll(/fonts\.googleapis\.com\/css2?\?([^"')\s]+)/g)) {
    for (const part of m[1].split('&')) {
      const fam = (part.match(/^family=([^:]+)/) || [])[1];
      if (!fam) continue;
      const name = decodeURIComponent(fam.replace(/\+/g, ' '));
      if (POLISH_OK.has(name)) ok++;
      else { fail++; problems.push(`${f}: „${name}” ${NO_POLISH.includes(name) ? 'NIE MA polskich znaków' : 'niesprawdzona – sprawdź latin-ext i dopisz do listy'}`); }
    }
  }
  // Nazwa czcionki bez polskich znaków wpisana w CSS/JS (np. font-family: 'Comic Neue') – poza komentarzami
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  for (const bad of NO_POLISH) {
    if (new RegExp(`font-family:[^;}\\n]*['"]${bad}['"]|['"]${bad}['"]\\s*,\\s*['"]?(?:cursive|sans-serif|serif)|name: '${bad}'`).test(code)) {
      fail++; problems.push(`${f}: w kodzie użyto czcionki „${bad}” (bez polskich znaków)`);
    }
  }
}
for (const p of problems) console.log('❌ ' + p);
console.log(`[Czcionki] ${ok} odwołań do czcionek z polskimi znakami, ${fail} problemów`);
process.exit(fail ? 1 : 0);
