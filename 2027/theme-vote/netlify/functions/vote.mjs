// POST /api/vote - public. Body: { firstName, lastInitial, den, theme, website (honeypot) }
import { randomUUID } from 'node:crypto';
import {
  json, error, store, getSettings, effectiveState, countVotes, normalizeName,
  THEME_IDS, DEN_IDS, DENS,
} from '../lib/core.mjs';

const NAME_RE = /^[\p{L}][\p{L}\p{M}' .-]{0,23}$/u;
const INITIAL_RE = /^\p{L}$/u;

export default async (req) => {
  let body;
  try {
    body = await req.json();
  } catch {
    return error(400, 'bad_json', 'Something went wrong. Please try again.');
  }

  const firstName = String(body.firstName || '').trim().replace(/\s+/g, ' ');
  const lastInitial = String(body.lastInitial || '').trim().replace(/\.$/, '');
  const { den, theme } = body;

  // Bots fill every field, people never see this one.
  if (body.website) return json({ ok: true, total: await countVotes() });

  if (!NAME_RE.test(firstName)) return error(400, 'bad_name', "Please type the scout's first name.");
  if (!INITIAL_RE.test(lastInitial)) return error(400, 'bad_initial', 'Please type the first letter of the last name.');
  if (!DEN_IDS.includes(den)) return error(400, 'bad_den', 'Please pick a den.');
  if (!THEME_IDS.includes(theme)) return error(400, 'bad_theme', 'Please pick a theme.');

  const settings = await getSettings();
  const state = effectiveState(settings);
  if (state === 'coming') return error(403, 'not_open', "Voting hasn't started yet. Check back soon!");
  if (state === 'closed') return error(403, 'closed', 'Voting is closed. Thanks for checking!');

  const pretty = (s) => s.charAt(0).toLocaleUpperCase() + s.slice(1);
  const scoutName = `${pretty(firstName)} ${lastInitial.toLocaleUpperCase()}.`;
  const denName = DENS.find((d) => d.id === den).name;
  const id = randomUUID();
  const indexKey = `index/${den}/${normalizeName(firstName, lastInitial)}`;

  const s = store();
  // onlyIfNew makes the duplicate check atomic, even if two phones vote at the same instant.
  const claim = await s.setJSON(indexKey, { id }, { onlyIfNew: true });
  if (claim && claim.modified === false) {
    const prior = await s.get(indexKey, { type: 'json' });
    const priorVote = prior?.id ? await s.get(`votes/${prior.id}`, { type: 'json' }) : null;
    return error(
      409,
      'duplicate',
      `${priorVote?.scoutName || scoutName} from the ${denName} already voted! It's one vote per scout. If that's a mistake, ask a den leader.`,
    );
  }

  await s.setJSON(`votes/${id}`, {
    id,
    scoutName,
    den,
    denName,
    theme,
    indexKey,
    createdAt: new Date().toISOString(),
  });

  return json({ ok: true, total: await countVotes(), scoutName });
};

export const config = {
  path: '/api/vote',
  method: 'POST',
  rateLimit: { windowLimit: 15, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
