import './leader.css';
import { THEMES, DENS } from '../../shared/themes.js';
import { request, store } from './api.js';

const $ = (s) => document.querySelector(s);
const CODE_KEY = 'p210-leader-code';
let code = store.get('sessionStorage', CODE_KEY) || '';
let data = null;
let timer = null;

const themeById = Object.fromEntries(THEMES.map((t) => [t.id, t]));
const denById = Object.fromEntries(DENS.map((d) => [d.id, d]));
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const api = (path, opts = {}) => request(path, { ...opts, headers: { 'x-leader-code': code } });

function toast(msg) {
  $('#toast').textContent = msg;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => ($('#toast').textContent = ''), 4000);
}

async function load() {
  const res = await api('/api/leader');
  if (res.status === 401) return lock('That passcode didn’t work.');
  if (!res.ok) return toast(res.data?.message || 'Could not load. Try Refresh.');
  data = res.data;
  $('#login').hidden = true;
  $('#dash').hidden = false;
  $('.lead-top-actions').hidden = false;
  render();
}

function lock(msg) {
  code = '';
  store.remove('sessionStorage', CODE_KEY);
  clearInterval(timer);
  $('#dash').hidden = true;
  $('.lead-top-actions').hidden = true;
  $('#login').hidden = false;
  const err = $('#login-error');
  err.hidden = !msg;
  err.textContent = msg || '';
}

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function render() {
  const { settings, state, results, votes } = data;
  const labels = { coming: 'Coming soon', open: 'Open', closed: 'Closed' };
  const badge = $('#state-badge');
  badge.dataset.state = state;
  badge.textContent =
    labels[state] +
    (state === 'closed' && settings.state === 'open' ? ' (auto-closed)' : '') +
    (state === 'open' && settings.closesAt ? ` until ${new Date(settings.closesAt).toLocaleString()}` : '');
  document.querySelectorAll('.seg-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.state === state)));

  if (document.activeElement !== $('#closesAt')) $('#closesAt').value = toLocalInput(settings.closesAt);
  if (document.activeElement !== $('#goal')) $('#goal').value = settings.goal ?? '';
  $('#published').checked = !!settings.revealPublished;

  // bars
  $('#total').textContent = results.total;
  const max = Math.max(1, ...results.totals.map((t) => t.count));
  $('#bars').innerHTML = results.totals
    .map((t) => {
      const pct = results.total ? Math.round((t.count / results.total) * 100) : 0;
      return `<div class="bar-row ${results.winner === t.id ? 'winner' : ''}" style="--c:${themeById[t.id].colors.main}">
        <div class="bar-label"><span>${t.name}</span><span>${t.count} (${pct}%)</span></div>
        <div class="bar"><div class="bar-fill" data-w="${(t.count / max) * 100}"></div></div>
      </div>`;
    })
    .join('');
  requestAnimationFrame(() =>
    document.querySelectorAll('.bar-fill').forEach((el) => (el.style.width = `${el.dataset.w}%`)),
  );

  // tie
  const tieBox = $('#tie');
  tieBox.hidden = !results.tie;
  if (results.tie) {
    $('#override').innerHTML =
      `<option value="">Choose a winner…</option>` +
      results.tiedThemes
        .map((id) => `<option value="${id}" ${settings.winnerOverride === id ? 'selected' : ''}>${themeById[id].name}</option>`)
        .join('');
  }

  // rows
  const key = (v) => `${v.den}|${v.scoutName.split(' ')[0].toLowerCase()}`;
  const counts = {};
  votes.forEach((v) => (counts[key(v)] = (counts[key(v)] || 0) + 1));
  $('#empty').hidden = votes.length > 0;
  $('#rows').innerHTML = votes
    .map((v) => {
      const dup = counts[key(v)] > 1;
      const t = themeById[v.theme];
      return `<tr class="${dup ? 'dup' : ''}">
        <td>${esc(v.scoutName)}${dup ? '<span class="dup-tag">check</span>' : ''}</td>
        <td>${esc(denById[v.den]?.name || v.den)}</td>
        <td><span class="theme-dot" style="--c:${t?.colors.main}"></span>${esc(t?.short || v.theme)}</td>
        <td>${new Date(v.createdAt).toLocaleString([], { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
        <td><button class="del" type="button" data-id="${v.id}" aria-label="Delete vote from ${esc(v.scoutName)}">✕</button></td>
      </tr>`;
    })
    .join('');
}

async function saveSettings(patch, okMsg) {
  const res = await api('/api/leader/settings', { method: 'POST', body: patch });
  if (res.status === 401) return lock('Your session expired. Enter the passcode again.');
  if (!res.ok) return toast(res.data?.message || 'Could not save.');
  toast(okMsg);
  await load();
}

function downloadCsv() {
  const rows = [['Scout', 'Den', 'Theme', 'Voted at']].concat(
    data.votes.map((v) => [v.scoutName, denById[v.den]?.name || v.den, themeById[v.theme]?.name || v.theme, new Date(v.createdAt).toLocaleString()]),
  );
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `pinewood-2027-theme-votes.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* --------------------------------------------------------------- events */
$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  code = $('#code').value.trim();
  if (!code) return;
  store.set('sessionStorage', CODE_KEY, code);
  $('#code').value = '';
  await load();
  if (code) startPolling();
});

$('#logout').addEventListener('click', () => lock());
$('#refresh').addEventListener('click', () => load());

document.querySelectorAll('.seg-btn').forEach((b) =>
  b.addEventListener('click', () => {
    const s = b.dataset.state;
    if (s === 'open' && !confirm('Open voting now? Families with the link can start voting.')) return;
    if (s === 'closed' && !confirm('Close voting now? The vote form will disappear for everyone.')) return;
    saveSettings({ state: s }, `Voting is now: ${b.textContent}.`);
  }),
);

$('#close-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = $('#closesAt').value;
  if (!v) return toast('Pick a date and time first.');
  saveSettings({ closesAt: new Date(v).toISOString() }, 'Auto-close time saved.');
});
$('#clear-close').addEventListener('click', () => saveSettings({ closesAt: null }, 'Auto-close cleared.'));

$('#goal-form').addEventListener('submit', (e) => {
  e.preventDefault();
  saveSettings({ goal: $('#goal').value || null }, 'Goal saved.');
});

$('#published').addEventListener('change', (e) => {
  const on = e.target.checked;
  if (on && !confirm('Publish the reveal? Once voting is closed, every family can see the winner.')) {
    e.target.checked = false;
    return;
  }
  saveSettings({ revealPublished: on }, on ? 'Reveal published.' : 'Reveal hidden again.');
});

$('#override').addEventListener('change', (e) =>
  saveSettings({ winnerOverride: e.target.value || null }, 'Tie-breaker saved.'),
);

$('#rows').addEventListener('click', async (e) => {
  const btn = e.target.closest('.del');
  if (!btn) return;
  const vote = data.votes.find((v) => v.id === btn.dataset.id);
  if (!confirm(`Delete the vote from ${vote?.scoutName}? This can't be undone.`)) return;
  const res = await api(`/api/vote/${btn.dataset.id}`, { method: 'DELETE' });
  if (!res.ok) return toast(res.data?.message || 'Could not delete.');
  toast(`Deleted the vote from ${vote?.scoutName}. They can vote again.`);
  load();
});

$('#csv').addEventListener('click', downloadCsv);

function startPolling() {
  clearInterval(timer);
  timer = setInterval(() => !document.hidden && load(), 15000);
}

if (code) {
  load();
  startPolling();
}
