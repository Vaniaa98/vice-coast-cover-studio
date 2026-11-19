// Vice Coast Cover Studio — the editor.
// Owns the cover state, the control panel, photo uploads, per-panel crop
// (drag to pan, wheel to zoom, sliders as well) and the live preview. The
// preview canvas renders the same renderCover the export uses, at the
// selected post size, so what you see is exactly what the PNG will be.

import { renderCover } from './cover.js';
import { LAYOUTS, CAPTIONS, ROLES, DEFAULT_PHOTOS, layoutById } from './layouts.js';
import { GRADES } from './grades.js';
import { TITLE_STYLES } from './lettering.js';
import { exportPNG, exportAllSizes } from './export.js';

export const SAMPLE_PHOTOS = [
  { file: 'boulevard.jpg', name: 'Boulevard' },
  { file: 'gas.jpg', name: 'Gas Station' },
  { file: 'marina.jpg', name: 'Marina' },
  { file: 'tower.jpg', name: 'Lifeguard Tower' },
  { file: 'car.jpg', name: 'Sports Car' },
  { file: 'street.jpg', name: 'Neon Street' },
  { file: 'coast.jpg', name: 'Coastal Road' },
  { file: 'pier.jpg', name: 'Pier' },
];

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square 1080 × 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait 1080 × 1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide 1920 × 1080' },
};

