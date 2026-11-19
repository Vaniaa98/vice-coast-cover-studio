// Vice Coast Cover Studio — colour grades.
// A grade is a sunset / neon wash laid over a photo: a soft sky gradient, a
// warm tint in 'overlay' or 'soft-light' (both keep the photo's luminance, so
// skin tones survive — the grades are skin-safe by construction), a vignette
// and, at the cover level, film grain. No hue rotation, no channel swap: the
// photo stays recognisable, it just gets graded like a poster.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset',
    sky: ['#ffd23f', '#ff7a3d', '#ff2d78'],
    tint: '#ff5e3a',
    tintAlpha: 0.26,
    mode: 'overlay',
    vignette: 0.32,
  },
  {
    id: 'neon-coast',
    name: 'Neon Coast',
    sky: ['#ff9ff3', '#c44dff', '#2de2ff'],
    tint: '#b14bff',
    tintAlpha: 0.28,
    mode: 'overlay',
    vignette: 0.36,
  },
  {
    id: 'vice-nights',
    name: 'Vice Nights',
    sky: ['#8b5cf6', '#4c1d95', '#0ea5e9'],
    tint: '#5b2ee5',
    tintAlpha: 0.3,
    mode: 'soft-light',
    vignette: 0.44,
  },
  {
    id: 'heat-wave',
    name: 'Heat Wave',
    sky: ['#ffe259', '#ffa751', '#f83600'],
    tint: '#ff7b00',
    tintAlpha: 0.28,
    mode: 'overlay',
    vignette: 0.3,
  },
  {
    id: 'chrome-dawn',
    name: 'Chrome Dawn',
    sky: ['#f2f8ff', '#a9c3de', '#e8c96a'],
    tint: '#7fa8c9',
    tintAlpha: 0.2,
    mode: 'soft-light',
    vignette: 0.26,
  },
  {
    id: 'palm-noir',
    name: 'Palm Noir',
    sky: ['#34d399', '#0f766e', '#022c22'],
    tint: '#0d9488',
    tintAlpha: 0.28,
    mode: 'overlay',
    vignette: 0.48,
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// Lay one grade over a clipped rectangle (the caller clips to the panel).
export function applyGrade(ctx, rect, grade) {
  const { x, y, w, h } = rect;
  // Sky wash: a faint diagonal gradient in the grade's colours.
  const wash = ctx.createLinearGradient(x, y, x + w, y + h);
  wash.addColorStop(0, hexA(grade.sky[0], 0.1));
  wash.addColorStop(0.55, hexA(grade.sky[1], 0.08));
  wash.addColorStop(1, hexA(grade.sky[2], 0.12));
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  // Warm tint, strongest at the foot of the panel like a setting sun.
  const tint = ctx.createLinearGradient(x, y + h * 0.3, x, y + h);
  tint.addColorStop(0, hexA(grade.tint, 0));
  tint.addColorStop(1, hexA(grade.tint, grade.tintAlpha));
  ctx.save();
  ctx.globalCompositeOperation = grade.mode;
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  // Vignette: darken the corners so the panel reads as a poster plate.
  const v = ctx.createRadialGradient(
    x + w / 2, y + h / 2, Math.min(w, h) * 0.35,
    x + w / 2, y + h / 2, Math.max(w, h) * 0.75,
  );
  v.addColorStop(0, 'rgba(8,0,24,0)');
  v.addColorStop(1, `rgba(8,0,24,${grade.vignette * 0.55})`);
  ctx.fillStyle = v;
  ctx.fillRect(x, y, w, h);
}

// Ink: the poster-ink treatment (7-ace style) — a hard dark inner edge and a
// faint duotone pull, so panels look printed rather than pasted.
export function applyInk(ctx, rect) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.strokeStyle = 'rgba(10,0,20,0.4)';
  ctx.lineWidth = Math.max(2, w * 0.006);
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = 'rgba(20,0,40,0.06)';
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

export function hexA(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
