import gsap from 'gsap';
import confetti from 'canvas-confetti';
import './main.css';
import { THEMES, DENS } from '../../shared/themes.js';
import { carFor, classicCar } from '../../shared/art.js';
import { getStatus, castVote, store } from './api.js';
import { sfx, mountSoundToggle, soundReady, wakeAudio } from './sfx.js';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Dev-only: lets automated testing advance animations when the tab is in the background.
if (import.meta.env.DEV) window.__gsap = gsap;

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const VOTED_KEY = 'p210-2027-voted';
const POLL_MS = 8000;

const form = $('#vote-form');
const cardsEl = $('.cards');
const errorEl = $('#form-error');
const voteBtn = $('.btn-vote');

let serverState = 'loading';
let celebrating = false;
let votingAgain = false;
let lastTotal = null;

/* =================================================================== utils */
function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const r = new Uint32Array(1);
    crypto.getRandomValues(r);
    const j = r[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function votedHere() {
  try {
    return JSON.parse(store.get('localStorage', VOTED_KEY) || '[]');
  } catch {
    return [];
  }
}
function rememberVote(entry) {
  const list = votedHere().filter((v) => v.scoutName !== entry.scoutName || v.den !== entry.den);
  list.push(entry);
  store.set('localStorage', VOTED_KEY, JSON.stringify(list));
}

/* =================================================================== hero */
function setupHero() {
  const racers = $$('.racer');
  THEMES.forEach((t, i) => {
    racers[i].innerHTML = carFor(t);
    racers[i].firstElementChild.classList.add('spin');
  });
  const bulbs = $$('.bulb');
  const endX = (r) => r.parentElement.clientWidth - r.offsetWidth - 26;

  if (reduce) {
    bulbs.forEach((b) => b.classList.add('go'));
    racers.forEach((r) => {
      r.firstElementChild.classList.remove('spin');
      gsap.set(r, { x: endX(r) * (0.55 + 0.2 * Number(r.dataset.lane)) });
    });
    window.addEventListener('resize', () =>
      racers.forEach((r) => gsap.set(r, { x: endX(r) * (0.55 + 0.2 * Number(r.dataset.lane)) })),
    );
    return;
  }

  const race = (delay = 0) => {
    const tl = gsap.timeline({ delay });
    const order = shuffle([0, 1, 2]);
    racers.forEach((r, i) => {
      r.firstElementChild.classList.add('spin');
      const speed = 1.15 + order[i] * 0.22;
      tl.fromTo(
        r,
        { x: -r.offsetWidth - 30 },
        {
          x: () => endX(r),
          duration: speed,
          ease: 'power2.in',
          onComplete: () => {
            r.firstElementChild.classList.remove('spin');
            gsap.fromTo(r, { rotation: -4 }, { rotation: 0, duration: 0.5, ease: 'elastic.out(1.2, 0.4)' });
          },
        },
        0,
      );
    });
    return tl;
  };

  // Starting lights: one beep per red light, then a buzzer on green.
  // On first load most phones block sound until a tap, so the beeps only play if the
  // browser already allows audio (soundReady). Tapping the track replays it with sound.
  const countdown = (timeline, { alwaysSound = false } = {}) => {
    const canBeep = () => alwaysSound || soundReady();
    bulbs.forEach((b, i) =>
      timeline.call(() => {
        b.classList.add('on');
        if (canBeep()) sfx.beep();
      }, null, i * 0.32),
    );
    timeline.call(
      () => {
        bulbs.forEach((b) => {
          b.classList.remove('on');
          b.classList.add('go');
        });
        if (canBeep()) sfx.buzz();
      },
      null,
      5 * 0.32 + 0.25,
    );
    return timeline;
  };

  const tl = gsap.timeline({ delay: 0.25 });
  gsap.set(racers, { x: (i, r) => -r.offsetWidth - 30 });
  countdown(tl);
  tl.add(race(), '>');
  tl.from('.title-word', { scale: 2.4, opacity: 0, duration: 0.55, ease: 'back.out(2.2)' }, '<+0.3');
  tl.from('.title-year', { scale: 0, rotation: 40, duration: 0.6, ease: 'back.out(3)' }, '>-0.15');
  tl.from('.hero-sub', { y: 24, opacity: 0, duration: 0.45, ease: 'power2.out' }, '>-0.2');
  tl.from('.hero-sub .you', { scale: 1.8, rotation: -12, duration: 0.5, ease: 'back.out(3)' }, '<');
  tl.from('.hero-cta', { y: 30, opacity: 0, duration: 0.45, ease: 'back.out(2)' }, '>-0.1');

  // Tap the track to run the whole countdown and race again, with sound.
  let replaying = false;
  $('.track').addEventListener('click', () => {
    if (replaying || gsap.isTweening(racers) || tl.progress() < 1) return;
    replaying = true;
    wakeAudio();
    bulbs.forEach((b) => b.classList.remove('on', 'go'));
    gsap.to(racers, { x: (i, r) => -r.offsetWidth - 30, duration: 0.35, ease: 'power2.in' });
    const again = gsap.timeline({ delay: 0.4, onComplete: () => (replaying = false) });
    countdown(again, { alwaysSound: true });
    again.call(() => {
      sfx.rev(1.1);
      setTimeout(() => sfx.whoosh(0.7), 750);
    });
    again.add(race(), '<');
  });
  window.addEventListener('resize', () => {
    if (!gsap.isTweening(racers) && tl.progress() === 1) racers.forEach((r) => gsap.set(r, { x: endX(r) }));
  });
}

/* =================================================================== cards */
function renderCards() {
  const html = shuffle(THEMES)
    .map((t) => {
      const c = t.colors;
      const bubbles =
        t.id === 'sea'
          ? [12, 30, 52, 74, 88]
              .map((x, i) => `<span class="bubble" style="left:${x}%;animation-delay:${i * 0.9}s"></span>`)
              .join('')
          : '';
      return `
      <div class="card" data-theme="${t.id}" style="--c-main:${c.main};--c-accent:${c.accent};--c-deep:${c.deep};--c-light:${c.light}">
        <input class="sr-only" type="radio" name="theme" id="theme-${t.id}" value="${t.id}" />
        <div class="card-inner">
          <label class="card-face card-front" for="theme-${t.id}">
            <span class="picked-flag" aria-hidden="true"></span>
            <div class="card-scene scene-${t.id}" aria-hidden="true">
              ${bubbles}
              <div class="card-car">${carFor(t)}</div>
            </div>
            <div class="card-body">
              <span class="card-tag">${t.tagline}</span>
              <h3>${t.name}</h3>
              <p class="card-desc">${t.description}</p>
            </div>
            <span class="pick-pill"><span class="no">Tap to pick</span><span class="yes">✓ Your pick!</span></span>
          </label>
          <div class="card-face card-back" id="ideas-${t.id}" aria-hidden="true" inert>
            <h3>${t.name}: car ideas</h3>
            <ul>${t.ideas.map((i) => `<li>${i}</li>`).join('')}</ul>
            <p class="back-tip">Or invent your very own!</p>
            <button type="button" class="btn back-pick" data-pick="${t.id}">Pick this theme</button>
          </div>
        </div>
        <button type="button" class="flip-btn" aria-expanded="false" aria-controls="ideas-${t.id}">
          <span class="flip-label">Car ideas</span> <span aria-hidden="true">↻</span>
        </button>
      </div>`;
    })
    .join('');
  cardsEl.insertAdjacentHTML('beforeend', html);

  $$('.card', cardsEl).forEach((card) => {
    const front = $('.card-front', card);
    const back = $('.card-back', card);
    const btn = $('.flip-btn', card);
    const flip = (toBack) => {
      card.classList.toggle('flipped', toBack);
      btn.setAttribute('aria-expanded', String(toBack));
      $('.flip-label', btn).textContent = toBack ? 'Flip back' : 'Car ideas';
      back.toggleAttribute('inert', !toBack);
      back.setAttribute('aria-hidden', String(!toBack));
      front.toggleAttribute('inert', toBack);
    };
    btn.addEventListener('click', () => {
      sfx.swish();
      flip(!card.classList.contains('flipped'));
    });
    $('.back-pick', card).addEventListener('click', () => {
      const input = $('input', card);
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      flip(false);
      btn.focus();
    });
  });

  cardsEl.addEventListener('change', (e) => {
    if (e.target.name !== 'theme') return;
    const card = e.target.closest('.card');
    cardsEl.classList.add('has-pick');
    $$('.card', cardsEl).forEach((c) => c.classList.toggle('is-picked', c === card));
    revCar(card);
    sfx.theme(card.dataset.theme);
    updateTicket();
  });

  // Cards drive in as they scroll into view.
  if (!reduce && 'IntersectionObserver' in window) {
    const cards = $$('.card', cardsEl);
    gsap.set(cards, { opacity: 0, y: 70 });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          const car = $('.card-car', en.target);
          gsap.to(en.target, { opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.6)' });
          gsap.from(car, { x: '-140%', duration: 0.9, delay: 0.15, ease: 'power3.out' });
        });
      },
      { threshold: 0.2 },
    );
    cards.forEach((c) => io.observe(c));
  }
}

