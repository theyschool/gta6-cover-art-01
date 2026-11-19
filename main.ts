// Vice Cover — the hand-in program for gta6-cover-art-01 (Node 22, standard
// library only). The app is this directory's app/ folder: plain static files a
// desktop browser loads offline (app/index.html and its ES modules, the display
// font vendored under app/fonts, no network request at runtime). This program
// copies app/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json with the vendored make.fun library, exactly as the kit's
// starter does — the dossier is the summary the judge reads. Before it writes
// the dossier it checks every screenshot against the gate's own limits (at
// most 4, each at most 256 KiB, long side at most 1280, short side at least
// 480), reading the dimensions straight from each file's header, so a bad
// screenshot fails the hand-in here instead of at the gate.
//
// Serve the app locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Reads a PNG's width and height from its IHDR chunk. */
function pngSize(buf) {
  if (buf.length < 24 || buf.toString('ascii', 1, 4) !== 'PNG') return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

/** Reads a JPEG's width and height from its first SOF0/SOF2 frame. */
function jpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let off = 2;
  while (off + 9 < buf.length) {
    if (buf[off] !== 0xff) return null;
    const marker = buf[off + 1];
    const len = buf.readUInt16BE(off + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { w: buf.readUInt16BE(off + 7), h: buf.readUInt16BE(off + 5) };
    }
    off += 2 + len;
  }
  return null;
}

/** Dimensions of a PNG or JPEG file, or null when the header is unreadable. */
function imageSize(path) {
  const buf = readFileSync(path);
  return pngSize(buf) ?? jpegSize(buf);
}

/** The gate's screenshot limits, checked here before the dossier is built. */
function checkScreenshots(dir) {
  const files = readdirSync(dir).filter((f) => !f.startsWith('.')).sort();
  if (files.length < 3 || files.length > 4) {
    throw new Error(`expected 3-4 screenshots, found ${files.length}`);
  }
  for (const file of files) {
    const path = join(dir, file);
    const bytes = statSync(path).size;
    if (bytes > 262144) throw new Error(`${file} is ${bytes} bytes, over the 256 KiB cap`);
    const size = imageSize(path);
    if (!size) throw new Error(`${file} is not a readable PNG or JPEG`);
    const long = Math.max(size.w, size.h);
    const short = Math.min(size.w, size.h);
    if (long > 1280) throw new Error(`${file} is ${size.w}x${size.h}, long side over 1280`);
    if (short < 480) throw new Error(`${file} is ${size.w}x${size.h}, short side under 480`);
  }
  return files;
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Check the screenshots in the copy, so /output is exactly what was checked.
const shotFiles = checkScreenshots(join(out, 'screenshots'));

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside
// /output's own 1000-entry cap, its screenshots/ and dossier.json).
const dossierPath = join(out, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

// Fail loudly rather than hand in a half-written /output: the dossier must
// parse, and the copies it was built from must be there.
const dossier = JSON.parse(readFileSync(dossierPath, 'utf8'));
if (!existsSync(join(out, 'app', 'index.html'))) throw new Error('app/index.html missing from /output');
// The dossier's cover is the index of the first screenshot by name, and its
// images must be exactly the screenshots that were checked above.
if (dossier.cover !== 0) throw new Error(`dossier cover index ${dossier.cover} is not the first screenshot`);
if (!Array.isArray(dossier.images) || dossier.images.length !== shotFiles.length) {
  throw new Error(`dossier holds ${dossier.images?.length ?? 0} images, expected ${shotFiles.length}`);
}
console.log(`vice-cover: ${shotFiles.length} screenshots, dossier ${readFileSync(dossierPath).length} bytes, cover ${shotFiles[dossier.cover]}`);
