// Vice Coast Cover Studio — lettering and poster furniture.
// Everything the podium covers wear on top of their panels: the giant
// gradient title, the neon script subtitle, the quote bar, the badges
// (WANTED stars, EST. seal, VOL. ticket, COLLECTOR'S EDITION ribbon,
// ORIGINAL starburst) and the palm strip with tagline, footer and barcode.
// All original art drawn in canvas — no Rockstar logo, artwork or font.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function star(ctx, cx, cy, points, rOuter, rInner, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const rad = i % 2 === 0 ? rOuter : rInner;
    const a = rot + (i * Math.PI) / points;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function fitSize(ctx, text, maxWidth, start, family, weight = '') {
  let size = start;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

export const TITLE_STYLES = {
  sunset: {
    name: 'Sunset',
    stops: [[0, '#ffe259'], [0.45, '#ff7a3d'], [1, '#ff2d78']],
    shadow: '#7b1fa2',
  },
  chrome: {
    name: 'Chrome',
    stops: [[0, '#f4faff'], [0.4, '#a9c3de'], [0.65, '#e8c96a'], [1, '#7d99bd']],
    shadow: '#1e3a5f',
  },
  neon: {
    name: 'Neon',
    stops: [[0, '#ff9ff3'], [0.5, '#ff2d78'], [1, '#b967ff']],
    shadow: '#4a00e0',
  },
};

// The giant block title. Auto-fits; splits into two lines when one line
// would get too small. Returns the height the title consumed.
export function drawTitle(ctx, text, box, styleId) {
  const style = TITLE_STYLES[styleId] || TITLE_STYLES.sunset;
  const { x, y, w, h } = box;
  const upper = text.toUpperCase();
  let size = fitSize(ctx, upper, w * 0.96, h, 'Anton');
  let lines = [upper];
  if (size < h * 0.62 && upper.includes(' ')) {
    const words = upper.split(' ');
    const mid = Math.ceil(words.length / 2);
    lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
    size = fitSize(ctx, lines[0], w * 0.96, h * 0.58, 'Anton');
    size = Math.min(size, fitSize(ctx, lines[1], w * 0.96, h * 0.58, 'Anton'));
  }
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  for (const [stop, color] of style.stops) grad.addColorStop(stop, color);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${size}px Anton`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#0a0a12';
  ctx.lineWidth = Math.max(3, size * 0.11);
  ctx.shadowColor = style.shadow;
  ctx.shadowBlur = size * 0.22;
  ctx.shadowOffsetY = size * 0.05;
  const lineH = size * 1.02;
  const totalH = lineH * lines.length;
  lines.forEach((line, i) => {
    const cy = y + (h - totalH) / 2 + lineH * (i + 0.5);
    ctx.strokeText(line, x + w / 2, cy);
    ctx.fillStyle = grad;
    ctx.fillText(line, x + w / 2, cy);
  });
  ctx.restore();
  return totalH;
}

// Neon script subtitle, slightly tilted, glowing pink.
export function drawSubtitle(ctx, text, cx, cy, size) {
  if (!text) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.03);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${size}px Pacifico`;
  ctx.shadowColor = '#ff2d78';
  ctx.shadowBlur = size * 0.55;
  ctx.fillStyle = '#ff8fd1';
  ctx.fillText(text, 0, 0);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffd7ef';
  ctx.fillText(text, 0, -size * 0.04);
  ctx.restore();
}

// Black pill: five gold stars, a press quote and its source.
export function drawQuoteBar(ctx, x, y, w, h, quote, source) {
  ctx.save();
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(5,2,12,0.92)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,210,63,0.55)';
  ctx.lineWidth = Math.max(1, h * 0.05);
  ctx.stroke();
  const pad = h * 0.35;
  let cx = x + pad;
  const starR = h * 0.26;
  ctx.fillStyle = '#ffd23f';
  for (let i = 0; i < 5; i += 1) {
    star(ctx, cx, y + h / 2, 5, starR, starR * 0.45);
    ctx.fill();
    cx += starR * 2.4;
  }
  const text = `“${quote}”  —  ${source}`;
  const size = fitSize(ctx, text, w - (cx - x) - pad, h * 0.52, "'Bebas Neue'");
  ctx.font = `${size}px 'Bebas Neue'`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff7e6';
  ctx.fillText(text, cx + pad * 0.4, y + h / 2 + size * 0.04);
  ctx.restore();
}

// WANTED pill with five stars, top corner of the cover. The label takes the
// left half, the stars the right half — sized from the pill so nothing is
// ever clipped at the edge.
export function drawWanted(ctx, x, y, w, h, label = 'WANTED') {
  ctx.save();
  roundRect(ctx, x, y, w, h, h * 0.28);
  ctx.fillStyle = 'rgba(5,2,12,0.92)';
  ctx.fill();
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = Math.max(1, h * 0.06);
  ctx.stroke();
  const size = fitSize(ctx, label, w * 0.42, h * 0.5, "'Bebas Neue'");
  ctx.font = `${size}px 'Bebas Neue'`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, x + w * 0.25, y + h / 2 + size * 0.04);
  const starR = Math.min(h * 0.2, w * 0.075);
  const step = (w * 0.44) / 5;
  let cx = x + w * 0.53 + starR;
  ctx.fillStyle = '#ffd23f';
  for (let i = 0; i < 5; i += 1) {
    star(ctx, cx, y + h / 2, 5, starR, starR * 0.45);
    ctx.fill();
    cx += step;
  }
  ctx.restore();
}

