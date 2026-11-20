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

function drawPanelCaption(ctx, rect, cap, mode, index, tagTop) {
  const { x, y, w, h } = rect;
  if (mode === 'role' || mode === 'cast') {
    const role = cap.role || ROLES[index % ROLES.length];
    // If the tag would land under the giant title, pin it to the top of
    // the panel instead (the hero of the title-over-art layouts).
    const ty = tagTop ? y + h * 0.14 : y + h * 0.82;
    ctx.save();
    ctx.translate(x + w * 0.5, ty);
    ctx.rotate(-0.02);
    const size = Math.max(9, Math.min(h * 0.07, w * 0.10));
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
  // The title box: v1 layouts keep the title band below the panels; the v2
  // layouts overlap the title onto the photos. Role tags that would land
  // under the title are pinned to the top of their panel instead.
  const chrome = layout.chrome || {};
  const titleBox = chrome.titleY !== undefined
    ? { x: 0.02 * W, y: chrome.titleY * H, w: 0.96 * W, h: chrome.titleH * H }
    : { x: 0.03 * W, y: 0.685 * H, w: 0.94 * W, h: 0.175 * H };
  // `pop` panels draw last, on top of the rest of the grid.
  const order = panels.map((_, i) => i)
    .sort((a, b) => (panels[a].pop ? 1 : 0) - (panels[b].pop ? 1 : 0));
  for (const i of order) {
    const rect = panels[i];
    const slot = state.panels[i] || {};
    const photo = state.photos[slot.photo ?? 0] || state.photos[0];
    const cap = slot.caption || CAPTIONS[i % CAPTIONS.length];
    // A panel's crop: the user's pan/zoom wins once they touch it; until
    // then a layout may set its own default crop (the pop-out hero crops
    // toward the face area).
    const panned = (slot.zoom || 1) > 1 || (slot.ox || 0) !== 0 || (slot.oy || 0) !== 0;
    const zoom = panned ? (slot.zoom || 1) : (rect.zoom || 1);
    const ox = panned ? (slot.ox || 0) : (rect.ox || 0);
    const oy = panned ? (slot.oy || 0) : (rect.oy || 0);
    const tagTop = (() => {
      // A role tag is a pill of tagH height centred at 0.82 of the panel.
      // Move it to the panel top when its span would sit under the giant
      // title; a tag centred on the cover also keeps clear of the script
      // subtitle below the title. Side tags never reach the subtitle, so
      // they only avoid the title itself.
      const tagSize = Math.max(9, Math.min(rect.h * 0.07, rect.w * 0.10));
      const tagH = tagSize * 1.5;
      const tagCy = rect.y + rect.h * 0.82;
      const titleBot = titleBox.y + titleBox.h;
      if ((tagCy - tagH / 2) < titleBot && (tagCy + tagH / 2) > titleBox.y) return true;
      const cx = rect.x + rect.w / 2;
      if (cx > 0.35 * W && cx < 0.65 * W) {
        const subY = (chrome.subY ?? 0.872) * H;
        return (tagCy - tagH / 2) < subY + H * 0.035 && (tagCy + tagH / 2) > subY - H * 0.035;
      }
      return false;
    })();
    ctx.save();
    if (rect.pop || rect.shadow) {
      // Soft dark plate behind the tilted panel, offset down-right.
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = Math.max(10, W * 0.015);
      ctx.shadowOffsetX = W * 0.006;
      ctx.shadowOffsetY = H * 0.01;
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(((rect.rot || 0) * Math.PI) / 180);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
      ctx.restore();
    }
    if (rect.rot) {
      // Tilted snapshot: a white polaroid border behind the photo, unless
      // the layout asks for a frameless plate.
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((rect.rot * Math.PI) / 180);
      if (rect.frame !== 'none') {
        ctx.fillStyle = '#f5f0e6';
        const bw = Math.max(3, W * 0.004);
        ctx.fillRect(-rect.w / 2 - bw, -rect.h / 2 - bw, rect.w + bw * 2, rect.h + bw * 2);
      }
      ctx.translate(-rect.w / 2, -rect.h / 2);
      ctx.beginPath();
      ctx.rect(0, 0, rect.w, rect.h);
      ctx.clip();
      drawPhotoCover(ctx, photo && photo.img, { x: 0, y: 0, w: rect.w, h: rect.h }, zoom, ox, oy);
      applyGrade(ctx, { x: 0, y: 0, w: rect.w, h: rect.h }, grade);
      if (state.ink) applyInk(ctx, { x: 0, y: 0, w: rect.w, h: rect.h });
      drawPanelCaption(ctx, { x: 0, y: 0, w: rect.w, h: rect.h }, cap, state.captionMode, i, tagTop);
      ctx.restore();
      continue;
    }
    clipPanel(ctx, rect);
    drawPhotoCover(ctx, photo && photo.img, rect, zoom, ox, oy);
    applyGrade(ctx, rect, grade);
    if (state.ink) applyInk(ctx, rect);
    drawPanelCaption(ctx, rect, cap, state.captionMode, i, tagTop);
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
  }

  // --- Title band ---------------------------------------------------------
  // v1 layouts paint a dark gradient band behind the title; the v2 layouts
  // set the title straight onto the photos, so there is no band at all.
  const band = chrome.band || 'strong';
  if (band !== 'none') {
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
  }

  const badges = state.badges || {};
  if (badges.quote !== false && state.quote) {
    if (chrome.quote === 'top') {
      drawQuoteBar(ctx, 0.03 * W, 0.018 * H, 0.68 * W, 0.038 * H, state.quote, state.quoteSource || 'THE COAST HERALD');
    } else {
      drawQuoteBar(ctx, 0.05 * W, 0.618 * H, 0.66 * W, 0.042 * H, state.quote, state.quoteSource || 'THE COAST HERALD');
    }
  }
  drawTitle(ctx, state.title || 'VICE COAST', titleBox, state.titleStyle || 'sunset');
  if (state.subtitle) {
    drawSubtitle(ctx, state.subtitle, 0.5 * W, (chrome.subY ?? 0.872) * H, H * 0.048);
  }

  // --- Billing block --------------------------------------------------------
  // In cast mode the credit line names the cast, taken from the visible
  // panels' role labels — the movie-poster billing block of the top covers.
  const castMode = state.captionMode === 'cast' || state.captionMode === 'role';
  if (chrome.billingY && castMode) {
    const roles = [];
    for (let j = 0; j < panels.length; j += 1) {
      const slot = state.panels[j] || {};
      const cap = slot.caption || CAPTIONS[j % CAPTIONS.length];
      const role = cap.role || ROLES[j % ROLES.length];
      if (role && !roles.includes(role)) roles.push(role);
    }
    const billing = `A VICE COAST PICTURE · STARRING ${roles.slice(0, 5).join(' · ')}`;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let bSize = Math.max(10, H * 0.026);
    ctx.font = `${bSize}px 'Bebas Neue'`;
    // The line must fit between the VOL ticket (left) and the EST. seal
    // (right) on the same row, so it shrinks to 0.72 of the width, not 0.9.
    while (bSize > 10 && ctx.measureText(billing).width > W * 0.72) {
      bSize -= 1;
      ctx.font = `${bSize}px 'Bebas Neue'`;
    }
    ctx.fillStyle = '#ffe9c9';
    ctx.fillText(billing, 0.5 * W, chrome.billingY * H);
    ctx.restore();
  }

  // --- Badges ---------------------------------------------------------------
  if (badges.wanted !== false) {
    drawWanted(ctx, 0.76 * W, 0.015 * H, 0.215 * W, 0.042 * H,
      state.badgeLabel || 'WANTED');
  }
  if (badges.seal !== false) {
    // v1: just below the panel grid's row junction (0.78W, 0.31H): the seal's
    // top edge sits 0.01H under the junction, so it never covers a top-row
    // caption bar (those end at the junction), and its bottom edge stays
    // above every bottom-row caption bar (those start near 0.62H - barH).
    // It overlaps photo only, in every layout and at every export size.
    // v2: bottom-right corner, overlapping the panel edge above the strip.
    const sealR = 0.042 * W;
    const sealX = (chrome.seal?.x ?? 0.78) * W;
    const sealY = chrome.seal ? chrome.seal.y * H : 0.31 * H + sealR + 0.01 * H;
    drawSeal(ctx, sealX, sealY, sealR, '2026');
  }
  if (badges.vol !== false) {
    const volX = (chrome.vol?.x ?? 0.855) * W;
    const volY = (chrome.vol?.y ?? 0.83) * H;
    drawVolTicket(ctx, volX, volY, 0.115 * W, 0.034 * H, state.vol || 'VOL. 06');
  }
  if (badges.ribbon !== false) {
    const rbX = (chrome.ribbon?.x ?? 0.79) * W;
    const rbY = (chrome.ribbon?.y ?? 0.872) * H;
    drawRibbon(ctx, rbX, rbY, 0.195 * W, 0.026 * H);
  }
  if (badges.starburst !== false) {
    // v1: upper-middle of the cover. v2: clear of the title letters, over
    // the hero's upper-right sky (the starburst must never cover a glyph).
    const sbX = (chrome.starburst?.x ?? 0.585) * W;
    const sbY = (chrome.starburst?.y ?? 0.4) * H;
    drawStarburst(ctx, sbX, sbY, 0.048 * W);
  }

  // --- Palm strip -----------------------------------------------------------
  const footer = castMode
    ? 'SHOT ON YOUR OWN CAMERA · GRADED BY HAND · LETTERING AND SEAL ORIGINAL · CAT. VC-26-0001'
    : 'VICE COAST · A VICE COAST COVER STUDIO PICTURE · STARRING YOU · SHOT ON YOUR OWN CAMERA · GRADED BY HAND · LETTERING AND SEAL ORIGINAL · CAT. VC-26-0001';
  drawStrip(ctx, { x: 0, y: 0.9 * H, w: W, h: 0.1 * H },
    state.tagline || 'ONE COAST · NO RULES · COMING SOON',
    footer,
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