function revCar(card) {
  if (reduce) return;
  const car = $('.card-car', card);
  const svg = car.firstElementChild;
  svg.classList.add('spin');
  gsap
    .timeline({ onComplete: () => svg.classList.remove('spin') })
    .to(car, { x: '-=6', duration: 0.05, repeat: 5, yoyo: true, ease: 'none' })
    .to(car, { x: '+=40', duration: 0.25, ease: 'power2.out' })
    .to(car, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
  const rect = card.getBoundingClientRect();
  const t = THEMES.find((x) => x.id === card.dataset.theme);
  confetti({
    particleCount: 40,
    spread: 70,
    startVelocity: 28,
    gravity: 1.1,
    scalar: 0.8,
    ticks: 120,
    origin: { x: (rect.left + rect.width / 2) / innerWidth, y: (rect.top + 120) / innerHeight },
    colors: [t.colors.main, t.colors.accent, '#ffffff'],
    disableForReducedMotion: true,
  });
}

/* =================================================================== dens */
function renderDens() {
  $('.den-grid').innerHTML = DENS.map(
    (d) => `<div class="den-chip" style="--den:${d.color}">
      <input class="sr-only" type="radio" name="den" id="den-${d.id}" value="${d.id}" />
      <label for="den-${d.id}"><span class="den-dot" aria-hidden="true"></span>${d.name}</label>
    </div>`,
  ).join('');
}

/* =================================================================== ticket */
function readForm() {
  const fd = new FormData(form);
  return {
    firstName: String(fd.get('firstName') || '').trim(),
    lastInitial: String(fd.get('lastInitial') || '').trim(),
    den: fd.get('den'),
    theme: fd.get('theme'),
    website: fd.get('website') || '',
  };
}

function updateTicket() {
  const v = readForm();
  const theme = THEMES.find((t) => t.id === v.theme);
  const den = DENS.find((d) => d.id === v.den);
  const name = v.firstName ? `${v.firstName}${v.lastInitial ? ` ${v.lastInitial.toUpperCase()}.` : ''}` : '';
  const text = $('.ticket-text');
  const carBox = $('.ticket-car');
  carBox.innerHTML = theme ? carFor(theme) : classicCar({ color: '#c9c5de', stripe: '#fff' });

  const ready = theme && v.firstName && v.lastInitial && den;
  if (ready) {
    text.innerHTML = `<strong>${escapeHtml(name)}</strong> from the <strong>${den.name}</strong> votes for <strong>${theme.name}</strong>!`;
  } else {
    const missing = [];
    if (!theme) missing.push('pick a theme');
    if (!v.firstName || !v.lastInitial) missing.push('type your name');
    if (!den) missing.push('pick your den');
    text.textContent = `Almost there! Still need to ${missing.join(', ')}.`;
  }
  voteBtn.classList.toggle('ready', !!ready && !reduce);
  if (ready) errorEl.hidden = true;
}

function showError(msg, focusEl) {
  errorEl.textContent = msg;
  errorEl.hidden = false;
  sfx.bonk();
  if (!reduce) gsap.fromTo(errorEl, { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1.4, 0.3)' });
  if (focusEl) {
    focusEl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    focusEl.focus({ preventScroll: true });
  }
}

/* =================================================================== submit */
async function onSubmit(e) {
  e.preventDefault();
  if (serverState !== 'open') return;
  const v = readForm();
  if (!v.theme) return showError('First, pick a theme card!', $('input[name="theme"]'));
  if (!v.firstName) return showError("Type the scout's first name.", $('#firstName'));
  if (!/^\p{L}$/u.test(v.lastInitial)) return showError('Type the first letter of the last name.', $('#lastInitial'));
  if (!v.den) return showError('Pick your den.', $('input[name="den"]'));

  voteBtn.disabled = true;
  $('.btn-vote-label').textContent = 'Revving up…';
  sfx.rev(0.8);
  const res = await castVote(v);
  voteBtn.disabled = false;
  $('.btn-vote-label').textContent = 'Cast my vote!';

  if (!res.ok) {
    if (res.data?.error === 'closed' || res.data?.error === 'not_open') refreshStatus();
    return showError(res.data?.message || 'Something went wrong. Please try again.');
  }

  const theme = THEMES.find((t) => t.id === v.theme);
  rememberVote({ scoutName: res.data.scoutName, den: v.den, theme: v.theme, at: Date.now() });
  votingAgain = false;
  updateCount(res.data.total, currentGoal);
  await celebrate(theme, res.data.scoutName);
  form.reset();
  cardsEl.classList.remove('has-pick');
  $$('.card', cardsEl).forEach((c) => c.classList.remove('is-picked'));
  updateTicket();
  setMode('thanks');
  const thanks = $('#thanks');
  thanks.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  thanks.focus({ preventScroll: true });
}

/* =================================================================== celebrate */
function celebrate(theme, name) {
  celebrating = true;
  const el = $('#celebrate');
  el.style.setProperty('--c-main', theme.colors.main);
  el.style.setProperty('--c-accent', theme.colors.accent);
  $('.celebrate-svg').innerHTML = carFor(theme);
  $('.celebrate-svg svg').classList.add('spin');
  $('.celebrate-name').textContent = name;
  el.hidden = false;

  const colors = [theme.colors.main, theme.colors.accent, '#ffffff', '#1b1b2f'];
  const burst = (x) =>
    confetti({ particleCount: 90, spread: 80, startVelocity: 55, origin: { x, y: 0.75 }, angle: x < 0.5 ? 60 : 120, colors, zIndex: 60, disableForReducedMotion: true });

  return new Promise((resolve) => {
    const done = () => {
      el.hidden = true;
      gsap.set(['.celebrate-bg', '.celebrate-word', '.celebrate-car', el], { clearProps: 'all' });
      celebrating = false;
      resolve();
    };
    if (reduce) {
      sfx.chime();
      setTimeout(done, 2200);
      return;
    }
    gsap
      .timeline({ onComplete: done })
      .from('.celebrate-bg', { scaleY: 0, transformOrigin: '50% 100%', duration: 0.35, ease: 'power3.out' })
      .call(() => sfx.stamp())
      .from('.celebrate-word', { scale: 3, opacity: 0, rotation: -8, duration: 0.5, ease: 'back.out(2)' }, '-=0.05')
      .call(() => sfx.whoosh(0.6), null, '-=0.25')
      .fromTo('.celebrate-car', { x: '-150vw' }, { x: 0, duration: 0.8, ease: 'power4.out' }, '-=0.25')
      .call(() => {
        burst(0.15);
        burst(0.85);
        sfx.chime();
        [0, 1, 2, 3].forEach((i) => setTimeout(() => sfx.pop(1 + i * 0.15), 120 + i * 110));
      }, null, '-=0.3')
      .to('.celebrate-car', { y: -10, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' })
      .call(() => sfx.rev(0.6), null, '+=0.55')
      .to('.celebrate-car', { x: '120vw', duration: 0.55, ease: 'power3.in' }, '+=0.15')
      .to(el, { opacity: 0, duration: 0.35 }, '-=0.15');
  });
}

/* =================================================================== counter */
let currentGoal = null;

function buildOdometer(digits = 3) {
  const odo = $('.odo');
  odo.innerHTML = Array.from(
    { length: digits },
    () => `<div class="odo-digit"><div class="odo-reel">${[...'0123456789'].map((d) => `<span>${d}</span>`).join('')}</div></div>`,
  ).join('');
}

function updateCount(total, goal) {
  currentGoal = goal ?? null;
  const digits = Math.max(3, String(total).length);
  if ($$('.odo-digit').length !== digits) buildOdometer(digits);
  const str = String(total).padStart(digits, '0');
  $$('.odo-reel').forEach((reel, i) => {
    reel.style.transform = `translateY(-${Number(str[i]) * 1.2}em)`;
  });
  $('#count-text').textContent = `${total} ${total === 1 ? 'scout has' : 'scouts have'} voted!`;

  const prog = $('.progress');
  if (goal) {
    prog.hidden = false;
    const pct = Math.min(1, total / goal);
    $('.progress-fill').style.width = `${pct * 100}%`;
    $('.pace-car').style.left = `${pct * 100}%`;
    const left = Math.max(0, goal - total);
    $('.progress-text').textContent =
      left === 0 ? `We hit our goal of ${goal} scouts! 🏆` : `Goal: ${goal} scouts. Only ${left} to go!`;
  } else {
    prog.hidden = true;
  }

  // A soft tick as the odometer rolls (silent until the visitor has tapped the page).
  if (lastTotal !== null && total > lastTotal) {
    for (let i = 0; i < Math.min(4, total - lastTotal); i++) setTimeout(() => sfx.tick(), i * 120);
  }
  if (lastTotal !== null && total > lastTotal && !reduce) {
    gsap.fromTo('.pit-card', { scale: 1.04 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  }
  lastTotal = total;
}

/* =================================================================== modes */
function setMode(mode) {
  document.body.dataset.mode = mode;
  $('#panel-coming').hidden = mode !== 'coming';
  $('#panel-closed').hidden = mode !== 'closed';
  $('#thanks').hidden = mode !== 'thanks';
  $$('input[name="theme"], input[name="den"]').forEach((i) => (i.disabled = mode !== 'open'));
  if (mode === 'thanks') {
    const list = votedHere();
    const names = list.map((v) => v.scoutName).join(', ');
    $('.thanks-who').textContent = list.length > 1 ? `Votes from this phone: ${names}` : `Way to go, ${names || 'racer'}!`;
    const last = list[list.length - 1];
    const theme = THEMES.find((t) => t.id === last?.theme);
    $('.thanks-car').innerHTML = theme ? carFor(theme) : classicCar();
  }
}

function applyStatus(st) {
  serverState = st.state;
  updateCount(st.total, st.goal);
  $('#reveal-link').hidden = !st.revealPublished;
  if (celebrating) return;
  let mode = st.state;
  if (mode === 'open' && votedHere().length && !votingAgain) mode = 'thanks';
  if (document.body.dataset.mode !== mode) setMode(mode);
}

async function refreshStatus() {
  const res = await getStatus();
  if (res.ok) applyStatus(res.data);
  else if (document.body.dataset.mode === 'loading') $('#count-text').textContent = "Can't reach the pit crew. Retrying…";
}

/* =================================================================== dev reset */
// Only exists under `npm run dev`; Vite strips it from the production build.
// Clears what this browser remembers (who voted here, saved passcodes) so you can
// test voting again. Pair it with `npm run reset` to wipe the local server data.
function addDevResetLink() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'dev-reset';
  btn.textContent = 'Dev only: reset this device';
  btn.addEventListener('click', () => {
    for (const area of ['localStorage', 'sessionStorage']) {
      try {
        Object.keys(window[area])
          .filter((k) => k.startsWith('p210-'))
          .forEach((k) => window[area].removeItem(k));
      } catch {
        /* storage blocked */
      }
    }
    location.reload();
  });
  $('.site-foot').append(btn);
}

/* =================================================================== init */
function init() {
  setupHero();
  renderCards();
  renderDens();
  buildOdometer();
  $('.pace-car').innerHTML = classicCar({ color: '#ef3e36', stripe: '#fff4df' });
  updateTicket();

  form.addEventListener('input', updateTicket);
  form.addEventListener('change', updateTicket);
  form.addEventListener('submit', onSubmit);
  $('#lastInitial').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^\p{L}]/gu, '').slice(0, 1).toUpperCase();
  });
  // Each den chip pops a little higher than the last.
  form.addEventListener('change', (e) => {
    if (e.target.name !== 'den') return;
    sfx.pop(1 + DENS.findIndex((d) => d.id === e.target.value) * 0.12);
  });
  $('.hero-cta').addEventListener('click', () => sfx.pop(1.1));
  $('#vote-again').addEventListener('click', () => {
    sfx.swish();
    votingAgain = true;
    setMode('open');
    $('#themes').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });

  mountSoundToggle();
  if (import.meta.env.DEV) addDevResetLink();

  refreshStatus();
  setInterval(() => {
    if (!document.hidden) refreshStatus();
  }, POLL_MS);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshStatus();
  });
}

init();
