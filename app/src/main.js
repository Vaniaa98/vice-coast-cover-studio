// Vice Coast Cover Studio — boot.
// Loads the vendored fonts first (the cover is all lettering), then starts
// the editor. A ?shot= query renders a fixed scene for a screenshot instead.

import { Editor } from './editor.js';
import { runShot } from './shots.js';

async function loadFonts() {
  const faces = [
    { family: 'Anton', weight: '400' },
    { family: "'Bebas Neue'", weight: '400' },
    { family: 'Pacifico', weight: '400' },
  ];
  try {
    await Promise.all(faces.map((f) => document.fonts.load(`${f.weight} 32px ${f.family}`)));
    await document.fonts.ready;
  } catch (e) {
    // Fallback fonts still render; the cover only loses its display faces.
  }
}

const editor = new Editor(document);
// Exposed for debugging and for the finalist review's automated checks;
// the app itself never reads it.
window.__editor = editor;
const query = new URLSearchParams(location.search);
const shot = query.get('shot');

loadFonts().then(async () => {
  if (shot) {
    // Editor shots need the live editor (controls, photo library) built
    // first; runShot then swaps in the fixed shot state and re-renders.
    await editor.init();
    await runShot(shot, query, editor);
  } else {
    await editor.init();
  }
});
