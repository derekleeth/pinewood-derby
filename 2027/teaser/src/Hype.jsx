import { AbsoluteFill, Easing, Sequence, interpolate, random, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { THEMES, EVENT } from '../../shared/themes.js';
import {
  ASPHALT, AsphaltBg, BODY, CREAM, Car, Checker, Confetti, DISPLAY, GREEN, GlobalStyle, INK, Pill,
  RED, Sfx, SpeedLines, YELLOW, stickerText, useLayout,
} from './parts.jsx';

// ----------------------------------------------------------------- timing
// 30 fps, 20 seconds. Every scene is built to read with the sound OFF.
export const SCENES = {
  lights: { from: 0, dur: 75 },
  title: { from: 75, dur: 95 },
  you: { from: 170, dur: 65 },
  theme0: { from: 235, dur: 90 },
  theme1: { from: 325, dur: 90 },
  theme2: { from: 415, dur: 90 },
  cta: { from: 505, dur: 95 },
};
export const DURATION = 600;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const useSpring = (delay, config = { damping: 11, mass: 0.7 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
};

/* ================================================================= 1. LIGHTS */
const Lights = () => {
  const frame = useCurrentFrame();
  const { u, portrait } = useLayout();
  const go = frame >= 60;
  const bulb = 128 * u;
  const goPop = useSpring(60, { damping: 8, mass: 0.6 });
  const flash = interpolate(frame, [60, 63, 74], [0, 0.55, 0], clamp);
  const boxIn = useSpring(0, { damping: 14 });
  const shake = go ? Math.sin(frame * 3) * interpolate(frame, [60, 72], [10, 0], clamp) * u : 0;

  return (
    <AbsoluteFill>
      <AsphaltBg />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 60 * u, transform: `translateX(${shake}px)` }}>
        <p style={{ ...stickerText(u, { color: YELLOW, stroke: 0, drop: 0 }), fontSize: 46 * u, letterSpacing: '0.12em', opacity: interpolate(frame, [0, 10], [0, 1], clamp) }}>
          {EVENT.pack} · PINEWOOD DERBY
        </p>
        <div
          style={{
            display: 'flex',
            gap: 26 * u,
            padding: `${26 * u}px ${32 * u}px`,
            background: '#101120',
            border: `${8 * u}px solid #07070f`,
            borderRadius: 40 * u,
            boxShadow: `0 ${14 * u}px 0 #000`,
            transform: `scale(${boxIn})`,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => {
            const on = frame >= 8 + i * 10;
            const c = go ? GREEN : on ? RED : null;
            return (
              <div
                key={i}
                style={{
                  width: bulb,
                  height: bulb,
                  borderRadius: '50%',
                  border: `${6 * u}px solid #07070f`,
                  background: c ? `radial-gradient(circle at 35% 35%, #fff 0%, ${c} 45%)` : '#3a2020',
                  boxShadow: c ? `0 0 ${50 * u}px ${c}` : 'none',
                }}
              />
            );
          })}
        </div>
        <div style={{ height: (portrait ? 360 : 300) * u, display: 'grid', placeItems: 'center' }}>
          {go ? (
            <p style={{ ...stickerText(u, { color: GREEN, stroke: 10, drop: 18 }), fontSize: (portrait ? 320 : 280) * u, transform: `scale(${goPop}) rotate(-6deg)` }}>
              GO!
            </p>
          ) : (
            <p style={{ ...stickerText(u, { color: CREAM, stroke: 6, drop: 10 }), fontSize: 110 * u, opacity: interpolate(frame, [8, 16], [0, 1], clamp) }}>
              {frame < 28 ? 'READY…' : 'SET…'}
            </p>
          )}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
      {[8, 18, 28, 38, 48].map((at) => (
        <Sfx key={at} at={at} name="beep" volume={0.22} />
      ))}
      <Sfx at={60} name="go" volume={0.25} />
    </AbsoluteFill>
  );
};

