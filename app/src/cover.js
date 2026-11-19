// Vice Cover — the cover renderer. Draws a multi-panel GTA-style poster
// (original art only: no Rockstar logo, artwork, character or font) from the
// user's photos, a caption and a colour grade, onto any canvas at any size.

/** Colour grades: a Vice City neon-sunset palette each. */
export const GRADES = {
  sunset: {
    name: 'Vice Sunset',
    sky: ['#2b1055', '#ff5e62', '#ffb347'],
    wash: 'rgba(255, 94, 98, 0.20)',
    deep: '#1a0b2e',
    glow: '#ff2e88',
    captionTop: '#ffffff',
    captionBottom: '#ffd76a',
  },
  neon: {
    name: 'Neon Night',
    sky: ['#0b1035', '#7b2ff7', '#ff2e88'],
    wash: 'rgba(123, 47, 247, 0.22)',
    deep: '#0b1035',
    glow: '#00e5ff',
    captionTop: '#ffffff',
    captionBottom: '#8ef6ff',
  },
  gold: {
    name: 'Palm Gold',
    sky: ['#3d1e00', '#ff9a3d', '#ffe08a'],
    wash: 'rgba(255, 154, 61, 0.20)',
    deep: '#241203',
    glow: '#ff7a18',
    captionTop: '#fffbe8',
    captionBottom: '#ffc53d',
  },
  dusk: {
    name: 'Pink Dusk',
    sky: ['#12082e', '#c2337f', '#ff8a5c'],
    wash: 'rgba(194, 51, 127, 0.22)',
    deep: '#160a33',
    glow: '#ff5e8a',
    captionTop: '#ffffff',
    captionBottom: '#ff9db1',
  },
};

