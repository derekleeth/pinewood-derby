// GET /api/status - public. Only the participation count, never per-theme data.
import { json, getSettings, effectiveState, countVotes } from '../lib/core.mjs';

export default async () => {
  const [settings, total] = await Promise.all([getSettings(), countVotes()]);
  return json({
    state: effectiveState(settings),
    total,
    goal: settings.goal,
    closesAt: settings.closesAt,
    revealPublished: !!settings.revealPublished && effectiveState(settings) === 'closed',
  });
};

export const config = { path: '/api/status', method: 'GET' };
