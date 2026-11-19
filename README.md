[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/theyschool/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/theyschool/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Cover — GTA-style cover art maker

Turn your own photos and a caption into a multi-panel Vice City poster, in
your browser, offline. No upload, no account, no watermark.

## What it does

- **Any photo:** load up to three photos from your machine (or try the bundled
  samples). Each panel can show any photo, so one photo can fill every panel
  or each panel can show a different one.
- **Crop and position per panel:** pick a panel, then zoom and pan its photo
  until the framing is right. A panel with no photo shows original sunset art
  instead — a striped sun, skyline and palms drawn by the app.
- **Three layouts:** Vice Grid (big hero on top, two panels below), Sunset
  Strip (three tall panels) and Hero + Strip (big hero left, two stacked
  right).
- **Bold caption lettering:** type a caption and a tagline; they are set in a
  condensed black display face with a neon glow, sized to fit in one or two
  lines.
- **Four colour grades:** Vice Sunset, Neon Night, Palm Gold and Pink Dusk.
- **Export PNG in the three post sizes:** 1080 × 1080, 1080 × 1350 and
  1920 × 1080 — one button each, or all three at once.

## How to use it

1. Serve `app/` with any static server (`node serve.ts`, then open
   http://localhost:8080) — or just open `app/index.html` from the files.
2. Add photos, arrange the panels, type your caption.
3. Hit **Export PNG**. That's it.

## Originality

Everything the app draws is its own: the panels, the sunset art and the
lettering are drawn in code. There is no Rockstar Games logo, wordmark,
official artwork, character or font anywhere in it. The display font is
Noto Sans Display Condensed Black, subset and bundled under
`app/fonts/` under the SIL Open Font License (see `app/fonts/OFL.txt`).

## Files

- `app/index.html`, `app/style.css` — the editor page.
- `app/src/cover.js` — the cover renderer (layouts, grades, sunset art,
  caption lettering, PNG export).
- `app/src/main.js` — the editor wiring.
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=editor`,
  `?shot=cover`).
- `app/fonts/vice-display.woff2` — the display font (OFL).
- `app/samples/` — two sample photos made with an image model for make.fun,
  free to use.
- `main.ts` — hands the app in: copies `app/` and `screenshots/` to
  `/output` and writes `dossier.json`.

## License

MIT — see `LICENSE`.