export function defaultState() {
  return {
    layout: 'hero-grid',
    grade: 'sunset',
    titleStyle: 'sunset',
    title: 'VICE COAST',
    subtitle: 'Neon Tide',
    quote: 'A FEVER DREAM IN NEON',
    quoteSource: 'THE COAST HERALD',
    tagline: 'ONE COAST · NO RULES · COMING SOON',
    captionMode: 'place',
    badges: { wanted: true, seal: true, vol: true, ribbon: true, starburst: true, quote: true },
    badgeLabel: 'WANTED',
    vol: 'VOL. 06',
    ink: false,
    halftone: false,
    grain: true,
    photos: [],
    panels: [],
    size: '1080x1350',
  };
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

export class Editor {
  constructor(doc) {
    this.doc = doc;
    this.canvas = doc.getElementById('stage');
    this.state = defaultState();
    this.selected = 0;
    this.lastPanels = [];
    this.drag = null;
    this.statusEl = doc.getElementById('status');
  }

  async init() {
    await this.loadSamples();
    this.buildControls();
    this.wireStage();
    this.wireExport();
    this.render();
    this.setStatus('Ready — pick a photo, a layout and a grade, then export.');
  }

  async loadSamples() {
    const loaded = [];
    for (const s of SAMPLE_PHOTOS) {
      try {
        const img = await loadImage(`samples/${s.file}`);
        loaded.push({ name: s.name, img, sample: true });
      } catch (e) {
        // A missing sample never blocks the editor; uploads still work.
      }
    }
    this.state.photos = loaded;
    this.state.panels = CAPTIONS.map((c, i) => ({
      photo: DEFAULT_PHOTOS[i % DEFAULT_PHOTOS.length] % Math.max(1, loaded.length),
      zoom: 1,
      ox: 0,
      oy: 0,
      caption: { ...c, role: ROLES[i % ROLES.length] },
    }));
  }

  setStatus(text) {
    if (this.statusEl) this.statusEl.textContent = text;
  }

  render() {
    const size = SIZES[this.state.size] || SIZES['1080x1350'];
    if (this.canvas.width !== size.w || this.canvas.height !== size.h) {
      this.canvas.width = size.w;
      this.canvas.height = size.h;
    }
    renderCover(this.canvas, this.state);
    this.lastPanels = layoutById(this.state.layout).panels(size.w, size.h);
    this.drawSelection();
    this.syncPanelInputs();
  }

  drawSelection() {
    const rect = this.lastPanels[this.selected];
    if (!rect) return;
    const ctx = this.canvas.getContext('2d');
    ctx.save();
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = Math.max(3, this.canvas.width * 0.004);
    ctx.setLineDash([14, 10]);
    ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    ctx.setLineDash([]);
    ctx.restore();
  }

  buildControls() {
    const doc = this.doc;
    // Layout buttons.
    const layoutList = doc.getElementById('layoutList');
    for (const l of LAYOUTS) {
      const b = el('button', 'chip', l.name);
      b.type = 'button';
      b.title = l.desc;
      b.addEventListener('click', () => {
        this.state.layout = l.id;
        this.selected = 0;
        this.markActive(layoutList, b);
        this.render();
      });
      layoutList.appendChild(b);
    }
    this.markActive(layoutList, layoutList.children[0]);
    // Grade swatches.
    const gradeList = doc.getElementById('gradeList');
    for (const g of GRADES) {
      const b = el('button', 'swatch');
      b.type = 'button';
      b.title = g.name;
      b.style.background = `linear-gradient(135deg, ${g.sky[0]}, ${g.sky[1]} 55%, ${g.sky[2]})`;
      b.setAttribute('aria-label', g.name);
      b.addEventListener('click', () => {
        this.state.grade = g.id;
        this.markActive(gradeList, b);
        this.render();
      });
      gradeList.appendChild(b);
    }
    this.markActive(gradeList, gradeList.children[0]);
    // Title styles.
    const styleList = doc.getElementById('titleStyleList');
    for (const [id, s] of Object.entries(TITLE_STYLES)) {
      const b = el('button', 'chip', s.name);
      b.type = 'button';
      b.addEventListener('click', () => {
        this.state.titleStyle = id;
        this.markActive(styleList, b);
        this.render();
      });
      styleList.appendChild(b);
    }
    this.markActive(styleList, styleList.children[0]);
    // Text inputs.
    const bind = (id, key) => {
      const input = doc.getElementById(id);
      input.addEventListener('input', () => {
        this.state[key] = input.value;
        this.render();
      });
    };
    bind('inTitle', 'title');
    bind('inSubtitle', 'subtitle');
    bind('inQuote', 'quote');
    bind('inQuoteSource', 'quoteSource');
    bind('inTagline', 'tagline');
    bind('inVol', 'vol');
    bind('inBadgeLabel', 'badgeLabel');
    // Caption mode.
    doc.getElementById('captionMode').addEventListener('change', (e) => {
      this.state.captionMode = e.target.value;
      this.render();
    });
    // Toggles.
    const toggle = (id, key) => {
      doc.getElementById(id).addEventListener('change', (e) => {
        this.state[key] = e.target.checked;
        this.render();
      });
    };
    toggle('optInk', 'ink');
    toggle('optHalftone', 'halftone');
    toggle('optGrain', 'grain');
    const badgeToggle = (id, key) => {
      doc.getElementById(id).addEventListener('change', (e) => {
        this.state.badges[key] = e.target.checked;
        this.render();
      });
    };
    badgeToggle('optWanted', 'wanted');
    badgeToggle('optSeal', 'seal');
    badgeToggle('optRibbon', 'ribbon');
    badgeToggle('optStarburst', 'starburst');
    badgeToggle('optQuote', 'quote');
    // Size selector.
    doc.getElementById('sizeSelect').addEventListener('change', (e) => {
      this.state.size = e.target.value;
      this.render();
    });
    // Panel caption inputs.
    const capBind = (id, key) => {
      doc.getElementById(id).addEventListener('input', (e) => {
        const slot = this.currentSlot();
        slot.caption[key] = e.target.value;
        this.render();
      });
    };
    capBind('panelPlace', 'place');
    capBind('panelTime', 'time');
    capBind('panelFlavor', 'flavor');
    capBind('panelRole', 'role');
    // Zoom slider.
    doc.getElementById('zoomRange').addEventListener('input', (e) => {
      const slot = this.currentSlot();
      slot.zoom = Number(e.target.value);
      this.render();
    });
    doc.getElementById('btnResetPanel').addEventListener('click', () => {
      const slot = this.currentSlot();
      slot.zoom = 1;
      slot.ox = 0;
      slot.oy = 0;
      this.render();
    });
    // Fill every panel with the library in order.
    doc.getElementById('btnFillAll').addEventListener('click', () => {
      const n = this.state.photos.length || 1;
      this.state.panels.forEach((slot, i) => {
        slot.photo = i % n;
      });
      this.render();
      this.setStatus('Filled every panel from your photos.');
    });
    // Uploads.
    const fileInput = doc.getElementById('fileInput');
    fileInput.addEventListener('change', async () => {
      await this.addFiles(fileInput.files);
      fileInput.value = '';
    });
    const drop = doc.getElementById('dropZone');
    drop.addEventListener('dragover', (e) => {
      e.preventDefault();
      drop.classList.add('over');
    });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', async (e) => {
      e.preventDefault();
      drop.classList.remove('over');
      await this.addFiles(e.dataTransfer.files);
    });
    this.buildPhotoLibrary();
  }

  markActive(container, button) {
    for (const child of container.children) child.classList.remove('active');
    button.classList.add('active');
  }

  buildPhotoLibrary() {
    const lib = this.doc.getElementById('photoLib');
    lib.innerHTML = '';
    this.state.photos.forEach((photo, i) => {
      const thumb = el('button', 'thumb');
      thumb.type = 'button';
      thumb.title = photo.name;
      const img = el('img');
      img.src = photo.img.src;
      img.alt = photo.name;
      img.draggable = true;
      img.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', String(i));
      });
      thumb.appendChild(img);
      thumb.addEventListener('click', () => {
        this.currentSlot().photo = i;
        this.render();
        this.setStatus(`Panel ${this.selected + 1} now uses “${photo.name}”.`);
      });
      lib.appendChild(thumb);
    });
  }

  async addFiles(files) {
    let added = 0;
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const img = await loadImage(URL.createObjectURL(file));
        this.state.photos.push({ name: file.name.replace(/\.[^.]+$/, ''), img, sample: false });
        added += 1;
      } catch (e) {
        // Skip unreadable files.
      }
    }
    if (added > 0) {
      this.buildPhotoLibrary();
      this.setStatus(`Added ${added} photo${added > 1 ? 's' : ''}. Click one to put it in the selected panel.`);
    }
  }

  currentSlot() {
    if (!this.state.panels[this.selected]) {
      this.state.panels[this.selected] = {
        photo: 0, zoom: 1, ox: 0, oy: 0,
        caption: { ...CAPTIONS[this.selected % CAPTIONS.length], role: ROLES[this.selected % ROLES.length] },
      };
    }
    return this.state.panels[this.selected];
  }

  syncPanelInputs() {
    const doc = this.doc;
    const slot = this.currentSlot();
    const cap = slot.caption;
    doc.getElementById('panelLabel').textContent = `Panel ${this.selected + 1} of ${this.lastPanels.length}`;
    doc.getElementById('panelPlace').value = cap.place || '';
    doc.getElementById('panelTime').value = cap.time || '';
    doc.getElementById('panelFlavor').value = cap.flavor || '';
    doc.getElementById('panelRole').value = cap.role || '';
    doc.getElementById('zoomRange').value = String(slot.zoom || 1);
  }

  wireStage() {
    const canvas = this.canvas;
    const toCanvas = (e) => {
      const box = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - box.left) / box.width) * canvas.width,
        y: ((e.clientY - box.top) / box.height) * canvas.height,
      };
    };
    const hit = (p) => {
      for (let i = this.lastPanels.length - 1; i >= 0; i -= 1) {
        const r = this.lastPanels[i];
        if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return i;
      }
      return -1;
    };
    canvas.addEventListener('pointerdown', (e) => {
      const p = toCanvas(e);
      const i = hit(p);
      if (i < 0) return;
      this.selected = i;
      canvas.setPointerCapture(e.pointerId);
      this.drag = { x: p.x, y: p.y, ox: this.currentSlot().ox || 0, oy: this.currentSlot().oy || 0 };
      this.render();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.drag) return;
      const p = toCanvas(e);
      const rect = this.lastPanels[this.selected];
      if (!rect) return;
      const slot = this.currentSlot();
      const dx = (p.x - this.drag.x) / Math.max(1, rect.w);
      const dy = (p.y - this.drag.y) / Math.max(1, rect.h);
      slot.ox = Math.max(-1, Math.min(1, this.drag.ox - dx * 2));
      slot.oy = Math.max(-1, Math.min(1, this.drag.oy - dy * 2));
      this.render();
    });
    const endDrag = () => {
      this.drag = null;
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const slot = this.currentSlot();
      const next = (slot.zoom || 1) * (e.deltaY < 0 ? 1.08 : 1 / 1.08);
      slot.zoom = Math.max(1, Math.min(2.5, next));
      this.render();
    }, { passive: false });
    canvas.addEventListener('dragover', (e) => e.preventDefault());
    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      const idx = Number(e.dataTransfer.getData('text/plain'));
      if (Number.isNaN(idx)) return;
      const i = hit(toCanvas(e));
      if (i < 0) return;
      this.selected = i;
      this.state.panels[i].photo = idx;
      this.render();
    });
  }

  wireExport() {
    const doc = this.doc;
    const run = async (sizeKey, label) => {
      try {
        await exportPNG(this.state, sizeKey);
        this.setStatus(`Saved ${label}.`);
      } catch (e) {
        this.setStatus('Export failed — try again.');
      }
    };
    doc.getElementById('expSquare').addEventListener('click', () => run('1080x1080', 'vice-coast-1080x1080.png'));
    doc.getElementById('expPortrait').addEventListener('click', () => run('1080x1350', 'vice-coast-1080x1350.png'));
    doc.getElementById('expWide').addEventListener('click', () => run('1920x1080', 'vice-coast-1920x1080.png'));
    doc.getElementById('expAll').addEventListener('click', async () => {
      try {
        await exportAllSizes(this.state);
        this.setStatus('Saved all three sizes.');
      } catch (e) {
        this.setStatus('Export failed — try again.');
      }
    });
  }
}
