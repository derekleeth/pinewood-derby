// Shared server helpers for the theme-vote functions.
import { getStore } from '@netlify/blobs';
import { createHash, timingSafeEqual } from 'node:crypto';
import { THEMES, THEME_IDS, DEN_IDS, DENS } from '../../../shared/themes.js';

export { THEMES, THEME_IDS, DEN_IDS, DENS };

// One store per year/project so a future site (e.g. car voting) never collides.
export const STORE_NAME = 'theme-votes-2027';
export const store = () => getStore({ name: STORE_NAME, consistency: 'strong' });

export const env = (key) => {
  try {
    const v = globalThis.Netlify?.env?.get(key);
    if (v !== undefined) return v;
  } catch {
    /* not on Netlify runtime */
  }
  return process.env[key];
};

/* ------------------------------------------------------------ responses */
export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export const error = (status, code, message) => json({ ok: false, error: code, message }, status);

/* ------------------------------------------------------------ auth */
function safeEqual(a, b) {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

function codeMatches(req, header, envKey) {
  const expected = env(envKey);
  if (!expected) return false; // never allow access when the passcode isn't configured
  const given = req.headers.get(header);
  return !!given && safeEqual(given.trim(), expected.trim());
}

export const isLeader = (req) => codeMatches(req, 'x-leader-code', 'LEADER_PASSCODE');
export const isRevealer = (req) => codeMatches(req, 'x-reveal-code', 'REVEAL_PASSCODE');

/* ------------------------------------------------------------ settings */
export const DEFAULT_SETTINGS = {
  state: 'coming', // 'coming' | 'open' | 'closed'
  closesAt: null, // ISO string; when state is 'open' and this passes, voting closes automatically
  goal: null, // participation goal (number of scouts)
  revealPublished: false, // when true, anyone can open /reveal once voting is closed
  winnerOverride: null, // theme id, only used to break a tie
};

export async function getSettings() {
  const saved = await store().get('settings', { type: 'json' });
  const s = { ...DEFAULT_SETTINGS, ...(saved || {}) };
  if (s.goal == null && env('PARTICIPATION_GOAL')) s.goal = Number(env('PARTICIPATION_GOAL')) || null;
  return s;
}

export async function saveSettings(patch) {
  const current = await getSettings();
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  await store().setJSON('settings', next);
  return next;
}

export function effectiveState(settings, now = Date.now()) {
  if (settings.state === 'open' && settings.closesAt && now >= Date.parse(settings.closesAt)) return 'closed';
  return settings.state;
}

/* ------------------------------------------------------------ votes */
export async function countVotes() {
  const { blobs } = await store().list({ prefix: 'votes/' });
  return blobs.length;
}

export async function listVotes() {
  const s = store();
  const { blobs } = await s.list({ prefix: 'votes/' });
  const votes = await Promise.all(blobs.map((b) => s.get(b.key, { type: 'json' })));
  return votes.filter(Boolean).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// "  maya  " + "r" -> "maya-r". Accents are folded so "Zoë" and "Zoe" match.
export function normalizeName(first, initial) {
  const fold = (s) =>
    String(s || '')
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  return `${fold(first)}-${fold(initial)}`;
}

export function tally(votes, settings) {
  const counts = Object.fromEntries(THEME_IDS.map((id) => [id, 0]));
  for (const v of votes) if (v.theme in counts) counts[v.theme] += 1;
  const totals = THEMES.map((t) => ({ id: t.id, name: t.name, count: counts[t.id] }));
  const max = Math.max(...totals.map((t) => t.count));
  const leaders = totals.filter((t) => t.count === max && max > 0).map((t) => t.id);
  const tie = leaders.length > 1;
  let winner = leaders.length === 1 ? leaders[0] : null;
  if (tie && settings?.winnerOverride && leaders.includes(settings.winnerOverride)) winner = settings.winnerOverride;
  return { totals, winner, tie, tiedThemes: tie ? leaders : [], total: votes.length };
}
