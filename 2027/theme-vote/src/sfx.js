// Tiny synthesized sound effects (Web Audio API). No audio files to download.
// The recipes match the hype video's ffmpeg-generated sounds so everything feels like one set.
//
// Browsers only allow sound after the visitor taps or clicks, so nothing can ever play
// just from opening the link. Sound is on by default at a low volume; the speaker
// button turns it off and the choice is remembered on this device.

const KEY = 'p210-sound';
const MASTER_VOLUME = 0.32;

let ctx = null;
let master = null;
let noiseBuf = null;

function readPref() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

let enabled = readPref() !== 'off';

export function isSoundOn() {
  return enabled;
}

export function setSound(on) {
  enabled = !!on;
  try {
    localStorage.setItem(KEY, enabled ? 'on' : 'off');
  } catch {
    /* storage blocked */
  }
  if (enabled) {
    ensure();
    sfx.pop(1.2);
  }
}

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Create/resume the audio engine on the first tap so later sounds play instantly.
['pointerdown', 'keydown', 'touchstart'].forEach((ev) =>
  window.addEventListener(ev, () => enabled && ensure(), { once: true, passive: true }),
);

/* ------------------------------------------------------------ building blocks */
function tone({ freq, to = freq, type = 'sine', dur = 0.2, vol = 0.5, attack = 0.005, at = 0, filter = null }) {
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node = osc;
  if (filter) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filter;
    osc.connect(f);
    node = f;
  }
  node.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise({ dur = 0.5, vol = 0.4, from = 800, to = 3000, q = 0.8, at = 0, swell = 0.4 }) {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = ctx.currentTime + at;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t0);
  f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + dur * swell);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

/** Call inside a tap handler to make sure audio is unlocked for sounds scheduled after it. */
export function wakeAudio() {
  if (enabled && ensure() && ctx.state !== 'running') ctx.resume().catch(() => {});
}

/** True when sound can play right now (on, and the browser has allowed audio). */
export function soundReady() {
  return enabled && !!ensure() && ctx.state === 'running';
}

// Plays now if audio is running. If the browser still has audio paused, only try to
// start it during a tap; otherwise skip, so sounds never pile up and blast later.
const play = (fn) => (...args) => {
  if (!enabled || !ensure()) return;
  const run = () => {
    try {
      fn(...args);
    } catch {
      /* never let a sound break the page */
    }
  };
  if (ctx.state === 'running') return run();
  const inTap = navigator.userActivation ? navigator.userActivation.isActive : false;
  if (inTap) ctx.resume().then(run, () => {});
};

/* ------------------------------------------------------------ the sounds */
export const sfx = {
  // starting-light beep and the higher GO tone
  beep: play(() => tone({ freq: 660, dur: 0.22, vol: 0.35 })),
  go: play(() => {
    tone({ freq: 1320, dur: 0.6, vol: 0.3 });
    tone({ freq: 1980, dur: 0.5, vol: 0.12 });
  }),
  // race-start buzzer: two slightly detuned square waves held, then cut off
  buzz: play((len = 0.7) => {
    const t0 = ctx.currentTime;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 2200;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.2, t0 + 0.015);
    g.gain.setValueAtTime(0.2, t0 + len - 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
    f.connect(g).connect(master);
    [440, 446].forEach((hz) => {
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = hz;
      o.connect(f);
      o.start(t0);
      o.stop(t0 + len + 0.05);
    });
  }),
  // cartoon pop; pitch lets a row of chips "climb"
  pop: play((pitch = 1) => tone({ freq: 900 * pitch, to: 300 * pitch, dur: 0.14, vol: 0.45 })),
  // sea bubbles: quick rising blips
  bubble: play((n = 1) => {
    for (let i = 0; i < n; i++) tone({ freq: 380 + i * 60, to: 1400 + i * 120, dur: 0.16, vol: 0.32, at: i * 0.09 });
  }),
  // heavy "stamp" thump for big words
  stamp: play(() => {
    tone({ freq: 120, to: 50, dur: 0.35, vol: 0.7 });
    noise({ dur: 0.12, vol: 0.18, from: 300, to: 120, q: 0.5, swell: 0.05 });
  }),
  // engine rev: buzzy square wave sweeping up through a low-pass
  rev: play((len = 0.9) => tone({ freq: 55, to: 260, type: 'square', dur: len, vol: 0.18, attack: 0.08, filter: 1100 })),
  // fast car whoosh
  whoosh: play((len = 0.6) => noise({ dur: len, vol: 0.4, from: 500, to: 3200, q: 0.9 })),
  // soft card swish
  swish: play(() => noise({ dur: 0.28, vol: 0.22, from: 2400, to: 900, q: 1.2, swell: 0.3 })),
  // happy three-note chime
  chime: play(() => {
    [784, 988, 1175].forEach((f, i) => tone({ freq: f, dur: 1.3, vol: 0.16, at: i * 0.07 }));
  }),
  // gentle "oops" for a form mistake
  bonk: play(() => tone({ freq: 220, to: 140, type: 'triangle', dur: 0.25, vol: 0.35 })),
  // tiny tick when the vote counter rolls
  tick: play(() => tone({ freq: 1800, dur: 0.05, vol: 0.12 })),
  // drumroll for the big reveal
  drumroll: play((len = 2.2) => {
    const hits = Math.floor(len / 0.055);
    for (let i = 0; i < hits; i++) {
      const crescendo = 0.06 + (i / hits) * 0.22;
      noise({ dur: 0.05, vol: crescendo, from: 220, to: 160, q: 0.7, at: i * 0.055, swell: 0.1 });
    }
  }),
  // a car-themed pick sound for each theme
  theme: play((id) => {
    if (id === 'food') {
      tone({ freq: 900, to: 300, dur: 0.14, vol: 0.45 });
      tone({ freq: 1200, to: 400, dur: 0.14, vol: 0.4, at: 0.12 });
    } else if (id === 'sea') {
      for (let i = 0; i < 3; i++) tone({ freq: 380 + i * 60, to: 1400 + i * 120, dur: 0.16, vol: 0.32, at: i * 0.09 });
    } else {
      tone({ freq: 55, to: 240, type: 'square', dur: 0.75, vol: 0.2, attack: 0.06, filter: 1000 });
    }
  }),
};

/* ------------------------------------------------------------ speaker button */
const ICON_ON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
const ICON_OFF =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

export function mountSoundToggle() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'sound-toggle';
  const render = () => {
    btn.setAttribute('aria-pressed', String(enabled));
    btn.setAttribute('aria-label', enabled ? 'Sound is on. Turn sound off' : 'Sound is off. Turn sound on');
    btn.title = enabled ? 'Sound on' : 'Sound off';
    btn.innerHTML = enabled ? ICON_ON : ICON_OFF;
  };
  btn.addEventListener('click', () => {
    setSound(!enabled);
    render();
  });
  render();
  document.body.append(btn);
  return btn;
}
