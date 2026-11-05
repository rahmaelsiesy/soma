#!/usr/bin/env node
// Builds a sellable edition of Soma.
//
//   node tools/build-edition.mjs            # starter edition
//   node tools/build-edition.mjs <edition>  # any folder under editions/
//
// Output:
//   dist/<edition>/            the app, ready to host or zip for buyers
//   dist/soma-<edition>.zip    that folder zipped (the buyer download)
//   dist/<edition>-site/       landing page at the root and the app under
//                              /app/, if the edition has a site/ folder;
//                              upload this folder to your host
//
// The app code (index.html, app.js, style.css, guide.html, sw.js, icons)
// is shared with the personal site. editions/<edition>/ supplies data.js
// (projects + SOMA_PROFILE), buyer-facing files (README, LICENSE),
// edition.json (seller details and licensing, filled into {{tokens}} and
// handed to the app as SOMA_PROFILE.edition) and optionally site/.
// Personal files (the root data.js, protocol_data.js, docs/, the legacy
// *.html pages, state.json, snapshots/) are never copied, and the build
// stops if a personal marker turns up in the output anyway.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, appendFileSync } from 'node:fs';
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

// Seller details and licensing. Every string value is a {{token}}.
const config = existsSync(join(src, 'edition.json'))
  ? JSON.parse(readFileSync(join(src, 'edition.json'), 'utf8'))
  : {};
delete config._readme;
const tokens = { year: String(new Date().getFullYear()) };
for (const [k, v] of Object.entries(config)) if (typeof v === 'string') tokens[k] = v;
const fillTokens = (text) => text.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in tokens ? tokens[k] : m));
const TEXT_FILE = /\.(js|mjs|html|css|json|txt|md|svg)$/;

// Fill {{tokens}} in every text file under a folder, in place.
const fillFolder = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { fillFolder(p); continue; }
    if (!/\.(html|txt|md)$/.test(f)) continue;
    writeFileSync(p, fillTokens(readFileSync(p, 'utf8')));
  }
};

function buildApp(out) {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  const APP_FILES = ['app.js', 'style.css', 'guide.html', 'sw.js', 'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png'];
  for (const f of APP_FILES) cpSync(join(root, f), join(out, f));

  // Edition files win over shared ones (e.g. an edition may ship its own
  // manifest.json or a protocol_data.js). edition.json and site/ are build
  // inputs, not app files.
  for (const f of readdirSync(src)) {
    if (f === 'edition.json' || f === 'site') continue;
    cpSync(join(src, f), join(out, f), { recursive: true });
  }

  // index.html: drop the lab-protocol script unless this edition ships one.
  let html = readFileSync(join(root, 'index.html'), 'utf8');
  if (!existsSync(join(src, 'protocol_data.js'))) {
    html = html.replace(/\n\s*<script src="protocol_data\.js"><\/script>/, '');
  }
  writeFileSync(join(out, 'index.html'), html);

  // Hand the edition config to the app (licensing, buy link, price).
  if (Object.keys(config).length) {
    appendFileSync(join(out, 'data.js'),
      `\n// Added by tools/build-edition.mjs from editions/${edition}/edition.json\nSOMA_PROFILE.edition = ${JSON.stringify(config, null, 2)};\n`);
  }
  fillFolder(out);
}

// Guard against shipping personal data.
const PERSONAL_MARKERS = ['rahmaelsiesy', 'Rahma', 'Caltech', 'seqFISH', 'Braak'];
function scanForLeaks(dir) {
  const leaks = [];
  const scan = (d) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) { scan(p); continue; }
      if (!TEXT_FILE.test(f)) continue;
      const text = readFileSync(p, 'utf8');
      for (const m of PERSONAL_MARKERS) if (text.includes(m)) leaks.push(`${p.slice(dir.length + 1)}: "${m}"`);
    }
  };
  scan(dir);
  if (leaks.length) {
    console.error('Build stopped, personal markers found:\n  ' + leaks.join('\n  '));
    process.exit(1);
  }
}

const out = join(root, 'dist', edition);
buildApp(out);
scanForLeaks(out);

const zipPath = join(root, 'dist', `soma-${edition}.zip`);
rmSync(zipPath, { force: true });
let zipped = false;
try {
  execFileSync('zip', ['-qr', zipPath, '.'], { cwd: out });
  zipped = true;
} catch (e) { /* zip not installed */ }

// Landing page + the app under /app/.
let siteOut = null;
if (existsSync(join(src, 'site'))) {
  siteOut = join(root, 'dist', `${edition}-site`);
  rmSync(siteOut, { recursive: true, force: true });
  cpSync(join(src, 'site'), siteOut, { recursive: true });
  fillFolder(siteOut);
  cpSync(out, join(siteOut, 'app'), { recursive: true });
  scanForLeaks(siteOut);
}

console.log(`Built dist/${edition}/${zipped ? ` and dist/soma-${edition}.zip` : ' (zip skipped: install the zip command to package it)'}`);
if (siteOut) console.log(`Built dist/${edition}-site/ (landing page + app at /app/)`);

// Placeholders still to fill before selling.
const todo = [];
for (const [k, v] of Object.entries(config)) {
  if (typeof v === 'string' && v.includes('YOUR-')) todo.push(k);
}
// Only the chosen provider's IDs matter.
const lic = config.licensing || {};
const needed = lic.provider === 'lemonsqueezy' ? ['storeId'] : ['organizationId'];
for (const k of needed) {
  if (!lic[k] || String(lic[k]).includes('YOUR-')) todo.push('licensing.' + k);
}
if (todo.length) {
  console.log(`\nNot ready to sell yet. Fill these in editions/${edition}/edition.json:\n  ${todo.join('\n  ')}`);
  if (todo.some(t => t.startsWith('licensing.'))) console.log('Until licensing is filled in, every Pro feature stays unlocked.');
}
