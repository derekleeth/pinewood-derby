// DELETE /api/vote/:id - leader only.
import { json, error, store, isLeader } from '../lib/core.mjs';

export default async (req, context) => {
  if (!isLeader(req)) return error(401, 'unauthorized', 'Wrong leader passcode.');
  // Pull the UUID out of the path (netlify dev can append ".html" or "/index.html").
  const raw = `${context.params?.id || ''} ${new URL(req.url).pathname}`;
  const id = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
  if (!id) return error(400, 'bad_id', 'Unknown vote.');

  const s = store();
  const vote = await s.get(`votes/${id}`, { type: 'json' });
  if (!vote) return error(404, 'not_found', 'That vote was already removed.');

  await s.delete(`votes/${id}`);
  if (vote.indexKey) {
    // Only free the name if the index still points at this vote.
    const idx = await s.get(vote.indexKey, { type: 'json' });
    if (idx?.id === id) await s.delete(vote.indexKey);
  }
  return json({ ok: true, deleted: id });
};

export const config = { path: '/api/vote/:id', method: 'DELETE' };
