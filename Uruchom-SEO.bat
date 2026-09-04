@echo off
chcp 65001 >nul
title EduBox AI - SEO Manager 2.0
cls

echo ======================================================================
echo                 EDUBOX AI - SEO MANAGER 2.0
echo ======================================================================
echo.
echo Ten skrót wykonuje BEZPIECZNY AUDYT. Nie zmienia plików HTML.
echo.

if not exist node_modules\cheerio (
  echo [SYSTEM] Pierwsze uruchomienie - instaluję wymagane składniki...
  call npm ci --no-audit --no-fund
  if errorlevel 1 goto error
)

call npm run seo:check
if errorlevel 1 goto error

echo.
echo [OK] Audyt zakończony bez błędów blokujących.
echo [INFO] Raport znajdziesz w folderze seo-reports.
goto end

:error
echo.
echo [UWAGA] Audyt wykrył błąd. Nic nie zostało automatycznie nadpisane.
echo [INFO] Szczegóły są w folderze seo-reports.

:end
echo.
pause
