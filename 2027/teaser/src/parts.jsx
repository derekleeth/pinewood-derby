import { AbsoluteFill, Audio, Sequence, random, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadBungee } from '@remotion/google-fonts/Bungee';
import { loadFont as loadNunito } from '@remotion/google-fonts/Nunito';
import { carFor, classicCar } from '../../shared/art.js';

export const { fontFamily: DISPLAY } = loadBungee();
export const { fontFamily: BODY } = loadNunito('normal', { weights: ['800', '900'] });

export const INK = '#1B1B2F';
export const CREAM = '#FFF4DF';
export const YELLOW = '#FFD23F';
export const RED = '#EF3E36';
export const GREEN = '#2EC46D';
export const ASPHALT = '#23253A';

/** Layout helper: u = 1 when the short side is 1080px. */
export function useLayout() {
  const { width, height } = useVideoConfig();
  return { W: width, H: height, portrait: height > width, u: Math.min(width, height) / 1080 };
}

export const GlobalStyle = () => (
  <style>{`
    .car-art { display: block; width: 100%; height: auto; overflow: visible; }
  `}</style>
);

/** Big outlined "sticker" display text. */
export function stickerText(u, { color = CREAM, stroke = 7, drop = 12, shadow = INK } = {}) {
  return {
    fontFamily: DISPLAY,
    color,
    WebkitTextStroke: `${stroke * u}px ${INK}`,
    paintOrder: 'stroke fill',
    textShadow: `0 ${drop * u}px 0 ${shadow}`,
    lineHeight: 1,
    margin: 0,
  };
}

export const Car = ({ theme, width, spin = 0, style }) => (
  <div style={{ width, ...style }} dangerouslySetInnerHTML={{ __html: carFor(theme, { spin }) }} />
);

export const ClassicCar = ({ width, spin = 0, color, stripe, style }) => (
  <div style={{ width, ...style }} dangerouslySetInnerHTML={{ __html: classicCar({ spin, color, stripe }) }} />
);

export const Sfx = ({ at, name, volume = 0.3 }) => (
  <Sequence from={at} durationInFrames={60} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

export const AsphaltBg = ({ glow = '#3b3f6b' }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(110% 70% at 50% 0%, ${glow} 0%, transparent 70%), linear-gradient(180deg, #1b1c30 0%, ${ASPHALT} 60%, #2b2e48 100%)`,
    }}
  />
);

export const Checker = ({ size, style }) => (
  <div
    style={{
      backgroundColor: '#fff',
      backgroundImage: `conic-gradient(${INK} 25%, #fff 0 50%, ${INK} 0 75%, #fff 0)`,
      backgroundSize: `${size}px ${size}px`,
      ...style,
    }}
  />
);

/** Horizontal speed streaks rushing left. */
export const SpeedLines = ({ count = 18, speed = 90, color = 'rgba(255,244,223,0.35)', seed = 'lines' }) => {
  const frame = useCurrentFrame();
  const { W, H, u } = useLayout();
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {Array.from({ length: count }, (_, i) => {
        const y = random(`${seed}-y-${i}`) * H;
        const len = (180 + random(`${seed}-l-${i}`) * 420) * u;
        const v = speed * (0.6 + random(`${seed}-v-${i}`) * 0.8) * u;
        const start = random(`${seed}-s-${i}`) * (W + len);
        const x = W - ((start + frame * v) % (W + len * 2));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: len,
              height: Math.max(4, 8 * u * random(`${seed}-h-${i}`)),
              borderRadius: 99,
              background: color,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Falling paper confetti. */
export const Confetti = ({ count = 70, colors = [RED, YELLOW, '#12A8C9', '#7BD94A', CREAM], seed = 'c', start = 0 }) => {
  const frame = useCurrentFrame() - start;
  const { W, H, u } = useLayout();
  if (frame < 0) return null;
  return (
    <AbsoluteFill style={{ overflow: 'hidden', pointerEvents: 'none' }}>
      {Array.from({ length: count }, (_, i) => {
        const r = (k) => random(`${seed}-${k}-${i}`);
        const x0 = r('x') * W;
        const fall = (6 + r('v') * 10) * u;
        const y = -60 * u - r('d') * H * 0.6 + frame * fall;
        const sway = Math.sin(frame / (6 + r('s') * 6) + r('p') * 6) * 40 * u;
        const size = (14 + r('z') * 18) * u;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x0 + sway,
              top: y,
              width: size,
              height: size * 0.6,
              background: colors[i % colors.length],
              border: `${2 * u}px solid ${INK}`,
              transform: `rotate(${frame * (8 + r('r') * 14)}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const Pill = ({ children, u, bg = YELLOW, color = INK, size = 44, style }) => (
  <div
    style={{
      display: 'inline-block',
      padding: `${10 * u}px ${30 * u}px`,
      border: `${6 * u}px solid ${INK}`,
      borderRadius: 999,
      background: bg,
      color,
      fontFamily: DISPLAY,
      fontSize: size * u,
      lineHeight: 1.1,
      boxShadow: `0 ${8 * u}px 0 ${INK}`,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);
