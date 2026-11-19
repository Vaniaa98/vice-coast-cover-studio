// Vice Coast Cover Studio — PNG export.
// Renders the current state off-screen at the exact post size and downloads
// it. The off-screen canvas uses the same renderCover as the live preview,
// so the file is pixel-identical to what the editor shows.

import { renderCover } from './cover.js';
import { SIZES } from './editor.js';

function renderOffscreen(state, sizeKey) {
  const size = SIZES[sizeKey];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  renderCover(canvas, state);
  return canvas;
}

function download(canvas, filename) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('no png'));
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve();
    }, 'image/png');
  });
}

export async function exportPNG(state, sizeKey) {
  const canvas = renderOffscreen(state, sizeKey);
  await download(canvas, `vice-coast-${sizeKey}.png`);
}

export async function exportAllSizes(state) {
  for (const sizeKey of Object.keys(SIZES)) {
    // A beat between downloads so the browser keeps each one.
    await exportPNG(state, sizeKey);
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
}
