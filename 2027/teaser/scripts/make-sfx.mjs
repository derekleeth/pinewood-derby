// Generates the video's sound effects from scratch with ffmpeg (no downloaded audio,
// so there are no licensing questions). Run: npm run sfx
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const out = new URL('../public/sfx/', import.meta.url);
mkdirSync(out, { recursive: true });

const SFX = {
  // starting-light beep and the higher "GO" tone
  beep: { expr: '0.5*sin(2*PI*660*t)*min(1,40*t)*exp(-6*t)', d: 0.22 },
  go: { expr: '0.5*(sin(2*PI*1320*t)+0.4*sin(2*PI*1980*t))*min(1,40*t)*exp(-3*t)', d: 0.6 },
  // rising engine rev: buzzy square wave sweeping up, softened by a low-pass
  rev: { expr: '0.35*sgn(sin(2*PI*(55*t+90*t*t))) *min(1,8*t)*exp(-1.6*t)', d: 1.1, af: 'lowpass=f=900,lowpass=f=1400' },
  // whoosh: filtered pink noise swelling then fading
  whoosh: { noise: true, d: 0.7, af: 'bandpass=f=1400:width_type=h:w=1600,afade=t=in:d=0.25,afade=t=out:st=0.3:d=0.4,volume=0.9' },
  // cartoon pop, bubble blip, stamp thump, and a closing chime
  pop: { expr: '0.6*sin(2*PI*(900*t-2600*t*t))*exp(-28*t)', d: 0.16 },
  bubble: { expr: '0.5*sin(2*PI*(380*t+2600*t*t))*exp(-22*t)', d: 0.18 },
  stamp: { expr: '0.8*sin(2*PI*(110*t-120*t*t))*exp(-11*t)', d: 0.35 },
  chime: {
    expr: '0.25*(sin(2*PI*784*t)+sin(2*PI*988*t)+sin(2*PI*1175*t))*min(1,60*t)*exp(-2.2*t)',
    d: 1.6,
  },
};

for (const [name, s] of Object.entries(SFX)) {
  const file = new URL(`${name}.wav`, out).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const input = s.noise ? `anoisesrc=d=${s.d}:c=pink:a=0.5:r=48000` : `aevalsrc=exprs='${s.expr}':d=${s.d}:s=48000`;
  const args = ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', input];
  if (s.af) args.push('-af', s.af);
  args.push('-ac', '2', file);
  execFileSync('ffmpeg', args, { stdio: 'inherit' });
  console.log('made', name);
}
