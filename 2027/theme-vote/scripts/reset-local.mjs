// Wipes the LOCAL test data that `netlify dev` keeps in .netlify/blobs-serve.
// It never touches the real site: production votes live on Netlify, not on disk.
//
//   npm run reset             -> delete all local votes AND settings (back to "Coming soon")
//   npm run reset -- --votes  -> delete votes only; keep state, goal, and reveal settings
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const votesOnly = process.argv.includes('--votes');

// Read the store name from the server code so the two never drift apart.
const core = readFileSync(join(root, 'netlify/lib/core.mjs'), 'utf8');
const storeName = core.match(/STORE_NAME\s*=\s*['"]([^'"]+)['"]/)?.[1];
if (!storeName) {
  console.error('Could not find STORE_NAME in netlify/lib/core.mjs');
  process.exit(1);
}

const base = join(root, '.netlify', 'blobs-serve');
const storeDir = `site%3A${storeName}`;
let removed = 0;

// Layout: blobs-serve/{entries,metadata}/<"unlinked" or site id>/site%3A<store>/...
for (const kind of ['entries', 'metadata']) {
  const kindDir = join(base, kind);
  if (!existsSync(kindDir)) continue;
  for (const site of readdirSync(kindDir)) {
    const dir = join(kindDir, site, storeDir);
    if (!existsSync(dir)) continue;
    const targets = votesOnly ? ['votes', 'index'].map((p) => join(dir, p)) : [dir];
    for (const t of targets) {
      if (existsSync(t)) {
        rmSync(t, { recursive: true, force: true });
        removed++;
      }
    }
  }
}

if (removed === 0) {
  console.log('Nothing to reset: no local test data found.');
} else if (votesOnly) {
  console.log(`Local votes cleared for "${storeName}". Settings (state, goal, reveal) were kept.`);
} else {
  console.log(`Local votes and settings cleared for "${storeName}". Voting is back to "Coming soon".`);
}
console.log('Tip: use the "Reset this device" link at the bottom of the dev page to clear your browser too.');
