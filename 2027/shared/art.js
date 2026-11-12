// Original car artwork, drawn as SVG strings so both the website and the Remotion
// video can use the exact same art. No external images, no trademarks.
//
// Every function returns an <svg> string. Options:
//   spin   - wheel rotation in degrees (Remotion animates this per frame)
//   uid    - unique suffix for pattern/clip ids when several SVGs share a page
//   title  - accessible label (omit for decorative use)

const INK = '#1B1B2F';
let counter = 0;
const nextId = () => `a${++counter}`;

function svgOpen(viewBox, title, extraClass = '') {
  const label = title
    ? `role="img" aria-label="${title}"`
    : 'aria-hidden="true" focusable="false"';
  return `<svg class="car-art ${extraClass}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" ${label}>`;
}

export function wheel(cx, cy, r, hub = '#FFC233', spin = 0, tread = false) {
  const spokes = [0, 60, 120]
    .map((a) => {
      const rad = ((a + spin) * Math.PI) / 180;
      const dx = Math.cos(rad) * r * 0.42;
      const dy = Math.sin(rad) * r * 0.42;
      return `<line x1="${cx - dx}" y1="${cy - dy}" x2="${cx + dx}" y2="${cy + dy}" stroke="${INK}" stroke-width="${Math.max(2, r * 0.1)}" stroke-linecap="round"/>`;
    })
    .join('');
  const treadRing = tread
    ? `<circle cx="${cx}" cy="${cy}" r="${r - 3}" fill="none" stroke="#3a3a52" stroke-width="6" stroke-dasharray="7 6" transform="rotate(${spin} ${cx} ${cy})"/>`
    : '';
  return `<g class="wheel">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${INK}"/>
    ${treadRing}
    <circle cx="${cx}" cy="${cy}" r="${r * 0.6}" fill="#E9E6F2" stroke="${INK}" stroke-width="3"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.48}" fill="${hub}"/>
    ${spokes}
    <circle cx="${cx}" cy="${cy}" r="${r * 0.14}" fill="${INK}"/>
  </g>`;
}

function shadow(cx, w, y = 134) {
  return `<ellipse class="car-shadow" cx="${cx}" cy="${y}" rx="${w / 2}" ry="5" fill="${INK}" opacity="0.18"/>`;
}

function numberBadge(x, y, n = '27', fill = '#FFF8EC') {
  return `<g><circle cx="${x}" cy="${y}" r="12" fill="${fill}" stroke="${INK}" stroke-width="3"/>
  <text x="${x}" y="${y + 5}" text-anchor="middle" font-family="Bungee, Impact, sans-serif" font-size="13" fill="${INK}">${n}</text></g>`;
}

