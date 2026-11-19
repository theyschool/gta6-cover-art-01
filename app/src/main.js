// Vice Cover — wires the editor: photos in, panels arranged, caption typed,
// PNG out in the three post sizes. A `?shot=` query sets up a fixed scene for
// a screenshot instead (./shots.js). Photos never leave the machine.
import { GRADES, LAYOUTS, defaultState, exportCover, layoutPanels, renderCover } from './cover.js';
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
      : `Photo ${panel.photo + 1} in this panel — zoom and drag it into place.`;
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

/** Renders the cover at w x h and downloads it as a PNG. */
export function downloadCover(w, h) {
  const out = exportCover(state, w, h);
  return new Promise((resolve) => {
    out.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-cover-${w}x${h}.png`;
      a.click();
      status.textContent = `Saved vice-cover-${w}x${h}.png`;
      resolve(blob);
    }, 'image/png');
  });
}

/** Renders the cover at w x h and returns a PNG data URL (used by screenshots). */
export function exportPNGDataURL(w, h) {
  return exportCover(state, w, h).toDataURL('image/png');
}

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