/** Panel layouts. Each returns panels as { id, name, x, y, w, h } in 0..1. */
export const LAYOUTS = {
  grid: {
    name: 'Vice Grid',
    blurb: 'Big hero on top, two panels below',
    panels() {
      // All values are 0..1 fractions of the cover (layoutPanels scales them).
      const hero = 0.60;
      return [
        { id: 'hero', name: 'Hero', x: 0, y: 0, w: 1, h: hero },
        { id: 'left', name: 'Left', x: 0, y: hero, w: 0.5, h: 1 - hero },
        { id: 'right', name: 'Right', x: 0.5, y: hero, w: 0.5, h: 1 - hero },
      ];
    },
  },
  strip: {
    name: 'Sunset Strip',
    blurb: 'Three tall panels side by side',
    panels() {
      return [
        { id: 'left', name: 'Left', x: 0, y: 0, w: 1 / 3, h: 1 },
        { id: 'mid', name: 'Middle', x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
        { id: 'right', name: 'Right', x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
      ];
    },
  },
  hero: {
    name: 'Hero + Strip',
    blurb: 'Big hero left, two stacked panels right',
    panels() {
      return [
        { id: 'hero', name: 'Hero', x: 0, y: 0, w: 0.64, h: 1 },
        { id: 'top', name: 'Top right', x: 0.64, y: 0, w: 0.36, h: 0.5 },
        { id: 'bottom', name: 'Bottom right', x: 0.64, y: 0.5, w: 0.36, h: 0.5 },
      ];
    },
  },
};

/** A fresh default state: three photo slots, one panel per layout slot. */
export function defaultState() {
  return {
    layout: 'grid',
    grade: 'sunset',
    caption: 'Sunset Heist',
    tagline: 'VICE CITY',
    photos: [null, null, null],
    panels: [
      { photo: 0, zoom: 1, x: 0, y: 0 },
      { photo: 0, zoom: 1, x: 0, y: 0 },
      { photo: 1, zoom: 1, x: 0, y: 0 },
    ],
  };
}

/** Panels for the state's layout, in absolute pixels for a w x h cover. */
export function layoutPanels(state, w, h) {
  const def = LAYOUTS[state.layout] ?? LAYOUTS.grid;
  return def.panels(w, h).map((p, i) => ({
    ...p,
    x: p.x * w,
    y: p.y * h,
    w: p.w * w,
    h: p.h * h,
    panel: state.panels[i] ?? { photo: -1, zoom: 1, x: 0, y: 0 },
  }));
}

function coverFitRect(imgW, imgH, rect, zoom, px, py) {
  const base = Math.max(rect.w / imgW, rect.h / imgH) * zoom;
  const pw = imgW * base;
  const ph = imgH * base;
  const ox = (pw - rect.w) / 2;
  const oy = (ph - rect.h) / 2;
  return { x: rect.x - ox + px * ox, y: rect.y - oy + py * oy, w: pw, h: ph };
}

/** Draws one photo into its panel, cropped and positioned per the panel. */
export function drawPhotoPanel(ctx, rect, photo, panel, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const r = coverFitRect(photo.naturalWidth, photo.naturalHeight, rect, panel.zoom, panel.x, panel.y);
  ctx.drawImage(photo, r.x, r.y, r.w, r.h);
  // Warm sunset wash + a darker foot so lettering reads over any photo.
  const wash = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  wash.addColorStop(0, 'rgba(255, 120, 80, 0.05)');
  wash.addColorStop(0.6, grade.wash);
  wash.addColorStop(1, 'rgba(20, 6, 40, 0.38)');
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** The striped outrun sun, cut by horizontal gaps toward its base. */
export function drawSun(ctx, cx, cy, r, grade) {
  ctx.save();
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.6);
  glow.addColorStop(0, 'rgba(255, 190, 90, 0.55)');
  glow.addColorStop(1, 'rgba(255, 94, 98, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 1.6, cy - r * 1.6, r * 3.2, r * 3.2);
  const sun = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  sun.addColorStop(0, '#ffe08a');
  sun.addColorStop(0.55, '#ff7a3d');
  sun.addColorStop(1, '#ff2e88');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Stripe cuts, widening toward the bottom.
  ctx.fillStyle = grade.sky[0];
  for (let i = 0; i < 5; i++) {
    const y = cy + r * (0.05 + i * 0.18);
    const half = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
    ctx.fillRect(cx - half, y, half * 2, r * (0.03 + i * 0.022));
  }
  ctx.restore();
}

/** A low skyline silhouette with a few lit windows. */
export function drawSkyline(ctx, x, y, w, h, color, seed) {
  ctx.save();
  ctx.fillStyle = color;
  let bx = x;
  let i = 0;
  while (bx < x + w) {
    const bw = w * (0.08 + ((seed * (i + 3)) % 7) / 70);
    const bh = h * (0.35 + ((seed * (i + 5)) % 10) / 16);
    ctx.fillRect(bx, y + h - bh, bw, bh);
    ctx.fillStyle = 'rgba(255, 220, 120, 0.85)';
    const wins = Math.floor(bh / (h * 0.09));
    for (let k = 0; k < wins; k++) {
      if ((seed + i * 3 + k * 7) % 3 === 0) {
        ctx.fillRect(bx + bw * 0.2, y + h - bh + h * 0.06 + k * h * 0.09, bw * 0.16, h * 0.035);
      }
    }
    ctx.fillStyle = color;
    bx += bw + w * 0.015;
    i++;
  }
  ctx.restore();
}

/** A palm silhouette: curved trunk, seven drooping fronds. */
export function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = s * 0.045;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.08, y - s * 0.55, x + s * 0.22, y - s * 0.95);
  ctx.stroke();
  const tx = x + s * 0.22;
  const ty = y - s * 0.95;
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (1.05 + (i / 6) * 0.9);
    const len = s * (0.42 + (i % 2) * 0.08);
    const ex = tx + Math.cos(a) * len;
    const ey = ty + Math.sin(a) * len * 0.55 + s * 0.12;
    ctx.lineWidth = s * 0.035;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a) * len * 0.5, ty + Math.sin(a) * len * 0.3 - s * 0.08, ex, ey);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(tx, ty, s * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** An art panel with no photo: sunset sky, striped sun, skyline, palms. */
export function drawArtPanel(ctx, rect, grade, seed) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  drawSun(ctx, rect.x + rect.w * 0.5, rect.y + rect.h * 0.42, Math.min(rect.w, rect.h) * 0.26, grade);
  drawSkyline(ctx, rect.x, rect.y + rect.h * 0.62, rect.w, rect.h * 0.38, grade.deep, seed);
  drawPalm(ctx, rect.x + rect.w * 0.10, rect.y + rect.h, Math.min(rect.w, rect.h) * 0.34, grade.deep);
  drawPalm(ctx, rect.x + rect.w * 0.92, rect.y + rect.h, Math.min(rect.w, rect.h) * 0.26, grade.deep);
  ctx.restore();
}

