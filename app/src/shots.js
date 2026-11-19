// Vice Coast Cover Studio — fixed scenes for screenshots.
// ?shot=cover renders one exported cover alone; ?shot=editor shows the app
// with a photo loaded. Every parameter is fixed by the query string, so a
// screenshot taken from the same URL is always the same picture.
// window.__shotReady is set once the cover is painted.

import { defaultState, SAMPLE_PHOTOS, SIZES } from './editor.js';
import { CAPTIONS, ROLES, DEFAULT_PHOTOS } from './layouts.js';
import { renderCover } from './cover.js';
import { loadImage } from './editor.js';

function param(query, key, fallback) {
  const v = query.get(key);
  return v === null || v === '' ? fallback : v;
}

export async function runShot(shot, query, editor) {
  const state = defaultState();
  state.layout = param(query, 'layout', 'hero-grid');
  state.grade = param(query, 'grade', 'sunset');
  state.titleStyle = param(query, 'titleStyle', 'sunset');
  state.title = param(query, 'title', 'VICE COAST');
  state.subtitle = param(query, 'subtitle', 'Neon Tide');
  state.quote = param(query, 'quote', 'A FEVER DREAM IN NEON');
  state.quoteSource = param(query, 'quoteSource', 'THE COAST HERALD');
  state.tagline = param(query, 'tagline', 'ONE COAST · NO RULES · COMING SOON');
  state.captionMode = param(query, 'captionMode', 'place');
  state.badgeLabel = param(query, 'badgeLabel', 'WANTED');
  state.vol = param(query, 'vol', 'VOL. 06');
  state.ink = query.get('ink') === '1';
  state.halftone = query.get('halftone') === '1';
  state.grain = query.get('grain') !== '0';
  const sizeKey = param(query, 'size', '1080x1350');
  state.size = SIZES[sizeKey] ? sizeKey : '1080x1350';

  // Load the sample photos, then point every panel at them in order.
  const photos = [];
  for (const s of SAMPLE_PHOTOS) {
    try {
      const img = await loadImage(`samples/${s.file}`);
      photos.push({ name: s.name, img, sample: true });
    } catch (e) {
      // Skip a missing sample; the cover still renders.
    }
  }
  state.photos = photos;
  state.panels = CAPTIONS.map((c, i) => ({
    photo: DEFAULT_PHOTOS[i % DEFAULT_PHOTOS.length] % Math.max(1, photos.length),
    zoom: 1,
    ox: 0,
    oy: 0,
    caption: { ...c, role: ROLES[i % ROLES.length] },
  }));

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('stage');
    const size = SIZES[state.size];
    canvas.width = size.w;
    canvas.height = size.h;
    renderCover(canvas, state);
  } else {
    // Editor shot: reuse the live editor with this fixed state.
    editor.state = state;
    editor.selected = 0;
    editor.render();
  }
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
