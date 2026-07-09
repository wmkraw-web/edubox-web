@echo off
:: Ustawienie kodowania znaków na UTF-8, żeby polskie litery wyświetlały się poprawnie
chcp 65001 >nul
title EduBox AI - Panel Automatyzacji SEO v3.0
cls

echo ======================================================================
echo          EDUBOX AI (eduboxpro.pl) - AUTOMATYZAJA SEO v3.0             
echo ======================================================================
echo.
echo  [SYSTEM] Sprawdzam pliki HTML, naprawiam meta-tagi i generuje sitemape...
echo  [SYSTEM] Proszę czekać, to zajmie tylko chwilę...
echo.
echo ----------------------------------------------------------------------

:: Uruchomienie naszego skryptu Node.js
node seo-automator.js

echo ----------------------------------------------------------------------
echo.
echo  [OK] Wszystkie zadania zostały wykonane pomyślnie!
echo  [INFO] Możesz teraz bezpiecznie zamknąć to okno.
echo.
echo ======================================================================
pause