/** Splits the caption into at most two lines that fit the width. */
export function wrapCaption(ctx, text, maxWidth) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [''];
  for (const word of words) {
    const trial = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth || !lines[lines.length - 1]) {
      lines[lines.length - 1] = trial;
    } else if (lines.length === 1) {
      lines.push(word);
    } else {
      lines[1] += ` ${word}`;
    }
  }
  return lines.slice(0, 2);
}

/** Draws the tagline and the big bold caption across the foot of the cover. */
export function drawCaption(ctx, w, h, caption, tagline, grade) {
  const text = caption.trim();
  if (!text && !tagline.trim()) return;
  const bandH = h * 0.30;
  const bandY = h - bandH;
  const scrim = ctx.createLinearGradient(0, bandY - h * 0.06, 0, h);
  scrim.addColorStop(0, 'rgba(16, 4, 32, 0)');
  scrim.addColorStop(0.45, 'rgba(16, 4, 32, 0.55)');
  scrim.addColorStop(1, 'rgba(16, 4, 32, 0.82)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY - h * 0.06, w, bandH + h * 0.06);

  const maxW = w * 0.92;
  let size = Math.min(w * 0.135, h * 0.115);
  const font = (s) => `900 ${s}px "Vice Display", "Arial Narrow", sans-serif`;
  ctx.font = font(size);
  let lines = wrapCaption(ctx, text.toUpperCase(), maxW);
  while ((lines.length > 1 || ctx.measureText(lines[0] ?? '').width > maxW) && size > 28) {
    size -= 4;
    ctx.font = font(size);
    lines = wrapCaption(ctx, text.toUpperCase(), maxW);
  }
  const lineH = size * 1.02;
  const totalH = lines.length * lineH;
  let y = h - h * 0.055 - totalH + lineH * 0.82;
  if (tagline.trim()) {
    const tagSize = Math.max(18, Math.min(w * 0.032, h * 0.028));
    ctx.font = `700 ${tagSize}px "Vice Display", "Arial Narrow", sans-serif`;
    try { ctx.letterSpacing = `${tagSize * 0.42}px`; } catch { /* older canvas */ }
    ctx.textAlign = 'center';
    ctx.fillStyle = grade.captionBottom;
    ctx.fillText(tagline.trim().toUpperCase(), w / 2, y - totalH - tagSize * 0.4);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
  const fill = ctx.createLinearGradient(0, y - size, 0, y + size * 0.2);
  fill.addColorStop(0, grade.captionTop);
  fill.addColorStop(1, grade.captionBottom);
  ctx.font = font(size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = grade.deep;
  ctx.lineWidth = size * 0.16;
  ctx.shadowColor = grade.glow;
  ctx.shadowBlur = size * 0.28;
  for (const line of lines) {
    ctx.strokeText(line, w / 2, y);
    ctx.fillStyle = fill;
    ctx.fillText(line, w / 2, y);
    y += lineH;
  }
  ctx.shadowBlur = 0;
}

/** Renders the whole cover onto `canvas` (its own size) from `state`. */
export function renderCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  ctx.fillStyle = grade.deep;
  ctx.fillRect(0, 0, w, h);
  const gutter = Math.max(4, Math.round(Math.min(w, h) * 0.008));
  for (const [i, rect] of layoutPanels(state, w, h).entries()) {
    const inset = {
      x: rect.x + gutter / 2,
      y: rect.y + gutter / 2,
      w: rect.w - gutter,
      h: rect.h - gutter,
    };
    const photo = rect.panel.photo >= 0 ? state.photos[rect.panel.photo] : null;
    if (photo) drawPhotoPanel(ctx, inset, photo, rect.panel, grade);
    else drawArtPanel(ctx, inset, grade, i + 2);
  }
  drawCaption(ctx, w, h, state.caption, state.tagline, grade);
  // Thin inner frame, the poster's edge.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = Math.max(2, Math.round(Math.min(w, h) * 0.004));
  ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2);
}

/** Builds a fresh canvas with the cover rendered at exactly w x h pixels. */
export function exportCover(state, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  renderCover(canvas, state);
  return canvas;
}