/* ================================================================= 2. TITLE */
const Title = () => {
  const frame = useCurrentFrame();
  const { W, u, portrait } = useLayout();
  const word = useSpring(20, { damping: 10, mass: 0.8 });
  const year = useSpring(32, { damping: 7, mass: 0.6 });
  const band = interpolate(frame, [6, 20], [-1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const carW = (portrait ? 330 : 380) * u;

  // Pass 1: three cars blast through. Pass 2: they roll back in and park in a row.
  const blast = (i) => interpolate(frame, [2 + i * 5, 26 + i * 5], [-carW * 1.3, W + carW], { ...clamp, easing: Easing.in(Easing.quad) });
  const park = (i) => spring({ frame: frame - (46 + i * 6), fps: 30, config: { damping: 13 } });

  return (
    <AbsoluteFill>
      <AsphaltBg glow="#4a3f8b" />
      <SpeedLines seed="title" speed={110} />
      <Checker size={44 * u} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 44 * u, transform: `translateX(${band * 100}%)` }} />
      <Checker size={44 * u} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 44 * u, transform: `translateX(${-band * 100}%)` }} />

      {/* blast-through pass */}
      {THEMES.map((t, i) => (
        <Car key={t.id} theme={t} width={carW} spin={frame * 40} style={{ position: 'absolute', top: `${(portrait ? 14 : 8) + i * (portrait ? 26 : 30)}%`, left: blast(i) }} />
      ))}

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <p style={{ ...stickerText(u, { stroke: 9, drop: 16, shadow: INK }), fontSize: (portrait ? 168 : 230) * u, textShadow: `0 ${12 * u}px 0 ${INK}, 0 ${22 * u}px 0 ${RED}`, transform: `scale(${interpolate(word, [0, 1], [3, 1])})`, opacity: Math.min(1, word * 2) }}>
          PINEWOOD
        </p>
        <div
          style={{
            marginTop: 40 * u,
            padding: `${6 * u}px ${46 * u}px`,
            background: YELLOW,
            border: `${8 * u}px solid #07070f`,
            borderRadius: 30 * u,
            boxShadow: `0 ${12 * u}px 0 #07070f`,
            transform: `scale(${year}) rotate(${interpolate(year, [0, 1], [40, -4])}deg)`,
          }}
        >
          <span style={{ fontFamily: DISPLAY, fontSize: (portrait ? 170 : 160) * u, color: INK, lineHeight: 1.05 }}>{EVENT.year}</span>
        </div>

        {/* parked row */}
        <div style={{ display: 'flex', gap: 24 * u, marginTop: (portrait ? 120 : 70) * u, height: carW * 0.55 }}>
          {THEMES.map((t, i) => {
            const p = park(i);
            return (
              <Car key={t.id} theme={t} width={carW * 0.85} spin={(1 - p) * 400} style={{ transform: `translateX(${(1 - p) * -W}px)` }} />
            );
          })}
        </div>
      </AbsoluteFill>

      <Sfx at={0} name="whoosh" volume={0.28} />
      <Sfx at={2} name="rev" volume={0.18} />
      <Sfx at={20} name="stamp" volume={0.35} />
      <Sfx at={32} name="pop" volume={0.3} />
      <Sfx at={46} name="whoosh" volume={0.15} />
    </AbsoluteFill>
  );
};

/* ================================================================= 3. YOU PICK */
const YouPick = () => {
  const frame = useCurrentFrame();
  const { u, portrait } = useLayout();
  const you = useSpring(12, { damping: 6, mass: 0.6 });
  const rest = useSpring(24, { damping: 10 });
  const shake = frame > 12 && frame < 22 ? Math.sin(frame * 4) * 8 * u : 0;
  return (
    <AbsoluteFill style={{ background: YELLOW, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          inset: '-60%',
          background: `repeating-conic-gradient(from 0deg, rgba(255,255,255,0.35) 0 10deg, transparent 10deg 20deg)`,
          transform: `rotate(${frame * 0.6}deg)`,
        }}
      />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 30 * u }}>
        <p style={{ ...stickerText(u, { color: INK, stroke: 0, drop: 0 }), fontSize: 80 * u, opacity: interpolate(frame, [0, 8], [0, 1], clamp), transform: `translateY(${interpolate(frame, [0, 8], [30, 0], clamp) * u}px)` }}>
          THIS YEAR…
        </p>
        <p style={{ ...stickerText(u, { color: RED, stroke: 12, drop: 22 }), fontSize: (portrait ? 400 : 360) * u, transform: `scale(${you}) rotate(${-6 + shake * 0.2}deg) translateX(${shake}px)` }}>
          YOU
        </p>
        <p style={{ ...stickerText(u, { color: CREAM, stroke: 9, drop: 14 }), fontSize: (portrait ? 120 : 130) * u, textAlign: 'center', transform: `scale(${rest})`, maxWidth: portrait ? '9ch' : 'none' }}>
          PICK THE THEME!
        </p>
      </AbsoluteFill>
      <Sfx at={12} name="stamp" volume={0.4} />
      <Sfx at={24} name="pop" volume={0.3} />
    </AbsoluteFill>
  );
};

