// GET /api/leader - leader only. Full results, settings, and the vote list.
import { json, error, isLeader, getSettings, effectiveState, listVotes, tally } from '../lib/core.mjs';

export default async (req) => {
  if (!isLeader(req)) return error(401, 'unauthorized', 'Wrong leader passcode.');
  const [settings, votes] = await Promise.all([getSettings(), listVotes()]);
  return json({
    ok: true,
    settings,
    state: effectiveState(settings),
    results: tally(votes, settings),
    votes: votes.map(({ indexKey, ...v }) => v),
  });
};

export const config = { path: '/api/leader', method: 'GET' };
