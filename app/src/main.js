// Vice Cover — the editor. Wires the preview canvas and the controls to the
// cover renderer: photo slots, layout / grade / style pickers, caption
// editing, drag-to-pan and click-to-select on the canvas, shuffle, reset,
// fill-all, arrow-key nudge, and PNG export in the three post sizes.
// A ?shot= URL drives the screenshots: ?shot=cover renders one cover
// full-window, ?shot=editor opens the editor with the samples loaded.

import {
  GRADES, LAYOUTS, STYLES, defaultState, layoutPanels, coverFitRect,
  renderCover, exportCover,
} from './cover.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const state = defaultState();
let selected = 0; // index into the current layout's panels
let drag = null; // { panel, startX, startY, px, py, moved }

const EXPORT_SIZES = [
  { label: '1080 × 1080', w: 1080, h: 1080 },
  { label: '1080 × 1350', w: 1080, h: 1350 },
  { label: '1920 × 1080', w: 1920, h: 1080 },
];

/** Slug for export filenames, from the caption. */
export function slugify(text) {
  const s = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s || 'vice-cover';
}

/** Load an image from a URL and resolve with the HTMLImageElement. */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

/** The two sample photos, loaded once and kept for the slots. */
const SAMPLES = [
  { name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { name: 'Pier', src: 'samples/pier.jpg' },
];

async function loadSamples() {
  const loaded = await Promise.allSettled(SAMPLES.map((s) => loadImage(s.src)));
  loaded.forEach((r, i) => {
    if (r.status === 'fulfilled') state.photos[i] = r.value;
  });
  return loaded.filter((r) => r.status === 'fulfilled').length;
}

/** The preview canvas, sized to the cover's aspect at device pixels. */
const preview = $('#preview');
function sizePreview() {
  const box = preview.parentElement.getBoundingClientRect();
  const ratio = state.layout === 'grid' ? 1 : 1;
  const w = Math.min(box.width, 640);
  const h = w * ratio;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  preview.style.width = `${w}px`;
  preview.style.height = `${h}px`;
  preview.width = Math.round(w * dpr);
  preview.height = Math.round(h * dpr);
}

function draw() {
  if (!preview.width) sizePreview();
  renderCover(preview, state);
  updatePanelLabel();
}

/** Which panel (if any) sits under a point on the preview canvas. */
function panelAt(cx, cy) {
  const rect = preview.getBoundingClientRect();
  const px = ((cx - rect.left) / rect.width) * preview.width;
  const py = ((cy - rect.top) / rect.height) * preview.height;
  const panels = layoutPanels(state, preview.width, preview.height);
  return panels.findIndex((p) => px >= p.x && px < p.x + p.w && py >= p.y && py < p.y + p.h);
}

function updatePanelLabel() {
  const panels = layoutPanels(state, preview.width, preview.height);
  const p = panels[selected];
  const el = $('#panelLabel');
  if (!el) return;
  el.textContent = p ? `Panel ${selected + 1} · ${p.name}` : 'No panel';
  const zoom = $('#zoomRange');
  if (zoom && p) zoom.value = String(p.panel.zoom);
}

/** Build a row of picker buttons from a { key: { name, blurb } } map. */
function buildPicker(el, map, current, onPick) {
  el.innerHTML = '';
  for (const [key, def] of Object.entries(map)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.dataset.key = key;
    b.textContent = def.name;
    b.title = def.blurb ?? def.name;
    if (key === current) b.classList.add('on');
    b.addEventListener('click', () => {
      el.querySelectorAll('.pick').forEach((x) => x.classList.toggle('on', x === b));
      onPick(key);
    });
    el.appendChild(b);
  }
}

function buildControls() {
  buildPicker($('#layoutPicker'), LAYOUTS, state.layout, (key) => {
    state.layout = key;
    selected = 0;
    sizePreview();
    draw();
  });
  buildPicker($('#gradePicker'), GRADES, state.grade, (key) => {
    state.grade = key;
    draw();
  });
  buildPicker($('#stylePicker'), STYLES, state.style, (key) => {
    state.style = key;
    draw();
  });

  $('#captionInput').addEventListener('input', (e) => { state.caption = e.target.value; draw(); });
  $('#taglineInput').addEventListener('input', (e) => { state.tagline = e.target.value; draw(); });

  $('#zoomRange').addEventListener('input', (e) => {
    const panels = layoutPanels(state, preview.width, preview.height);
    const p = panels[selected];
    if (p) { p.panel.zoom = Number(e.target.value); draw(); }
  });

  $('#shuffleBtn').addEventListener('click', shuffleLook);
  $('#resetBtn').addEventListener('click', () => {
    const panels = layoutPanels(state, preview.width, preview.height);
    const p = panels[selected];
    if (p) { p.panel.zoom = 1; p.panel.x = 0; p.panel.y = 0; draw(); }
  });
  $('#fillAllBtn').addEventListener('click', () => {
    const panels = layoutPanels(state, preview.width, preview.height);
    const p = panels[selected];
    const photo = p ? p.panel.photo : 0;
    for (const slot of state.panels) slot.photo = photo;
    draw();
  });

  $$('#exportBtns button').forEach((b) => {
    b.addEventListener('click', () => {
      const size = EXPORT_SIZES[Number(b.dataset.size)];
      downloadCover(size);
    });
  });

  $$('.photo-slot input[type=file]').forEach((input, i) => {
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      try {
        state.photos[i] = await loadImage(url);
        draw();
      } finally {
        URL.revokeObjectURL(url);
      }
    });
  });
  $$('.photo-slot [data-sample]').forEach((b) => {
    b.addEventListener('click', async () => {
      const img = await loadImage(SAMPLES[Number(b.dataset.sample)].src);
      state.photos[Number(b.dataset.slot)] = img;
      draw();
    });
  });

  // Drag to pan the photo under the pointer; a click without a drag selects.
  preview.addEventListener('pointerdown', (e) => {
    const idx = panelAt(e.clientX, e.clientY);
    if (idx < 0) return;
    selected = idx;
    const panels = layoutPanels(state, preview.width, preview.height);
    const p = panels[selected];
    drag = { panel: p.panel, startX: e.clientX, startY: e.clientY, px: p.panel.x, py: p.panel.y, moved: false };
    preview.setPointerCapture(e.pointerId);
    draw();
  });
  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const panels = layoutPanels(state, preview.width, preview.height);
    const rect = panels[selected];
    if (!rect) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    if (!drag.moved) return;
    const photo = state.photos[rect.panel.photo];
    if (!photo) return;
    const fit = coverFitRect(photo.naturalWidth, photo.naturalHeight, rect, rect.panel.zoom, 0, 0);
    const overflowX = Math.max(0, (fit.w - rect.w) / 2);
    const overflowY = Math.max(0, (fit.h - rect.h) / 2);
    const scaleX = preview.getBoundingClientRect().width / preview.width;
    const scaleY = preview.getBoundingClientRect().height / preview.height;
    drag.panel.x = clamp(drag.px + (dx / scaleX) / Math.max(1, overflowX), -1, 1);
    drag.panel.y = clamp(drag.py + (dy / scaleY) / Math.max(1, overflowY), -1, 1);
    draw();
  });
  preview.addEventListener('pointerup', () => { drag = null; });

  // Arrow keys nudge the selected panel's photo; shift makes it finer.
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    const step = e.shiftKey ? 0.02 : 0.08;
    const panels = layoutPanels(state, preview.width, preview.height);
    const p = panels[selected];
    if (!p) return;
    let used = true;
    if (e.key === 'ArrowLeft') p.panel.x = clamp(p.panel.x - step, -1, 1);
    else if (e.key === 'ArrowRight') p.panel.x = clamp(p.panel.x + step, -1, 1);
    else if (e.key === 'ArrowUp') p.panel.y = clamp(p.panel.y - step, -1, 1);
    else if (e.key === 'ArrowDown') p.panel.y = clamp(p.panel.y + step, -1, 1);
    else used = false;
    if (used) { e.preventDefault(); draw(); }
  });
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/** A new random look: layout, grade, style and panel photos. */
export function shuffleLook() {
  const keys = (o) => Object.keys(o);
  state.layout = keys(LAYOUTS)[Math.floor(Math.random() * keys(LAYOUTS).length)];
  state.grade = keys(GRADES)[Math.floor(Math.random() * keys(GRADES).length)];
  state.style = keys(STYLES)[Math.floor(Math.random() * keys(STYLES).length)];
  const loaded = state.photos.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
  if (loaded.length) {
    for (const slot of state.panels) slot.photo = loaded[Math.floor(Math.random() * loaded.length)];
  }
  selected = 0;
  syncPickers();
  sizePreview();
  draw();
}

