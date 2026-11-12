// Tiny fetch wrapper. Always resolves: { ok, status, data }.
export async function request(path, { method = 'GET', body, headers = {} } = {}) {
  try {
    const res = await fetch(path, {
      method,
      headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    let data = {};
    try {
      data = await res.json();
    } catch {
      /* empty body */
    }
    return { ok: res.ok && data.ok !== false, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { message: "Can't reach the pit crew. Check your connection and try again." } };
  }
}

export const getStatus = () => request('/api/status');
export const castVote = (vote) => request('/api/vote', { method: 'POST', body: vote });

// Session storage helpers that never throw (private mode, blocked storage, etc.)
export const store = {
  get(area, key) {
    try {
      return window[area].getItem(key);
    } catch {
      return null;
    }
  },
  set(area, key, value) {
    try {
      window[area].setItem(key, value);
    } catch {
      /* ignore */
    }
  },
  remove(area, key) {
    try {
      window[area].removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
