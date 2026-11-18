// Builds a printable, grayscale "Go vote!" flyer with a QR code to the theme-vote site.
// Usage: node 2027/flyer/build.mjs   (needs Python `segno` for the QR and Playwright for the PDF)
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { EVENT, THEMES } from '../shared/themes.js';
import { carFor } from '../shared/art.js';

const { chromium } = createRequire(import.meta.url)('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const url = `https://${EVENT.siteUrl}/`;

// QR as inline SVG, high error correction so a smudgy laser print still scans.
const qr = execFileSync('python3', ['-c', `
import segno, io, sys
q = segno.make(sys.argv[1], error='h')
b = io.BytesIO(); q.save(b, kind='svg', scale=10, border=0, xmldecl=False, svgns=True, dark='#000', light=None, omitsize=True)
sys.stdout.write(b.getvalue().decode())`, url]).toString();

const themes = THEMES.map((t) => `
  <div class="theme">
    <div class="car">${carFor(t, { uid: t.id })}</div>
    <div class="tname">${t.name}</div>
  </div>`).join('');

const flyer = `
<section class="flyer">
  <div class="flag-band"></div>
  <header>
    <div class="kicker">${EVENT.pack} &middot; Pinewood Derby</div>
    <h1>Vote for the 2027 theme!</h1>
    <p class="lede">Help your scout pick this year's Pinewood Derby theme. It takes about a minute.</p>
  </header>
  <div class="body">
    <div class="qr-box">
      <div class="qr">${qr}</div>
      <div class="scan">Scan with your phone camera</div>
      <div class="url">${EVENT.siteUrl}</div>
    </div>
    <div class="info">
      <div class="label">The choices</div>
      <div class="themes">${themes}</div>
      <ul>
        <li><b>One vote per scout.</b> Siblings each get their own vote.</li>
        <li>No login or account needed.</li>
        <li>Let your scout choose. Kids love this part!</li>
      </ul>
    </div>
  </div>
  <footer>Vote soon! Voting closes before the December pack meeting.</footer>
</section>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Pinewood 2027 Vote Flyer</title>
<link href="https://fonts.googleapis.com/css2?family=Bungee&family=Nunito:wght@600;800;900&display=swap" rel="stylesheet">
<style>
  @page { size: letter; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #fff; color: #000; font-family: Nunito, Arial, sans-serif; }
  .page { width: 8.5in; height: 11in; display: flex; flex-direction: column; }
  .flyer { position: relative; flex: 1; padding: 0.36in 0.5in 0.22in; display: flex; flex-direction: column; overflow: hidden; }
  .flyer + .flyer { border-top: 1.5px dashed #888; }
  .flag-band { position: absolute; left: 0; right: 0; top: 0; height: 0.2in;
    background: repeating-conic-gradient(#000 0 25%, #fff 0 50%) 0 0 / 0.2in 0.2in; }
  .kicker { font-family: Bungee, Impact, sans-serif; font-size: 13pt; letter-spacing: 0.04em; color: #444; margin-top: 0.08in; }
  h1 { font-family: Bungee, Impact, sans-serif; font-weight: 400; font-size: 30pt; line-height: 1.05; margin: 0.02in 0 0.04in; }
  .lede { font-size: 13pt; font-weight: 600; margin: 0 0 0.12in; }
  .body { display: flex; gap: 0.35in; align-items: center; }
  .qr-box { flex: 0 0 2.75in; text-align: center; border: 3px solid #000; border-radius: 14px; padding: 0.15in 0.12in 0.1in; }
  .qr svg { width: 2.25in; margin: 0 auto; height: auto; display: block; }
  .scan { font-weight: 900; font-size: 11.5pt; margin-top: 0.08in; white-space: nowrap; }
  .url { font-family: Bungee, Impact, sans-serif; font-size: 10pt; margin-top: 0.02in; white-space: nowrap; }
  .info { flex: 1; }
  .label { font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; font-size: 10pt; color: #444; margin-bottom: 0.04in; }
  .themes { display: flex; flex-direction: column; gap: 0.02in; }
  .theme { display: flex; align-items: center; gap: 0.14in; }
  .car { flex: 0 0 1.25in; }
  .car svg { width: 100%; height: auto; display: block; filter: grayscale(1) contrast(1.05) brightness(1.08); }
  .tname { font-weight: 900; font-size: 14pt; line-height: 1.1; }
  ul { margin: 0.12in 0 0; padding-left: 0.2in; font-size: 11.5pt; font-weight: 600; line-height: 1.35; }
  footer { margin-top: auto; text-align: center; font-family: Bungee, Impact, sans-serif; font-size: 14pt;
    border-top: 3px solid #000; padding-top: 0.1in; }
</style></head><body>
<div class="page">${flyer}${flyer}</div>
</body></html>`;

const htmlPath = join(here, 'vote-flyer.html');
writeFileSync(htmlPath, html);

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: join(here, 'vote-flyer.pdf'), format: 'Letter', printBackground: true });
await page.setViewportSize({ width: 816, height: 1056 });
await page.screenshot({ path: join(here, 'vote-flyer-preview.png'), fullPage: true });
await browser.close();
console.log('Wrote vote-flyer.pdf, vote-flyer.html, vote-flyer-preview.png');