function syncPickers() {
  for (const [id, key] of [['#layoutPicker', state.layout], ['#gradePicker', state.grade], ['#stylePicker', state.style]]) {
    $(id).querySelectorAll('.pick').forEach((b) => b.classList.toggle('on', b.dataset.key === key));
  }
}

/** Export the cover at w x h and download it as a PNG. */
export function downloadCover(size) {
  const canvas = exportCover(state, size.w, size.h);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${slugify(state.caption)}-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

/** Apply a state override from the shot driver's ?state= JSON. */
function applyStateOverride(raw) {
  try {
    const over = JSON.parse(raw);
    for (const [k, v] of Object.entries(over)) {
      if (k === 'panels' && Array.isArray(v)) {
        v.forEach((p, i) => { if (state.panels[i]) Object.assign(state.panels[i], p); });
      } else if (k in state) {
        state[k] = v;
      }
    }
  } catch { /* a bad override is ignored; the defaults stand */ }
}

/** Shot mode: ?shot=cover renders one cover full-window; ?shot=editor opens
 * the editor with the samples loaded. Both take ?state= JSON overrides. */
async function shotMode() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (!shot) return false;
  await loadSamples();
  const over = params.get('state');
  if (over) applyStateOverride(decodeURIComponent(over));
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const holder = $('#coverStage');
    const canvas = document.createElement('canvas');
    const w = Number(params.get('w') ?? 1080);
    const h = Number(params.get('h') ?? 1080);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.objectFit = 'contain';
    holder.appendChild(canvas);
    await document.fonts.ready;
    renderCover(canvas, state);
    document.title = 'Vice Cover — shot';
    return true;
  }
  // editor shot: the normal editor, samples in, controls visible
  buildControls();
  sizePreview();
  draw();
  await document.fonts.ready;
  draw();
  return true;
}

async function boot() {
  if (await shotMode()) return;
  await loadSamples();
  buildControls();
  sizePreview();
  draw();
  window.addEventListener('resize', () => { sizePreview(); draw(); });
}

boot();
