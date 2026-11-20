// Vice Coast Cover Studio — the twelve cover layouts.
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
  'THE DRIVER', 'THE BOSS', 'THE CAPTAIN', 'THE FIXER',
  'THE NAVIGATOR', 'THE LOOKOUT', 'THE MECHANIC', 'THE RIDER',
  'THE INSIDER', 'THE COURIER', 'THE CLOSER', 'THE ANGLER',
];

// The role a photo plays in cast mode — the role follows the PHOTO, not
// the panel slot, so the label always names the person in the picture.
// (v2 labelled by panel index: the blonde navigator was "THE FIXER" and
// the mechanic was "THE CAPTAIN".)
export const PHOTO_ROLES = {
  0: 'THE DRIVER', 1: 'THE FIXER', 2: 'THE CAPTAIN', 3: 'THE LOOKOUT',
  4: 'THE RIDER', 5: 'THE INSIDER', 6: 'THE CLOSER', 7: 'THE ANGLER',
  8: 'THE BOSS', 9: 'THE MECHANIC', 10: 'THE NAVIGATOR', 11: 'THE COURIER',
};
// convertible, then the cast — boss, mechanic, navigator — then the gas
// station (the one scenery panel that still carries a figure). v3: faces,
// not landscapes; the pier angler and the courier fill the later slots.
// Indices: 0 boulevard, 1 gas, 2 marina, 3 tower, 4 car, 5 street,
// 6 coast, 7 pier, 8 boss, 9 mechanic, 10 navigator, 11 courier.
export const DEFAULT_PHOTOS = [0, 8, 9, 10, 1, 11, 7, 5, 0];

function r(x, y, w, h, extra = {}) {
  return { x, y, w, h, ...extra };
}

// Chrome shared by the three v2 layouts: the giant title overlaps the
// photos (title zone 0.44–0.68 of the height), the quote bar rides at the
// top, there is no dark band behind the title, and a billing line naming
// the cast sits just above the palm strip. Badges move to the corners so
// nothing covers the title. Panels run to 0.80 of the height, so the title
// overlaps their lower third — the layered look of the top covers.
const OVER_ART_CHROME = {
  titleY: 0.44, titleH: 0.24, subY: 0.70,
  quote: 'top', band: 'none', billingY: 0.855,
  seal: { x: 0.90, y: 0.82 }, vol: { x: 0.02, y: 0.83 },
  ribbon: { x: 0.02, y: 0.875 }, starburst: { x: 0.68, y: 0.30 },
};

export const LAYOUTS = [
  // --- v2 layouts: the podium look -------------------------------------------------
  {
    id: 'title-over-art',
    name: 'Title Over Art',
    desc: 'The podium look: giant title overlapping the photos, quote on top.',
    chrome: OVER_ART_CHROME,
    panels(W, H) {
      return [
        r(0.28 * W, 0, 0.44 * W, 0.80 * H, { ox: -0.55, oy: -0.1 }),
        r(0, 0, 0.28 * W, 0.40 * H),
        r(0, 0.40 * H, 0.28 * W, 0.40 * H),
        r(0.72 * W, 0, 0.28 * W, 0.40 * H),
        r(0.72 * W, 0.40 * H, 0.28 * W, 0.40 * H),
      ];
    },
  },
  {
    id: 'pop-out',
    name: 'Pop-Out Hero',
    desc: 'The hero breaks out of the grid and overlaps the title, Billboard Bay style.',
    chrome: OVER_ART_CHROME,
    panels(W, H) {
      // The hero is slot 0 (the boulevard convertible) and is drawn last —
      // the renderer draws `pop` panels on top of the rest — so it breaks
      // out over the four background plates and under the title.
      return [
        r(0.24 * W, -0.01 * H, 0.52 * W, 0.85 * H, {
          rot: -1.2, pop: true, frame: 'none', zoom: 1.15, ox: -0.5, oy: -0.25,
        }),
        r(0, 0, 0.30 * W, 0.40 * H),
        r(0, 0.40 * H, 0.30 * W, 0.40 * H),
        // v3: the pop-out hero overlaps the right column, so the right
        // panels' tags sit at their bottom-RIGHT — a bottom-left tag there
        // is half hidden behind the hero.
        r(0.70 * W, 0, 0.30 * W, 0.40 * H, { tag: 'right' }),
        r(0.70 * W, 0.40 * H, 0.30 * W, 0.40 * H, { tag: 'right' }),
      ];
    },
  },
  {
    id: 'slanted',
    name: 'Slanted Panels',
    desc: 'Tilted, overlapping panels with drop shadows, HEATWAVE style.',
    chrome: OVER_ART_CHROME,
    panels(W, H) {
      return [
        // v3: zoomed slightly and panned down (oy +0.35) so the hero's
        // face sits clear above the title instead of half behind it.
        r(0.01 * W, 0.01 * H, 0.46 * W, 0.78 * H, {
          rot: -2.5, frame: 'none', shadow: true, ox: -0.6, oy: 0.35, zoom: 1.1,
        }),
        r(0.45 * W, 0.0, 0.26 * W, 0.38 * H, { rot: 2, frame: 'none', shadow: true }),
        r(0.72 * W, 0.02 * H, 0.27 * W, 0.38 * H, { rot: -1.5, frame: 'none', shadow: true }),
        r(0.44 * W, 0.40 * H, 0.26 * W, 0.38 * H, { rot: -2, frame: 'none', shadow: true }),
        r(0.71 * W, 0.41 * H, 0.28 * W, 0.38 * H, { rot: 2.5, frame: 'none', shadow: true }),
      ];
    },
  },
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
