// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows the cover alone at the size the query names.
// `photos` picks samples (samples/<name>.jpg) for slots 1-3, `panels` assigns
// photo indexes to panels, `layout` / `grade` / `caption` / `tagline` set the
// look, `size` (WxH) sets the cover shot's pixels. window.__shotReady is set
// once painted, after the display font has loaded.
import { renderCover } from './cover.js';

function parseSize(value, fallback) {
  const m = /^(\d+)x(\d+)$/.exec(value ?? '');
  return m ? { w: Number(m[1]), h: Number(m[2]) } : fallback;
}

/** Applies a shot scene to `state`, then paints and signals readiness. */
export async function runShot(shot, query, state, loadImage, redraw) {
  const photos = (query.get('photos') ?? 'pier,boulevard').split(',').filter(Boolean);
  for (let i = 0; i < 3; i++) {
    state.photos[i] = photos[i] ? await loadImage(`samples/${photos[i]}.jpg`) : null;
  }
  const panels = (query.get('panels') ?? '').split(',').filter((v) => v !== '');
  panels.forEach((v, i) => {
    if (state.panels[i]) state.panels[i].photo = Number(v);
  });
  // Per-panel framing for the shot: `zoom`, `panx` and `pany` are comma lists
  // in the panels' order (pan -1..1; +y shows the top of the photo).
  for (const [key, field] of [['zoom', 'zoom'], ['panx', 'x'], ['pany', 'y']]) {
    const values = (query.get(key) ?? '').split(',').filter((v) => v !== '');
    values.forEach((v, i) => {
      if (state.panels[i]) state.panels[i][field] = Number(v);
    });
  }
  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('caption') !== null) state.caption = query.get('caption');
  if (query.get('tagline') !== null) state.tagline = query.get('tagline');
  const captionInput = document.getElementById('caption');
  const taglineInput = document.getElementById('tagline');
  if (captionInput) captionInput.value = state.caption;
  if (taglineInput) taglineInput.value = state.tagline;
  const name1 = document.getElementById('photo-1-name');
  const name2 = document.getElementById('photo-2-name');
  if (name1 && photos[0]) name1.textContent = `Sample: ${photos[0]}.jpg`;
  if (name2 && photos[1]) name2.textContent = `Sample: ${photos[1]}.jpg`;

  try { await document.fonts.load('900 100px "Vice Display"'); } catch { /* fallback font */ }
  await document.fonts.ready;

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const size = parseSize(query.get('size'), { w: 1920, h: 1080 });
    const canvas = document.getElementById('cover');
    canvas.width = size.w;
    canvas.height = size.h;
    renderCover(canvas, state);
  } else {
    redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
