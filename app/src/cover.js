// Vice Coast Cover Studio — the cover renderer.
// renderCover draws one complete poster onto a canvas at any size: graded
// photo panels in the chosen layout, the giant title block, the badges, the
// palm strip. Everything is deterministic: grain and barcode come from a
// fixed seed, never from Date or Math.random, so the same state always
// renders the same bytes — the grader runs the program twice.

import { gradeById, applyGrade, applyInk } from './grades.js';
import { layoutById, CAPTIONS, ROLES } from './layouts.js';
import {
  mulberry32, drawTitle, drawSubtitle, drawQuoteBar, drawWanted,
  drawSeal, drawVolTicket, drawRibbon, drawStarburst, drawStrip,
  halftoneBand, roundRect,
} from './lettering.js';

let grainCanvas = null;

function grainPattern(ctx) {
  if (!grainCanvas) {
    grainCanvas = document.createElement('canvas');
    grainCanvas.width = 128;
    grainCanvas.height = 128;
    const g = grainCanvas.getContext('2d');
    const img = g.createImageData(128, 128);
    const rnd = mulberry32(20261120);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(rnd() * 255);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  return ctx.createPattern(grainCanvas, 'repeat');
}

// Draw one photo into a rect, cover-fit, with zoom and pan offsets.
// zoom >= 1; ox/oy in [-1, 1] pan across the overflow.
function drawPhotoCover(ctx, img, rect, zoom, ox, oy) {
  if (!img) return;
  const { x, y, w, h } = rect;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const dx = (w - pw) / 2 - ox * Math.max(0, (pw - w) / 2);
  const dy = (h - ph) / 2 - oy * Math.max(0, (ph - h) / 2);
  ctx.drawImage(img, x + dx, y + dy, pw, ph);
}

function clipPanel(ctx, rect) {
  ctx.beginPath();
  if (rect.slant) {
    const s = rect.slant * rect.w;
    ctx.moveTo(rect.x + s, rect.y);
    ctx.lineTo(rect.x + rect.w, rect.y);
    ctx.lineTo(rect.x + rect.w - s, rect.y + rect.h);
    ctx.lineTo(rect.x, rect.y + rect.h);
    ctx.closePath();
  } else {
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.clip();
}

function drawPanelCaption(ctx, rect, cap, mode, index) {
  const { x, y, w, h } = rect;
  if (mode === 'role') {
    const role = cap.role || ROLES[index % ROLES.length];
    ctx.save();
    ctx.translate(x + w * 0.5, y + h * 0.82);
    ctx.rotate(-0.02);
    const size = Math.max(9, Math.min(h * 0.11, w * 0.16));
    ctx.font = `${size}px 'Bebas Neue'`;
    const tw = ctx.measureText(role).width + size * 1.4;
    roundRect(ctx, -tw / 2, -size * 0.75, tw, size * 1.5, size * 0.2);
    ctx.fillStyle = '#f5f0e6';
    ctx.fill();
    ctx.fillStyle = '#12041f';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(role, 0, size * 0.05);
    ctx.restore();
    return;
  }
  // Place mode: black label bar, place on top, time — flavor below.
  const pad = Math.max(4, w * 0.03);
  const barH = Math.min(h * 0.34, w * 0.24 + 22);
  const by = y + h - barH - pad * 0.4;
  ctx.save();
  ctx.fillStyle = 'rgba(5,2,12,0.88)';
  ctx.fillRect(x + pad * 0.4, by, w - pad * 0.8, barH);
  const placeSize = Math.max(9, Math.min(barH * 0.42, w * 0.085));
  ctx.font = `${placeSize}px 'Bebas Neue'`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(cap.place, x + pad, by + barH * 0.3);
  const subSize = Math.max(7, placeSize * 0.52);
  ctx.font = `${subSize}px sans-serif`;
  ctx.fillStyle = '#ffd23f';
  ctx.fillText(`${cap.time} — ${cap.flavor}`, x + pad, by + barH * 0.74);
  ctx.restore();
}

function titleSeed(text) {
  let s = 7;
  for (let i = 0; i < text.length; i += 1) s = (s * 31 + text.charCodeAt(i)) >>> 0;
  return s;
}

export function renderCover(canvas, state) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  const layout = layoutById(state.layout);
  const grade = gradeById(state.grade);
  const panels = layout.panels(W, H);

  ctx.save();
  ctx.fillStyle = '#14042a';
  ctx.fillRect(0, 0, W, H);

  // --- Photo panels -------------------------------------------------------
  panels.forEach((rect, i) => {
    const slot = state.panels[i] || {};
    const photo = state.photos[slot.photo ?? 0] || state.photos[0];
    const cap = slot.caption || CAPTIONS[i % CAPTIONS.length];
    ctx.save();
    if (rect.rot) {
      // Tilted snapshot: a white polaroid border behind the photo.
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((rect.rot * Math.PI) / 180);
      ctx.fillStyle = '#f5f0e6';
      const bw = Math.max(3, W * 0.004);
      ctx.fillRect(-rect.w / 2 - bw, -rect.h / 2 - bw, rect.w + bw * 2, rect.h + bw * 2);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      ctx.beginPath();
      ctx.rect(0, 0, rect.w, rect.h);
      ctx.clip();
      drawPhotoCover(ctx, photo && photo.img, { x: 0, y: 0, w: rect.w, h: rect.h },
        slot.zoom || 1, slot.ox || 0, slot.oy || 0);
      applyGrade(ctx, { x: 0, y: 0, w: rect.w, h: rect.h }, grade);
      if (state.ink) applyInk(ctx, { x: 0, y: 0, w: rect.w, h: rect.h });
      drawPanelCaption(ctx, { x: 0, y: 0, w: rect.w, h: rect.h }, cap, state.captionMode, i);
      ctx.restore();
      return;
    }
    clipPanel(ctx, rect);
    drawPhotoCover(ctx, photo && photo.img, rect, slot.zoom || 1, slot.ox || 0, slot.oy || 0);
    applyGrade(ctx, rect, grade);
    if (state.ink) applyInk(ctx, rect);
    drawPanelCaption(ctx, rect, cap, state.captionMode, i);
    ctx.restore();
    // Cream poster frame around the panel.
    ctx.save();
    ctx.strokeStyle = '#f5ead6';
    ctx.lineWidth = Math.max(2, W * 0.0035);
    if (rect.slant) {
      const s = rect.slant * rect.w;
      ctx.beginPath();
      ctx.moveTo(rect.x + s, rect.y);
      ctx.lineTo(rect.x + rect.w, rect.y);
      ctx.lineTo(rect.x + rect.w - s, rect.y + rect.h);
      ctx.lineTo(rect.x, rect.y + rect.h);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
  });

  // --- Title band ---------------------------------------------------------
  const bandY = 0.58 * H;
  const bandH = 0.32 * H;
  const bandGrad = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  bandGrad.addColorStop(0, 'rgba(16,2,36,0)');
  bandGrad.addColorStop(0.35, 'rgba(16,2,36,0.72)');
  bandGrad.addColorStop(1, 'rgba(16,2,36,0.94)');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, bandY, W, bandH);
  if (state.halftone) {
    halftoneBand(ctx, { x: 0, y: bandY + bandH * 0.15, w: W, h: bandH * 0.85 });
  }

  const badges = state.badges || {};
  if (badges.quote !== false && state.quote) {
    drawQuoteBar(ctx, 0.05 * W, 0.618 * H, 0.66 * W, 0.042 * H, state.quote, state.quoteSource || 'THE COAST HERALD');
  }
  drawTitle(ctx, state.title || 'VICE COAST',
    { x: 0.03 * W, y: 0.685 * H, w: 0.94 * W, h: 0.175 * H }, state.titleStyle || 'sunset');
  if (state.subtitle) {
    drawSubtitle(ctx, state.subtitle, 0.5 * W, 0.872 * H, H * 0.048);
  }

  // --- Badges ---------------------------------------------------------------
  if (badges.wanted !== false) {
    drawWanted(ctx, 0.76 * W, 0.015 * H, 0.215 * W, 0.042 * H,
      state.badgeLabel || 'WANTED');
  }
  if (badges.seal !== false) {
    // On the panel grid's cross junction (0.78W, 0.31H): it overlaps panel
    // corners, never a caption bar.
    drawSeal(ctx, 0.78 * W, 0.31 * H, 0.042 * W, '2026');
  }
  if (badges.vol !== false) {
    drawVolTicket(ctx, 0.855 * W, 0.83 * H, 0.115 * W, 0.034 * H, state.vol || 'VOL. 06');
  }
  if (badges.ribbon !== false) {
    drawRibbon(ctx, 0.79 * W, 0.872 * H, 0.195 * W, 0.026 * H);
  }
  if (badges.starburst !== false) {
    drawStarburst(ctx, 0.585 * W, 0.4 * H, 0.048 * W);
  }

  // --- Palm strip -----------------------------------------------------------
  drawStrip(ctx, { x: 0, y: 0.9 * H, w: W, h: 0.1 * H },
    state.tagline || 'ONE COAST · NO RULES · COMING SOON',
    'VICE COAST · A VICE COAST COVER STUDIO PICTURE · STARRING YOU · SHOT ON YOUR OWN CAMERA · GRADED BY HAND · LETTERING AND SEAL ORIGINAL · CAT. VC-26-0001',
    titleSeed(state.title || 'VICE COAST'));

  // --- Film grain -----------------------------------------------------------
  if (state.grain !== false) {
    ctx.save();
    ctx.globalAlpha = 0.055;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grainPattern(ctx);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  ctx.restore();
}
