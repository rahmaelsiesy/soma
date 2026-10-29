#!/usr/bin/env node
// Builds a sellable edition of Soma into dist/<edition>/ plus
// dist/soma-<edition>.zip.
//
//   node tools/build-edition.mjs            # starter edition
//   node tools/build-edition.mjs <edition>  # any folder under editions/
//
// The app code (index.html, app.js, style.css, sw.js, icons) is shared
// with the personal site. editions/<edition>/ supplies data.js (projects
// + SOMA_PROFILE) and the buyer-facing files (README, LICENSE). Personal
// files (the root data.js, protocol_data.js, docs/, the legacy *.html
// pages, state.json, snapshots/) are never copied, and the build stops if
// a personal marker turns up in the output anyway.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const edition = process.argv[2] || 'starter';
const src = join(root, 'editions', edition);
if (!existsSync(join(src, 'data.js'))) {
  console.error(`editions/${edition}/data.js not found`);
  process.exit(1);
}

const out = join(root, 'dist', edition);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const APP_FILES = ['app.js', 'style.css', 'sw.js', 'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png'];
for (const f of APP_FILES) cpSync(join(root, f), join(out, f));

// Edition files win over shared ones (e.g. an edition may ship its own
// manifest.json or a protocol_data.js).
for (const f of readdirSync(src)) cpSync(join(src, f), join(out, f), { recursive: true });

// index.html: drop the lab-protocol script unless this edition ships one.
let html = readFileSync(join(root, 'index.html'), 'utf8');
if (!existsSync(join(src, 'protocol_data.js'))) {
  html = html.replace(/\n\s*<script src="protocol_data\.js"><\/script>/, '');
}
writeFileSync(join(out, 'index.html'), html);

// Guard against shipping personal data.
const PERSONAL_MARKERS = ['rahmaelsiesy', 'Rahma', 'Caltech', 'seqFISH', 'Braak'];
const leaks = [];
const scan = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { scan(p); continue; }
    if (!/\.(js|mjs|html|css|json|txt|md|svg)$/.test(f)) continue;
    const text = readFileSync(p, 'utf8');
    for (const m of PERSONAL_MARKERS) if (text.includes(m)) leaks.push(`${p.slice(out.length + 1)}: "${m}"`);
  }
};
scan(out);
if (leaks.length) {
  console.error('Build stopped, personal markers found:\n  ' + leaks.join('\n  '));
  process.exit(1);
}

const zipPath = join(root, 'dist', `soma-${edition}.zip`);
rmSync(zipPath, { force: true });
try {
  execFileSync('zip', ['-qr', zipPath, '.'], { cwd: out });
  console.log(`Built dist/${edition}/ and dist/soma-${edition}.zip`);
} catch (e) {
  console.log(`Built dist/${edition}/ (zip skipped: install the zip command to package it)`);
}
