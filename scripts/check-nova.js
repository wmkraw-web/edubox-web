'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const chatApi = fs.readFileSync(path.join(root, 'api', 'chat.js'), 'utf8');

assert.match(index, /const openJourney = async \(journey\)/, 'szybkie ścieżki NOVY powinny pobierać pełną odpowiedź asynchronicznie');
const journeyHandler = index.match(/const openJourney = async \(journey\) => \{([\s\S]*?)\n\s*const trackNovaAppClick/)?.[1] || '';
assert.match(journeyHandler, /await askNovaAI\(/, 'szybkie ścieżki powinny korzystać z rozmowy AI');
assert.match(journeyHandler, /messages,\s*journeyApps/, 'pełna porada ścieżki powinna opisywać tylko widoczne pod nią kafelki');
assert.match(journeyHandler, /matchedApps = \[\.\.\.journeyApps/, 'kafelki wybranej ścieżki powinny pozostać pod pełną odpowiedzią');
assert.match(index, /Kafelki są dodatkiem do pełnej porady, a nie jej zamiennikiem/, 'instrukcja NOVY musi chronić pełną poradę przed skróceniem do kafelków');
assert.match(index, /zwykle napisz 5–9 zdań/, 'NOVA powinna rozwijać złożone tematy');
assert.match(index, /whitespace-pre-line/, 'akapitowe odpowiedzi NOVY powinny zachowywać podziały wierszy');
assert.match(index, /czystego tekstu bez znaczników Markdown/, 'NOVA nie powinna wyświetlać surowych znaczników Markdown');

const ttsLimit = Number(chatApi.match(/TTS_MAX_TEXT_LENGTH\s*=\s*(\d+)/)?.[1]);
assert.ok(ttsLimit >= 1600, 'limit głosu musi mieścić maksymalną zalecaną długość odpowiedzi NOVY');

console.log('[NOVA] OK — pełne porady, klikalne kafelki i głos mają zgodne limity.');