/* ================================================================= 4-6. THEMES */
const ThemeBackground = ({ theme }) => {
  const frame = useCurrentFrame();
  const { u, H } = useLayout();
  const c = theme.colors;
  if (theme.id === 'food') {
    const s = 90 * u;
    return (
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(0deg, rgba(232,65,44,0.85) 0 ${s}px, transparent ${s}px ${s * 2}px), repeating-linear-gradient(90deg, rgba(232,65,44,0.85) 0 ${s}px, ${CREAM} ${s}px ${s * 2}px)`,
          backgroundPosition: `${frame * 2 * u}px 0`,
        }}
      >
        <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.35), transparent 60%)' }} />
      </AbsoluteFill>
    );
  }
  if (theme.id === 'sea') {
    return (
      <AbsoluteFill style={{ background: `linear-gradient(180deg, #8EE6F5 0%, ${c.main} 40%, ${c.deep} 100%)`, overflow: 'hidden' }}>
        {Array.from({ length: 26 }, (_, i) => {
          const r = (k) => random(`bub-${k}-${i}`);
          const size = (20 + r('s') * 50) * u;
          const y = H + 100 * u - ((r('o') * H + frame * (4 + r('v') * 6) * u) % (H + 200 * u));
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${r('x') * 100}%`,
                top: y,
                width: size,
                height: size,
                borderRadius: '50%',
                border: `${5 * u}px solid rgba(255,255,255,0.75)`,
                transform: `translateX(${Math.sin(frame / 8 + i) * 14 * u}px)`,
              }}
            />
          );
        })}
      </AbsoluteFill>
    );
  }
  // monster: warm sky, hazard bands, dirt
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${c.light} 0%, #FFCF6B 100%)`, overflow: 'hidden' }}>
      {[0, 1].map((k) => (
        <div
          key={k}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            [k ? 'bottom' : 'top']: 0,
            height: 70 * u,
            background: `repeating-linear-gradient(45deg, ${INK} 0 ${40 * u}px, ${c.main} ${40 * u}px ${80 * u}px)`,
            backgroundPosition: `${(k ? -1 : 1) * frame * 4 * u}px 0`,
            borderBlock: `${8 * u}px solid ${INK}`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const ThemeScene = ({ theme, index }) => {
  const frame = useCurrentFrame();
  const { W, u, portrait } = useLayout();
  const { dur } = SCENES[`theme${index}`];
  const wipe = interpolate(frame, [0, 10], [0, 150], { ...clamp, easing: Easing.out(Easing.cubic) });
  const carIn = useSpring(3, { damping: 12, mass: 0.9 });
  const exit = interpolate(frame, [dur - 10, dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const title = useSpring(16, { damping: 9, mass: 0.7 });
  const tag = useSpring(26, { damping: 10 });
  const label = useSpring(4, { damping: 12 });
  const ideas = theme.ideas.slice(0, portrait ? 4 : 4);

  const carW = (portrait ? 860 : 900) * u;
  const bounceAmp = theme.id === 'monster' ? 22 : 8;
  const bounce = Math.abs(Math.sin(frame / (theme.id === 'monster' ? 3 : 4))) * bounceAmp * u * (1 - Math.min(1, frame / 60)) + Math.sin(frame / 3) * 3 * u;
  const carX = (1 - carIn) * -W * 1.1 + exit * W * 1.4;
  const spin = frame * 30 * (1 - carIn * 0.85) + exit * 900;

  const nameSize = theme.name.length > 20 ? (portrait ? 96 : 100) : portrait ? 128 : 130;
  const accentBg = theme.id === 'monster' ? INK : theme.colors.deep;

  const carBlock = (
    <div style={{ position: 'relative', transform: `translate(${carX}px, ${-bounce}px)`, width: carW }}>
      {theme.id === 'monster' &&
        [0, 1, 2].map((k) => {
          const t = (frame + k * 7) % 21;
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: -40 * u - t * 6 * u,
                bottom: 20 * u + t * 2 * u,
                width: (50 + t * 3) * u,
                height: (50 + t * 3) * u,
                borderRadius: '50%',
                background: '#8a6a45',
                border: `${5 * u}px solid ${INK}`,
                opacity: 1 - t / 21,
              }}
            />
          );
        })}
      <Car theme={theme} width={carW} spin={spin} />
    </div>
  );

  const textBlock = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: portrait ? 'center' : 'flex-start', gap: 26 * u, textAlign: portrait ? 'center' : 'left' }}>
      <Pill u={u} size={40} bg={CREAM} style={{ transform: `scale(${label})` }}>
        THEME {index + 1} OF 3
      </Pill>
      <p
        style={{
          ...stickerText(u, { color: CREAM, stroke: 9, drop: 14 }),
          fontSize: nameSize * u,
          lineHeight: 1.02,
          maxWidth: portrait ? 980 * u : 900 * u,
          transform: `scale(${interpolate(title, [0, 1], [2.4, 1])})`,
          opacity: Math.min(1, title * 2),
          textShadow: `0 ${10 * u}px 0 ${INK}, 0 ${18 * u}px 0 ${accentBg}`,
        }}
      >
        {theme.name.toUpperCase()}
      </p>
      <Pill u={u} size={46} bg={theme.colors.accent} style={{ transform: `scale(${tag}) rotate(-3deg)` }}>
        {theme.tagline}
      </Pill>
    </div>
  );

  const chips = (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: portrait ? 'center' : 'flex-start', gap: 18 * u, maxWidth: portrait ? 1000 * u : 900 * u }}>
      {ideas.map((idea, i) => {
        const s = spring({ frame: frame - (36 + i * 7), fps: 30, config: { damping: 9, mass: 0.5 } });
        return (
          <div
            key={idea}
            style={{
              padding: `${12 * u}px ${26 * u}px`,
              border: `${5 * u}px solid ${INK}`,
              borderRadius: 999,
              background: '#fff',
              color: INK,
              fontFamily: BODY,
              fontWeight: 900,
              fontSize: (portrait ? 44 : 40) * u,
              boxShadow: `0 ${6 * u}px 0 ${INK}`,
              transform: `scale(${s})`,
            }}
          >
            {idea}
          </div>
        );
      })}
    </div>
  );

  return (
    <AbsoluteFill style={{ clipPath: `circle(${wipe}% at 50% 50%)`, background: theme.colors.main }}>
      <ThemeBackground theme={theme} />
      {portrait ? (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'space-evenly', padding: `${120 * u}px ${40 * u}px` }}>
          {textBlock}
          {carBlock}
          {chips}
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', padding: `${90 * u}px ${70 * u}px`, gap: 40 * u }}>
          <div style={{ flex: '0 0 46%', display: 'grid', placeItems: 'center' }}>{carBlock}</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 40 * u }}>
            {textBlock}
            {chips}
          </div>
        </AbsoluteFill>
      )}
      <Sfx at={0} name="whoosh" volume={0.22} />
      {theme.id === 'sea' ? (
        [4, 9, 14].map((at) => <Sfx key={at} at={at} name="bubble" volume={0.25} />)
      ) : (
        <Sfx at={3} name="rev" volume={theme.id === 'monster' ? 0.24 : 0.16} />
      )}
      <Sfx at={16} name="stamp" volume={0.32} />
      {ideas.map((_, i) => (
        <Sfx key={i} at={36 + i * 7} name={theme.id === 'sea' ? 'bubble' : 'pop'} volume={0.2} />
      ))}
      <Sfx at={dur - 10} name="whoosh" volume={0.16} />
    </AbsoluteFill>
  );
};

