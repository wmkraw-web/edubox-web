'use strict';

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const root = path.resolve(__dirname, '..');
const htmlFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.toLowerCase().endsWith('.html')) htmlFiles.push(full);
  }
}

walk(root);
let scriptsChecked = 0;
const errors = [];

for (const file of htmlFiles.sort()) {
  const html = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const scripts = [...html.matchAll(/<script\b(?=[^>]*\btype=["']text\/babel["'])[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [index, match] of scripts.entries()) {
    scriptsChecked += 1;
    try {
      babel.transformSync(match[1], {
        filename: `${relative}#babel-${index + 1}.jsx`,
        presets: ['@babel/preset-react'],
        sourceType: 'unambiguous',
        babelrc: false,
        configFile: false,
      });
    } catch (error) {
      errors.push(`${relative} (skrypt ${index + 1}): ${error.message}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`[JSX] Znaleziono ${errors.length} błędów składni:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`[JSX] OK — sprawdzono ${scriptsChecked} skryptów text/babel w ${htmlFiles.length} plikach HTML.`);
}
