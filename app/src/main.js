// Vice Cover — wires the editor: photos in, panels arranged, caption typed,
// PNG out in the three post sizes. Drag a photo on the preview to move it,
// click a panel to pick it, shuffle for a fresh look. A `?shot=` query sets
// up a fixed scene for a screenshot instead (./shots.js). Photos never leave
// the machine.
import { GRADES, LAYOUTS, CAPTION_STYLES, coverFitRect, defaultState, exportCover, layoutPanels, renderCover } from './cover.js';
import { runShot } from './shots.js';

/** The three post sizes the app exports. */
export const EXPORT_SIZES = [
  { w: 1080, h: 1080, label: '1080 × 1080' },
  { w: 1080, h: 1350, label: '1080 × 1350' },
  { w: 1920, h: 1080, label: '1920 × 1080' },
];

const state = defaultState();
let exportSize = EXPORT_SIZES[0];
let selectedPanel = 0;

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const captionInput = document.getElementById('caption');
const taglineInput = document.getElementById('tagline');

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Redraws the live preview at the chosen export aspect. */
export function redraw() {
  canvas.width = exportSize.w;
  canvas.height = exportSize.h;
  renderCover(canvas, state);
  refreshPanelControls();
}

/** Rebuilds the panel editor labels and slider values for the selected panel. */
export function refreshPanelControls() {
  const panels = layoutPanels(state, 1, 1);
  const select = document.getElementById('panel');
  select.innerHTML = '';
  for (const [i, p] of panels.entries()) {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = `${i + 1} · ${p.name}`;
    select.appendChild(option);
  }
  select.value = String(selectedPanel);
  const panel = state.panels[selectedPanel];
  document.getElementById('panel-photo').value = String(panel.photo);
  document.getElementById('zoom').value = String(panel.zoom);
  document.getElementById('zoom-value').textContent = `${Math.round(panel.zoom * 100)}%`;
  document.getElementById('pan-x').value = String(panel.x);
  document.getElementById('pan-y').value = String(panel.y);
  document.getElementById('panel-note').textContent =
    panel.photo < 0
      ? 'No photo: this panel shows sunset art (sun, skyline, palms).'
      : `Photo ${panel.photo + 1} in this panel — drag it on the preview, or use zoom and the sliders.`;
}

/** Sets a photo slot from a File, then redraws. */
export async function setPhotoSlot(slot, file) {
  if (!file) return;
  state.photos[slot] = await loadImage(URL.createObjectURL(file));
  document.getElementById(`photo-${slot + 1}-name`).textContent = file.name;
  redraw();
}

/** Sets a photo slot from a bundled sample image. */
export async function setSampleSlot(slot, sample) {
  state.photos[slot] = await loadImage(`samples/${sample}.jpg`);
  document.getElementById(`photo-${slot + 1}-name`).textContent = `Sample: ${sample}.jpg`;
  redraw();
}

/** Turns the caption into a file-name slug: "Sunset Heist" -> "sunset-heist". */
export function slugify(text) {
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'vice-cover';
}