/* ------------------------------------------------------------------ HOT DOG */
export function hotdogCar({ spin = 0, title = '', uid = nextId() } = {}) {
  return `${svgOpen('0 0 260 140', title, 'car-hotdog')}
  ${shadow(130, 210)}
  <g stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
    <!-- antenna flag -->
    <line x1="214" y1="62" x2="226" y2="22" fill="none"/>
    <g class="flag" transform="translate(226 22)">
      <rect x="0" y="0" width="26" height="18" fill="#fff"/>
      <rect x="0" y="0" width="6.5" height="6" fill="${INK}" stroke="none"/>
      <rect x="13" y="0" width="6.5" height="6" fill="${INK}" stroke="none"/>
      <rect x="6.5" y="6" width="6.5" height="6" fill="${INK}" stroke="none"/>
      <rect x="19.5" y="6" width="6.5" height="6" fill="${INK}" stroke="none"/>
      <rect x="0" y="12" width="6.5" height="6" fill="${INK}" stroke="none"/>
      <rect x="13" y="12" width="6.5" height="6" fill="${INK}" stroke="none"/>
    </g>
    <!-- back bun lip -->
    <rect x="28" y="60" width="204" height="24" rx="12" fill="#E08A3C"/>
    <!-- sausage -->
    <rect x="8" y="56" width="244" height="28" rx="14" fill="#D9442B"/>
    <path d="M24 62 Q130 56 236 62" fill="none" stroke="#F58B6E" stroke-width="4"/>
    <!-- mustard -->
    <polyline points="30,72 44,64 58,74 72,64 86,74 100,64 114,74 128,64 142,74 156,64 170,74 184,64 198,74 212,64 226,72"
      fill="none" stroke="#FFC233" stroke-width="7"/>
    <polyline points="30,72 44,64 58,74 72,64 86,74 100,64 114,74 128,64 142,74 156,64 170,74 184,64 198,74 212,64 226,72"
      fill="none" stroke="${INK}" stroke-width="1.5" opacity="0.25"/>
    <!-- front bun -->
    <path d="M22 84 Q22 76 34 76 L226 76 Q238 76 238 84 L238 96 Q238 112 220 112 L40 112 Q22 112 22 96 Z" fill="#F2A65A"/>
    <path d="M40 86 L220 86" fill="none" stroke="#FFD29A" stroke-width="4"/>
    <!-- sesame -->
    <g fill="#FFF3D6" stroke="none">
      <ellipse cx="60" cy="98" rx="3" ry="1.8"/><ellipse cx="92" cy="102" rx="3" ry="1.8"/>
      <ellipse cx="172" cy="100" rx="3" ry="1.8"/><ellipse cx="204" cy="96" rx="3" ry="1.8"/>
    </g>
  </g>
  ${numberBadge(130, 98, '27')}
  ${wheel(64, 116, 19, '#FFC233', spin)}
  ${wheel(196, 116, 19, '#FFC233', spin)}
</svg>`;
}

/* -------------------------------------------------------------------- SHARK */
export function sharkCar({ spin = 0, title = '', uid = nextId() } = {}) {
  return `${svgOpen('0 0 260 140', title, 'car-shark')}
  ${shadow(132, 210)}
  <g class="bubbles" fill="#C8F4FF" stroke="${INK}" stroke-width="2.5">
    <circle cx="246" cy="52" r="5"/><circle cx="236" cy="34" r="3.5"/><circle cx="250" cy="20" r="2.5"/>
  </g>
  <g stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
    <!-- tail fin -->
    <path d="M40 84 L10 54 L22 86 L8 116 Z" fill="#5B7A97"/>
    <!-- dorsal fin -->
    <path d="M118 58 L136 18 Q142 14 146 22 L166 58 Z" fill="#5B7A97"/>
    <!-- body -->
    <path d="M32 86 C60 58 150 50 210 60 C236 64 252 78 254 92 C240 106 200 112 150 112 L64 110 C46 108 36 100 32 86 Z" fill="#7C9BB8"/>
    <!-- belly -->
    <path d="M66 100 Q160 116 250 94 Q238 110 160 112 Q100 112 66 100 Z" fill="#E6F0F8"/>
    <!-- gills -->
    <path d="M176 72 Q172 82 176 92 M186 72 Q182 82 186 92 M196 72 Q192 82 196 92" fill="none" stroke-width="3"/>
    <!-- mouth + teeth -->
    <path d="M206 96 Q228 102 248 92" fill="none" stroke-width="3"/>
    <polygon points="212,97 216,104 220,98 224,105 228,98 232,104 236,97 240,102 244,95" fill="#fff" stroke-width="2"/>
    <!-- fin stripe -->
    <path d="M84 70 Q120 62 160 64" fill="none" stroke="#B9D3E8" stroke-width="5"/>
  </g>
  <!-- eye -->
  <circle cx="224" cy="76" r="7" fill="#fff" stroke="${INK}" stroke-width="3"/>
  <circle cx="226" cy="76" r="3.5" fill="${INK}"/>
  <circle cx="227.5" cy="74.5" r="1.2" fill="#fff"/>
  ${numberBadge(118, 88, '27', '#FF7A8A')}
  ${wheel(80, 116, 18, '#FF7A8A', spin)}
  ${wheel(198, 116, 18, '#FF7A8A', spin)}
</svg>`;
}

