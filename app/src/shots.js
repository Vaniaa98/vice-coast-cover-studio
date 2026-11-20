// Vice Coast Cover Studio — fixed scenes for screenshots.
// ?shot=cover renders one exported cover alone; ?shot=editor shows the app
// with a photo loaded. Every parameter is fixed by the query string, so a
// screenshot taken from the same URL is always the same picture.
// window.__shotReady is set once the cover is painted.

import { defaultState, SAMPLE_PHOTOS, SIZES } from './editor.js';
import { CAPTIONS, ROLES, PHOTO_ROLES, DEFAULT_PHOTOS, layoutById } from './layouts.js';
import { renderCover } from './cover.js';
import { loadImage } from './editor.js';

function param(query, key, fallback) {
  const v = query.get(key);
  return v === null || v === '' ? fallback : v;
}

export async function runShot(shot, query, editor) {
  const state = defaultState();
  state.layout = param(query, 'layout', 'title-over-art');
  state.grade = param(query, 'grade', 'sunset');
  state.titleStyle = param(query, 'titleStyle', 'striped');
  state.title = param(query, 'title', 'VICE COAST');
  state.subtitle = param(query, 'subtitle', 'Neon Tide');
  state.quote = param(query, 'quote', 'A FEVER DREAM IN NEON');
  state.quoteSource = param(query, 'quoteSource', 'THE COAST HERALD');
  state.tagline = param(query, 'tagline', 'ONE COAST · NO RULES · COMING SOON');
  state.captionMode = param(query, 'captionMode', 'cast');
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
  // v3: a shot may pin its own photo per panel (?photos=0,8,11,7,1) so
  // each cover shows a different slice of the cast; otherwise the
  // default cast order applies.
  const photoList = (() => {
    const p = query.get('photos');
    if (!p) return null;
    const idx = p.split(',').map((s) => Number(s)).filter((n) => Number.isFinite(n) && n >= 0);
    return idx.length ? idx : null;
  })();
  const photoOrder = photoList || DEFAULT_PHOTOS;
  state.panels = CAPTIONS.map((c, i) => {
    const photoIdx = photoOrder[i % photoOrder.length] % Math.max(1, photos.length);
    return {
      photo: photoIdx,
      zoom: 1,
      ox: 0,
      oy: 0,
      // v3: the role names the person in the photo, not the panel slot.
      caption: { ...c, role: PHOTO_ROLES[photoIdx] || ROLES[i % ROLES.length] },
    };
  });

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('stage');
    const size = SIZES[state.size];
    canvas.width = size.w;
    canvas.height = size.h;
    renderCover(canvas, state);
  } else {
    // Editor shot: reuse the live editor with this fixed state, and sync
    // the visible controls (caption mode, size, active layout chip) so the
    // screenshot shows the shot's state, not the editor defaults.
    editor.state = state;
    editor.selected = 0;
    const capSel = document.getElementById('captionMode');
    if (capSel) capSel.value = state.captionMode;
    const sizeSel = document.getElementById('sizeSelect');
    if (sizeSel) sizeSel.value = state.size;
    const layoutList = document.getElementById('layoutList');
    const layoutName = layoutById(state.layout).name;
    if (layoutList) {
      for (const b of layoutList.children) {
        b.classList.toggle('active', b.textContent === layoutName);
      }
    }
    editor.render();
  }
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
