import gsap from 'gsap';
import confetti from 'canvas-confetti';
import './reveal.css';
import { THEMES } from '../../shared/themes.js';
import { carFor } from '../../shared/art.js';
import { request, store } from './api.js';

// Dev-only: lets automated testing advance animations when the tab is in the background.
if (import.meta.env.DEV) window.__gsap = gsap;

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const KEY = 'p210-reveal-code';
let results = null;

/* -------------------------------------------------------------- gate */
async function fetchResults(code) {
  const headers = code ? { 'x-reveal-code': code, 'x-leader-code': code } : {};
  return request('/api/reveal', { headers });
}

function showGate(title, msg, { form = false, home = false } = {}) {
  $('#gate').hidden = false;
  $('#stage').hidden = true;
  $('#gate-title').textContent = title;
  $('#gate-msg').textContent = msg;
  $('#gate-form').hidden = !form;
  $('#home-link').hidden = !home;
}

async function unlock(code) {
  const res = await fetchResults(code);
  if (res.ok) {
    if (code) store.set('sessionStorage', KEY, code);
    results = res.data;
    return showStage();
  }
  if (res.data?.error === 'not_closed') {
    if (code) {
      const err = $('#gate-error');
      err.hidden = false;
      err.textContent = 'Voting is still open. Only the leader passcode can preview the reveal.';
    }
    return showGate('Not yet!', 'The reveal unlocks after voting closes. Go cast your vote!', { home: true, form: true });
  }
  if (res.status === 401) {
    if (code) {
      store.remove('sessionStorage', KEY);
      const err = $('#gate-error');
      err.hidden = false;
      err.textContent = 'That passcode didn’t work.';
    }
    return showGate('The big reveal', 'Enter the reveal passcode to start.', { form: true });
  }
  showGate('Uh oh', res.data?.message || 'Could not load the results. Try again.', { home: true });
}

$('#gate-form').addEventListener('submit', (e) => {
  e.preventDefault();
  unlock($('#code').value.trim());
});

/* -------------------------------------------------------------- stage */
function showStage() {
  $('#gate').hidden = true;
  $('#stage').hidden = false;
  $('#preview-flag').hidden = !results.preview;
  $('#tie-warn').hidden = !(results.tie && !results.winner);
  $('#start').hidden = false;
  $('#race').hidden = true;
  $('#win').hidden = true;
  if (!reduce) gsap.from('.rv-title', { scale: 0.4, opacity: 0, duration: 0.7, ease: 'back.out(2)' });
}

function buildTrack() {
  $('#track').innerHTML = THEMES.map((t) => {
    const row = results.totals.find((x) => x.id === t.id);
    return `<div class="rv-lane" data-id="${t.id}" style="--c-main:${t.colors.main}">
      <span class="rv-lane-name">${t.short}</span>
      <span class="rv-lane-count">${row?.count ?? 0}</span>
      <div class="rv-car">${carFor(t)}</div>
    </div>`;
  }).join('');
}

function finishX(lane) {
  const car = lane.querySelector('.rv-car');
  return lane.clientWidth * 0.96 - car.offsetWidth * 0.92;
}

function runRace() {
  buildTrack();
  $('#start').hidden = true;
  $('#race').hidden = false;
  $('#win').hidden = true;
  const showCounts = $('#show-counts').checked;
  const lanes = $$('.rv-lane');
  const max = Math.max(1, ...results.totals.map((t) => t.count));
  const bulbs = $$('.rv-lights .bulb');
  bulbs.forEach((b) => b.classList.remove('on', 'go'));

  const finals = lanes.map((lane) => {
    const row = results.totals.find((x) => x.id === lane.dataset.id);
    const F = finishX(lane);
    const isWinner = results.winner ? lane.dataset.id === results.winner : row.count === max;
    const frac = isWinner ? 1 : Math.max(0.12, (row.count / max) * 0.9);
    return { lane, F, x: F * frac, isWinner };
  });

  if (reduce) {
    bulbs.forEach((b) => b.classList.add('go'));
    finals.forEach((f) => {
      gsap.set(f.lane.querySelector('.rv-car'), { x: f.x });
      f.lane.classList.toggle('winner', f.isWinner);
      if (showCounts) gsap.set(f.lane.querySelector('.rv-lane-count'), { scale: 1 });
    });
    setTimeout(showWinner, 1500);
    return;
  }

  const tl = gsap.timeline();
  bulbs.forEach((b, i) => tl.call(() => b.classList.add('on'), null, 0.4 + i * 0.6));
  tl.call(() => bulbs.forEach((b) => (b.classList.remove('on'), b.classList.add('go'))), null, 0.4 + 5 * 0.6);

  const start = 0.4 + 5 * 0.6 + 0.1;
  finals.forEach((f, i) => {
    const car = f.lane.querySelector('.rv-car');
    car.firstElementChild.classList.add('spin');
    gsap.set(car, { x: 0 });
    // Lead changes along the way keep everyone guessing.
    const a = f.F * (0.2 + Math.random() * 0.2);
    const b = f.F * (0.45 + Math.random() * 0.25);
    const c = Math.min(f.x, f.F * (0.6 + Math.random() * 0.25));
    tl.to(
      car,
      {
        keyframes: [
          { x: a, duration: 1.2, ease: 'power2.in' },
          { x: b, duration: 1.4, ease: 'sine.inOut' },
          { x: c, duration: 1.4, ease: 'sine.inOut' },
          { x: f.x, duration: 1.3 + (f.isWinner ? 0 : 0.4), ease: 'power3.out' },
        ],
        onComplete: () => car.firstElementChild.classList.remove('spin'),
      },
      start + i * 0.05,
    );
  });
  tl.call(() => {
    finals.forEach((f) => f.lane.classList.toggle('winner', f.isWinner));
  });
  if (showCounts) tl.to('.rv-lane-count', { scale: 1, duration: 0.5, ease: 'back.out(3)', stagger: 0.15 });
  tl.call(showWinner, null, '+=1.6');
}

