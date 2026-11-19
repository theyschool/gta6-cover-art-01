// Vice Cover — the hand-in program (Node 22, standard library only). It copies
// app/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json with the vendored make.fun library, after checking the
// screenshots against the gate's limits. Outside the grader's container,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's screenshot limits (reference/gate.json): 3 to 4 images, each at
// most 256 KiB, a whole PNG or JPEG, long side at most 1280, short side at
// least 480 pixels.
const SHOT_MAX = 4;
const SHOT_MAX_BYTES = 262144;
const SHOT_LONG_MAX = 1280;
const SHOT_SHORT_MIN = 480;

/** Width and height from a PNG's IHDR chunk or a JPEG's SOF marker. */
export function imageSize(buf) {
  if (buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let off = 2;
    while (off + 9 < buf.length) {
      if (buf[off] !== 0xff) break;
      const marker = buf[off + 1];
      const len = buf.readUInt16BE(off + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { w: buf.readUInt16BE(off + 7), h: buf.readUInt16BE(off + 5) };
      }
      off += 2 + len;
    }
  }
  return null;
}

/** Check every screenshot in dir against the gate's limits; throw on a fail. */
export function checkScreenshots(dir) {
  const files = readdirSync(dir)
    .filter((n) => !n.startsWith('.'))
    .sort();
  if (files.length < 3 || files.length > SHOT_MAX) {
    throw new Error(`screenshots: want 3 to ${SHOT_MAX} images, found ${files.length}`);
  }
  for (const name of files) {
    if (!/^[A-Za-z0-9._-]{1,128}$/.test(name) || name.startsWith('-')) {
      throw new Error(`screenshots: bad file name ${name}`);
    }
    const path = join(dir, name);
    const size = statSync(path).size;
    if (size > SHOT_MAX_BYTES) throw new Error(`screenshots: ${name} is ${size} bytes, over ${SHOT_MAX_BYTES}`);
    const dims = imageSize(readFileSync(path));
    if (!dims) throw new Error(`screenshots: ${name} is not a whole PNG or JPEG`);
    const long = Math.max(dims.w, dims.h);
    const short = Math.min(dims.w, dims.h);
    if (long > SHOT_LONG_MAX || short < SHOT_SHORT_MIN) {
      throw new Error(`screenshots: ${name} is ${dims.w}x${dims.h}, outside ${SHOT_SHORT_MIN}..${SHOT_LONG_MAX}`);
    }
  }
  return files;
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

const shots = checkScreenshots(join(out, 'screenshots'));

// The gate's own caps for the dossier and the app's entry page.
const DOSSIER_MAX_BYTES = 1572864;
const INDEX_MAX_BYTES = 1048576;

/** Re-read the written dossier and the entry page and hold them to the caps. */
export function checkOutput(dir) {
  const dossierPath = join(dir, 'dossier.json');
  const dossierSize = statSync(dossierPath).size;
  if (dossierSize > DOSSIER_MAX_BYTES) {
    throw new Error(`dossier.json is ${dossierSize} bytes, over ${DOSSIER_MAX_BYTES}`);
  }
  // It must parse back as JSON, or the scorer cannot read it.
  JSON.parse(readFileSync(dossierPath, 'utf8'));
  const indexPath = join(dir, 'app', 'index.html');
  if (!existsSync(indexPath)) throw new Error('app/index.html is missing from the output');
  const indexSize = statSync(indexPath).size;
  if (indexSize > INDEX_MAX_BYTES) {
    throw new Error(`app/index.html is ${indexSize} bytes, over ${INDEX_MAX_BYTES}`);
  }
  return { dossierSize, indexSize };
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

const checked = checkOutput(out);
console.log(`handed in: ${shots.length} screenshots, dossier.json ${checked.dossierSize} bytes, app/index.html ${checked.indexSize} bytes, written to ${out}`);