/** Renders the cover at w x h and downloads it as a PNG. */
export function downloadCover(w, h) {
  const out = exportCover(state, w, h);
  return new Promise((resolve) => {
    out.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-cover-${slugify(state.caption)}-${w}x${h}.png`;
      a.click();
      status.textContent = `Saved vice-cover-${slugify(state.caption)}-${w}x${h}.png`;
      resolve(blob);
    }, 'image/png');
  });
}

/** Renders the cover at w x h and returns a PNG data URL (used by screenshots). */
export function exportPNGDataURL(w, h) {
  return exportCover(state, w, h).toDataURL('image/png');
}

/** Picks a fresh look: layout, grade, caption style and panel photos. */
export function shuffleLook() {
  const layoutKeys = Object.keys(LAYOUTS);
  const gradeKeys = Object.keys(GRADES);
  const styleKeys = Object.keys(CAPTION_STYLES);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  state.layout = pick(layoutKeys);
  state.grade = pick(gradeKeys);
  state.style = pick(styleKeys);
  const loaded = state.photos.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
  const panels = layoutPanels(state, 1, 1);
  panels.forEach((_, i) => {
    state.panels[i].photo = loaded.length ? loaded[Math.floor(Math.random() * loaded.length)] : -1;
    state.panels[i].zoom = 1;
    state.panels[i].x = 0;
    state.panels[i].y = 0;
  });
  selectedPanel = 0;
  document.getElementById('grade').value = state.grade;
  document.getElementById('caption-style').value = state.style;
  document.querySelectorAll('.layout-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.layout === state.layout));
  status.textContent = `Shuffled: ${LAYOUTS[state.layout].name} · ${GRADES[state.grade].name} · ${CAPTION_STYLES[state.style].name}.`;
  redraw();
}

/** Resets the selected panel's framing: zoom 1, centred. */
export function resetFraming() {
  const panel = state.panels[selectedPanel];
  panel.zoom = 1;
  panel.x = 0;
  panel.y = 0;
  status.textContent = 'Framing reset for this panel.';
  redraw();
}

/** Which panel (if any) holds the point px,py in canvas pixels. */
export function panelAt(px, py) {
  const panels = layoutPanels(state, canvas.width, canvas.height);
  for (let i = panels.length - 1; i >= 0; i--) {
    const r = panels[i];
    if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) return i;
  }
  return -1;
}

// Drag a photo on the preview: pointer down starts a drag on the panel under
// the cursor, moving the pointer pans that panel's photo; a plain click
// (no real movement) just selects the panel instead.
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const hit = panelAt(px, py);
  if (hit < 0) return;
  selectedPanel = hit;
  const panel = state.panels[hit];
  const photo = panel.photo >= 0 ? state.photos[panel.photo] : null;
  drag = { x: px, y: py, moved: false, panel, photo, rect: layoutPanels(state, canvas.width, canvas.height)[hit] };
  canvas.setPointerCapture(e.pointerId);
  refreshPanelControls();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const dx = px - drag.x;
  const dy = py - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
  if (!drag.moved || !drag.photo) return;
  const fit = coverFitRect(drag.photo.naturalWidth, drag.photo.naturalHeight, drag.rect, drag.panel.zoom, 0, 0);
  const ox = Math.max(1, (fit.w - drag.rect.w) / 2);
  const oy = Math.max(1, (fit.h - drag.rect.h) / 2);
  drag.panel.x = Math.max(-1, Math.min(1, drag.panel.x + dx / ox));
  drag.panel.y = Math.max(-1, Math.min(1, drag.panel.y + dy / oy));
  drag.x = px;
  drag.y = py;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

// Arrow keys nudge the selected panel's photo a little.
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, select, textarea')) return;
  const panel = state.panels[selectedPanel];
  if (panel.photo < 0) return;
  const step = 0.08;
  if (e.key === 'ArrowLeft') { panel.x = Math.max(-1, panel.x - step); redraw(); }
  if (e.key === 'ArrowRight') { panel.x = Math.min(1, panel.x + step); redraw(); }
  if (e.key === 'ArrowUp') { panel.y = Math.max(-1, panel.y - step); redraw(); }
  if (e.key === 'ArrowDown') { panel.y = Math.min(1, panel.y + step); redraw(); }
});

// Photo slots: file picker + sample button each.
for (let slot = 0; slot < 3; slot++) {
  document.getElementById(`photo-${slot + 1}`).addEventListener('change', (e) => {
    setPhotoSlot(slot, e.target.files[0]).catch(() => {
      status.textContent = 'That file could not be read as a photo.';
    });
  });
  document.getElementById(`sample-${slot + 1}`).addEventListener('click', () => {
    setSampleSlot(slot, slot === 1 ? 'boulevard' : 'pier').catch(() => {
      status.textContent = 'The sample photo failed to load.';
    });
  });
}

// Layout picker.
const layoutBox = document.getElementById('layouts');
for (const [key, def] of Object.entries(LAYOUTS)) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'layout-btn';
  button.dataset.layout = key;
  button.textContent = `${def.name} — ${def.blurb}`;
  button.addEventListener('click', () => {
    state.layout = key;
    selectedPanel = 0;
    document.querySelectorAll('.layout-btn').forEach((b) => b.classList.toggle('active', b === button));
    redraw();
  });
  if (key === state.layout) button.classList.add('active');
  layoutBox.appendChild(button);
}

// Grade picker.
const gradeSelect = document.getElementById('grade');
for (const [key, def] of Object.entries(GRADES)) {
  const option = document.createElement('option');
  option.value = key;
  option.textContent = def.name;
  gradeSelect.appendChild(option);
}
gradeSelect.value = state.grade;
gradeSelect.addEventListener('change', () => {
  state.grade = gradeSelect.value;
  redraw();
});

// Caption style picker.
const styleSelect = document.getElementById('caption-style');
for (const [key, def] of Object.entries(CAPTION_STYLES)) {
  const option = document.createElement('option');
  option.value = key;
  option.textContent = `${def.name} — ${def.blurb}`;
  styleSelect.appendChild(option);
}
styleSelect.value = state.style;
styleSelect.addEventListener('change', () => {
  state.style = styleSelect.value;
  redraw();
});

// Caption + tagline.
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
taglineInput.addEventListener('input', () => { state.tagline = taglineInput.value; redraw(); });

// Panel editor.
document.getElementById('panel').addEventListener('change', (e) => {
  selectedPanel = Number(e.target.value);
  refreshPanelControls();
});
document.getElementById('panel-photo').addEventListener('change', (e) => {
  state.panels[selectedPanel].photo = Number(e.target.value);
  redraw();
});
document.getElementById('zoom').addEventListener('input', (e) => {
  state.panels[selectedPanel].zoom = Number(e.target.value);
  redraw();
});
document.getElementById('pan-x').addEventListener('input', (e) => {
  state.panels[selectedPanel].x = Number(e.target.value);
  redraw();
});
document.getElementById('pan-y').addEventListener('input', (e) => {
  state.panels[selectedPanel].y = Number(e.target.value);
  redraw();
});
document.getElementById('fill-all').addEventListener('click', () => {
  const first = state.panels.find((p) => p.photo >= 0);
  const photo = first ? first.photo : 0;
  for (const p of state.panels) p.photo = photo;
  status.textContent = `Every panel now shows Photo ${photo + 1}.`;
  redraw();
});
document.getElementById('reset-framing').addEventListener('click', resetFraming);
document.getElementById('shuffle').addEventListener('click', shuffleLook);

// Export size picker + export buttons.
const sizeBox = document.getElementById('sizes');
for (const size of EXPORT_SIZES) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'size-btn';
  button.textContent = size.label;
  button.addEventListener('click', () => {
    exportSize = size;
    document.querySelectorAll('.size-btn').forEach((b) => b.classList.toggle('active', b === button));
    redraw();
  });
  if (size === exportSize) button.classList.add('active');
  sizeBox.appendChild(button);
}
document.getElementById('export').addEventListener('click', () => {
  downloadCover(exportSize.w, exportSize.h);
});
document.getElementById('export-all').addEventListener('click', async () => {
  for (const size of EXPORT_SIZES) await downloadCover(size.w, size.h);
  status.textContent = 'Saved all three sizes.';
});

// Test hooks for the screenshot scenes: export the exact PNG the app writes.
window.__exportPNG = (w, h) => Promise.resolve(exportPNGDataURL(w, h));
window.__state = state;

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, state, loadImage, redraw);
} else {
  document.fonts.load('900 100px "Vice Display"').catch(() => {}).finally(() => redraw());
  document.fonts.ready.then(() => redraw());
}
