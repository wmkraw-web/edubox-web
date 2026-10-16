// Ścieżki obrazków podglądu w Bazie Materiałów. Podgląd jest PUBLICZNY (bez kodu PRO), więc
// endpoint może oddać wyłącznie pliki z katalogu podglady/ o ściśle określonej nazwie – nigdy
// pliki pakietów (materialy/…), które są dostępne tylko z ważnym kodem.
const PREVIEW_PATH = /^podglady\/[A-Za-z0-9_-]{1,80}\.jpg$/;

function isPreviewPath(path) {
  return typeof path === 'string' && PREVIEW_PATH.test(path);
}

// Wgrywać można tylko do dwóch katalogów: pliki pakietów i obrazki podglądu.
function isUploadPath(path) {
  return typeof path === 'string'
    && !path.includes('..')
    && (/^materialy\/[^/]{1,200}$/.test(path) || isPreviewPath(path));
}

module.exports = { PREVIEW_PATH, isPreviewPath, isUploadPath };
