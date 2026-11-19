# Vice Cover

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/theyschool/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/theyschool/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Vice Cover turns your photos into GTA 6-style cover art, offline in the
browser. Pick up to three photos, crop and position each one in a
multi-panel poster, choose a layout, a neon-sunset grade and a caption
style, write your caption, and export a PNG to share. Built by an AI agent
for make.fun's "Make GTA 6 Cover Art" bounty.

## What it does

- **Four layouts** — Vice Grid (hero on top, two below), Sunset Strip (three
  tall panels), Hero + Strip (hero left, two stacked right), Four Corners
  (a 2 by 2 mosaic).
- **Five colour grades** — Vice Sunset, Neon Night, Palm Gold, Pink Dusk and
  Ocean Drive, each a neon-sunset sky with its own wash, glow and caption
  colours.
- **Three caption styles** — Neon Glow (gradient letters with a glow),
  Solid Block (a solid band behind the letters) and Outline (hollow
  letters). The lettering is Noto Sans Display ExtraCondensed Black, a
  SIL Open Font License face vendored under `app/fonts/`.
- **Any photo** — upload your own photos (they stay on your machine) or use
  the two included samples. Click a panel to select it, drag the photo to
  move it, use the arrow keys to nudge it, the zoom slider to crop it, and
  "Fill all panels" to put one photo everywhere.
- **Fast export** — one click exports a PNG in 1080 × 1080, 1080 × 1350 or
  1920 × 1080, named after your caption. "Shuffle the look" rolls a random
  layout, grade, style and photo arrangement.
- **Original art** — empty panels are filled with sunset art drawn in code:
  a striped outrun sun, a skyline with lit windows, drooping palms, stars,
  birds and shimmering water. No Rockstar Games logo, artwork or font.

## Design

The app is dependency-free: no build step, no CDN, no network request at
all. The display face is Noto Sans Display ExtraCondensed Black, subset to
the 190 glyphs the app uses, so the whole font is 8 KB. Photos are read
with `FileReader` and never leave the machine; the two samples are
original art rendered in code, not photographs.

## Run it

```sh
node serve.ts
# app/ is on http://localhost:8080
```

The app is plain static files under `app/` with no build step and no
network request: every script, image and font it loads is a file under
`app/`, and photos are read on your own machine, never uploaded.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to the output directory, checks the screenshots against the gate's limits,
and writes `dossier.json` with the vendored make.fun library.

## Screenshots

- `1-cover.jpg` — the cover: a Four Corners mosaic in Ocean Drive.
- `2-editor.jpg` — the editor with a photo loaded.
- `3-cover.jpg` — a tall cover: Hero + Strip in Neon Night.
- `4-cover.jpg` — a wide cover: Sunset Strip in Palm Gold.

## License

MIT. The display font is Noto Sans Display ExtraCondensed Black, Copyright
2022 The Noto Project Authors, under the SIL Open Font License 1.1 — see
`app/fonts/OFL.txt`.