/* ================================================================= 7. CTA */
const Cta = () => {
  const frame = useCurrentFrame();
  const { W, u, portrait } = useLayout();
  const vote = useSpring(4, { damping: 8, mass: 0.7 });
  const ask = useSpring(22, { damping: 12 });
  const url = useSpring(30, { damping: 9, mass: 0.7 });
  const carW = (portrait ? 300 : 320) * u;
  const flagWave = Math.sin(frame / 4) * 6;

  return (
    <AbsoluteFill style={{ clipPath: `circle(${interpolate(frame, [0, 10], [0, 150], clamp)}% at 50% 50%)` }}>
      <AsphaltBg glow="#5a3f8b" />
      <Confetti start={30} seed="cta" />
      <Checker size={50 * u} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 50 * u }} />
      <Checker size={50 * u} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50 * u }} />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: (portrait ? 60 : 34) * u, padding: `${80 * u}px ${40 * u}px` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 * u, transform: `scale(${vote})` }}>
          <Checker size={22 * u} style={{ width: 110 * u, height: 76 * u, border: `${6 * u}px solid #07070f`, borderRadius: 10 * u, transform: `skewY(${flagWave}deg) rotate(-10deg)` }} />
          <p style={{ ...stickerText(u, { color: YELLOW, stroke: 10, drop: 16 }), fontSize: (portrait ? 190 : 200) * u, textShadow: `0 ${12 * u}px 0 ${INK}, 0 ${22 * u}px 0 ${RED}` }}>
            VOTE!
          </p>
          <Checker size={22 * u} style={{ width: 110 * u, height: 76 * u, border: `${6 * u}px solid #07070f`, borderRadius: 10 * u, transform: `skewY(${-flagWave}deg) rotate(10deg)` }} />
        </div>

        <div style={{ display: 'flex', gap: 20 * u }}>
          {THEMES.map((t, i) => {
            const p = spring({ frame: frame - (10 + i * 5), fps: 30, config: { damping: 12 } });
            return <Car key={t.id} theme={t} width={carW} spin={(1 - p) * 500} style={{ transform: `translateX(${(1 - p) * -W}px)` }} />;
          })}
        </div>

        <p style={{ fontFamily: BODY, fontWeight: 900, fontSize: (portrait ? 64 : 54) * u, color: CREAM, margin: 0, textAlign: 'center', transform: `scale(${ask})` }}>
          Ask a grown-up to help you vote at
        </p>
        <div
          style={{
            padding: `${18 * u}px ${40 * u}px`,
            background: CREAM,
            border: `${8 * u}px solid #07070f`,
            borderRadius: 30 * u,
            boxShadow: `0 ${12 * u}px 0 #07070f`,
            transform: `scale(${url}) rotate(-2deg)`,
            maxWidth: '96%',
          }}
        >
          <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: (portrait ? 70 : 84) * u, color: INK, whiteSpace: 'nowrap' }}>{EVENT.siteUrl}</span>
        </div>
        <p style={{ fontFamily: DISPLAY, fontSize: 40 * u, color: YELLOW, margin: 0, letterSpacing: '0.08em', opacity: interpolate(frame, [40, 50], [0, 1], clamp) }}>
          {EVENT.pack.toUpperCase()} · PINEWOOD {EVENT.year}
        </p>
      </AbsoluteFill>
      <Sfx at={4} name="stamp" volume={0.38} />
      <Sfx at={10} name="whoosh" volume={0.18} />
      <Sfx at={30} name="chime" volume={0.28} />
    </AbsoluteFill>
  );
};

