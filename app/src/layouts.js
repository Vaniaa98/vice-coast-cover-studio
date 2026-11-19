// Vice Coast Cover Studio — the nine cover layouts.
// Every layout is a function of the canvas size, returning panel rectangles
// as fractions of the canvas. The title band (roughly the bottom third) and
// the palm strip (the bottom tenth) are drawn over the panels, so a panel
// that runs to 0.70 of the height sits behind the title — the layered look
// of the podium covers. Panels may carry `rot` (tilted snapshots) or
// `slant` (slashed comic cuts); the renderer honours both.

export const CAPTIONS = [
  { place: 'OCEAN DRIVE', time: '6:42 PM', flavor: 'LOOKING FOR TROUBLE' },
  { place: 'MARINA DEL SOL', time: '7:40 PM', flavor: 'NO WITNESSES' },
  { place: 'TOWER 2', time: '6:10 PM', flavor: 'LAST SWIM' },
  { place: 'PALM BOULEVARD', time: '9:15 PM', flavor: 'LIGHTS OUT' },
  { place: 'INTERSTATE 6', time: '11:58 PM', flavor: 'FULL THROTTLE' },
  { place: 'PIER 26', time: '5:30 AM', flavor: 'GONE FISHING' },
  { place: 'SUNSET HEIGHTS', time: '8:30 PM', flavor: 'BIG MONEY' },
  { place: 'NEON ROW', time: '2:12 AM', flavor: 'NO SLEEP TILL DAWN' },
  { place: 'VICE PORT', time: '4:44 PM', flavor: 'EVERYTHING MUST GO' },
];

export const ROLES = [
  'THE DRIVER', 'THE ANGLER', 'THE DEALER', 'THE LOOKOUT',
  'THE MECHANIC', 'THE SINGER', 'THE RUNNER', 'THE BOSS',
  'ONE LAST SUMMER',
];

// Default photo for each panel slot: the hero always opens on the boulevard
// convertible, the rest cycle the sample set.
export const DEFAULT_PHOTOS = [0, 3, 2, 6, 1, 4, 5, 7, 0];

function r(x, y, w, h, extra = {}) {
  return { x, y, w, h, ...extra };
}

export const LAYOUTS = [
  {
    id: 'hero-grid',
    name: 'Hero + Grid',
    desc: 'One big hero, four small panels — the movie-poster look.',
    panels(W, H) {
      const z = 0.62 * H;
      return [
        r(0, 0, 0.56 * W, z),
        r(0.56 * W, 0, 0.22 * W, z / 2),
        r(0.78 * W, 0, 0.22 * W, z / 2),
        r(0.56 * W, z / 2, 0.22 * W, z / 2),
        r(0.78 * W, z / 2, 0.22 * W, z / 2),
      ];
    },
  },
  {
    id: 'whole-cast',
    name: 'Whole Cast',
    desc: 'Hero column plus eight small panels — the GTA loading screen.',
    panels(W, H) {
      const z = 0.62 * H;
      const out = [r(0, 0, 0.3 * W, z)];
      for (let row = 0; row < 2; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          out.push(r((0.3 + col * 0.175) * W, (row * z) / 2, 0.175 * W, z / 2));
        }
      }
      return out;
    },
  },
  {
    id: 'hero-three',
    name: 'Hero + Three',
    desc: 'A wide hero over three small panels.',
    panels(W, H) {
      const z = 0.62 * H;
      return [
        r(0, 0, W, 0.46 * H),
        r(0, 0.46 * H, W / 3, z - 0.46 * H),
        r(W / 3, 0.46 * H, W / 3, z - 0.46 * H),
        r((2 * W) / 3, 0.46 * H, W / 3, z - 0.46 * H),
      ];
    },
  },
  {
    id: 'full-bleed',
    name: 'Full Bleed',
    desc: 'One photo edge to edge, title over it.',
    panels(W, H) {
      return [r(0, 0, W, H)];
    },
  },
  {
    id: 'tilted',
    name: 'Tilted Snapshot',
    desc: 'Polaroid-tilted snapshots, 7-ace style.',
    panels(W, H) {
      const z = 0.62 * H;
      return [
        r(0.02 * W, 0.02 * H, 0.5 * W, 0.56 * H, { rot: -1.5 }),
        r(0.55 * W, 0.0, 0.22 * W, 0.29 * H, { rot: 1 }),
        r(0.78 * W, 0.02 * H, 0.21 * W, 0.29 * H, { rot: -1 }),
        r(0.54 * W, 0.32 * H, 0.24 * W, 0.28 * H, { rot: 2 }),
        r(0.79 * W, 0.31 * H, 0.2 * W, 0.29 * H, { rot: -2 }),
      ];
    },
  },
  {
    id: 'comic',
    name: 'Slashed Comic',
    desc: 'Diagonal-cut panels like a comic splash page.',
    panels(W, H) {
      const z = 0.62 * H;
      return [
        r(0, 0, 0.58 * W, z, { slant: 0.05 }),
        r(0.58 * W, 0, 0.42 * W, z / 2, { slant: -0.05 }),
        r(0.58 * W, z / 2, 0.21 * W, z / 2, { slant: 0.05 }),
        r(0.79 * W, z / 2, 0.21 * W, z / 2, { slant: -0.05 }),
      ];
    },
  },
  {
    id: 'six-hero',
    name: 'Six-Panel Hero',
    desc: 'Hero plus five — three over two.',
    panels(W, H) {
      const z = 0.62 * H;
      return [
        r(0, 0, 0.42 * W, z),
        r(0.42 * W, 0, (0.58 * W) / 3, z / 2),
        r(0.42 * W + (0.58 * W) / 3, 0, (0.58 * W) / 3, z / 2),
        r(0.42 * W + (2 * 0.58 * W) / 3, 0, (0.58 * W) / 3, z / 2),
        r(0.42 * W, z / 2, 0.29 * W, z / 2),
        r(0.71 * W, z / 2, 0.29 * W, z / 2),
      ];
    },
  },
  {
    id: 'story-strip',
    name: 'Story Strip',
    desc: 'Four tall panels in a film-strip row.',
    panels(W, H) {
      const z = 0.62 * H;
      const widths = [0.3, 0.24, 0.22, 0.24];
      const out = [];
      let x = 0;
      for (const w of widths) {
        out.push(r(x * W, 0, w * W, z));
        x += w;
      }
      return out;
    },
  },
  {
    id: 'duo-split',
    name: 'Duo Split',
    desc: 'Two big panels, one title — the double feature.',
    panels(W, H) {
      const z = 0.62 * H;
      return [r(0, 0, 0.5 * W, z), r(0.5 * W, 0, 0.5 * W, z)];
    },
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}
