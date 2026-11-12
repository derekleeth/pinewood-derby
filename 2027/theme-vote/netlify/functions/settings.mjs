// POST /api/leader/settings - leader only. Body: any subset of the settings fields.
import { json, error, isLeader, getSettings, saveSettings, effectiveState, THEME_IDS } from '../lib/core.mjs';

export default async (req) => {
  if (!isLeader(req)) return error(401, 'unauthorized', 'Wrong leader passcode.');
  let body;
  try {
    body = await req.json();
  } catch {
    return error(400, 'bad_json', 'Bad request.');
  }

  const patch = {};
  if ('state' in body) {
    if (!['coming', 'open', 'closed'].includes(body.state)) return error(400, 'bad_state', 'Unknown state.');
    patch.state = body.state;
  }
  if ('closesAt' in body) {
    if (body.closesAt === null || body.closesAt === '') patch.closesAt = null;
    else if (Number.isNaN(Date.parse(body.closesAt))) return error(400, 'bad_date', 'That close time is not valid.');
    else patch.closesAt = new Date(body.closesAt).toISOString();
  }
  if ('goal' in body) {
    const g = body.goal === null || body.goal === '' ? null : Math.round(Number(body.goal));
    if (g !== null && !(g > 0 && g < 1000)) return error(400, 'bad_goal', 'Goal must be between 1 and 999.');
    patch.goal = g;
  }
  if ('revealPublished' in body) patch.revealPublished = !!body.revealPublished;
  if ('winnerOverride' in body) {
    if (body.winnerOverride !== null && !THEME_IDS.includes(body.winnerOverride)) {
      return error(400, 'bad_theme', 'Unknown theme.');
    }
    patch.winnerOverride = body.winnerOverride;
  }

  // Re-opening after an auto-close: clear a close time that already passed.
  if (patch.state === 'open' && !('closesAt' in patch)) {
    const cur = await getSettings();
    if (cur.closesAt && Date.parse(cur.closesAt) <= Date.now()) patch.closesAt = null;
  }

  const settings = await saveSettings(patch);
  return json({ ok: true, settings, state: effectiveState(settings) });
};

export const config = { path: '/api/leader/settings', method: 'POST' };
