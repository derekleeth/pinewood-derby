// The single source of truth for the 2027 theme vote.
// Used by the voting site (front end + Netlify Functions) and the Remotion video.
// To change themes next year: copy this folder into the new year and edit this list.

export const EVENT = {
  year: 2027,
  pack: 'Pack 210',
  title: 'Pinewood 2027',
  siteUrl: 'pack210-derby.netlify.app',
};

export const DENS = [
  { id: 'lions', name: 'Lions', color: '#FFC233' },
  { id: 'tigers', name: 'Tigers', color: '#FF8A2A' },
  { id: 'wolves', name: 'Wolves', color: '#EF3E36' },
  { id: 'bears', name: 'Bears', color: '#5AA9E6' },
  { id: 'webelos', name: 'Webelos', color: '#7C5CFF' },
  { id: 'aol', name: 'Arrow of Light', color: '#2EC4A6' },
];

export const THEMES = [
  {
    id: 'food',
    name: 'Food on Wheels',
    short: 'Food',
    tagline: 'Race your lunch!',
    description:
      'Turn your car into something yummy. Will it be a hot dog, a pizza slice, or a sprinkle donut?',
    ideas: ['Hot dog hot rod', 'Pizza slice speedster', 'Taco truck', 'Sprinkle donut dragster'],
    colors: { main: '#E8412C', accent: '#FFC233', deep: '#8F1D12', light: '#FFE9B8' },
    car: 'hotdog',
  },
  {
    id: 'sea',
    name: 'Under the Sea',
    short: 'Sea',
    tagline: 'Dive into the race!',
    description:
      'Make a car from the deep blue sea. Build a shark, a submarine, or a pirate ship!',
    ideas: ['Shark attack racer', 'Yellow submarine', 'Pirate ship', 'Octopus cruiser'],
    colors: { main: '#12A8C9', accent: '#FF7A8A', deep: '#0B3D6B', light: '#C8F4FF' },
    car: 'shark',
  },
  {
    id: 'monster',
    name: 'Monster Trucks & Wild Machines',
    short: 'Monster Trucks',
    tagline: 'Big wheels. Big noise!',
    description:
      'Go big and tough. Build a monster truck, a bulldozer, a tractor, or a train!',
    ideas: ['Monster truck', 'Bulldozer', 'Farm tractor', 'Steam train'],
    colors: { main: '#FFB000', accent: '#7BD94A', deep: '#3B2A1A', light: '#FFE7A3' },
    car: 'monster',
  },
];

export const THEME_IDS = THEMES.map((t) => t.id);
export const DEN_IDS = DENS.map((d) => d.id);