/* ================================================================= ROOT */
export const Hype = () => (
  <AbsoluteFill style={{ background: ASPHALT, fontFamily: BODY }}>
    <GlobalStyle />
    <Sequence from={SCENES.lights.from} durationInFrames={SCENES.lights.dur}><Lights /></Sequence>
    <Sequence from={SCENES.title.from} durationInFrames={SCENES.title.dur}><Title /></Sequence>
    <Sequence from={SCENES.you.from} durationInFrames={SCENES.you.dur}><YouPick /></Sequence>
    {THEMES.map((t, i) => (
      <Sequence key={t.id} from={SCENES[`theme${i}`].from} durationInFrames={SCENES[`theme${i}`].dur}>
        <ThemeScene theme={t} index={i} />
      </Sequence>
    ))}
    <Sequence from={SCENES.cta.from} durationInFrames={SCENES.cta.dur}><Cta /></Sequence>
  </AbsoluteFill>
);

/* ================================================================= OG IMAGE */
export const OgImage = () => {
  const u = 630 / 1080;
  return (
    <AbsoluteFill style={{ fontFamily: BODY }}>
      <GlobalStyle />
      <AsphaltBg glow="#4a3f8b" />
      <Checker size={30} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 30 }} />
      <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', padding: '40px 56px 70px', gap: 30 }}>
        <div style={{ flex: '0 0 55%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 22 }}>
          <p style={{ fontFamily: DISPLAY, color: YELLOW, fontSize: 24, margin: 0, letterSpacing: '0.12em' }}>{EVENT.pack.toUpperCase()} · PINEWOOD DERBY</p>
          <p style={{ ...stickerText(u, { stroke: 9, drop: 16 }), fontSize: 104, textShadow: `0 7px 0 ${INK}, 0 13px 0 ${RED}` }}>PINEWOOD</p>
          <div style={{ padding: '2px 26px', background: YELLOW, border: '5px solid #07070f', borderRadius: 18, boxShadow: '0 7px 0 #07070f', transform: 'rotate(-4deg)' }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 88, color: INK, lineHeight: 1.05 }}>{EVENT.year}</span>
          </div>
          <p style={{ ...stickerText(u, { stroke: 6, drop: 8 }), fontSize: 50, marginTop: 10 }}>
            <span style={{ color: RED }}>YOU</span> PICK THE THEME!
          </p>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          {THEMES.map((t, i) => (
            <Car key={t.id} theme={t} width={320} style={{ transform: `translateX(${(i - 1) * 24}px)` }} />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

