// GET /api/reveal - the results for the reveal animation.
//  - Leaders (x-leader-code) can always preview.
//  - Everyone else only after voting is closed, AND either the reveal is published
//    or they have the reveal passcode (x-reveal-code).
import { json, error, isLeader, isRevealer, getSettings, effectiveState, listVotes, tally } from '../lib/core.mjs';

export default async (req) => {
  const settings = await getSettings();
  const state = effectiveState(settings);
  const leader = isLeader(req);

  if (!leader) {
    if (state !== 'closed') return error(403, 'not_closed', 'The reveal unlocks after voting closes.');
    if (!settings.revealPublished && !isRevealer(req)) {
      return error(401, 'need_code', 'Enter the reveal passcode.');
    }
  }

  const results = tally(await listVotes(), settings);
  return json({ ok: true, preview: leader && state !== 'closed', ...results });
};

export const config = { path: '/api/reveal', method: 'GET' };