function showWinner() {
  const theme = THEMES.find((t) => t.id === results.winner);
  const win = $('#win');
  if (!theme) {
    // An unresolved tie: show it plainly, leaders pick on the leader page.
    $('#win-name').textContent = "It's a tie!";
    $('#win-tag').textContent = results.tiedThemes.map((id) => THEMES.find((t) => t.id === id).short).join(' + ');
    $('#win-car').innerHTML = '';
    $('#win-ideas').innerHTML = '';
  } else {
    win.style.setProperty('--c-main', theme.colors.main);
    win.style.setProperty('--c-accent', theme.colors.accent);
    $('#win-car').innerHTML = carFor(theme);
    $('#win-name').textContent = theme.name;
    $('#win-tag').textContent = theme.tagline;
    $('#win-ideas').innerHTML = theme.ideas.map((i) => `<li>${i}</li>`).join('');
  }
  $('#win-counts').textContent = $('#show-counts').checked
    ? `${results.total} scouts voted · ` + results.totals.map((t) => `${THEMES.find((x) => x.id === t.id).short}: ${t.count}`).join(' · ')
    : `${results.total} scouts voted. Thank you, racers!`;
  win.hidden = false;

  if (reduce) {
    $('#drum').hidden = true;
    return;
  }
  const colors = theme ? [theme.colors.main, theme.colors.accent, '#ffffff', '#1b1b2f'] : undefined;
  $('#drum').hidden = false;
  gsap
    .timeline()
    .set('#win-card', { opacity: 0 })
    .from(win, { clipPath: 'circle(0% at 50% 50%)', duration: 0.6, ease: 'power3.out' })
    .from('#drum', { scale: 0.5, opacity: 0, duration: 0.4, ease: 'back.out(2)' })
    .to('#drum', { scale: 1.1, duration: 2.2, ease: 'none' })
    .to('#drum', { opacity: 0, scale: 2, duration: 0.25 })
    .set('#drum', { display: 'none' })
    .set('#win-card', { opacity: 1 })
    .from('#win-car', { x: '-120vw', duration: 0.8, ease: 'power4.out' })
    .from('#win-name', { scale: 3, opacity: 0, rotation: -6, duration: 0.55, ease: 'back.out(2)' }, '-=0.3')
    .call(() => {
      const end = Date.now() + 3500;
      (function frame() {
        confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors, zIndex: 30 });
        confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors, zIndex: 30 });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
      confetti({ particleCount: 200, spread: 120, startVelocity: 60, origin: { y: 0.6 }, colors, zIndex: 30 });
    })
    .from('#win-tag', { y: 40, opacity: 0, duration: 0.4, ease: 'back.out(2)' })
    .from('#win-ideas li', { y: 30, opacity: 0, stagger: 0.12, duration: 0.35, ease: 'back.out(2)' })
    .from(['#win-counts', '.rv-win-actions'], { opacity: 0, duration: 0.4 });
}

$('#go').addEventListener('click', runRace);
$('#replay').addEventListener('click', () => {
  gsap.set(['#drum', '#win-card', '#win', '#win-car', '#win-name', '#win-tag', '#win-counts', '.rv-win-actions'], { clearProps: 'all' });
  $$('#win-ideas li').forEach((li) => gsap.set(li, { clearProps: 'all' }));
  runRace();
});
$('#fullscreen').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
});

// Leaders who are signed in on the leader page in this tab session can preview right away.
unlock(store.get('sessionStorage', KEY) || store.get('sessionStorage', 'p210-leader-code') || '');