// Gold serrated seal: EST. 2026.
export function drawSeal(ctx, cx, cy, r, year = '2026') {
  ctx.save();
  ctx.translate(cx, cy);
  star(ctx, 0, 0, 24, r, r * 0.92);
  const g = ctx.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, '#ffe98a');
  g.addColorStop(0.5, '#f5b301');
  g.addColorStop(1, '#c98a00');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#7a5200';
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
  ctx.fillStyle = '#f7c948';
  ctx.fill();
  ctx.strokeStyle = '#7a5200';
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.stroke();
  ctx.fillStyle = '#231400';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${r * 0.34}px 'Bebas Neue'`;
  ctx.fillText('EST.', 0, -r * 0.24);
  ctx.font = `${r * 0.52}px 'Bebas Neue'`;
  ctx.fillText(year, 0, r * 0.22);
  ctx.restore();
}

// A small rotated ticket: VOL. 06.
export function drawVolTicket(ctx, x, y, w, h, text = 'VOL. 06') {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(-0.06);
  roundRect(ctx, -w / 2, -h / 2, w, h, h * 0.2);
  ctx.fillStyle = '#19c2ff';
  ctx.fill();
  ctx.strokeStyle = '#062a3a';
  ctx.lineWidth = Math.max(1, h * 0.08);
  ctx.stroke();
  ctx.fillStyle = '#062a3a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const size = fitSize(ctx, text, w * 0.86, h * 0.62, "'Bebas Neue'");
  ctx.font = `${size}px 'Bebas Neue'`;
  ctx.fillText(text, 0, size * 0.05);
  ctx.restore();
}

// Pink ribbon with folded ends: COLLECTOR'S EDITION.
export function drawRibbon(ctx, x, y, w, h, text = "COLLECTOR'S EDITION") {
  ctx.save();
  ctx.fillStyle = '#ff2d78';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - h * 0.4, y + h / 2);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + h * 0.4, y + h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(10,0,20,0.6)';
  ctx.lineWidth = Math.max(1, h * 0.06);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const size = fitSize(ctx, text, w * 0.86, h * 0.55, "'Bebas Neue'");
  ctx.font = `${size}px 'Bebas Neue'`;
  ctx.fillText(text, x + w / 2, y + h / 2 + size * 0.05);
  ctx.restore();
}

// Pink starburst: ORIGINAL / COVER ART.
export function drawStarburst(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  star(ctx, 0, 0, 16, r, r * 0.78);
  ctx.fillStyle = '#ff2d78';
  ctx.fill();
  ctx.strokeStyle = '#0a0a12';
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${r * 0.26}px 'Bebas Neue'`;
  ctx.fillText('ORIGINAL', 0, -r * 0.16);
  ctx.font = `${r * 0.22}px 'Bebas Neue'`;
  ctx.fillText('COVER ART', 0, r * 0.18);
  ctx.restore();
}

// One palm silhouette: a curved trunk and five fronds.
export function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(2, -18, 8, -30);
  ctx.stroke();
  for (let i = 0; i < 5; i += 1) {
    const a = -Math.PI * (0.15 + i * 0.17);
    ctx.beginPath();
    ctx.moveTo(8, -30);
    ctx.quadraticCurveTo(
      8 + Math.cos(a) * 20, -30 + Math.sin(a) * 14 - 7,
      8 + Math.cos(a) * 32, -30 + Math.sin(a) * 24 + 7,
    );
    ctx.stroke();
  }
  ctx.restore();
}

// Halftone dots over a band: the printed-poster texture.
export function halftoneBand(ctx, rect, spacing = 11) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  for (let py = y + spacing / 2; py < y + h; py += spacing) {
    const t = (py - y) / h;
    const r = 0.8 + t * 2.2;
    for (let px = x + spacing / 2; px < x + w; px += spacing) {
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// The bottom strip: palm silhouettes, tagline, footer microcopy, barcode.
export function drawStrip(ctx, rect, tagline, footer, seed) {
  const { x, y, w, h } = rect;
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#1b0533');
  g.addColorStop(0.5, '#3d0a4e');
  g.addColorStop(1, '#12041f');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  const palmColor = 'rgba(255,150,80,0.5)';
  const palmH = h * 0.85;
  const s = palmH / 34;
  let px = x + w * 0.03;
  while (px < x + w * 0.97) {
    drawPalm(ctx, px, y + h * 0.92, s * (0.7 + ((px * 7) % 5) * 0.08), palmColor);
    px += w * 0.055;
  }
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tagSize = fitSize(ctx, tagline, w * 0.62, h * 0.42, "'Bebas Neue'");
  ctx.font = `${tagSize}px 'Bebas Neue'`;
  ctx.fillStyle = '#ffe9c9';
  ctx.fillText(tagline, x + w / 2, y + h * 0.32);
  const footSize = fitSize(ctx, footer, w * 0.78, h * 0.2, 'sans-serif');
  ctx.font = `${footSize}px sans-serif`;
  ctx.fillStyle = 'rgba(255,233,201,0.75)';
  ctx.fillText(footer, x + w / 2, y + h * 0.74);
  ctx.restore();
  // Barcode: deterministic bars from the seed.
  const rnd = mulberry32(seed);
  const bw = w * 0.055;
  const bx = x + w - bw - w * 0.015;
  const by = y + h * 0.22;
  const bh = h * 0.56;
  let bxCursor = bx;
  ctx.fillStyle = '#f5f0e6';
  ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
  ctx.fillStyle = '#12041f';
  while (bxCursor < bx + bw) {
    const barW = 1 + Math.floor(rnd() * 3) * (w / 900);
    if (rnd() > 0.45) ctx.fillRect(bxCursor, by, barW, bh);
    bxCursor += barW + (w / 900);
  }
}