/* ------------------------------------------------------------ MONSTER TRUCK */
export function monsterCar({ spin = 0, title = '', uid = nextId() } = {}) {
  const pid = `haz-${uid}`;
  return `${svgOpen('0 0 260 140', title, 'car-monster')}
  <defs>
    <pattern id="${pid}" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="16" height="16" fill="#FFB000"/>
      <rect width="8" height="16" fill="${INK}"/>
    </pattern>
  </defs>
  ${shadow(130, 230, 136)}
  <g stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
    <!-- exhaust stack + puff -->
    <rect x="166" y="22" width="9" height="34" rx="2" fill="#B8B4C8"/>
    <g class="puff" fill="#EDEAF5" stroke-width="3">
      <circle cx="176" cy="14" r="6"/><circle cx="188" cy="8" r="4.5"/>
    </g>
    <!-- suspension -->
    <path d="M64 92 L84 74 M196 92 L176 74 M60 74 L200 74" fill="none" stroke-width="5"/>
    <!-- body -->
    <path d="M30 58 L84 58 L100 28 L158 28 L176 58 L232 58 Q242 58 242 68 L242 80 L22 80 L22 66 Q22 58 30 58 Z" fill="#FFB000"/>
    <!-- window -->
    <path d="M108 36 L152 36 L164 56 L98 56 Z" fill="#BFE9FF"/>
    <path d="M116 40 L126 40 L118 52" fill="none" stroke="#fff" stroke-width="3"/>
    <!-- hazard band -->
    <rect x="22" y="68" width="220" height="12" fill="url(#${pid})"/>
    <!-- light bar -->
    <rect x="106" y="20" width="48" height="8" rx="3" fill="${INK}"/>
    <circle cx="116" cy="24" r="2.5" fill="#FFE27A" stroke="none"/>
    <circle cx="130" cy="24" r="2.5" fill="#FFE27A" stroke="none"/>
    <circle cx="144" cy="24" r="2.5" fill="#FFE27A" stroke="none"/>
    <!-- lime flame stripe -->
    <path d="M34 62 L60 62 L52 66 L80 64" fill="none" stroke="#7BD94A" stroke-width="4"/>
  </g>
  ${numberBadge(206, 64, '27')}
  ${wheel(64, 104, 30, '#7BD94A', spin, true)}
  ${wheel(196, 104, 30, '#7BD94A', spin, true)}
</svg>`;
}

/* ------------------------------------------------------ CLASSIC DERBY CAR */
export function classicCar({ spin = 0, color = '#EF3E36', stripe = '#FFF8EC', number = '27', title = '' } = {}) {
  return `${svgOpen('0 0 260 140', title, 'car-classic')}
  ${shadow(130, 220)}
  <g stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M14 104 L14 84 Q14 76 24 74 L150 60 Q204 56 238 82 Q250 90 250 104 Z" fill="${color}"/>
    <path d="M24 86 L150 72 Q196 70 232 90" fill="none" stroke="${stripe}" stroke-width="7"/>
    <path d="M118 64 Q130 40 156 44 Q170 46 176 60 Z" fill="#BFE9FF"/>
    <rect x="14" y="60" width="14" height="22" rx="3" fill="${INK}"/>
  </g>
  ${numberBadge(90, 90, number)}
  ${wheel(62, 112, 19, stripe, spin)}
  ${wheel(206, 112, 19, stripe, spin)}
</svg>`;
}

export const CAR_ART = { hotdog: hotdogCar, shark: sharkCar, monster: monsterCar };

export function carFor(theme, opts = {}) {
  return (CAR_ART[theme.car] || classicCar)(opts);
}
